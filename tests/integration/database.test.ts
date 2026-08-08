import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db, pool } from "../../src/db/client";
import {
  addAdminUser,
  applyToTeam,
  changeTeamLeader,
  closeMyTeam,
  removeAdmin,
  resumeMyTeam,
  respondToMembership,
  reviewTeamApplication,
  requestMagicLink,
  saveRegistration,
  saveSubmission,
  saveTeam,
  submitConfirmation,
  updateAudit,
  withdrawApplication,
} from "../../src/app/actions";
import {
  adminOverview,
  publicParticipants,
  publicSubmissionDetail,
  publicTeamDetail,
  publicTeams,
  showcase,
  teamApplicationContext,
} from "../../src/lib/queries";
import {
  confirmationMembers,
  emailSendLimits,
  participants,
  submissions,
  teamApplications,
  teamConfirmations,
  teamMembers,
  teams,
  users,
  verificationTokens,
} from "../../src/db/schema";
import {
  consumeEmailRateLimit,
  EmailRateLimitError,
  EMAIL_RATE_LIMIT_MS,
} from "../../src/lib/email-rate-limit";

const authUser = vi.hoisted(() => ({ id: "", email: "test@example.com" }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));
vi.mock("@/auth", () => ({ signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("@/lib/authz", () => ({
  requireUser: vi.fn(async () => ({ ...authUser })),
  requireAdmin: vi.fn(async () => ({ ...authUser, role: "admin" })),
}));

const suffix = () => randomUUID().slice(0, 8);
async function makeParticipant(
  name = "测试参赛者",
  overrides: Partial<typeof participants.$inferInsert> = {},
) {
  const id = suffix();
  const [user] = await db
    .insert(users)
    .values({ email: `${id}@example.com`, emailVerified: new Date() })
    .returning();
  const [participant] = await db
    .insert(participants)
    .values({
      userId: user.id,
      name,
      phone: "13800000000",
      email: user.email,
      school: "DUT",
      college: "CS",
      grade: "1",
      studentId: id,
      registrationMethod: "暂未确定",
      ...overrides,
    })
    .returning();
  return participant;
}
async function makeTeam(
  leaderId: string,
  maxSize = 4,
  overrides: Partial<typeof teams.$inferInsert> = {},
) {
  const [team] = await db
    .insert(teams)
    .values({
      name: `Team-${suffix()}`,
      leaderParticipantId: leaderId,
      contact: "contact",
      description: "desc",
      recruitmentDeadline: "2099-12-31",
      maxSize,
      ...overrides,
    })
    .returning();
  await db.insert(teamMembers).values({
    teamId: team.id,
    participantId: leaderId,
    role: "队长",
    position: 1,
    consentedAt: new Date(),
  });
  return team;
}

function actionForm(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) formData.set(key, value);
  return formData;
}

function submissionForm() {
  return actionForm({
    projectName: "E2E 作品",
    track: "AI",
    oneLiner: "一句话介绍",
    background: "项目背景",
    problemSolved: "解决的问题",
    coreFeatures: "核心功能",
    techApproach: "技术方案",
    innovation: "创新点",
    applicationValue: "应用价值",
    usageGuide: "使用说明",
  });
}

describe("PostgreSQL business constraints", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    authUser.id = "";
    await db.delete(verificationTokens);
    await db.delete(emailSendLimits);
    await db.delete(teamApplications);
    await db.delete(teamMembers);
    await db.delete(teams);
    await db.delete(participants);
    await db.delete(users);
  });
  afterAll(async () => {
    await pool.end();
  });
  it("rate limits magic link requests with unexpired tokens", async () => {
    const email = "rate-limit@example.com";
    await db.insert(verificationTokens).values(
      Array.from({ length: 5 }, (_, index) => ({
        identifier: email,
        token: `rate-${index}`,
        expires: new Date(Date.now() + 60_000),
      })),
    );

    const result = await requestMagicLink(
      { ok: false, message: "" },
      actionForm({ email: "rate-limit\uFF20example.com", callbackUrl: "/" }),
    );

    expect(result).toMatchObject({ ok: false });
    expect(result.message).toContain("频繁");
  });

  it("allows only one participant profile per user", async () => {
    const p = await makeParticipant();
    await expect(
      db.insert(participants).values({
        userId: p.userId,
        name: "B",
        phone: "1",
        email: "b@example.com",
        school: "D",
        college: "C",
        grade: "1",
        studentId: "2",
        registrationMethod: "暂未确定",
      }),
    ).rejects.toThrow();
  });
  it("allows one magic-link send per IP per rolling minute", async () => {
    const secret = "rate-limit-test-secret-0123456789abcdef";
    const first = new Date("2026-01-01T00:00:00.000Z");
    await consumeEmailRateLimit("203.0.113.10", first, secret);

    await expect(
      consumeEmailRateLimit(
        "203.0.113.10",
        new Date("2026-01-01T00:00:30.000Z"),
        secret,
      ),
    ).rejects.toBeInstanceOf(EmailRateLimitError);

    await consumeEmailRateLimit(
      "203.0.113.10",
      new Date(first.getTime() + EMAIL_RATE_LIMIT_MS + 1),
      secret,
    );
  });
  it("tracks different IPs independently", async () => {
    const secret = "rate-limit-test-secret-0123456789abcdef";
    const now = new Date("2026-01-01T00:00:00.000Z");

    await consumeEmailRateLimit("203.0.113.10", now, secret);
    await consumeEmailRateLimit("198.51.100.20", now, secret);
  });
  it("stores only a hashed IP in the rate limit table", async () => {
    const secret = "rate-limit-test-secret-0123456789abcdef";
    await consumeEmailRateLimit("203.0.113.10", new Date(), secret);

    const [row] = await db
      .select()
      .from(emailSendLimits)
      .where(eq(emailSendLimits.ipHash, "203.0.113.10"));
    expect(row).toBeUndefined();

    const [stored] = await db.select().from(emailSendLimits);
    expect(stored?.ipHash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored?.ipHash).not.toContain("203.0.113.10");
  });
  it("allows only one concurrent sender for the same IP", async () => {
    const secret = "rate-limit-test-secret-0123456789abcdef";
    const now = new Date("2026-01-01T00:00:00.000Z");
    const attempts = await Promise.allSettled([
      consumeEmailRateLimit("203.0.113.11", now, secret),
      consumeEmailRateLimit("203.0.113.11", now, secret),
      consumeEmailRateLimit("203.0.113.11", now, secret),
    ]);

    expect(
      attempts.filter((attempt) => attempt.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      attempts.filter(
        (attempt) =>
          attempt.status === "rejected" &&
          attempt.reason instanceof EmailRateLimitError,
      ),
    ).toHaveLength(2);
  });
  it("stores the contact email entered in the registration form", async () => {
    const participant = await makeParticipant();
    authUser.id = participant.userId;

    const result = await saveRegistration(
      { ok: false, message: "" },
      actionForm({
        name: participant.name,
        phone: participant.phone,
        email: "contact@example.com",
        school: participant.school,
        college: participant.college,
        grade: participant.grade,
        studentId: participant.studentId,
        registrationMethod: "暂未确定",
      }),
    );
    const [stored] = await db
      .select()
      .from(participants)
      .where(eq(participants.id, participant.id));

    expect(result.ok).toBe(true);
    expect(stored.email).toBe("contact@example.com");
  });
  it("auto-approves registration and allows public display without contact", async () => {
    const participant = await makeParticipant();
    authUser.id = participant.userId;

    const result = await saveRegistration(
      { ok: false, message: "" },
      actionForm({
        name: participant.name,
        phone: participant.phone,
        email: participant.email,
        school: participant.school,
        college: participant.college,
        grade: participant.grade,
        studentId: participant.studentId,
        registrationMethod: "个人报名，正在找队伍",
        publicDisplay: "on",
      }),
    );
    const [stored] = await db
      .select()
      .from(participants)
      .where(eq(participants.id, participant.id));

    expect(result.ok).toBe(true);
    expect(stored).toMatchObject({
      auditStatus: "approved",
      publicDisplay: true,
      publicContact: "",
    });
  });
  it("uses fail-closed defaults for internal status and team visibility", async () => {
    const leader = await makeParticipant();
    const team = await makeTeam(leader.id);
    expect(leader.isInternal).toBe(false);
    expect(team.publicDisplay).toBe(false);
    expect(team.publicConsentAt).toBeNull();
    const [membership] = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, team.id));
    expect(membership.consentedAt).toBeInstanceOf(Date);
  });
  it("prevents one participant joining two teams", async () => {
    const leader1 = await makeParticipant("L1"),
      leader2 = await makeParticipant("L2"),
      member = await makeParticipant("M");
    const a = await makeTeam(leader1.id),
      b = await makeTeam(leader2.id);
    await db
      .insert(teamMembers)
      .values({ teamId: a.id, participantId: member.id, position: 2 });
    await expect(
      db
        .insert(teamMembers)
        .values({ teamId: b.id, participantId: member.id, position: 2 }),
    ).rejects.toThrow();
  });
  it("enforces the maximum team size range", async () => {
    const leader = await makeParticipant();
    await expect(makeTeam(leader.id, 5)).rejects.toThrow();
  });
  it("rolls back an incomplete team transaction", async () => {
    const leader = await makeParticipant();
    await expect(
      db.transaction(async (tx) => {
        const [team] = await tx
          .insert(teams)
          .values({
            name: "Rollback",
            leaderParticipantId: leader.id,
            contact: "c",
            description: "d",
            recruitmentDeadline: "2099-12-31",
          })
          .returning();
        await tx
          .insert(teamMembers)
          .values({ teamId: team.id, participantId: leader.id, position: 5 });
      }),
    ).rejects.toThrow();
    expect(
      (await db.select().from(teams).where(eq(teams.name, "Rollback"))).length,
    ).toBe(0);
  });
  it("stores team applications relationally", async () => {
    const leader = await makeParticipant("L"),
      applicant = await makeParticipant("A"),
      team = await makeTeam(leader.id);
    const [application] = await db
      .insert(teamApplications)
      .values({ teamId: team.id, applicantId: applicant.id, message: "Hello" })
      .returning();
    const context = await teamApplicationContext(applicant.userId, team.id);
    expect(application.status).toBe("pending");
    expect(context).toMatchObject({
      membershipTeamId: null,
      activeApplicationCount: 1,
      pendingApplication: { id: application.id },
    });
  });
  it("allows only one pending application per applicant and team", async () => {
    const leader = await makeParticipant("L"),
      applicant = await makeParticipant("A"),
      team = await makeTeam(leader.id);
    const [first] = await db
      .insert(teamApplications)
      .values({ teamId: team.id, applicantId: applicant.id })
      .returning();
    await expect(
      db
        .insert(teamApplications)
        .values({ teamId: team.id, applicantId: applicant.id }),
    ).rejects.toThrow();
    await db
      .update(teamApplications)
      .set({ status: "withdrawn" })
      .where(eq(teamApplications.id, first.id));
    await expect(
      db
        .insert(teamApplications)
        .values({ teamId: team.id, applicantId: applicant.id }),
    ).resolves.toBeDefined();
  });
  it("keeps unavailable participants out of the public teammate pool", async () => {
    const active = await makeParticipant("Active", {
        auditStatus: "approved",
        publicDisplay: true,
        publicContact: "active@example.com",
        registrationMethod: "个人报名，正在找队伍",
      }),
      optedOut = await makeParticipant("Opted out", {
        auditStatus: "approved",
        publicDisplay: true,
        publicContact: "out@example.com",
        registrationMethod: "个人参赛，不再组队",
      }),
      member = await makeParticipant("Member", {
        auditStatus: "approved",
        publicDisplay: true,
        publicContact: "member@example.com",
        registrationMethod: "个人报名，正在找队伍",
      }),
      leader = await makeParticipant("Leader"),
      team = await makeTeam(leader.id);
    await db.insert(teamMembers).values({
      teamId: team.id,
      participantId: member.id,
      position: 2,
      consentedAt: new Date(),
    });

    const ids = (await publicParticipants()).items.map(({ id }) => id);

    expect(ids).toContain(active.id);
    expect(ids).not.toContain(optedOut.id);
    expect(ids).not.toContain(member.id);
  });
  it("pauses and resumes recruitment without rejecting pending applications", async () => {
    const leader = await makeParticipant("L"),
      applicant = await makeParticipant("A", {
        auditStatus: "approved",
        isInternal: true,
      }),
      consentedAt = new Date(),
      team = await makeTeam(leader.id, 4, {
        auditStatus: "approved",
        publicDisplay: true,
        publicConsentAt: consentedAt,
      });
    const [application] = await db
      .insert(teamApplications)
      .values({ teamId: team.id, applicantId: applicant.id })
      .returning();
    authUser.id = leader.userId;

    const result = await closeMyTeam(
      { ok: false, message: "" },
      new FormData(),
    );
    const [[storedTeam], [storedApplication]] = await Promise.all([
      db.select().from(teams).where(eq(teams.id, team.id)),
      db
        .select()
        .from(teamApplications)
        .where(eq(teamApplications.id, application.id)),
    ]);

    expect(result).toEqual({
      ok: true,
      message: "已暂停招募；待处理申请已保留",
    });
    expect(storedTeam).toMatchObject({
      recruitStatus: "paused",
      publicDisplay: true,
    });
    expect(storedTeam.publicConsentAt).toEqual(consentedAt);
    expect(storedApplication.status).toBe("pending");

    const reviewed = await reviewTeamApplication(
      application.id,
      { ok: false, message: "" },
      actionForm({ decision: "approve" }),
    );
    const [reviewedApplication] = await db
      .select()
      .from(teamApplications)
      .where(eq(teamApplications.id, application.id));
    expect(reviewed.ok).toBe(true);
    expect(reviewedApplication.status).toBe("approved");

    const resumed = await resumeMyTeam(
      { ok: false, message: "" },
      new FormData(),
    );
    const [resumedTeam] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, team.id));
    expect(resumed).toEqual({ ok: true, message: "已恢复招募" });
    expect(resumedTeam).toMatchObject({
      recruitStatus: "recruiting",
      auditStatus: "approved",
      publicDisplay: true,
    });
  });
  it("reopens an editable legacy completed team when its form is saved", async () => {
    const leader = await makeParticipant("L"),
      team = await makeTeam(leader.id, 4, { recruitStatus: "completed" });
    authUser.id = leader.userId;

    const result = await saveTeam(
      { ok: false, message: "" },
      actionForm({
        name: team.name,
        contact: team.contact,
        description: team.description,
        recruitmentDeadline: "2099-12-31",
        maxSize: "4",
        publicDisplay: "on",
      }),
    );
    const [storedTeam] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, team.id));

    expect(result).toMatchObject({ ok: true });
    expect(result.message).toContain("公开展示");
    expect(storedTeam).toMatchObject({
      recruitStatus: "recruiting",
      publicDisplay: true,
      auditStatus: "approved",
    });
    expect(storedTeam.publicConsentAt).toBeInstanceOf(Date);
  });
  it("includes the team roster needed by the admin detail dialog", async () => {
    const leader = await makeParticipant("队长"),
      member = await makeParticipant("成员"),
      team = await makeTeam(leader.id);
    await db.insert(teamMembers).values({
      teamId: team.id,
      participantId: member.id,
      role: "开发",
      position: 2,
      consentedAt: null,
    });

    const overview = await adminOverview();
    const record = overview.teams.find((item) => item.id === team.id);

    expect(record?.members).toHaveLength(2);
    expect(record?.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "队长",
          participant: expect.objectContaining({ name: "队长" }),
        }),
        expect.objectContaining({
          role: "开发",
          consentedAt: null,
          participant: expect.objectContaining({ name: "成员" }),
        }),
      ]),
    );
  });
  it("creates or promotes persistent administrator users by email", async () => {
    await db.insert(users).values({
      email: "existing-admin@example.com",
      role: "participant",
    });

    const [promoted, created] = await Promise.all([
      addAdminUser(
        { ok: false, message: "" },
        actionForm({ email: "existing-admin@example.com" }),
      ),
      addAdminUser(
        { ok: false, message: "" },
        actionForm({ email: "new-admin@example.com" }),
      ),
    ]);
    const [existingAdmin, newAdmin] = await Promise.all([
      db
        .select()
        .from(users)
        .where(eq(users.email, "existing-admin@example.com"))
        .then(([row]) => row),
      db
        .select()
        .from(users)
        .where(eq(users.email, "new-admin@example.com"))
        .then(([row]) => row),
    ]);

    expect(promoted).toMatchObject({ ok: true });
    expect(created).toMatchObject({ ok: true });
    expect(existingAdmin.role).toBe("admin");
    expect(newAdmin).toMatchObject({
      email: "new-admin@example.com",
      role: "admin",
      emailVerified: null,
    });
  });
  it("requires and stores a user-visible audit rejection reason", async () => {
    const participant = await makeParticipant();

    const missingReason = await updateAudit(
      "participant",
      participant.id,
      { ok: false, message: "" },
      actionForm({ decision: "rejected" }),
    );
    expect(missingReason.ok).toBe(false);

    const rejected = await updateAudit(
      "participant",
      participant.id,
      { ok: false, message: "" },
      actionForm({ decision: "rejected", reason: "请补充项目经历" }),
    );
    let [stored] = await db
      .select()
      .from(participants)
      .where(eq(participants.id, participant.id));
    expect(rejected.ok).toBe(true);
    expect(stored).toMatchObject({
      auditStatus: "rejected",
      adminNote: "请补充项目经历",
    });

    await updateAudit(
      "participant",
      participant.id,
      { ok: false, message: "" },
      actionForm({ decision: "approved" }),
    );
    [stored] = await db
      .select()
      .from(participants)
      .where(eq(participants.id, participant.id));
    expect(stored).toMatchObject({ auditStatus: "approved", adminNote: "" });
  });
  it("keeps private or unaudited member identities out of public team queries", async () => {
    const leader = await makeParticipant("L", {
        auditStatus: "approved",
        publicDisplay: false,
      }),
      member = await makeParticipant("M", {
        auditStatus: "pending",
        publicDisplay: true,
      }),
      team = await makeTeam(leader.id, 4, {
        auditStatus: "approved",
        publicDisplay: true,
        publicConsentAt: new Date(),
      });
    await db.insert(teamMembers).values({
      teamId: team.id,
      participantId: member.id,
      position: 2,
      consentedAt: new Date(),
    });

    const [list, detail] = await Promise.all([
      publicTeams(),
      publicTeamDetail(team.id),
    ]);
    expect(
      list.items.find(({ team: item }) => item.id === team.id),
    ).toMatchObject({
      leaderName: null,
      currentSize: 2,
    });
    expect(detail).toMatchObject({
      leaderName: "未公开",
      currentSize: 2,
      members: [],
    });

    await db
      .update(teams)
      .set({ auditStatus: "rejected" })
      .where(eq(teams.id, team.id));
    expect(await publicTeamDetail(team.id)).toBeNull();
  });
  it("requires public gates for submissions and their teams without selecting admin fields", async () => {
    const leader = await makeParticipant("L"),
      team = await makeTeam(leader.id, 4, {
        auditStatus: "approved",
        publicDisplay: true,
        publicConsentAt: new Date(),
      });
    await db.insert(teamConfirmations).values({
      teamId: team.id,
      submittedById: leader.id,
      auditStatus: "approved",
    });
    const [submission] = await db
      .insert(submissions)
      .values({
        teamId: team.id,
        submittedById: leader.id,
        projectName: "Private by default",
        track: "AI",
        oneLiner: "x",
        background: "x",
        problemSolved: "x",
        coreFeatures: "x",
        techApproach: "x",
        innovation: "x",
        applicationValue: "x",
        usageGuide: "x",
        publicDisplay: true,
        auditStatus: "approved",
        adminNote: "must never be selected publicly",
      })
      .returning();

    expect((await showcase()).items).toEqual([]);
    expect(await publicSubmissionDetail(submission.id)).toBeNull();
    await db
      .update(submissions)
      .set({ publicConsentAt: new Date() })
      .where(eq(submissions.id, submission.id));
    const detail = await publicSubmissionDetail(submission.id);
    expect(detail?.submission.projectName).toBe("Private by default");
    expect("adminNote" in (detail?.submission ?? {})).toBe(false);
    expect("submittedById" in (detail?.submission ?? {})).toBe(false);
    expect((await showcase()).items).toHaveLength(1);

    await db
      .update(teams)
      .set({ auditStatus: "pending" })
      .where(eq(teams.id, team.id));
    expect((await showcase()).items).toEqual([]);
    expect(await publicSubmissionDetail(submission.id)).toBeNull();

    await db
      .update(teams)
      .set({
        auditStatus: "approved",
        publicDisplay: false,
        publicConsentAt: null,
      })
      .where(eq(teams.id, team.id));
    expect((await showcase()).items).toEqual([]);
    expect(await publicSubmissionDetail(submission.id)).toBeNull();
  });
  it("blocks duplicate final confirmation unless the previous review was rejected", async () => {
    const leader = await makeParticipant("L"),
      team = await makeTeam(leader.id);
    authUser.id = leader.userId;
    const confirmationForm = actionForm({ allConfirmed: "on" });

    const first = await submitConfirmation(
      { ok: false, message: "" },
      confirmationForm,
    );
    expect(first.ok).toBe(true);

    await db
      .update(teamConfirmations)
      .set({ auditStatus: "approved" })
      .where(eq(teamConfirmations.teamId, team.id));
    const duplicate = await submitConfirmation(
      { ok: false, message: "" },
      actionForm({ allConfirmed: "on" }),
    );
    expect(duplicate).toMatchObject({ ok: false });
    expect(duplicate.message).toContain("无需重复提交");

    await db
      .update(teamConfirmations)
      .set({ auditStatus: "rejected", exception: "请重新核对成员" })
      .where(eq(teamConfirmations.teamId, team.id));
    const resubmitted = await submitConfirmation(
      { ok: false, message: "" },
      actionForm({ allConfirmed: "on" }),
    );
    const [stored] = await db
      .select()
      .from(teamConfirmations)
      .where(eq(teamConfirmations.teamId, team.id));
    expect(resubmitted.ok).toBe(true);
    expect(stored).toMatchObject({ auditStatus: "pending", exception: "" });
  });
  it("blocks saving a submission while the final confirmation is rejected", async () => {
    const leader = await makeParticipant("L"),
      team = await makeTeam(leader.id);
    await db.insert(teamConfirmations).values({
      teamId: team.id,
      submittedById: leader.id,
      auditStatus: "rejected",
      exception: "请重新核对成员",
    });
    authUser.id = leader.userId;

    const result = await saveSubmission(
      { ok: false, message: "" },
      actionForm({
        projectName: "Project",
        track: "AI",
        oneLiner: "x",
        background: "x",
        problemSolved: "x",
        coreFeatures: "x",
        techApproach: "x",
        innovation: "x",
        applicationValue: "x",
        usageGuide: "x",
      }),
    );

    expect(result).toMatchObject({ ok: false });
    expect(result.message).toContain("最终确认被驳回");
  });
  it("withdraws public submission visibility when final confirmation is rejected", async () => {
    const leader = await makeParticipant("L"),
      team = await makeTeam(leader.id, 4, {
        auditStatus: "approved",
        publicDisplay: true,
        publicConsentAt: new Date(),
      });
    const [confirmation] = await db
      .insert(teamConfirmations)
      .values({
        teamId: team.id,
        submittedById: leader.id,
        auditStatus: "approved",
      })
      .returning();
    const [submission] = await db
      .insert(submissions)
      .values({
        teamId: team.id,
        submittedById: leader.id,
        projectName: "Visible before rejection",
        track: "AI",
        oneLiner: "x",
        background: "x",
        problemSolved: "x",
        coreFeatures: "x",
        techApproach: "x",
        innovation: "x",
        applicationValue: "x",
        usageGuide: "x",
        publicDisplay: true,
        publicConsentAt: new Date(),
        auditStatus: "approved",
      })
      .returning();

    const result = await updateAudit(
      "confirmation",
      confirmation.id,
      { ok: false, message: "" },
      actionForm({ decision: "rejected", reason: "阵容有误" }),
    );

    expect(result.ok).toBe(true);
    const [stored] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, submission.id));
    expect(stored).toMatchObject({
      publicDisplay: false,
      publicConsentAt: null,
      auditStatus: "pending",
    });
    expect((await showcase()).items).toEqual([]);
  });
  it("lets a member leave after the final confirmation is rejected", async () => {
    const leader = await makeParticipant("L"),
      member = await makeParticipant("M"),
      team = await makeTeam(leader.id);
    await db.insert(teamMembers).values({
      teamId: team.id,
      participantId: member.id,
      position: 2,
      consentedAt: new Date(),
    });
    await db.insert(teamConfirmations).values({
      teamId: team.id,
      submittedById: leader.id,
      auditStatus: "rejected",
      exception: "请重新核对成员",
    });
    authUser.id = member.userId;

    const result = await respondToMembership(
      { ok: false, message: "" },
      actionForm({ decision: "leave" }),
    );

    expect(result).toMatchObject({ ok: true });
    expect(
      (
        await db
          .select()
          .from(teamMembers)
          .where(eq(teamMembers.participantId, member.id))
      ).length,
    ).toBe(0);
    expect(
      (
        await db
          .select()
          .from(teamConfirmations)
          .where(eq(teamConfirmations.teamId, team.id))
      ).length,
    ).toBe(0);
  });
  it("lets a legacy unconsented member invalidate an old final snapshot", async () => {
    const leader = await makeParticipant("L"),
      member = await makeParticipant("M"),
      team = await makeTeam(leader.id);
    await db.insert(teamMembers).values({
      teamId: team.id,
      participantId: member.id,
      position: 2,
      consentedAt: null,
    });
    const [confirmation] = await db
      .insert(teamConfirmations)
      .values({
        teamId: team.id,
        submittedById: leader.id,
        allConfirmed: true,
        commitment: true,
      })
      .returning();
    await db.insert(confirmationMembers).values([
      {
        confirmationId: confirmation.id,
        participantId: leader.id,
        participantNumber: leader.participantNumber,
        name: leader.name,
        role: "队长",
        position: 1,
      },
      {
        confirmationId: confirmation.id,
        participantId: member.id,
        participantNumber: member.participantNumber,
        name: member.name,
        role: "成员",
        position: 2,
      },
    ]);
    await db
      .update(teams)
      .set({ recruitStatus: "completed" })
      .where(eq(teams.id, team.id));
    authUser.id = member.userId;

    const result = await respondToMembership(
      { ok: false, message: "" },
      actionForm({ decision: "leave" }),
    );

    expect(result).toMatchObject({ ok: true });
    expect(result.message).toContain("最终确认");
    const [memberships, confirmations, snapshots, [storedTeam]] =
      await Promise.all([
        db
          .select()
          .from(teamMembers)
          .where(eq(teamMembers.participantId, member.id)),
        db
          .select()
          .from(teamConfirmations)
          .where(eq(teamConfirmations.teamId, team.id)),
        db
          .select()
          .from(confirmationMembers)
          .where(eq(confirmationMembers.confirmationId, confirmation.id)),
        db.select().from(teams).where(eq(teams.id, team.id)),
      ]);
    expect(memberships).toEqual([]);
    expect(confirmations).toEqual([]);
    expect(snapshots).toEqual([]);
    expect(storedTeam.recruitStatus).toBe("recruiting");
  });
  it("requires a fresh final snapshot and preserves full status after legacy consent", async () => {
    const leader = await makeParticipant("L"),
      member = await makeParticipant("M"),
      team = await makeTeam(leader.id, 2);
    await db.insert(teamMembers).values({
      teamId: team.id,
      participantId: member.id,
      position: 2,
      consentedAt: null,
    });
    await db.insert(teamConfirmations).values({
      teamId: team.id,
      submittedById: leader.id,
      allConfirmed: true,
      commitment: true,
    });
    await db
      .update(teams)
      .set({ recruitStatus: "completed" })
      .where(eq(teams.id, team.id));
    authUser.id = member.userId;

    const result = await respondToMembership(
      { ok: false, message: "" },
      actionForm({ decision: "confirm" }),
    );

    expect(result).toMatchObject({ ok: true });
    expect(result.message).toContain("重新提交");
    const [[membership], confirmations, [storedTeam]] = await Promise.all([
      db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.participantId, member.id)),
      db
        .select()
        .from(teamConfirmations)
        .where(eq(teamConfirmations.teamId, team.id)),
      db.select().from(teams).where(eq(teams.id, team.id)),
    ]);
    expect(membership.consentedAt).toBeInstanceOf(Date);
    expect(confirmations).toEqual([]);
    expect(storedTeam.recruitStatus).toBe("full");
  });
  it("serializes concurrent approvals at the final team slot", async () => {
    const leader = await makeParticipant("L", {
        auditStatus: "approved",
        isInternal: true,
      }),
      applicantA = await makeParticipant("A", {
        auditStatus: "approved",
        isInternal: true,
      }),
      applicantB = await makeParticipant("B", {
        auditStatus: "approved",
        isInternal: true,
      }),
      team = await makeTeam(leader.id, 2, {
        auditStatus: "approved",
        publicDisplay: true,
        publicConsentAt: new Date(),
      });
    const applications = await db
      .insert(teamApplications)
      .values([
        { teamId: team.id, applicantId: applicantA.id },
        { teamId: team.id, applicantId: applicantB.id },
      ])
      .returning();
    authUser.id = leader.userId;

    const results = await Promise.all(
      applications.map((application) =>
        reviewTeamApplication(
          application.id,
          { ok: false, message: "" },
          actionForm({ decision: "approve" }),
        ),
      ),
    );

    expect(results.filter(({ ok }) => ok)).toHaveLength(1);
    const roster = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, team.id));
    expect(roster).toHaveLength(2);
    const states = (
      await db
        .select({ status: teamApplications.status })
        .from(teamApplications)
        .where(eq(teamApplications.teamId, team.id))
    )
      .map(({ status }) => status)
      .sort();
    expect(states).toEqual(["approved", "rejected"]);
  });
  it("keeps the confirmation snapshot consistent with a competing approval", async () => {
    const leader = await makeParticipant("L", {
        auditStatus: "approved",
        isInternal: true,
      }),
      applicant = await makeParticipant("A", {
        auditStatus: "approved",
        isInternal: true,
      }),
      team = await makeTeam(leader.id, 4, {
        auditStatus: "approved",
        publicDisplay: true,
        publicConsentAt: new Date(),
      });
    const [application] = await db
      .insert(teamApplications)
      .values({ teamId: team.id, applicantId: applicant.id })
      .returning();
    authUser.id = leader.userId;

    const [approvalResult, confirmationResult] = await Promise.all([
      reviewTeamApplication(
        application.id,
        { ok: false, message: "" },
        actionForm({ decision: "approve" }),
      ),
      submitConfirmation(
        { ok: false, message: "" },
        actionForm({ allConfirmed: "on" }),
      ),
    ]);

    expect(confirmationResult.ok).toBe(true);
    const [confirmation] = await db
      .select()
      .from(teamConfirmations)
      .where(eq(teamConfirmations.teamId, team.id));
    const [roster, snapshot, [storedApplication]] = await Promise.all([
      db.select().from(teamMembers).where(eq(teamMembers.teamId, team.id)),
      db
        .select()
        .from(confirmationMembers)
        .where(eq(confirmationMembers.confirmationId, confirmation.id)),
      db
        .select()
        .from(teamApplications)
        .where(eq(teamApplications.id, application.id)),
    ]);
    expect(snapshot).toHaveLength(roster.length);
    expect(storedApplication.status).toBe(
      approvalResult.ok ? "approved" : "rejected",
    );
    expect(
      roster.some(({ participantId }) => participantId === applicant.id),
    ).toBe(approvalResult.ok);
    expect(
      snapshot.some(({ participantId }) => participantId === applicant.id),
    ).toBe(approvalResult.ok);
  });
  it("serializes leader transfer against final confirmation", async () => {
    const leader = await makeParticipant("L", { auditStatus: "approved" }),
      successor = await makeParticipant("S", { auditStatus: "approved" }),
      team = await makeTeam(leader.id);
    await db.insert(teamMembers).values({
      teamId: team.id,
      participantId: successor.id,
      position: 2,
      consentedAt: new Date(),
    });
    authUser.id = leader.userId;

    const [transferResult, confirmationResult] = await Promise.all([
      changeTeamLeader(
        { ok: false, message: "" },
        actionForm({ participantNumber: String(successor.participantNumber) }),
      ),
      submitConfirmation(
        { ok: false, message: "" },
        actionForm({ allConfirmed: "on" }),
      ),
    ]);

    expect(
      [transferResult, confirmationResult].filter(({ ok }) => ok),
    ).toHaveLength(1);
    const [storedTeam, roster, confirmations] = await Promise.all([
      db
        .select()
        .from(teams)
        .where(eq(teams.id, team.id))
        .then(([row]) => row),
      db.select().from(teamMembers).where(eq(teamMembers.teamId, team.id)),
      db
        .select()
        .from(teamConfirmations)
        .where(eq(teamConfirmations.teamId, team.id)),
    ]);
    const leaders = roster.filter(({ role }) => role === "队长");
    expect(leaders).toHaveLength(1);
    expect(leaders[0].participantId).toBe(storedTeam.leaderParticipantId);
    expect(confirmations).toHaveLength(confirmationResult.ok ? 1 : 0);
  });
  it("only allows submission after the final confirmation is approved", async () => {
    const leader = await makeParticipant("L", { auditStatus: "approved" });
    const team = await makeTeam(leader.id, 4, {
      auditStatus: "approved",
      publicDisplay: true,
      publicConsentAt: new Date(),
    });
    authUser.id = leader.userId;

    // No confirmation yet -> blocked.
    const beforeConfirmation = await saveSubmission(
      { ok: false, message: "" },
      submissionForm(),
    );
    expect(beforeConfirmation.ok).toBe(false);
    expect(beforeConfirmation.message).toContain("最终组队确认");

    // Confirmation submitted but pending -> blocked.
    await submitConfirmation(
      { ok: false, message: "" },
      actionForm({ allConfirmed: "on" }),
    );
    const whilePending = await saveSubmission(
      { ok: false, message: "" },
      submissionForm(),
    );
    expect(whilePending.ok).toBe(false);
    expect(whilePending.message).toContain("审核中");

    // Admin rejects the confirmation -> still blocked, with the rejection hint.
    const [confirmation] = await db
      .select()
      .from(teamConfirmations)
      .where(eq(teamConfirmations.teamId, team.id));
    await updateAudit(
      "confirmation",
      confirmation.id,
      { ok: false, message: "" },
      actionForm({ decision: "rejected", reason: "成员信息有误" }),
    );
    const whileRejected = await saveSubmission(
      { ok: false, message: "" },
      submissionForm(),
    );
    expect(whileRejected.ok).toBe(false);
    expect(whileRejected.message).toContain("被驳回");

    // Admin approves -> submission allowed and stored as pending review.
    await updateAudit(
      "confirmation",
      confirmation.id,
      { ok: false, message: "" },
      actionForm({ decision: "approved" }),
    );
    const approved = await saveSubmission(
      { ok: false, message: "" },
      submissionForm(),
    );
    expect(approved.ok).toBe(true);
    const [stored] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.teamId, team.id));
    expect(stored).toMatchObject({
      projectName: "E2E 作品",
      auditStatus: "pending",
      publicDisplay: false,
    });
  });
  it("editing team details does not silently resume a paused recruitment", async () => {
    const leader = await makeParticipant("L", { auditStatus: "approved" });
    const team = await makeTeam(leader.id, 4, {
      auditStatus: "approved",
      publicDisplay: true,
      publicConsentAt: new Date(),
      recruitStatus: "recruiting",
    });
    authUser.id = leader.userId;

    await closeMyTeam({ ok: false, message: "" }, new FormData());
    const [paused] = await db.select().from(teams).where(eq(teams.id, team.id));
    expect(paused.recruitStatus).toBe("paused");

    // Editing details (here: the description) must not flip a paused team back
    // to recruiting — that would silently relist it in the public hall.
    const edited = await saveTeam(
      { ok: false, message: "" },
      actionForm({
        name: team.name,
        contact: team.contact,
        description: "edited description",
        recruitmentDeadline: "2099-12-31",
        maxSize: "4",
        publicDisplay: "on",
      }),
    );
    expect(edited.ok).toBe(true);
    const [after] = await db.select().from(teams).where(eq(teams.id, team.id));
    expect(after.recruitStatus).toBe("paused");
    expect(after.description).toBe("edited description");
    expect(after.publicDisplay).toBe(true);
  });
  it("demotes a non-seed admin and refuses self / last-admin / unknown removal", async () => {
    await db.insert(users).values([
      { email: "a@example.com", role: "admin", emailVerified: new Date() },
      { email: "b@example.com", role: "admin", emailVerified: new Date() },
    ]);

    const demoted = await removeAdmin(
      { ok: false, message: "" },
      actionForm({ email: "A@example.com" }),
    );
    expect(demoted.ok).toBe(true);
    const [aUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "a@example.com"));
    expect(aUser.role).toBe("participant");
    const [bUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "b@example.com"));
    expect(bUser.role).toBe("admin");

    const selfRemoval = await removeAdmin(
      { ok: false, message: "" },
      actionForm({ email: "test@example.com" }),
    );
    expect(selfRemoval.ok).toBe(false);
    expect(selfRemoval.message).toContain("自己");

    const lastAdmin = await removeAdmin(
      { ok: false, message: "" },
      actionForm({ email: "b@example.com" }),
    );
    expect(lastAdmin.ok).toBe(false);
    expect(lastAdmin.message).toContain("最后一名");

    const ghost = await removeAdmin(
      { ok: false, message: "" },
      actionForm({ email: "ghost@example.com" }),
    );
    expect(ghost.ok).toBe(false);
    expect(ghost.message).toContain("不是管理员");
  });
  it("refuses to remove an ADMIN_EMAILS seed admin and leaves the role intact", async () => {
    const previous = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "seed@example.com";
    try {
      await db.insert(users).values([
        { email: "seed@example.com", role: "admin", emailVerified: new Date() },
        {
          email: "other@example.com",
          role: "admin",
          emailVerified: new Date(),
        },
      ]);
      const seedRemoval = await removeAdmin(
        { ok: false, message: "" },
        actionForm({ email: "seed@example.com" }),
      );
      expect(seedRemoval.ok).toBe(false);
      expect(seedRemoval.message).toContain("ADMIN_EMAILS");
      const [seed] = await db
        .select()
        .from(users)
        .where(eq(users.email, "seed@example.com"));
      expect(seed.role).toBe("admin");
    } finally {
      process.env.ADMIN_EMAILS = previous;
    }
  });
  it("paginates public teams and participants with clamped page params", async () => {
    // 15 public recruiting teams, each with a unique leader.
    for (let i = 0; i < 15; i++) {
      const leader = await makeParticipant(`L${i}`, {
        auditStatus: "approved",
        publicDisplay: true,
      });
      await makeTeam(leader.id, 4, {
        auditStatus: "approved",
        publicDisplay: true,
        publicConsentAt: new Date(),
        name: `Team-${i}`,
      });
    }

    const page1 = await publicTeams("", 1, 5);
    const page2 = await publicTeams("", 2, 5);
    const page3 = await publicTeams("", 3, 5);
    const page4 = await publicTeams("", 4, 5);
    expect(page1.items).toHaveLength(5);
    expect(page2.items).toHaveLength(5);
    expect(page3.items).toHaveLength(5);
    expect(page4.items).toHaveLength(0);
    expect(page1.total).toBe(15);
    const names = [...page1.items, ...page2.items, ...page3.items].map(
      ({ team }) => team.name,
    );
    expect(new Set(names).size).toBe(15);

    // pageSize clamping: negative / zero / non-numeric fall back to 12.
    expect((await publicTeams("", 1, -1)).pageSize).toBe(12);
    expect((await publicTeams("", 1, 0)).pageSize).toBe(12);
    expect((await publicTeams("", 1, "abc")).pageSize).toBe(12);
    // Cap at MAX_PAGE_SIZE (50).
    expect((await publicTeams("", 1, 100)).pageSize).toBe(50);
    // page clamping: non-numeric -> 1.
    expect((await publicTeams("", "nope", 5)).page).toBe(1);

    // 15 approved public participants who are not in any team.
    for (let i = 0; i < 15; i++) {
      await makeParticipant(`Pool${i}`, {
        auditStatus: "approved",
        publicDisplay: true,
        publicContact: `pool${i}@example.com`,
        registrationMethod: "个人报名，正在找队伍",
      });
    }
    const pool = await publicParticipants("", 2, 5);
    expect(pool.total).toBe(15);
    expect(pool.items).toHaveLength(5);
    expect(pool.page).toBe(2);
    expect(pool.pageSize).toBe(5);
  });
  it("limits active pending applications to three per participant", async () => {
    const leaders = [];
    for (let i = 0; i < 4; i++) {
      const l = await makeParticipant(`L${i}`, {
        auditStatus: "approved",
        isInternal: true,
      });
      leaders.push(l);
    }
    const applicant = await makeParticipant("A", {
      auditStatus: "approved",
      isInternal: true,
    });
    authUser.id = applicant.userId;
    for (let i = 0; i < 3; i++) {
      const team = await makeTeam(leaders[i].id, 4, {
        auditStatus: "approved",
        publicDisplay: true,
        publicConsentAt: new Date(),
      });
      expect(
        (
          await applyToTeam(
            team.id,
            { ok: false, message: "" },
            actionForm({ message: `apply ${i}` }),
          )
        ).ok,
      ).toBe(true);
    }
    const fourthTeam = await makeTeam(leaders[3].id, 4, {
      auditStatus: "approved",
      publicDisplay: true,
      publicConsentAt: new Date(),
    });
    const blocked = await applyToTeam(
      fourthTeam.id,
      { ok: false, message: "" },
      actionForm({ message: "too many" }),
    );
    expect(blocked.ok).toBe(false);
    expect(blocked.message).toContain("最多 3 支");
  });
  it("rejects applications to internal-only teams from external participants", async () => {
    const leader = await makeParticipant("L", {
      auditStatus: "approved",
      isInternal: true,
    });
    const team = await makeTeam(leader.id, 4, {
      auditStatus: "approved",
      publicDisplay: true,
      publicConsentAt: new Date(),
    });
    const external = await makeParticipant("X", { auditStatus: "approved" });
    authUser.id = external.userId;
    const result = await applyToTeam(
      team.id,
      { ok: false, message: "" },
      actionForm({ message: "hi" }),
    );
    expect(result.ok).toBe(false);
    expect(result.message).toContain("校内成员");
  });
  it("rejects applications to a team whose recruitment deadline has passed", async () => {
    const leader = await makeParticipant("L", {
      auditStatus: "approved",
      isInternal: true,
    });
    const team = await makeTeam(leader.id, 4, {
      auditStatus: "approved",
      publicDisplay: true,
      publicConsentAt: new Date(),
      recruitmentDeadline: "2020-01-01",
    });
    const applicant = await makeParticipant("A", {
      auditStatus: "approved",
      isInternal: true,
    });
    authUser.id = applicant.userId;
    const result = await applyToTeam(
      team.id,
      { ok: false, message: "" },
      actionForm({ message: "hi" }),
    );
    expect(result.ok).toBe(false);
    expect(result.message).toContain("不可申请");
  });
  it("rejects a duplicate pending application to the same team", async () => {
    const leader = await makeParticipant("L", {
      auditStatus: "approved",
      isInternal: true,
    });
    const team = await makeTeam(leader.id, 4, {
      auditStatus: "approved",
      publicDisplay: true,
      publicConsentAt: new Date(),
    });
    const applicant = await makeParticipant("A", {
      auditStatus: "approved",
      isInternal: true,
    });
    authUser.id = applicant.userId;
    expect(
      (
        await applyToTeam(
          team.id,
          { ok: false, message: "" },
          actionForm({ message: "first" }),
        )
      ).ok,
    ).toBe(true);
    const dup = await applyToTeam(
      team.id,
      { ok: false, message: "" },
      actionForm({ message: "again" }),
    );
    expect(dup.ok).toBe(false);
    expect(dup.message).toContain("申请过");
  });
  it("rejects applications before the participant audit is approved", async () => {
    const leader = await makeParticipant("L", {
      auditStatus: "approved",
      isInternal: true,
    });
    const team = await makeTeam(leader.id, 4, {
      auditStatus: "approved",
      publicDisplay: true,
      publicConsentAt: new Date(),
    });
    const applicant = await makeParticipant("A", {
      auditStatus: "pending",
      isInternal: true,
    });
    authUser.id = applicant.userId;
    const result = await applyToTeam(
      team.id,
      { ok: false, message: "" },
      actionForm({ message: "hi" }),
    );
    expect(result.ok).toBe(false);
    expect(result.message).toContain("审核通过");
  });
  it("rejects applications from a participant already in another team", async () => {
    const leader1 = await makeParticipant("L1", {
      auditStatus: "approved",
      isInternal: true,
    });
    const leader2 = await makeParticipant("L2", {
      auditStatus: "approved",
      isInternal: true,
    });
    const member = await makeParticipant("M", {
      auditStatus: "approved",
      isInternal: true,
    });
    const team1 = await makeTeam(leader1.id, 4, {
      auditStatus: "approved",
      publicDisplay: true,
      publicConsentAt: new Date(),
    });
    const team2 = await makeTeam(leader2.id, 4, {
      auditStatus: "approved",
      publicDisplay: true,
      publicConsentAt: new Date(),
    });
    await db.insert(teamMembers).values({
      teamId: team1.id,
      participantId: member.id,
      position: 2,
      consentedAt: new Date(),
    });
    authUser.id = member.userId;
    const result = await applyToTeam(
      team2.id,
      { ok: false, message: "" },
      actionForm({ message: "hi" }),
    );
    expect(result.ok).toBe(false);
    expect(result.message).toContain("已经加入队伍");
  });
  it("rejects shrinking a team below its current member count", async () => {
    const leader = await makeParticipant("L", { auditStatus: "approved" });
    const member = await makeParticipant("M", { auditStatus: "approved" });
    const team = await makeTeam(leader.id, 4, {
      auditStatus: "approved",
      publicDisplay: true,
      publicConsentAt: new Date(),
    });
    await db.insert(teamMembers).values({
      teamId: team.id,
      participantId: member.id,
      position: 2,
      consentedAt: new Date(),
    });
    authUser.id = leader.userId;
    const result = await saveTeam(
      { ok: false, message: "" },
      actionForm({
        name: team.name,
        contact: team.contact,
        description: team.description,
        recruitmentDeadline: "2099-12-31",
        maxSize: "1",
        publicDisplay: "on",
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.message).toContain("不能缩减");
  });
  it("rejects leader transfer to a non-member, an unconfirmed member, or the current leader", async () => {
    const leader = await makeParticipant("L", { auditStatus: "approved" });
    const member = await makeParticipant("M", { auditStatus: "approved" });
    const unconfirmed = await makeParticipant("U", { auditStatus: "approved" });
    const outsider = await makeParticipant("O", { auditStatus: "approved" });
    const team = await makeTeam(leader.id, 4, {
      auditStatus: "approved",
      publicDisplay: true,
      publicConsentAt: new Date(),
    });
    await db.insert(teamMembers).values({
      teamId: team.id,
      participantId: member.id,
      position: 2,
      consentedAt: new Date(),
    });
    await db.insert(teamMembers).values({
      teamId: team.id,
      participantId: unconfirmed.id,
      position: 3,
      consentedAt: null,
    });
    authUser.id = leader.userId;

    const notMember = await changeTeamLeader(
      { ok: false, message: "" },
      actionForm({ participantNumber: String(outsider.participantNumber) }),
    );
    expect(notMember.ok).toBe(false);
    expect(notMember.message).toContain("当前队伍成员");

    const notConsented = await changeTeamLeader(
      { ok: false, message: "" },
      actionForm({ participantNumber: String(unconfirmed.participantNumber) }),
    );
    expect(notConsented.ok).toBe(false);
    expect(notConsented.message).toContain("尚未确认");

    const alreadyLeader = await changeTeamLeader(
      { ok: false, message: "" },
      actionForm({ participantNumber: String(leader.participantNumber) }),
    );
    expect(alreadyLeader.ok).toBe(false);
    expect(alreadyLeader.message).toContain("已经是队长");
  });
  it("lets the first team's approval win and blocks the second", async () => {
    const leader1 = await makeParticipant("L1", {
      auditStatus: "approved",
      isInternal: true,
    });
    const leader2 = await makeParticipant("L2", {
      auditStatus: "approved",
      isInternal: true,
    });
    const applicant = await makeParticipant("A", {
      auditStatus: "approved",
      isInternal: true,
    });
    const team1 = await makeTeam(leader1.id, 4, {
      auditStatus: "approved",
      publicDisplay: true,
      publicConsentAt: new Date(),
    });
    const team2 = await makeTeam(leader2.id, 4, {
      auditStatus: "approved",
      publicDisplay: true,
      publicConsentAt: new Date(),
    });
    const [app1, app2] = await db
      .insert(teamApplications)
      .values([
        { teamId: team1.id, applicantId: applicant.id },
        { teamId: team2.id, applicantId: applicant.id },
      ])
      .returning();

    authUser.id = leader1.userId;
    expect(
      (
        await reviewTeamApplication(
          app1.id,
          { ok: false, message: "" },
          actionForm({ decision: "approve" }),
        )
      ).ok,
    ).toBe(true);

    // Approving the applicant into team1 auto-withdraws their other pending
    // applications, so team2's later approval can no longer see a pending
    // record — the applicant can never be pulled into a second team.
    authUser.id = leader2.userId;
    const second = await reviewTeamApplication(
      app2.id,
      { ok: false, message: "" },
      actionForm({ decision: "approve" }),
    );
    expect(second.ok).toBe(false);
    expect(second.message).toContain("状态已变化");

    const [withdrawn] = await db
      .select()
      .from(teamApplications)
      .where(eq(teamApplications.id, app2.id));
    expect(withdrawn.status).toBe("withdrawn");

    const memberships = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.participantId, applicant.id));
    expect(memberships).toHaveLength(1);
    expect(memberships[0].teamId).toBe(team1.id);
  });
  it("audits team, confirmation and submission records with a rejection reason", async () => {
    const leader = await makeParticipant("L", { auditStatus: "approved" });
    const team = await makeTeam(leader.id, 4, {
      auditStatus: "approved",
      publicDisplay: true,
      publicConsentAt: new Date(),
    });
    authUser.id = leader.userId;

    const teamRejected = await updateAudit(
      "team",
      team.id,
      { ok: false, message: "" },
      actionForm({ decision: "rejected", reason: "方向不明" }),
    );
    expect(teamRejected.ok).toBe(true);
    const [storedTeam] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, team.id));
    expect(storedTeam).toMatchObject({
      auditStatus: "rejected",
      exception: "方向不明",
    });
    await updateAudit(
      "team",
      team.id,
      { ok: false, message: "" },
      actionForm({ decision: "approved" }),
    );

    await submitConfirmation(
      { ok: false, message: "" },
      actionForm({ allConfirmed: "on" }),
    );
    const [conf] = await db
      .select()
      .from(teamConfirmations)
      .where(eq(teamConfirmations.teamId, team.id));
    const confRejected = await updateAudit(
      "confirmation",
      conf.id,
      { ok: false, message: "" },
      actionForm({ decision: "rejected", reason: "成员信息有误" }),
    );
    expect(confRejected.ok).toBe(true);
    const [storedConf] = await db
      .select()
      .from(teamConfirmations)
      .where(eq(teamConfirmations.id, conf.id));
    expect(storedConf).toMatchObject({
      auditStatus: "rejected",
      exception: "成员信息有误",
    });
    await updateAudit(
      "confirmation",
      conf.id,
      { ok: false, message: "" },
      actionForm({ decision: "approved" }),
    );

    const saved = await saveSubmission(
      { ok: false, message: "" },
      submissionForm(),
    );
    expect(saved.ok).toBe(true);
    const [sub] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.teamId, team.id));
    const subRejected = await updateAudit(
      "submission",
      sub.id,
      { ok: false, message: "" },
      actionForm({ decision: "rejected", reason: "材料不全" }),
    );
    expect(subRejected.ok).toBe(true);
    const [storedSub] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, sub.id));
    expect(storedSub).toMatchObject({
      auditStatus: "rejected",
      adminNote: "材料不全",
    });
  });
  it("keeps registration approved when the participant edits their profile", async () => {
    const participant = await makeParticipant("P", {
      auditStatus: "approved",
      publicDisplay: true,
    });
    authUser.id = participant.userId;
    const result = await saveRegistration(
      { ok: false, message: "" },
      actionForm({
        name: participant.name,
        phone: participant.phone,
        email: participant.email,
        school: participant.school,
        college: participant.college,
        grade: participant.grade,
        studentId: participant.studentId,
        registrationMethod: "暂未确定",
      }),
    );
    expect(result.ok).toBe(true);
    const [stored] = await db
      .select()
      .from(participants)
      .where(eq(participants.id, participant.id));
    expect(stored).toMatchObject({ auditStatus: "approved", adminNote: "" });
  });
  it("only lets a participant withdraw their own pending application", async () => {
    const leader = await makeParticipant("L", {
      auditStatus: "approved",
      isInternal: true,
    });
    const team = await makeTeam(leader.id, 4, {
      auditStatus: "approved",
      publicDisplay: true,
      publicConsentAt: new Date(),
    });
    const applicant = await makeParticipant("A", {
      auditStatus: "approved",
      isInternal: true,
    });
    const other = await makeParticipant("O", {
      auditStatus: "approved",
      isInternal: true,
    });
    authUser.id = applicant.userId;
    await applyToTeam(
      team.id,
      { ok: false, message: "" },
      actionForm({ message: "hi" }),
    );
    const [application] = await db
      .select()
      .from(teamApplications)
      .where(
        and(
          eq(teamApplications.teamId, team.id),
          eq(teamApplications.applicantId, applicant.id),
        ),
      );

    authUser.id = other.userId;
    await withdrawApplication(application.id);
    const [still] = await db
      .select()
      .from(teamApplications)
      .where(eq(teamApplications.id, application.id));
    expect(still.status).toBe("pending");

    authUser.id = applicant.userId;
    await withdrawApplication(application.id);
    const [withdrawn] = await db
      .select()
      .from(teamApplications)
      .where(eq(teamApplications.id, application.id));
    expect(withdrawn.status).toBe("withdrawn");
    const ctx = await teamApplicationContext(applicant.userId, team.id);
    expect(ctx?.activeApplicationCount).toBe(0);
  });
  it("filters public teams and participants by keyword", async () => {
    const leader = await makeParticipant("L", {
      auditStatus: "approved",
      publicDisplay: true,
    });
    await makeTeam(leader.id, 4, {
      auditStatus: "approved",
      publicDisplay: true,
      publicConsentAt: new Date(),
      name: "Alpha Team",
      projectDirection: "AI",
    });
    await makeParticipant("Bob", {
      auditStatus: "approved",
      publicDisplay: true,
      publicContact: "bob@example.com",
      registrationMethod: "个人报名，正在找队伍",
      bio: "擅长前端开发",
    });

    expect((await publicTeams("alpha", 1, 50)).total).toBe(1);
    expect((await publicTeams("nope", 1, 50)).total).toBe(0);
    expect((await publicParticipants("bob", 1, 50)).total).toBe(1);
    expect((await publicParticipants("missing", 1, 50)).total).toBe(0);
  });
});
