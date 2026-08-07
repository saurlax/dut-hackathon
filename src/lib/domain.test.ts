import { describe, expect, it } from "vitest";
import {
  displayNumber,
  hasPublicContact,
  normalizeParticipantNumber,
  resolveGatedPageState,
} from "./domain";

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
});
