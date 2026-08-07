import { describe, expect, it } from "vitest";
import {
  applicationSchema,
  participantSchema,
  submissionSchema,
  teamSchema,
} from "./validators";

const participantInput = {
  name: "A",
  phone: "1",
  email: "a@example.com",
  school: "DUT",
  college: "C",
  grade: "1",
  studentId: "1",
  registrationMethod: "暂未确定" as const,
};

const submissionInput = {
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
};

describe("business validation", () => {
  it("rejects a public profile without contact information", () => {
    const result = participantSchema.safeParse({
      ...participantInput,
      publicDisplay: "on",
    });
    expect(result.success).toBe(false);
  });
  it("treats omitted and non-checkbox strings as false", () => {
    expect(participantSchema.parse(participantInput)).toMatchObject({
      isInternal: false,
      publicDisplay: false,
    });
    expect(
      participantSchema.parse({
        ...participantInput,
        isInternal: "false",
        publicDisplay: "true",
      }),
    ).toMatchObject({ isInternal: false, publicDisplay: false });
  });
  it("accepts the browser checkbox value only when explicitly checked", () => {
    expect(
      participantSchema.parse({
        ...participantInput,
        isInternal: "on",
        publicDisplay: "on",
        publicContact: "contact",
      }),
    ).toMatchObject({ isInternal: true, publicDisplay: true });
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
  it("keeps team visibility and external admission disabled by default", () =>
    expect(
      teamSchema.parse({
        name: "T",
        description: "D",
        contact: "C",
        recruitmentDeadline: "2099-09-01",
        maxSize: 4,
      }),
    ).toMatchObject({ allowExternal: false, publicDisplay: false }));
  it("requires an explicit checkbox value to publish a submission", () => {
    expect(submissionSchema.parse(submissionInput).publicDisplay).toBe(false);
    expect(
      submissionSchema.parse({ ...submissionInput, publicDisplay: "on" })
        .publicDisplay,
    ).toBe(true);
  });
  it("validates submission links", () => {
    const base = {
      ...submissionInput,
      githubUrl: "not-url",
    };
    expect(submissionSchema.safeParse(base).success).toBe(false);
  });
});
