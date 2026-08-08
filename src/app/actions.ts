"use server";

import { and, count, eq, gt, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { db } from "@/db";
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
} from "@/db/schema";
import { requireAdmin, requireUser } from "@/lib/authz";
import { resolveEmailRateLimitIp } from "@/lib/client-ip";
import { adminEmails, getServerEnv } from "@/lib/env";
import type { ActionState } from "@/lib/domain";
import { isRecruitmentOpen, normalizeLoginEmail } from "@/lib/domain";
import {
  consumeMagicLinkIpRateLimit,
  isEmailRateLimitError,
} from "@/lib/email-rate-limit";
import {
  applicationSchema,
  auditDecisionSchema,
  confirmationSchema,
  emailLoginSchema,
  formDataObject,
  participantSchema,
  submissionSchema,
  teamSchema,
} from "@/lib/validators";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

class RuleError extends Error {}

function fail(message: string): never {
  throw new RuleError(message);
}

function invalid(error: {
  flatten(): { fieldErrors: Record<string, string[]> };
}): ActionState {
  return {
    ok: false,
    message: "请检查表单内容",
    fieldErrors: error.flatten().fieldErrors,
  };
}

function mutationFailure(error: unknown, fallback: string): ActionState {
  return {
    ok: false,
    message: error instanceof RuleError ? error.message : fallback,
  };
}

async function participantForUserInTransaction(
  tx: Transaction,
  userId: string,
) {
  return (
    (
      await tx
        .select()
        .from(participants)
        .where(eq(participants.userId, userId))
        .limit(1)
    )[0] ?? null
  );
}

async function lockParticipantForUser(tx: Transaction, userId: string) {
  return (
    (
      await tx
        .select()
        .from(participants)
        .where(eq(participants.userId, userId))
        .limit(1)
        .for("update")
    )[0] ?? null
  );
}

async function lockParticipant(tx: Transaction, participantId: string) {
  return (
    (
      await tx
        .select()
        .from(participants)
        .where(eq(participants.id, participantId))
        .limit(1)
        .for("update")
    )[0] ?? null
  );
}

async function lockTeamForLeader(tx: Transaction, userId: string) {
  const participant = await participantForUserInTransaction(tx, userId);
  if (!participant) fail("请先完成参赛报名");
  const team = (
    await tx
      .select()
      .from(teams)
      .where(eq(teams.leaderParticipantId, participant.id))
      .limit(1)
      .for("update")
  )[0];
  if (!team) fail("你不是当前队长");
  return { participant, team };
}

async function lockTeam(tx: Transaction, teamId: string) {
  return (
    (
      await tx
        .select()
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1)
        .for("update")
    )[0] ?? null
  );
}

async function teamSize(tx: Transaction, teamId: string) {
  const row = await tx
    .select({ value: count() })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId));
  return Number(row[0]?.value ?? 0);
}

async function assertTeamMutable(tx: Transaction, teamId: string) {
  const confirmation = await tx
    .select({
      id: teamConfirmations.id,
      auditStatus: teamConfirmations.auditStatus,
    })
    .from(teamConfirmations)
    .where(eq(teamConfirmations.teamId, teamId))
    .limit(1);
  if (confirmation.length && confirmation[0].auditStatus !== "rejected")
    fail("最终确认后不能修改队伍");
}

function assertTeamAcceptsApplications(
  team: typeof teams.$inferSelect,
  currentSize: number,
) {
  if (
    !team.publicDisplay ||
    !team.publicConsentAt ||
    team.auditStatus !== "approved" ||
    team.recruitStatus !== "recruiting" ||
    !isRecruitmentOpen(team.recruitmentDeadline)
  ) {
    fail("这支队伍当前不可申请");
  }
  if (currentSize >= team.maxSize) fail("这支队伍已满员");
}

function assertTeamCanApproveApplication(
  team: typeof teams.$inferSelect,
  currentSize: number,
) {
  if (
    !team.publicDisplay ||
    !team.publicConsentAt ||
    team.auditStatus !== "approved" ||
    (team.recruitStatus !== "recruiting" && team.recruitStatus !== "paused") ||
    !isRecruitmentOpen(team.recruitmentDeadline)
  ) {
    fail("这支队伍当前不能同意入队申请");
  }
  if (currentSize >= team.maxSize) fail("这支队伍已满员");
}

export async function requestMagicLink(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = normalizeLoginEmail(String(formData.get("email") ?? ""));
  const callbackUrl = String(formData.get("callbackUrl") ?? "/");
  if (!email) return { ok: false, message: "请输入有效邮箱" };
  const env = getServerEnv();
  const rateLimitIp = resolveEmailRateLimitIp(
    await headers(),
    env.TRUST_PROXY === "true",
    process.env.NODE_ENV,
  );
  try {
    if (rateLimitIp) await consumeMagicLinkIpRateLimit(rateLimitIp);
  } catch (error) {
    if (isEmailRateLimitError(error))
      return { ok: false, message: "发送太频繁，请一分钟后再试" };
    throw error;
  }
  const recentTokens = await db
    .select({ value: count() })
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, email),
        gt(verificationTokens.expires, new Date()),
      ),
    );
  if (Number(recentTokens[0]?.value ?? 0) >= 5)
    return { ok: false, message: "请求过于频繁，请稍后再试" };
  try {
    await signIn("nodemailer", {
      email,
      redirectTo: callbackUrl,
      redirect: false,
    });
    redirect("/login/verify");
  } catch (error) {
    if (isEmailRateLimitError(error))
      return { ok: false, message: "发送太频繁，请一分钟后再试" };
    if (error instanceof AuthError)
      return { ok: false, message: "登录邮件发送失败，请稍后重试" };
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}

export async function saveRegistration(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser("/register");
  const parsed = participantSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const existing = (
    await db
      .select({
        id: participants.id,
        auditStatus: participants.auditStatus,
      })
      .from(participants)
      .where(eq(participants.userId, user.id))
      .limit(1)
  )[0];
  const auditStatus =
    existing?.auditStatus === "rejected" ? "pending" : "approved";
  const values = {
    ...parsed.data,
    updatedAt: new Date(),
  };
  await db
    .insert(participants)
    .values({ ...values, userId: user.id, auditStatus })
    .onConflictDoUpdate({
      target: participants.userId,
      set: {
        ...values,
        auditStatus,
        revision: sql`${participants.revision} + 1`,
        adminNote: "",
      },
    });
  revalidatePath("/register");
  revalidatePath("/my-registration");
  revalidatePath("/browse-pool");
  return {
    ok: true,
    message:
      auditStatus === "pending"
        ? "报名资料已保存；如已授权公开，需管理员恢复后才可展示"
        : parsed.data.publicDisplay
          ? "报名资料已保存，并已按授权公开展示"
          : "报名资料已保存",
  };
}

export async function saveTeam(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser("/create");
  const parsed = teamSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  if (!isRecruitmentOpen(parsed.data.recruitmentDeadline))
    return { ok: false, message: "招募截止日期不能早于今天" };

  const now = new Date();
  const teamValues = {
    ...parsed.data,
    publicConsentAt: parsed.data.publicDisplay ? now : null,
  };
  let requiresAdminRestore = false;
  try {
    await db.transaction(async (tx) => {
      const participant = await participantForUserInTransaction(tx, user.id);
      if (!participant) fail("请先完成参赛报名");
      const existing = (
        await tx
          .select()
          .from(teams)
          .where(eq(teams.leaderParticipantId, participant.id))
          .limit(1)
          .for("update")
      )[0];

      if (existing) {
        await assertTeamMutable(tx, existing.id);
        requiresAdminRestore = existing.auditStatus === "rejected";
        const currentSize = await teamSize(tx, existing.id);
        if (currentSize > teamValues.maxSize)
          fail(`当前已有 ${currentSize} 名成员，不能缩减到更小人数`);
        // Preserve the leader's recruitment intent: editing details must not
        // silently resume a paused team. The deadline is already validated as
        // in the future at the top of this action, so the only states to
        // reconcile here are size-driven fullness and an explicit pause.
        const recruitStatus =
          currentSize >= teamValues.maxSize
            ? "full"
            : existing.recruitStatus === "paused"
              ? "paused"
              : "recruiting";
        await tx
          .update(teams)
          .set({
            ...teamValues,
            recruitStatus,
            auditStatus:
              existing.auditStatus === "rejected" ? "pending" : "approved",
            revision: sql`${teams.revision} + 1`,
            exception: "",
            updatedAt: now,
          })
          .where(
            and(
              eq(teams.id, existing.id),
              eq(teams.leaderParticipantId, participant.id),
            ),
          );
        return;
      }

      const lockedParticipant = await lockParticipantForUser(tx, user.id);
      if (!lockedParticipant) fail("请先完成参赛报名");
      const membership = await tx
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.participantId, lockedParticipant.id))
        .limit(1);
      if (membership.length) fail("你已经加入其他队伍");
      const becameLeader = await tx
        .select({ id: teams.id })
        .from(teams)
        .where(eq(teams.leaderParticipantId, lockedParticipant.id))
        .limit(1);
      if (becameLeader.length) fail("你已经创建了队伍");

      const [created] = await tx
        .insert(teams)
        .values({
          ...teamValues,
          auditStatus: "approved",
          leaderParticipantId: lockedParticipant.id,
        })
        .returning();
      await tx.insert(teamMembers).values({
        teamId: created.id,
        participantId: lockedParticipant.id,
        role: "队长",
        position: 1,
        consentedAt: now,
      });
    });
  } catch (error) {
    return mutationFailure(error, "保存队伍失败，请稍后重试");
  }
  revalidatePath("/create");
  revalidatePath("/my-team");
  revalidatePath("/browse-teams");
  return {
    ok: true,
    message: requiresAdminRestore
      ? "队伍资料已保存；如已授权公开，需管理员恢复后才可展示"
      : parsed.data.publicDisplay
        ? "队伍资料已保存，并已按授权公开展示"
        : "队伍资料已保存；当前未授权公开，不会显示在组队大厅",
  };
}

export async function changeTeamLeader(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser("/my-team");
  const raw = String(formData.get("participantNumber") ?? "")
    .trim()
    .toUpperCase()
    .replace(/^P/, "");
  const number = Number(raw);
  if (!Number.isInteger(number))
    return { ok: false, message: "请输入有效参赛者编号" };
  try {
    await db.transaction(async (tx) => {
      const owned = await lockTeamForLeader(tx, user.id);
      await assertTeamMutable(tx, owned.team.id);
      const target = (
        await tx
          .select({
            participant: participants,
            consentedAt: teamMembers.consentedAt,
          })
          .from(teamMembers)
          .innerJoin(
            participants,
            eq(teamMembers.participantId, participants.id),
          )
          .where(
            and(
              eq(teamMembers.teamId, owned.team.id),
              eq(participants.participantNumber, number),
            ),
          )
          .limit(1)
      )[0];
      if (!target) fail("新队长必须是当前队伍成员");
      if (!target.consentedAt) fail("该成员尚未确认加入队伍");
      if (target.participant.id === owned.team.leaderParticipantId)
        fail("该成员已经是队长");
      await lockParticipant(tx, target.participant.id);
      await tx
        .update(teamMembers)
        .set({ role: "成员" })
        .where(eq(teamMembers.teamId, owned.team.id));
      await tx
        .update(teamMembers)
        .set({ role: "队长" })
        .where(
          and(
            eq(teamMembers.teamId, owned.team.id),
            eq(teamMembers.participantId, target.participant.id),
          ),
        );
      const changed = await tx
        .update(teams)
        .set({
          leaderParticipantId: target.participant.id,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(teams.id, owned.team.id),
            eq(teams.leaderParticipantId, owned.participant.id),
          ),
        )
        .returning({ id: teams.id });
      if (!changed.length) fail("队长状态已变化，请刷新后重试");
    });
  } catch (error) {
    return mutationFailure(error, "队长转让失败，请稍后重试");
  }
  revalidatePath("/my-team");
  revalidatePath("/create");
  return { ok: true, message: "队长已转让" };
}

export async function applyToTeam(
  teamId: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser(`/team/${teamId}`);
  const parsed = applicationSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  try {
    await db.transaction(async (tx) => {
      const team = await lockTeam(tx, teamId);
      if (!team) fail("队伍不存在");
      const currentSize = await teamSize(tx, team.id);
      assertTeamAcceptsApplications(team, currentSize);
      const participant = await lockParticipantForUser(tx, user.id);
      if (!participant) fail("请先完成参赛报名");
      if (participant.auditStatus !== "approved")
        fail("报名资料审核通过后才能申请队伍");
      const membership = await tx
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.participantId, participant.id))
        .limit(1);
      if (membership.length) fail("你已经加入队伍，不能重复申请");
      if (!team.allowExternal && !participant.isInternal)
        fail("这支队伍只接受校内成员");
      const active = await tx
        .select({ value: count() })
        .from(teamApplications)
        .where(
          and(
            eq(teamApplications.applicantId, participant.id),
            eq(teamApplications.status, "pending"),
          ),
        );
      if (Number(active[0]?.value ?? 0) >= 3) fail("同时申请的队伍最多 3 支");
      const duplicate = await tx
        .select({ id: teamApplications.id })
        .from(teamApplications)
        .where(
          and(
            eq(teamApplications.teamId, teamId),
            eq(teamApplications.applicantId, participant.id),
            eq(teamApplications.status, "pending"),
          ),
        )
        .limit(1);
      if (duplicate.length) fail("你已经申请过这支队伍");
      await tx.insert(teamApplications).values({
        teamId,
        applicantId: participant.id,
        message: parsed.data.message,
      });
    });
  } catch (error) {
    return mutationFailure(error, "申请提交失败，请稍后重试");
  }
  revalidatePath(`/team/${teamId}`);
  revalidatePath("/my-team");
  return { ok: true, message: "申请已提交" };
}

export async function withdrawApplication(applicationId: string) {
  const user = await requireUser("/my-team");
  await db.transaction(async (tx) => {
    const participant = await lockParticipantForUser(tx, user.id);
    if (!participant) return;
    const application = await tx
      .select({ id: teamApplications.id })
      .from(teamApplications)
      .where(
        and(
          eq(teamApplications.id, applicationId),
          eq(teamApplications.applicantId, participant.id),
          eq(teamApplications.status, "pending"),
        ),
      )
      .limit(1)
      .for("update");
    if (!application.length) return;
    await tx
      .update(teamApplications)
      .set({ status: "withdrawn", updatedAt: new Date() })
      .where(eq(teamApplications.id, applicationId));
  });
  revalidatePath("/my-team");
}

export async function reviewTeamApplication(
  applicationId: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser("/my-team");
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "approve" && decision !== "reject")
    return { ok: false, message: "无效的审核操作" };
  let teamId = "";
  try {
    await db.transaction(async (tx) => {
      const leader = await participantForUserInTransaction(tx, user.id);
      if (!leader) fail("请先完成参赛报名");
      const applicationHint = (
        await tx
          .select({
            teamId: teamApplications.teamId,
            applicantId: teamApplications.applicantId,
          })
          .from(teamApplications)
          .where(eq(teamApplications.id, applicationId))
          .limit(1)
      )[0];
      if (!applicationHint) fail("申请不存在");
      teamId = applicationHint.teamId;
      const team = (
        await tx
          .select()
          .from(teams)
          .where(
            and(
              eq(teams.id, applicationHint.teamId),
              eq(teams.leaderParticipantId, leader.id),
            ),
          )
          .limit(1)
          .for("update")
      )[0];
      if (!team) fail("你不是这支队伍的当前队长");
      const applicant = await lockParticipant(tx, applicationHint.applicantId);
      if (!applicant) fail("申请人不存在");
      const application = (
        await tx
          .select()
          .from(teamApplications)
          .where(
            and(
              eq(teamApplications.id, applicationId),
              eq(teamApplications.teamId, team.id),
              eq(teamApplications.applicantId, applicant.id),
              eq(teamApplications.status, "pending"),
            ),
          )
          .limit(1)
          .for("update")
      )[0];
      if (!application) fail("申请状态已变化，请刷新后重试");

      if (decision === "reject") {
        await tx
          .update(teamApplications)
          .set({ status: "rejected", updatedAt: new Date() })
          .where(eq(teamApplications.id, application.id));
        return;
      }

      if (applicant.auditStatus !== "approved")
        fail("申请人的报名资料尚未审核通过");
      await assertTeamMutable(tx, team.id);
      const currentSize = await teamSize(tx, team.id);
      assertTeamCanApproveApplication(team, currentSize);
      if (!team.allowExternal && !applicant.isInternal)
        fail("这支队伍只接受校内成员");
      const membership = await tx
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.participantId, applicant.id))
        .limit(1);
      if (membership.length) fail("该申请人已经加入其他队伍");
      const positions = await tx
        .select({ value: teamMembers.position })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, team.id));
      const used = new Set(positions.map(({ value }) => value));
      const position = Array.from(
        { length: team.maxSize },
        (_, index) => index + 1,
      ).find((value) => !used.has(value));
      if (!position) fail("这支队伍已满员");
      const now = new Date();
      await tx.insert(teamMembers).values({
        teamId: team.id,
        participantId: applicant.id,
        role: "成员",
        position,
        consentedAt: now,
      });
      await tx
        .update(teamApplications)
        .set({ status: "approved", updatedAt: now })
        .where(eq(teamApplications.id, application.id));
      await tx
        .update(teamApplications)
        .set({ status: "withdrawn", updatedAt: now })
        .where(
          and(
            eq(teamApplications.applicantId, applicant.id),
            eq(teamApplications.status, "pending"),
            ne(teamApplications.id, application.id),
          ),
        );
      if (currentSize + 1 >= team.maxSize) {
        await tx
          .update(teams)
          .set({ recruitStatus: "full", updatedAt: now })
          .where(eq(teams.id, team.id));
        await tx
          .update(teamApplications)
          .set({ status: "rejected", updatedAt: now })
          .where(
            and(
              eq(teamApplications.teamId, team.id),
              eq(teamApplications.status, "pending"),
            ),
          );
      }
    });
  } catch (error) {
    return mutationFailure(error, "审核申请失败，请稍后重试");
  }
  revalidatePath("/my-team");
  revalidatePath("/browse-teams");
  if (teamId) revalidatePath(`/team/${teamId}`);
  return {
    ok: true,
    message: decision === "approve" ? "已同意申请并加入队伍" : "已拒绝申请",
  };
}

export async function respondToMembership(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser("/my-team");
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "confirm" && decision !== "leave")
    return { ok: false, message: "无效的成员操作" };
  let teamId = "";
  let invalidatedConfirmation = false;
  try {
    await db.transaction(async (tx) => {
      const participant = await participantForUserInTransaction(tx, user.id);
      if (!participant) fail("请先完成参赛报名");
      const membershipHint = (
        await tx
          .select({ teamId: teamMembers.teamId })
          .from(teamMembers)
          .where(eq(teamMembers.participantId, participant.id))
          .limit(1)
      )[0];
      if (!membershipHint) fail("你当前没有加入队伍");
      teamId = membershipHint.teamId;
      const team = await lockTeam(tx, membershipHint.teamId);
      if (!team) fail("队伍不存在");
      const lockedParticipant = await lockParticipant(tx, participant.id);
      if (!lockedParticipant) fail("参赛者不存在");
      const membership = (
        await tx
          .select()
          .from(teamMembers)
          .where(
            and(
              eq(teamMembers.teamId, team.id),
              eq(teamMembers.participantId, participant.id),
            ),
          )
          .limit(1)
          .for("update")
      )[0];
      if (!membership) fail("成员状态已变化，请刷新后重试");
      if (team.leaderParticipantId === participant.id)
        fail("队长不能直接退出队伍，请先转让队长");

      const confirmation = (
        await tx
          .select({
            id: teamConfirmations.id,
            auditStatus: teamConfirmations.auditStatus,
          })
          .from(teamConfirmations)
          .where(eq(teamConfirmations.teamId, team.id))
          .limit(1)
          .for("update")
      )[0];

      if (decision === "confirm") {
        if (membership.consentedAt) fail("你已经确认加入这支队伍");
        await tx
          .update(teamMembers)
          .set({ consentedAt: new Date() })
          .where(
            and(
              eq(teamMembers.teamId, team.id),
              eq(teamMembers.participantId, participant.id),
            ),
          );
        if (!confirmation) return;
      } else if (
        confirmation &&
        membership.consentedAt &&
        confirmation.auditStatus !== "rejected"
      ) {
        fail("最终确认后不能退出队伍");
      }

      if (confirmation) {
        await tx
          .delete(teamConfirmations)
          .where(eq(teamConfirmations.id, confirmation.id));
        await tx
          .update(submissions)
          .set({
            publicDisplay: false,
            publicConsentAt: null,
            auditStatus: "pending",
            updatedAt: new Date(),
          })
          .where(eq(submissions.teamId, team.id));
        invalidatedConfirmation = true;
      }

      if (decision === "leave") {
        await tx
          .delete(teamMembers)
          .where(
            and(
              eq(teamMembers.teamId, team.id),
              eq(teamMembers.participantId, participant.id),
            ),
          );
      }
      if (
        confirmation ||
        (decision === "leave" && team.recruitStatus === "full")
      ) {
        const currentSize = await teamSize(tx, team.id);
        await tx
          .update(teams)
          .set({
            recruitStatus:
              currentSize >= team.maxSize
                ? "full"
                : isRecruitmentOpen(team.recruitmentDeadline)
                  ? "recruiting"
                  : "paused",
            ...(confirmation
              ? { publicDisplay: false, publicConsentAt: null }
              : {}),
            updatedAt: new Date(),
          })
          .where(eq(teams.id, team.id));
      }
    });
  } catch (error) {
    return mutationFailure(error, "成员操作失败，请稍后重试");
  }
  revalidatePath("/my-team");
  revalidatePath("/browse-teams");
  revalidatePath("/final-confirmation");
  revalidatePath("/submission");
  revalidatePath("/showcase");
  if (teamId) revalidatePath(`/team/${teamId}`);
  return {
    ok: true,
    message:
      decision === "confirm"
        ? invalidatedConfirmation
          ? "已确认加入队伍；原最终确认已失效，请队长重新提交"
          : "已确认加入队伍"
        : invalidatedConfirmation
          ? "已退出队伍；原最终确认因缺少本人同意已失效"
          : "已退出队伍",
  };
}

export async function closeMyTeam(
  _state: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  void _formData;
  const user = await requireUser("/my-team");
  let teamId = "";
  try {
    await db.transaction(async (tx) => {
      const owned = await lockTeamForLeader(tx, user.id);
      teamId = owned.team.id;
      await assertTeamMutable(tx, owned.team.id);
      if (owned.team.recruitStatus !== "recruiting")
        fail("当前队伍未处于招募中");
      const changed = await tx
        .update(teams)
        .set({
          recruitStatus: "paused",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(teams.id, owned.team.id),
            eq(teams.leaderParticipantId, owned.participant.id),
            eq(teams.recruitStatus, "recruiting"),
          ),
        )
        .returning({ id: teams.id });
      if (!changed.length) fail("招募状态已变化，请刷新后重试");
    });
  } catch (error) {
    return mutationFailure(error, "暂停招募失败，请稍后重试");
  }
  revalidatePath("/my-team");
  revalidatePath("/browse-teams");
  if (teamId) revalidatePath(`/team/${teamId}`);
  return { ok: true, message: "已暂停招募；待处理申请已保留" };
}

export async function resumeMyTeam(
  _state: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  void _formData;
  const user = await requireUser("/my-team");
  let teamId = "";
  try {
    await db.transaction(async (tx) => {
      const owned = await lockTeamForLeader(tx, user.id);
      teamId = owned.team.id;
      await assertTeamMutable(tx, owned.team.id);
      if (owned.team.recruitStatus !== "paused")
        fail("当前队伍不处于暂停招募状态");
      if (!isRecruitmentOpen(owned.team.recruitmentDeadline))
        fail("招募截止日期已过，请先更新队伍资料");
      if ((await teamSize(tx, owned.team.id)) >= owned.team.maxSize)
        fail("队伍已满员，不能恢复招募");
      const changed = await tx
        .update(teams)
        .set({ recruitStatus: "recruiting", updatedAt: new Date() })
        .where(
          and(
            eq(teams.id, owned.team.id),
            eq(teams.leaderParticipantId, owned.participant.id),
            eq(teams.recruitStatus, "paused"),
          ),
        )
        .returning({ id: teams.id });
      if (!changed.length) fail("招募状态已变化，请刷新后重试");
    });
  } catch (error) {
    return mutationFailure(error, "恢复招募失败，请稍后重试");
  }
  revalidatePath("/my-team");
  revalidatePath("/browse-teams");
  if (teamId) revalidatePath(`/team/${teamId}`);
  return { ok: true, message: "已恢复招募" };
}

export async function submitConfirmation(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser("/final-confirmation");
  const parsed = confirmationSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  try {
    await db.transaction(async (tx) => {
      const owned = await lockTeamForLeader(tx, user.id);
      const existing = (
        await tx
          .select()
          .from(teamConfirmations)
          .where(eq(teamConfirmations.teamId, owned.team.id))
          .limit(1)
          .for("update")
      )[0];
      if (existing?.auditStatus === "pending")
        fail("最终确认正在审核中，请勿重复提交");
      if (existing?.auditStatus === "approved")
        fail("最终确认已审核通过，无需重复提交");
      const members = await tx
        .select({
          participant: participants,
          role: teamMembers.role,
          position: teamMembers.position,
          consentedAt: teamMembers.consentedAt,
        })
        .from(teamMembers)
        .innerJoin(participants, eq(teamMembers.participantId, participants.id))
        .where(eq(teamMembers.teamId, owned.team.id));
      if (!members.length) fail("队伍没有可确认的成员");
      if (members.some(({ consentedAt }) => !consentedAt))
        fail("仍有成员尚未确认加入，不能提交最终确认");
      const leaderMember = members.find(
        ({ participant }) => participant.id === owned.team.leaderParticipantId,
      );
      if (!leaderMember || leaderMember.role !== "队长")
        fail("队长与成员关系不一致，请联系管理员");
      const [confirmation] = existing
        ? await tx
            .update(teamConfirmations)
            .set({
              submittedById: owned.participant.id,
              allConfirmed: true,
              commitment: true,
              auditStatus: "pending",
              revision: sql`${teamConfirmations.revision} + 1`,
              exception: "",
              updatedAt: new Date(),
            })
            .where(eq(teamConfirmations.id, existing.id))
            .returning()
        : await tx
            .insert(teamConfirmations)
            .values({
              teamId: owned.team.id,
              submittedById: owned.participant.id,
              allConfirmed: true,
              commitment: true,
            })
            .returning();
      await tx
        .delete(confirmationMembers)
        .where(eq(confirmationMembers.confirmationId, confirmation.id));
      await tx.insert(confirmationMembers).values(
        members.map(({ participant, role, position }) => ({
          confirmationId: confirmation.id,
          participantId: participant.id,
          participantNumber: participant.participantNumber,
          name: participant.name,
          role,
          position,
        })),
      );
      await tx
        .update(teams)
        .set({ recruitStatus: "completed", updatedAt: new Date() })
        .where(
          and(
            eq(teams.id, owned.team.id),
            eq(teams.leaderParticipantId, owned.participant.id),
          ),
        );
      await tx
        .update(teamApplications)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(
          and(
            eq(teamApplications.teamId, owned.team.id),
            eq(teamApplications.status, "pending"),
          ),
        );
    });
  } catch (error) {
    return mutationFailure(error, "最终确认提交失败，请稍后重试");
  }
  revalidatePath("/final-confirmation");
  revalidatePath("/my-team");
  revalidatePath("/browse-teams");
  return { ok: true, message: "最终确认已提交" };
}

export async function saveSubmission(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser("/submission");
  const parsed = submissionSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const {
    projectName,
    track,
    oneLiner,
    background,
    problemSolved,
    coreFeatures,
    techApproach,
    innovation,
    applicationValue,
    usageGuide,
    publicDisplay,
    ...links
  } = parsed.data;
  const now = new Date();
  try {
    await db.transaction(async (tx) => {
      const owned = await lockTeamForLeader(tx, user.id);
      const confirmation = await tx
        .select({
          id: teamConfirmations.id,
          auditStatus: teamConfirmations.auditStatus,
        })
        .from(teamConfirmations)
        .where(eq(teamConfirmations.teamId, owned.team.id))
        .limit(1)
        .for("update");
      if (!confirmation.length) fail("请先完成最终组队确认");
      // A submission is only allowed once the final team confirmation has been
      // approved by an admin — a pending or rejected confirmation must not open
      // the submission flow (previously any confirmation row was enough).
      const confirmationStatus = confirmation[0].auditStatus;
      if (confirmationStatus === "pending")
        fail("最终确认审核中，暂不能提交作品");
      if (confirmationStatus === "rejected")
        fail("最终确认被驳回，请重新提交最终确认后再提交作品");
      const values = {
        projectName,
        track,
        oneLiner,
        background,
        problemSolved,
        coreFeatures,
        techApproach,
        innovation,
        applicationValue,
        usageGuide,
        links,
        publicDisplay,
        publicConsentAt: publicDisplay ? now : null,
      };
      await tx
        .insert(submissions)
        .values({
          teamId: owned.team.id,
          submittedById: owned.participant.id,
          ...values,
        })
        .onConflictDoUpdate({
          target: submissions.teamId,
          set: {
            ...values,
            auditStatus: "pending",
            materialStatus: "pending",
            revision: sql`${submissions.revision} + 1`,
            adminNote: "",
            updatedAt: now,
          },
        });
    });
  } catch (error) {
    return mutationFailure(error, "作品保存失败，请稍后重试");
  }
  revalidatePath("/submission");
  revalidatePath("/showcase");
  return { ok: true, message: "作品资料已保存" };
}

export async function addAdminUser(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = emailLoginSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const email = parsed.data.email.toLowerCase();
  try {
    await db
      .insert(users)
      .values({ email, role: "admin" })
      .onConflictDoUpdate({
        target: users.email,
        set: { role: "admin", updatedAt: new Date() },
      });
  } catch (error) {
    return mutationFailure(error, "新增管理员失败，请稍后重试");
  }
  revalidatePath("/admin");
  return { ok: true, message: `已将 ${email} 设置为管理员` };
}

export async function removeAdmin(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAdmin();
  const parsed = emailLoginSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const email = parsed.data.email.toLowerCase();
  if (email === (user.email ?? "").toLowerCase())
    return { ok: false, message: "不能移除自己，请联系其他管理员操作" };
  // Seed admins are re-promoted on every login via the signIn event, so the
  // roster cannot be edited for them here — they must be removed from the
  // ADMIN_EMAILS env var instead.
  if (adminEmails().has(email))
    return {
      ok: false,
      message: "该管理员由 ADMIN_EMAILS 配置，无法在后台移除",
    };
  try {
    const outcome = await db.transaction(async (tx) => {
      // Lock the whole admin roster so two concurrent removals cannot race the
      // last-admin guard and empty the roster.
      const roster = await tx
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.role, "admin"))
        .for("update");
      const target = roster.find((row) => row.email.toLowerCase() === email);
      if (!target) return "missing" as const;
      // Only block on the last admin when the target is actually on the
      // roster — removing a non-existent email must report "not an admin".
      if (roster.length <= 1) return "lastAdmin" as const;
      await tx
        .update(users)
        .set({ role: "participant", updatedAt: new Date() })
        .where(eq(users.id, target.id));
      return "removed" as const;
    });
    if (outcome === "lastAdmin")
      return {
        ok: false,
        message: "无法移除最后一名管理员，请先指定新的管理员",
      };
    if (outcome === "missing")
      return { ok: false, message: "该邮箱不是管理员" };
  } catch (error) {
    return mutationFailure(error, "移除管理员失败，请稍后重试");
  }
  revalidatePath("/admin");
  return { ok: true, message: `已移除管理员 ${email}` };
}

export async function updateAudit(
  kind: "participant" | "team" | "confirmation" | "submission",
  id: string,
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = auditDecisionSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { decision, reason, expectedStatus, expectedRevision } = parsed.data;
  if (decision === expectedStatus)
    return { ok: false, message: "审核状态没有变化" };
  const note = decision === "rejected" ? reason : "";
  const now = new Date();
  try {
    if (kind === "participant") {
      const changed = await db
        .update(participants)
        .set({
          auditStatus: decision,
          revision: sql`${participants.revision} + 1`,
          adminNote: note,
          updatedAt: now,
        })
        .where(
          and(
            eq(participants.id, id),
            eq(participants.auditStatus, expectedStatus),
            eq(participants.revision, expectedRevision),
          ),
        )
        .returning({ id: participants.id });
      if (!changed.length) fail("记录已变化，请刷新后重试");
    } else if (kind === "team") {
      const changed = await db
        .update(teams)
        .set({
          auditStatus: decision,
          revision: sql`${teams.revision} + 1`,
          exception: note,
          updatedAt: now,
        })
        .where(
          and(
            eq(teams.id, id),
            eq(teams.auditStatus, expectedStatus),
            eq(teams.revision, expectedRevision),
          ),
        )
        .returning({ id: teams.id });
      if (!changed.length) fail("记录已变化，请刷新后重试");
    } else if (kind === "confirmation") {
      await db.transaction(async (tx) => {
        const [confirmation] = await tx
          .update(teamConfirmations)
          .set({
            auditStatus: decision,
            revision: sql`${teamConfirmations.revision} + 1`,
            exception: note,
            updatedAt: now,
          })
          .where(
            and(
              eq(teamConfirmations.id, id),
              eq(teamConfirmations.auditStatus, expectedStatus),
              eq(teamConfirmations.revision, expectedRevision),
            ),
          )
          .returning({ teamId: teamConfirmations.teamId });
        if (!confirmation) fail("记录已变化，请刷新后重试");
        if (decision === "rejected") {
          await tx
            .update(submissions)
            .set({
              publicDisplay: false,
              publicConsentAt: null,
              auditStatus: "pending",
              materialStatus: "pending",
              revision: sql`${submissions.revision} + 1`,
              updatedAt: now,
            })
            .where(eq(submissions.teamId, confirmation.teamId));
        }
      });
    } else {
      await db.transaction(async (tx) => {
        const [submission] = await tx
          .select({ teamId: submissions.teamId })
          .from(submissions)
          .where(
            and(
              eq(submissions.id, id),
              eq(submissions.auditStatus, expectedStatus),
              eq(submissions.revision, expectedRevision),
            ),
          )
          .limit(1);
        if (!submission) fail("记录已变化，请刷新后重试");
        if (decision === "approved") {
          const [confirmation] = await tx
            .select({ auditStatus: teamConfirmations.auditStatus })
            .from(teamConfirmations)
            .where(eq(teamConfirmations.teamId, submission.teamId))
            .limit(1)
            .for("update");
          if (confirmation?.auditStatus !== "approved")
            fail("最终确认状态已变化，不能通过作品审核");
        }
        const changed = await tx
          .update(submissions)
          .set({
            auditStatus: decision,
            materialStatus: decision === "approved" ? "complete" : "incomplete",
            revision: sql`${submissions.revision} + 1`,
            adminNote: note,
            updatedAt: now,
          })
          .where(
            and(
              eq(submissions.id, id),
              eq(submissions.auditStatus, expectedStatus),
              eq(submissions.revision, expectedRevision),
            ),
          )
          .returning({ id: submissions.id });
        if (!changed.length) fail("记录已变化，请刷新后重试");
      });
    }
  } catch (error) {
    return mutationFailure(error, "更新审核状态失败，请稍后重试");
  }
  revalidatePath("/admin");
  revalidatePath("/my-registration");
  revalidatePath("/my-team");
  revalidatePath("/final-confirmation");
  revalidatePath("/submission");
  revalidatePath("/browse-teams");
  revalidatePath("/browse-pool");
  revalidatePath("/showcase");
  const moderationRecord = kind === "participant" || kind === "team";
  return {
    ok: true,
    message: moderationRecord
      ? decision === "approved"
        ? "已恢复公开"
        : "已下架并记录原因"
      : decision === "approved"
        ? "审核已通过"
        : "已驳回并记录原因",
  };
}
