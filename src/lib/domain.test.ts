import { describe, expect, it } from "vitest";
import {
  displayNumber,
  eventDate,
  hasPublicContact,
  isSafeHttpUrl,
  isRecruitmentOpen,
  normalizeLoginEmail,
  normalizeParticipantNumber,
  resolveGatedPageState,
} from "./domain";

describe("event date rules", () => {
  it("uses the event timezone instead of the server timezone", () => {
    expect(eventDate(new Date("2026-08-08T15:59:59.000Z"))).toBe("2026-08-08");
    expect(eventDate(new Date("2026-08-08T16:00:00.000Z"))).toBe("2026-08-09");
  });
  it("keeps recruitment open through the local deadline date", () => {
    const now = new Date("2026-08-08T16:00:00.000Z");
    expect(isRecruitmentOpen("2026-08-09", now)).toBe(true);
    expect(isRecruitmentOpen("2026-08-08", now)).toBe(false);
  });
});

describe("public contact rules", () => {
  it("recognizes public display values from nested cell-like shapes", () =>
    expect(hasPublicContact({ text: "微信 123" })).toBe(true));
  it("requires a non-empty contact channel", () =>
    expect(hasPublicContact({ text: "  ", values: [] })).toBe(false));
  it("accepts non-empty values inside arrays", () =>
    expect(hasPublicContact([null, "email@example.com"])).toBe(true));
});

describe("safe URL rules", () => {
  it("accepts only http and https links", () => {
    expect(isSafeHttpUrl("https://example.com")).toBe(true);
    expect(isSafeHttpUrl("http://example.com/path?q=1")).toBe(true);
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("data:text/html,<script>alert(1)</script>")).toBe(
      false,
    );
    expect(isSafeHttpUrl("")).toBe(false);
  });
});

describe("participant number normalization", () => {
  it("matches numbers with different zero padding", () =>
    expect(normalizeParticipantNumber("P0007")).toBe("7"));
  it("keeps different numbers distinct", () =>
    expect(normalizeParticipantNumber("P0008")).not.toBe(
      normalizeParticipantNumber("P0007"),
    ));
  it("preserves non-standard values after trimming and casing", () =>
    expect(normalizeParticipantNumber(" ab-1 ")).toBe("AB-1"));
});

describe("login email normalization", () => {
  it("matches Auth.js normalization for rate limiting", () => {
    expect(normalizeLoginEmail("  USER＠Example.COM ")).toBe(
      "user@example.com",
    );
    expect(normalizeLoginEmail("user@example.com,extra")).toBe(
      "user@example.com",
    );
  });
  it("rejects quoted and malformed addresses", () => {
    expect(normalizeLoginEmail('"user"@example.com')).toBeNull();
    expect(normalizeLoginEmail("user@example@com")).toBeNull();
    expect(normalizeLoginEmail("")).toBeNull();
  });
});

describe.each(["project submission", "final confirmation"])(
  "%s page state",
  () => {
    it("keeps loading while the profile is unresolved", () =>
      expect(resolveGatedPageState({ profileReady: false })).toBe("loading"));
    it("keeps loading when a different user was checked", () =>
      expect(
        resolveGatedPageState({
          profileReady: true,
          userId: "a",
          checkedUserId: "b",
        }),
      ).toBe("loading"));
    it("shows the form after the same user passes access check", () =>
      expect(
        resolveGatedPageState({
          profileReady: true,
          userId: "a",
          checkedUserId: "a",
          allowed: true,
        }),
      ).toBe("form"));
    it("shows retry state when access check fails", () =>
      expect(
        resolveGatedPageState({
          profileReady: true,
          userId: "a",
          checkedUserId: "a",
          failed: true,
        }),
      ).toBe("error"));
  },
);

describe("display numbers", () => {
  it("creates stable padded participant numbers", () =>
    expect(displayNumber("P", 12)).toBe("P0012"));
});
