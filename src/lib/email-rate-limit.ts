import "server-only";

import { createHmac } from "node:crypto";
import { sql } from "drizzle-orm";
import { AuthError } from "next-auth";
import { db } from "@/db";
import { emailSendLimits } from "@/db/schema";
import { getServerEnv } from "@/lib/env";

export const EMAIL_RATE_LIMIT_MS = 60_000;
export const EMAIL_RATE_LIMIT_MESSAGE = "发送太频繁，请一分钟后再试";

export class EmailRateLimitError extends AuthError {
  constructor() {
    super(EMAIL_RATE_LIMIT_MESSAGE);
    // @ts-expect-error Auth.js does not expose custom error types in its public union.
    this.type = "EmailRateLimit";
  }
}

export function hashClientIp(
  ip: string,
  secret = getServerEnv().AUTH_SECRET,
): string {
  return createHmac("sha256", secret).update(ip).digest("hex");
}

export async function consumeEmailRateLimit(
  ip: string,
  now = new Date(),
  secret = getServerEnv().AUTH_SECRET,
): Promise<void> {
  const ipHash = hashClientIp(ip, secret);
  const cutoff = new Date(now.getTime() - EMAIL_RATE_LIMIT_MS);
  const [recorded] = await db
    .insert(emailSendLimits)
    .values({ ipHash, lastRequestAt: now })
    .onConflictDoUpdate({
      target: emailSendLimits.ipHash,
      set: { lastRequestAt: now },
      where: sql`${emailSendLimits.lastRequestAt} < ${cutoff}`,
    })
    .returning({ ipHash: emailSendLimits.ipHash });

  if (!recorded) throw new EmailRateLimitError();
}
