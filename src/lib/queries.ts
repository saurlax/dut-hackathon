import "server-only";

import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
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
} from "@/db/schema";
import { displayNumber } from "@/lib/domain";

export async function participantForUser(userId: string) {
  return (
    (
      await db
        .select()
        .from(participants)
        .where(eq(participants.userId, userId))
        .limit(1)
    )[0] ?? null
  );
}

export async function publicParticipants(keyword = "") {
  const where = and(
    eq(participants.publicDisplay, true),
    eq(participants.auditStatus, "approved"),
    keyword
      ? or(
          ilike(participants.name, `%${keyword}%`),
          ilike(participants.bio, `%${keyword}%`),
        )
      : undefined,
  );
  return db
    .select()
    .from(participants)
    .where(where)
    .orderBy(desc(participants.updatedAt))
    .limit(100);
}

export async function publicTeams(keyword = "") {
  const size = db
    .select({
      teamId: teamMembers.teamId,
      value: count(teamMembers.participantId).as("member_count"),
    })
    .from(teamMembers)
    .groupBy(teamMembers.teamId)
    .as("team_size");
  return db
    .select({
      team: teams,
      leaderName: participants.name,
      currentSize: sql<number>`coalesce(${size.value}, 0)`,
    })
    .from(teams)
    .innerJoin(participants, eq(teams.leaderParticipantId, participants.id))
    .leftJoin(size, eq(teams.id, size.teamId))
    .where(
      and(
        eq(teams.publicDisplay, true),
        eq(teams.auditStatus, "approved"),
        keyword
          ? or(
              ilike(teams.name, `%${keyword}%`),
              ilike(teams.projectDirection, `%${keyword}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(teams.updatedAt))
    .limit(100);
}

export async function teamDetail(id: string) {
  const team = (
    await db
      .select({ team: teams, leaderName: participants.name })
      .from(teams)
      .innerJoin(participants, eq(teams.leaderParticipantId, participants.id))
      .where(eq(teams.id, id))
      .limit(1)
  )[0];
  if (!team) return null;
  const members = await db
    .select({
      participant: participants,
      role: teamMembers.role,
      position: teamMembers.position,
    })
    .from(teamMembers)
    .innerJoin(participants, eq(teamMembers.participantId, participants.id))
    .where(eq(teamMembers.teamId, id))
    .orderBy(asc(teamMembers.position));
  return { ...team, members };
}

export async function teamForLeader(userId: string) {
  const participant = await participantForUser(userId);
  if (!participant) return null;
  const team = (
    await db
      .select()
      .from(teams)
      .where(eq(teams.leaderParticipantId, participant.id))
      .limit(1)
  )[0];
  if (!team) return null;
  return teamDetail(team.id);
}

export async function applicationsForUser(userId: string) {
  const participant = await participantForUser(userId);
  if (!participant) return [];
  return db
    .select({ application: teamApplications, teamName: teams.name })
    .from(teamApplications)
    .innerJoin(teams, eq(teamApplications.teamId, teams.id))
    .where(eq(teamApplications.applicantId, participant.id))
    .orderBy(desc(teamApplications.createdAt));
}

export async function applicationsForLeader(userId: string) {
  const owned = await teamForLeader(userId);
  if (!owned) return [];
  return db
    .select({ application: teamApplications, participant: participants })
    .from(teamApplications)
    .innerJoin(participants, eq(teamApplications.applicantId, participants.id))
    .where(eq(teamApplications.teamId, owned.team.id))
    .orderBy(desc(teamApplications.createdAt));
}

export async function confirmationForTeam(teamId: string) {
  const confirmation = (
    await db
      .select()
      .from(teamConfirmations)
      .where(eq(teamConfirmations.teamId, teamId))
      .limit(1)
  )[0];
  if (!confirmation) return null;
  const members = await db
    .select()
    .from(confirmationMembers)
    .where(eq(confirmationMembers.confirmationId, confirmation.id))
    .orderBy(asc(confirmationMembers.position));
  return { confirmation, members };
}

export async function submissionForTeam(teamId: string) {
  return (
    (
      await db
        .select()
        .from(submissions)
        .where(eq(submissions.teamId, teamId))
        .limit(1)
    )[0] ?? null
  );
}

export async function showcase(keyword = "") {
  return db
    .select({ submission: submissions, teamName: teams.name })
    .from(submissions)
    .innerJoin(teams, eq(submissions.teamId, teams.id))
    .where(
      and(
        eq(submissions.auditStatus, "approved"),
        eq(submissions.publicDisplay, true),
        keyword ? ilike(submissions.projectName, `%${keyword}%`) : undefined,
      ),
    )
    .orderBy(desc(submissions.updatedAt));
}

export async function adminOverview() {
  const [teamRows, participantRows, confirmationRows, submissionRows] =
    await Promise.all([
      db.select().from(teams).orderBy(desc(teams.createdAt)),
      db.select().from(participants).orderBy(desc(participants.createdAt)),
      db
        .select()
        .from(teamConfirmations)
        .orderBy(desc(teamConfirmations.createdAt)),
      db.select().from(submissions).orderBy(desc(submissions.createdAt)),
    ]);
  return {
    teams: teamRows.map((item) => ({
      ...item,
      number: displayNumber("T", item.teamNumber),
    })),
    participants: participantRows.map((item) => ({
      ...item,
      number: displayNumber("P", item.participantNumber),
    })),
    confirmations: confirmationRows,
    submissions: submissionRows,
  };
}

export async function currentUserRecord(userId: string) {
  return (
    (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0] ??
    null
  );
}
