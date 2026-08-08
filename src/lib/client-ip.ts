export function normalizeClientIp(value: string): string {
  let normalized = value.trim();
  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    normalized = normalized.slice(1, -1);
  }
  if (normalized.toLowerCase().startsWith("::ffff:")) {
    normalized = normalized.slice("::ffff:".length);
  }
  return normalized.toLowerCase();
}

export function clientIpFromHeaders(
  headers: Headers,
  trustProxy = false,
): string | null {
  if (!trustProxy) return null;

  const forwarded = headers.get("x-forwarded-for");
  const raw =
    forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip")?.trim() || "";
  if (!raw || raw.toLowerCase() === "unknown") return null;

  return normalizeClientIp(raw);
}
