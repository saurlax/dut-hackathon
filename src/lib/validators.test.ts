import { describe, expect, it } from "vitest";
import {
  applicationSchema,
  participantSchema,
  submissionSchema,
  teamSchema,
} from "./validators";

describe("business validation", () => {
  it("rejects a public profile without contact information", () => {
    const result = participantSchema.safeParse({
      name: "A",
      phone: "1",
      email: "a@example.com",
      school: "DUT",
      college: "C",
      grade: "1",
      studentId: "1",
      registrationMethod: "暂未确定",
      publicDisplay: "on",
    });
    expect(result.success).toBe(false);
  });
  it("limits active application messages to 200 characters", () =>
    expect(
      applicationSchema.safeParse({ message: "x".repeat(201) }).success,
    ).toBe(false));
  it("limits teams to four members", () =>
    expect(
      teamSchema.safeParse({
        name: "T",
        description: "D",
        contact: "C",
        recruitmentDeadline: "2026-09-01",
        maxSize: 5,
      }).success,
    ).toBe(false));
  it("validates submission links", () => {
    const base = {
      projectName: "P",
      track: "AI",
      oneLiner: "x",
      background: "x",
      problemSolved: "x",
      coreFeatures: "x",
      techApproach: "x",
      innovation: "x",
      applicationValue: "x",
      usageGuide: "x",
      githubUrl: "not-url",
    };
    expect(submissionSchema.safeParse(base).success).toBe(false);
  });
});
