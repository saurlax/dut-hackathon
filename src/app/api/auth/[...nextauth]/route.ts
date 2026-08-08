import type { NextRequest } from "next/server";
import { handlers } from "@/auth";
import { resolveEmailRateLimitIp } from "@/lib/client-ip";
import {
  consumeMagicLinkIpRateLimit,
  isEmailRateLimitError,
} from "@/lib/email-rate-limit";
import { getServerEnv } from "@/lib/env";

export const GET = handlers.GET;

export async function POST(request: NextRequest) {
  if (request.nextUrl.pathname.endsWith("/signin/nodemailer")) {
    const env = getServerEnv();
    const ip = resolveEmailRateLimitIp(
      request.headers,
      env.TRUST_PROXY === "true",
      process.env.NODE_ENV,
    );
    try {
      if (ip) await consumeMagicLinkIpRateLimit(ip);
    } catch (error) {
      if (isEmailRateLimitError(error)) {
        return Response.json(
          { error: "EmailRateLimit" },
          { status: 429, headers: { "Retry-After": "60" } },
        );
      }
      throw error;
    }
  }
  return handlers.POST(request);
}
