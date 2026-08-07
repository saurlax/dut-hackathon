import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  or,
  sql,
} from "drizzle-orm";
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
import { displayNumber, eventDate } from "@/lib/domain";

const publicTeamFields = {
  id: teams.id,
  teamNumber: teams.teamNumber,
  name: teams.name,
  track: teams.track,
  projectDirection: teams.projectDirection,
  maturity: teams.maturity,
  capabilities: teams.capabilities,
  requiredRoles: teams.requiredRoles,
  techStack: teams.techStack,
  requirements: teams.requirements,
  description: teams.description,
  contact: teams.contact,
  allowExternal: teams.allowExternal,
  recruitmentDeadline: teams.recruitmentDeadline,
  maxSize: teams.maxSize,
  recruitStatus: teams.recruitStatus,
};

const publicSubmissionFields = {
  id: submissions.id,
  projectName: submissions.projectName,
  track: submissions.track,
  oneLiner: submissions.oneLiner,
  background: submissions.background,
  problemSolved: submissions.problemSolved,
  coreFeatures: submissions.coreFeatures,
  techApproach: submissions.techApproach,
  innovation: submissions.innovation,
  applicationValue: submissions.applicationValue,
  usageGuide: submissions.usageGuide,
  links: submissions.links,
};

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
  return db
    .select({
      id: participants.id,
      participantNumber: participants.participantNumber,
      name: participants.name,
      school: participants.school,
      college: participants.college,
      grade: participants.grade,
      bio: participants.bio,
      desiredRoles: participants.desiredRoles,
      techStack: participants.techStack,
      publicContact: participants.publicContact,
    })
    .from(participants)
    .where(
      and(
        eq(participants.publicDisplay, true),
        eq(participants.auditStatus, "approved"),
        keyword
          ? or(
              ilike(participants.name, `%${keyword}%`),
              ilike(participants.bio, `%${keyword}%`),
            )
          : undefined,
      ),
    )
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
    .where(isNotNull(teamMembers.consentedAt))
    .groupBy(teamMembers.teamId)
    .as("team_size");
  return db
    .select({
      team: publicTeamFields,
      leaderName: participants.name,
      currentSize: sql<number>`cast(coalesce(${size.value}, 0) as integer)`,
    })
    .from(teams)
    .leftJoin(
      participants,
      and(
        eq(teams.leaderParticipantId, participants.id),
        eq(participants.publicDisplay, true),
        eq(participants.auditStatus, "approved"),
      ),
    )
    .leftJoin(size, eq(teams.id, size.teamId))
    .where(
      and(
        eq(teams.publicDisplay, true),
        isNotNull(teams.publicConsentAt),
        eq(teams.auditStatus, "approved"),
        eq(teams.recruitStatus, "recruiting"),
        gte(teams.recruitmentDeadline, eventDate()),
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

export async function publicTeamDetail(id: string) {
  const team = (
    await db
      .select({ team: publicTeamFields, leaderName: participants.name })
      .from(teams)
      .leftJoin(
        participants,
        and(
          eq(teams.leaderParticipantId, participants.id),
          eq(participants.publicDisplay, true),
          eq(participants.auditStatus, "approved"),
        ),
      )
      .where(
        and(
          eq(teams.id, id),
          eq(teams.publicDisplay, true),
          isNotNull(teams.publicConsentAt),
          eq(teams.auditStatus, "approved"),
        ),
      )
      .limit(1)
  )[0];
  if (!team) return null;
  const [members, size] = await Promise.all([
    db
      .select({
        participant: { id: participants.id, name: participants.name },
        role: teamMembers.role,
        position: teamMembers.position,
      })
      .from(teamMembers)
      .innerJoin(participants, eq(teamMembers.participantId, participants.id))
      .where(
        and(
          eq(teamMembers.teamId, id),
          isNotNull(teamMembers.consentedAt),
          eq(participants.publicDisplay, true),
          eq(participants.auditStatus, "approved"),
        ),
      )
      .orderBy(asc(teamMembers.position)),
    db
      .select({ value: count() })
      .from(teamMembers)
      .where(
        and(eq(teamMembers.teamId, id), isNotNull(teamMembers.consentedAt)),
      ),
  ]);
  return {
    ...team,
    leaderName: team.leaderName ?? "未公开",
    members,
    currentSize: Number(size[0]?.value ?? 0),
  };
}

async function teamDetail(id: string) {
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
      consentedAt: teamMembers.consentedAt,
    })
    .from(teamMembers)
    .innerJoin(participants, eq(teamMembers.participantId, participants.id))
    .where(eq(teamMembers.teamId, id))
    .orderBy(asc(teamMembers.position));
  return { ...team, members };
}

export async function teamForUser(userId: string) {
  const participant = await participantForUser(userId);
  if (!participant) return null;
  const membership = (
    await db
      .select({
        teamId: teamMembers.teamId,
        role: teamMembers.role,
        consentedAt: teamMembers.consentedAt,
      })
      .from(teamMembers)
      .where(eq(teamMembers.participantId, participant.id))
      .limit(1)
  )[0];
  if (!membership) return null;
  const detail = await teamDetail(membership.teamId);
  return detail ? { ...detail, membership } : null;
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
    .select({
      application: teamApplications,
      participant: {
        id: participants.id,
        participantNumber: participants.participantNumber,
        name: participants.name,
        isInternal: participants.isInternal,
      },
    })
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
        .select({
          id: submissions.id,
          projectName: submissions.projectName,
          track: submissions.track,
          oneLiner: submissions.oneLiner,
          background: submissions.background,
          problemSolved: submissions.problemSolved,
          coreFeatures: submissions.coreFeatures,
          techApproach: submissions.techApproach,
          innovation: submissions.innovation,
          applicationValue: submissions.applicationValue,
          usageGuide: submissions.usageGuide,
          links: submissions.links,
          publicDisplay: submissions.publicDisplay,
        })
        .from(submissions)
        .where(eq(submissions.teamId, teamId))
        .limit(1)
    )[0] ?? null
  );
}

export async function showcase(keyword = "") {
  return db
    .select({
      submission: {
        id: submissions.id,
        projectName: submissions.projectName,
        track: submissions.track,
        oneLiner: submissions.oneLiner,
      },
      teamName: teams.name,
    })
    .from(submissions)
    .innerJoin(teams, eq(submissions.teamId, teams.id))
    .where(
      and(
        eq(submissions.auditStatus, "approved"),
        eq(submissions.publicDisplay, true),
        isNotNull(submissions.publicConsentAt),
        eq(teams.auditStatus, "approved"),
        eq(teams.publicDisplay, true),
        isNotNull(teams.publicConsentAt),
        keyword ? ilike(submissions.projectName, `%${keyword}%`) : undefined,
      ),
    )
    .orderBy(desc(submissions.updatedAt));
}

export async function publicSubmissionDetail(id: string) {
  return (
    (
      await db
        .select({ submission: publicSubmissionFields, teamName: teams.name })
        .from(submissions)
        .innerJoin(teams, eq(submissions.teamId, teams.id))
        .where(
          and(
            eq(submissions.id, id),
            eq(submissions.auditStatus, "approved"),
            eq(submissions.publicDisplay, true),
            isNotNull(submissions.publicConsentAt),
            eq(teams.auditStatus, "approved"),
            eq(teams.publicDisplay, true),
            isNotNull(teams.publicConsentAt),
          ),
        )
        .limit(1)
    )[0] ?? null
  );
}

export async function adminOverview() {
  const [
    teamRows,
    participantRows,
    confirmationRows,
    submissionRows,
    teamMemberRows,
    adminRows,
  ] = await Promise.all([
    db.select().from(teams).orderBy(desc(teams.createdAt)),
    db.select().from(participants).orderBy(desc(participants.createdAt)),
    db
      .select()
      .from(teamConfirmations)
      .orderBy(desc(teamConfirmations.createdAt)),
    db.select().from(submissions).orderBy(desc(submissions.createdAt)),
    db
      .select({
        teamId: teamMembers.teamId,
        role: teamMembers.role,
        position: teamMembers.position,
        consentedAt: teamMembers.consentedAt,
        participant: {
          id: participants.id,
          participantNumber: participants.participantNumber,
          name: participants.name,
        },
      })
      .from(teamMembers)
      .innerJoin(participants, eq(teamMembers.participantId, participants.id))
      .orderBy(asc(teamMembers.teamId), asc(teamMembers.position)),
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.role, "admin"))
      .orderBy(desc(users.updatedAt)),
  ]);
  const membersByTeam = new Map<string, (typeof teamMemberRows)[number][]>();
  for (const member of teamMemberRows) {
    const members = membersByTeam.get(member.teamId) ?? [];
    members.push(member);
    membersByTeam.set(member.teamId, members);
  }
  return {
    teams: teamRows.map((item) => ({
      ...item,
      number: displayNumber("T", item.teamNumber),
      members: membersByTeam.get(item.id) ?? [],
    })),
    participants: participantRows.map((item) => ({
      ...item,
      number: displayNumber("P", item.participantNumber),
    })),
    confirmations: confirmationRows,
    submissions: submissionRows,
    admins: adminRows,
  };
}

export async function currentUserRecord(userId: string) {
  return (
    (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0] ??
    null
  );
}
