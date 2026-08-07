"use server";

import { and, count, eq, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
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
} from "@/db/schema";
import { requireAdmin, requireUser } from "@/lib/authz";
import type { ActionState } from "@/lib/domain";
import { participantForUser, teamForLeader } from "@/lib/queries";
import {
  applicationSchema,
  confirmationSchema,
  formDataObject,
  participantSchema,
  submissionSchema,
  teamSchema,
} from "@/lib/validators";

function invalid(error: {
  flatten(): { fieldErrors: Record<string, string[]> };
}): ActionState {
  return {
    ok: false,
    message: "请检查表单内容",
    fieldErrors: error.flatten().fieldErrors,
  };
}

export async function requestMagicLink(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const callbackUrl = String(formData.get("callbackUrl") ?? "/");
  if (!/^\S+@\S+\.\S+$/.test(email))
    return { ok: false, message: "请输入有效邮箱" };
  try {
    await signIn("nodemailer", { email, redirectTo: callbackUrl });
    return { ok: true, message: "登录链接已发送，请检查邮箱" };
  } catch (error) {
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
  const values = {
    ...parsed.data,
    email: user.email ?? parsed.data.email,
    updatedAt: new Date(),
  };
  await db
    .insert(participants)
    .values({ ...values, userId: user.id })
    .onConflictDoUpdate({ target: participants.userId, set: values });
  revalidatePath("/register");
  revalidatePath("/my-registration");
  return { ok: true, message: "报名资料已保存" };
}

export async function saveTeam(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser("/create");
  const parsed = teamSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const participant = await participantForUser(user.id);
  if (!participant) return { ok: false, message: "请先完成参赛报名" };

  const { memberNumbers, ...teamValues } = parsed.data;
  const normalizedNumbers = [
    ...new Set(
      memberNumbers
        .map((value) => Number(value.trim().toUpperCase().replace(/^P/, "")))
        .filter(Number.isInteger),
    ),
  ];
  if (normalizedNumbers.length > teamValues.maxSize - 1)
    return {
      ok: false,
      message: `成员数不能超过 ${teamValues.maxSize - 1} 人`,
    };
  try {
    await db.transaction(async (tx) => {
      const memberRows = normalizedNumbers.length
        ? await tx
            .select()
            .from(participants)
            .where(inArray(participants.participantNumber, normalizedNumbers))
        : [];
      if (memberRows.length !== normalizedNumbers.length)
        throw new Error("部分参赛者编号不存在");
      if (memberRows.some((item) => item.id === participant.id))
        throw new Error("队长无需重复填写为成员");
      const targetIds = memberRows.map((item) => item.id);
      const existing = (
        await tx
          .select()
          .from(teams)
          .where(eq(teams.leaderParticipantId, participant.id))
          .limit(1)
      )[0];
      if (existing) {
        const confirmed = await tx
          .select({ value: count() })
          .from(teamConfirmations)
          .where(eq(teamConfirmations.teamId, existing.id));
        if (Number(confirmed[0]?.value ?? 0) > 0)
          throw new Error("最终确认后不能修改队伍资料");
        if (targetIds.length) {
          const occupied = await tx
            .select()
            .from(teamMembers)
            .where(
              and(
                inArray(teamMembers.participantId, targetIds),
                ne(teamMembers.teamId, existing.id),
              ),
            );
          if (occupied.length) throw new Error("部分成员已经加入其他队伍");
        }
        await tx
          .update(teams)
          .set({ ...teamValues, updatedAt: new Date() })
          .where(eq(teams.id, existing.id));
        await tx
          .delete(teamMembers)
          .where(
            and(
              eq(teamMembers.teamId, existing.id),
              ne(teamMembers.participantId, participant.id),
            ),
          );
        if (memberRows.length)
          await tx.insert(teamMembers).values(
            memberRows.map((member, index) => ({
              teamId: existing.id,
              participantId: member.id,
              role: "成员",
              position: index + 2,
            })),
          );
        return;
      }
      const membership = await tx
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.participantId, participant.id))
        .limit(1);
      if (membership.length) throw new Error("你已经加入其他队伍");
      if (targetIds.length) {
        const occupied = await tx
          .select()
          .from(teamMembers)
          .where(inArray(teamMembers.participantId, targetIds));
        if (occupied.length) throw new Error("部分成员已经加入其他队伍");
      }
      const [created] = await tx
        .insert(teams)
        .values({ ...teamValues, leaderParticipantId: participant.id })
        .returning();
      await tx.insert(teamMembers).values({
        teamId: created.id,
        participantId: participant.id,
        role: "队长",
        position: 1,
      });
      if (memberRows.length)
        await tx.insert(teamMembers).values(
          memberRows.map((member, index) => ({
            teamId: created.id,
            participantId: member.id,
            role: "成员",
            position: index + 2,
          })),
        );
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "保存队伍失败",
    };
  }
  revalidatePath("/create");
  revalidatePath("/my-team");
  revalidatePath("/browse-teams");
  return { ok: true, message: "队伍资料已保存" };
}

export async function changeTeamLeader(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser("/my-team");
  const owned = await teamForLeader(user.id);
  if (!owned) return { ok: false, message: "你不是队长" };
  const raw = String(formData.get("participantNumber") ?? "")
    .trim()
    .toUpperCase()
    .replace(/^P/, "");
  const number = Number(raw);
  if (!Number.isInteger(number))
    return { ok: false, message: "请输入有效参赛者编号" };
  const target = owned.members.find(
    ({ participant }) => participant.participantNumber === number,
  );
  if (!target) return { ok: false, message: "新队长必须是当前队伍成员" };
  if (target.participant.id === owned.team.leaderParticipantId)
    return { ok: false, message: "该成员已经是队长" };
  try {
    await db.transaction(async (tx) => {
      const confirmed = await tx
        .select()
        .from(teamConfirmations)
        .where(eq(teamConfirmations.teamId, owned.team.id))
        .limit(1);
      if (confirmed.length) throw new Error("最终确认后不能转让队长");
      await tx
        .update(teams)
        .set({
          leaderParticipantId: target.participant.id,
          updatedAt: new Date(),
        })
        .where(eq(teams.id, owned.team.id));
      await tx
        .update(teamMembers)
        .set({ role: "成员" })
        .where(
          and(
            eq(teamMembers.teamId, owned.team.id),
            eq(teamMembers.participantId, owned.team.leaderParticipantId),
          ),
        );
      await tx
        .update(teamMembers)
        .set({ role: "队长" })
        .where(
          and(
            eq(teamMembers.teamId, owned.team.id),
            eq(teamMembers.participantId, target.participant.id),
          ),
        );
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "队长转让失败",
    };
  }
  revalidatePath("/my-team");
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
  const participant = await participantForUser(user.id);
  if (!participant) return { ok: false, message: "请先完成参赛报名" };
  const membership = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.participantId, participant.id))
    .limit(1);
  if (membership.length)
    return { ok: false, message: "你已经加入队伍，不能重复申请" };
  const team = (
    await db.select().from(teams).where(eq(teams.id, teamId)).limit(1)
  )[0];
  if (!team) return { ok: false, message: "队伍不存在" };
  if (!team.allowExternal && !participant.isInternal)
    return { ok: false, message: "这支队伍只接受校内成员" };
  const active = await db
    .select({ value: count() })
    .from(teamApplications)
    .where(
      and(
        eq(teamApplications.applicantId, participant.id),
        eq(teamApplications.status, "pending"),
      ),
    );
  if (Number(active[0]?.value ?? 0) >= 3)
    return { ok: false, message: "同时申请的队伍最多 3 支" };
  const duplicate = await db
    .select()
    .from(teamApplications)
    .where(
      and(
        eq(teamApplications.teamId, teamId),
        eq(teamApplications.applicantId, participant.id),
        eq(teamApplications.status, "pending"),
      ),
    )
    .limit(1);
  if (duplicate.length) return { ok: false, message: "你已经申请过这支队伍" };
  await db.insert(teamApplications).values({
    teamId,
    applicantId: participant.id,
    message: parsed.data.message,
  });
  revalidatePath(`/team/${teamId}`);
  return { ok: true, message: "申请已提交" };
}

export async function withdrawApplication(applicationId: string) {
  const user = await requireUser("/my-team");
  const participant = await participantForUser(user.id);
  if (!participant) return;
  await db
    .update(teamApplications)
    .set({ status: "withdrawn", updatedAt: new Date() })
    .where(
      and(
        eq(teamApplications.id, applicationId),
        eq(teamApplications.applicantId, participant.id),
      ),
    );
  revalidatePath("/my-team");
}

export async function closeMyTeam() {
  const user = await requireUser("/my-team");
  const owned = await teamForLeader(user.id);
  if (!owned) return;
  const confirmed = await db
    .select()
    .from(teamConfirmations)
    .where(eq(teamConfirmations.teamId, owned.team.id))
    .limit(1);
  if (confirmed.length) return;
  await db
    .update(teams)
    .set({
      recruitStatus: "completed",
      publicDisplay: false,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, owned.team.id));
  revalidatePath("/my-team");
  revalidatePath("/browse-teams");
}

export async function submitConfirmation(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser("/final-confirmation");
  const parsed = confirmationSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const owned = await teamForLeader(user.id);
  if (!owned) return { ok: false, message: "只有队长可以提交最终确认" };
  try {
    await db.transaction(async (tx) => {
      const [confirmation] = await tx
        .insert(teamConfirmations)
        .values({
          teamId: owned.team.id,
          submittedById: owned.team.leaderParticipantId,
          allConfirmed: true,
        })
        .onConflictDoUpdate({
          target: teamConfirmations.teamId,
          set: {
            allConfirmed: true,
            auditStatus: "pending",
            updatedAt: new Date(),
          },
        })
        .returning();
      await tx
        .delete(confirmationMembers)
        .where(eq(confirmationMembers.confirmationId, confirmation.id));
      await tx.insert(confirmationMembers).values(
        owned.members.map(({ participant, role, position }) => ({
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
        .where(eq(teams.id, owned.team.id));
    });
  } catch {
    return { ok: false, message: "最终确认提交失败" };
  }
  revalidatePath("/final-confirmation");
  return { ok: true, message: "最终确认已提交" };
}

export async function saveSubmission(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser("/submission");
  const parsed = submissionSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const owned = await teamForLeader(user.id);
  if (!owned) return { ok: false, message: "只有队长可以提交作品" };
  const confirmation = await db
    .select()
    .from(teamConfirmations)
    .where(eq(teamConfirmations.teamId, owned.team.id))
    .limit(1);
  if (!confirmation.length)
    return { ok: false, message: "请先完成最终组队确认" };
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
    ...links
  } = parsed.data;
  await db
    .insert(submissions)
    .values({
      teamId: owned.team.id,
      submittedById: owned.team.leaderParticipantId,
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
    })
    .onConflictDoUpdate({
      target: submissions.teamId,
      set: {
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
        auditStatus: "pending",
        updatedAt: new Date(),
      },
    });
  revalidatePath("/submission");
  revalidatePath("/showcase");
  return { ok: true, message: "作品资料已保存" };
}

export async function updateAudit(
  kind: "participant" | "team" | "confirmation" | "submission",
  id: string,
  status: "pending" | "approved" | "rejected",
) {
  await requireAdmin();
  const table = {
    participant: participants,
    team: teams,
    confirmation: teamConfirmations,
    submission: submissions,
  }[kind];
  await db
    .update(table)
    .set({ auditStatus: status, updatedAt: new Date() })
    .where(eq(table.id, id));
  revalidatePath("/admin");
  revalidatePath("/browse-teams");
  revalidatePath("/browse-pool");
  revalidatePath("/showcase");
}
