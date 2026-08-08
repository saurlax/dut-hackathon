import { describe, expect, it } from "vitest";
import {
  applicationSchema,
  auditDecisionSchema,
  formDataObject,
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
  it("allows a public profile without contact information", () =>
    expect(
      participantSchema.parse({ ...participantInput, publicDisplay: "on" })
        .publicContact,
    ).toBe(""));
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
  it("requires a reason when an audit is rejected", () => {
    expect(
      auditDecisionSchema.safeParse({ decision: "rejected", reason: "" })
        .success,
    ).toBe(false);
    expect(
      auditDecisionSchema.safeParse({
        decision: "rejected",
        reason: "资料不完整",
      }).success,
    ).toBe(true);
    expect(
      auditDecisionSchema.safeParse({ decision: "approved" }).success,
    ).toBe(true);
  });
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
  it("rejects executable submission link schemes", () => {
    const base = {
      ...submissionInput,
      githubUrl: "https://example.com",
    };
    expect(submissionSchema.safeParse(base).success).toBe(true);
    expect(
      submissionSchema.safeParse({
        ...base,
        githubUrl: "javascript:alert(1)",
      }).success,
    ).toBe(false);
    expect(
      submissionSchema.safeParse({
        ...base,
        githubUrl: "data:text/html,<script>alert(1)</script>",
      }).success,
    ).toBe(false);
  });
  it("rejects unsafe portfolio URLs", () => {
    expect(
      participantSchema.safeParse({
        ...participantInput,
        portfolioUrl: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });
  it("accepts a team of one and rejects zero, negative, and fractional sizes", () => {
    const base = {
      name: "T",
      description: "D",
      contact: "C",
      recruitmentDeadline: "2099-09-01",
    };
    expect(teamSchema.safeParse({ ...base, maxSize: 1 }).success).toBe(true);
    expect(teamSchema.safeParse({ ...base, maxSize: 0 }).success).toBe(false);
    expect(teamSchema.safeParse({ ...base, maxSize: -1 }).success).toBe(false);
    expect(teamSchema.safeParse({ ...base, maxSize: 2.5 }).success).toBe(false);
    expect(teamSchema.safeParse({ ...base, maxSize: "abc" }).success).toBe(
      false,
    );
  });
  it("rejects whitespace-only and oversized team names", () => {
    const base = {
      name: "T",
      description: "D",
      contact: "C",
      recruitmentDeadline: "2099-09-01",
      maxSize: 4,
    };
    expect(teamSchema.safeParse({ ...base, name: "   " }).success).toBe(false);
    expect(
      teamSchema.safeParse({ ...base, name: "x".repeat(81) }).success,
    ).toBe(false);
  });
  it("requires participant phone and a valid email", () => {
    expect(
      participantSchema.safeParse({ ...participantInput, phone: "  " }).success,
    ).toBe(false);
    expect(
      participantSchema.safeParse({
        ...participantInput,
        email: "not-an-email",
      }).success,
    ).toBe(false);
  });
  it("collects repeated form values into arrays", () => {
    const formData = new FormData();
    formData.append("skills", "产品");
    formData.append("skills", "前端");
    formData.append("name", "测试");
    expect(formDataObject(formData)).toEqual({
      skills: ["产品", "前端"],
      name: "测试",
    });
  });
  it("strips expected track values from participant registration data", () => {
    const parsed = participantSchema.parse({
      ...participantInput,
      expectedTracks: ["人工智能"],
    });

    expect("expectedTracks" in parsed).toBe(false);
  });
});
