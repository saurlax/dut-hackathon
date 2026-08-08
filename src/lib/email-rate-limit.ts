import "server-only";

import { createHmac } from "node:crypto";
import { lt, lte, sql } from "drizzle-orm";
import { AuthError } from "next-auth";
import { db } from "@/db";
import { emailSendLimits, verificationTokens } from "@/db/schema";
import { getServerEnv } from "@/lib/env";

export const EMAIL_RATE_LIMIT_MS = 60_000;
export const EMAIL_RATE_LIMIT_MAX_REQUESTS = 1;
export const IP_RATE_LIMIT_MAX_REQUESTS = 10;
export const RATE_LIMIT_RETENTION_MS = 24 * 60 * 60 * 1_000;
export const EMAIL_RATE_LIMIT_MESSAGE = "发送太频繁，请一分钟后再试";

export class EmailRateLimitError extends AuthError {
  constructor() {
    super(EMAIL_RATE_LIMIT_MESSAGE);
    // @ts-expect-error Auth.js does not expose custom error types in its public union.
    this.type = "EmailRateLimit";
  }
}

export function hashRateLimitKey(
  scope: "email" | "ip",
  value: string,
  secret = getServerEnv().AUTH_SECRET,
): string {
  return createHmac("sha256", secret)
    .update(`${scope}\0${value}`)
    .digest("hex");
}

async function consumeRateLimit(
  scope: "email" | "ip",
  value: string,
  maxRequests: number,
  now: Date,
  secret: string,
): Promise<void> {
  const keyHash = hashRateLimitKey(scope, value, secret);
  const cutoff = new Date(now.getTime() - EMAIL_RATE_LIMIT_MS);
  const [recorded] = await db
    .insert(emailSendLimits)
    .values({ keyHash, requestCount: 1, lastRequestAt: now })
    .onConflictDoUpdate({
      target: emailSendLimits.keyHash,
      set: {
        requestCount: sql<number>`case
          when ${emailSendLimits.lastRequestAt} < ${cutoff} then 1
          else ${emailSendLimits.requestCount} + 1
        end`,
        lastRequestAt: sql<Date>`case
          when ${emailSendLimits.lastRequestAt} < ${cutoff} then ${now}
          else ${emailSendLimits.lastRequestAt}
        end`,
      },
      where: sql`${emailSendLimits.lastRequestAt} < ${cutoff}
        or ${emailSendLimits.requestCount} < ${maxRequests}`,
    })
    .returning({ keyHash: emailSendLimits.keyHash });

  if (!recorded) throw new EmailRateLimitError();
}

export async function consumeMagicLinkEmailRateLimit(
  email: string,
  now = new Date(),
  secret = getServerEnv().AUTH_SECRET,
): Promise<void> {
  await consumeRateLimit(
    "email",
    email,
    EMAIL_RATE_LIMIT_MAX_REQUESTS,
    now,
    secret,
  );
}

export async function consumeMagicLinkIpRateLimit(
  ip: string,
  now = new Date(),
  secret = getServerEnv().AUTH_SECRET,
): Promise<void> {
  await consumeRateLimit("ip", ip, IP_RATE_LIMIT_MAX_REQUESTS, now, secret);
}

export async function cleanupMagicLinkState(
  now = new Date(),
  retentionMs = RATE_LIMIT_RETENTION_MS,
) {
  const staleRateLimitCutoff = new Date(now.getTime() - retentionMs);
  const [expiredTokens, staleRateLimits] = await Promise.all([
    db
      .delete(verificationTokens)
      .where(lte(verificationTokens.expires, now))
      .returning({ token: verificationTokens.token }),
    db
      .delete(emailSendLimits)
      .where(lt(emailSendLimits.lastRequestAt, staleRateLimitCutoff))
      .returning({ keyHash: emailSendLimits.keyHash }),
  ]);
  return {
    expiredTokens: expiredTokens.length,
    staleRateLimits: staleRateLimits.length,
  };
}

export function isEmailRateLimitError(error: unknown): boolean {
  return (
    error instanceof EmailRateLimitError ||
    (error instanceof AuthError &&
      error.cause?.err instanceof EmailRateLimitError)
  );
}
