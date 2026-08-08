import { describe, expect, it } from "vitest";
import { resolveAppRedirect } from "./redirect-url";

const ORIGIN = "https://app.example.com";

describe("resolveAppRedirect", () => {
  it("allows same-origin absolute URLs", () =>
    expect(resolveAppRedirect(`${ORIGIN}/register`, ORIGIN)).toBe(
      `${ORIGIN}/register`,
    ));
  it("clamps relative URLs onto the app origin", () =>
    expect(resolveAppRedirect("/register", ORIGIN)).toBe(`${ORIGIN}/register`));
  it("rejects cross-origin URLs instead of open-redirecting", () =>
    expect(resolveAppRedirect("https://evil.example.com/phish", ORIGIN)).toBe(
      ORIGIN,
    ));
  it("falls back to the origin for malformed URLs", () =>
    expect(resolveAppRedirect("not a url", ORIGIN)).toBe(ORIGIN));
});
