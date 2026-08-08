import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db, pool } from "../../src/db/client";
import {
  addAdminUser,
  changeTeamLeader,
  closeMyTeam,
  resumeMyTeam,
  respondToMembership,
  reviewTeamApplication,
  requestMagicLink,
  saveRegistration,
  saveSubmission,
  saveTeam,
  submitConfirmation,
  updateAudit,
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
  participants,
  submissions,
  teamApplications,
  teamConfirmations,
  teamMembers,
  teams,
  users,
  verificationTokens,
} from "../../src/db/schema";

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

describe("PostgreSQL business constraints", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    authUser.id = "";
    await db.delete(verificationTokens);
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

    const ids = (await publicParticipants()).map(({ id }) => id);

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
    expect(result.message).toContain("审核通过");
    expect(storedTeam).toMatchObject({
      recruitStatus: "recruiting",
      publicDisplay: true,
      auditStatus: "pending",
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
    expect(list.find(({ team: item }) => item.id === team.id)).toMatchObject({
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

    expect(await showcase()).toEqual([]);
    expect(await publicSubmissionDetail(submission.id)).toBeNull();
    await db
      .update(submissions)
      .set({ publicConsentAt: new Date() })
      .where(eq(submissions.id, submission.id));
    const detail = await publicSubmissionDetail(submission.id);
    expect(detail?.submission.projectName).toBe("Private by default");
    expect("adminNote" in (detail?.submission ?? {})).toBe(false);
    expect("submittedById" in (detail?.submission ?? {})).toBe(false);
    expect(await showcase()).toHaveLength(1);

    await db
      .update(teams)
      .set({ auditStatus: "pending" })
      .where(eq(teams.id, team.id));
    expect(await showcase()).toEqual([]);
    expect(await publicSubmissionDetail(submission.id)).toBeNull();

    await db
      .update(teams)
      .set({
        auditStatus: "approved",
        publicDisplay: false,
        publicConsentAt: null,
      })
      .where(eq(teams.id, team.id));
    expect(await showcase()).toEqual([]);
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
    expect(await showcase()).toEqual([]);
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
});
