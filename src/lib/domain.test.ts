import { describe, expect, it } from "vitest";
import {
  displayNumber,
  eventDate,
  hasPublicContact,
  isRecruitmentOpen,
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
  it("treats the deadline day as open and the day before as closed", () => {
    const now = new Date("2026-12-31T14:00:00.000Z"); // 22:00 in CST
    expect(isRecruitmentOpen("2026-12-31", now)).toBe(true);
    expect(isRecruitmentOpen("2026-12-30", now)).toBe(false);
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
  it("pads single-digit numbers to four places", () => {
    expect(displayNumber("T", 7)).toBe("T0007");
    expect(displayNumber("S", 1)).toBe("S0001");
  });
});
