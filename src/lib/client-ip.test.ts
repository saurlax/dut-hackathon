import { describe, expect, it } from "vitest";
import { clientIpFromHeaders, normalizeClientIp } from "./client-ip";

describe("clientIpFromHeaders", () => {
  it("returns null unless the proxy is trusted", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.10" });

    expect(clientIpFromHeaders(headers)).toBeNull();
  });

  it("uses the first forwarded address when the proxy is trusted", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 10.0.0.1",
    });

    expect(clientIpFromHeaders(headers, true)).toBe("203.0.113.10");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "2001:db8::1" });

    expect(clientIpFromHeaders(headers, true)).toBe("2001:db8::1");
  });

  it("ignores empty or unknown addresses", () => {
    expect(clientIpFromHeaders(new Headers(), true)).toBeNull();
    expect(
      clientIpFromHeaders(new Headers({ "x-forwarded-for": "unknown" }), true),
    ).toBeNull();
  });
});

describe("normalizeClientIp", () => {
  it("normalizes IPv4-mapped IPv6 addresses", () => {
    expect(normalizeClientIp("::FFFF:203.0.113.10")).toBe("203.0.113.10");
  });

  it("normalizes bracketed IPv6 literals and casing", () => {
    expect(normalizeClientIp("[2001:DB8::1]")).toBe("2001:db8::1");
  });
});
