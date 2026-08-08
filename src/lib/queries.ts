import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNull,
  isNotNull,
  notInArray,
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

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

// Clamp page params coming from the URL: page must be a positive integer
// (default 1); pageSize falls back to the default for anything that is not a
// positive integer and is capped at MAX_PAGE_SIZE. This replaces the old
// hard `.limit(100)` and removes the negative-pageSize data-loss bug.
function parsePage(value: string | number | undefined): number {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

function parsePageSize(value: string | number | undefined): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(n, MAX_PAGE_SIZE);
}

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

export async function publicParticipants(
  keyword = "",
  page: string | number = 1,
  pageSize: string | number = DEFAULT_PAGE_SIZE,
) {
  const p = parsePage(page);
  const ps = parsePageSize(pageSize);
  const where = and(
    eq(participants.publicDisplay, true),
    eq(participants.auditStatus, "approved"),
    isNull(teamMembers.participantId),
    notInArray(participants.registrationMethod, [
      "已经加入队伍",
      "个人参赛，不再组队",
    ]),
    keyword
      ? or(
          ilike(participants.name, `%${keyword}%`),
          ilike(participants.bio, `%${keyword}%`),
        )
      : undefined,
  );
  const [items, totalRows] = await Promise.all([
    db
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
      .leftJoin(teamMembers, eq(teamMembers.participantId, participants.id))
      .where(where)
      .orderBy(
        desc(participants.updatedAt),
        desc(participants.participantNumber),
      )
      .limit(ps)
      .offset((p - 1) * ps),
    db
      .select({ value: count() })
      .from(participants)
      .leftJoin(teamMembers, eq(teamMembers.participantId, participants.id))
      .where(where),
  ]);
  return {
    items,
    total: Number(totalRows[0]?.value ?? 0),
    page: p,
    pageSize: ps,
  };
}

export async function publicTeams(
  keyword = "",
  page: string | number = 1,
  pageSize: string | number = DEFAULT_PAGE_SIZE,
) {
  const p = parsePage(page);
  const ps = parsePageSize(pageSize);
  const size = db
    .select({
      teamId: teamMembers.teamId,
      value: count(teamMembers.participantId).as("member_count"),
    })
    .from(teamMembers)
    .groupBy(teamMembers.teamId)
    .as("team_size");
  const where = and(
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
  );
  const [items, totalRows] = await Promise.all([
    db
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
      .where(where)
      .orderBy(desc(teams.updatedAt), desc(teams.teamNumber))
      .limit(ps)
      .offset((p - 1) * ps),
    db.select({ value: count() }).from(teams).where(where),
  ]);
  return {
    items,
    total: Number(totalRows[0]?.value ?? 0),
    page: p,
    pageSize: ps,
  };
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
      .where(eq(teamMembers.teamId, id)),
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

export async function teamApplicationContext(userId: string, teamId: string) {
  const participant = await participantForUser(userId);
  if (!participant) return null;

  const [membership, pendingApplication, activeApplications] =
    await Promise.all([
      db
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.participantId, participant.id))
        .limit(1),
      db
        .select({
          id: teamApplications.id,
          createdAt: teamApplications.createdAt,
        })
        .from(teamApplications)
        .where(
          and(
            eq(teamApplications.teamId, teamId),
            eq(teamApplications.applicantId, participant.id),
            eq(teamApplications.status, "pending"),
          ),
        )
        .limit(1),
      db
        .select({ value: count() })
        .from(teamApplications)
        .where(
          and(
            eq(teamApplications.applicantId, participant.id),
            eq(teamApplications.status, "pending"),
          ),
        ),
    ]);

  return {
    participant: {
      auditStatus: participant.auditStatus,
      adminNote: participant.adminNote,
      isInternal: participant.isInternal,
    },
    membershipTeamId: membership[0]?.teamId ?? null,
    pendingApplication: pendingApplication[0] ?? null,
    activeApplicationCount: Number(activeApplications[0]?.value ?? 0),
  };
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
          auditStatus: submissions.auditStatus,
          materialStatus: submissions.materialStatus,
          adminNote: submissions.adminNote,
        })
        .from(submissions)
        .where(eq(submissions.teamId, teamId))
        .limit(1)
    )[0] ?? null
  );
}

export async function showcase(
  keyword = "",
  page: string | number = 1,
  pageSize: string | number = DEFAULT_PAGE_SIZE,
) {
  const p = parsePage(page);
  const ps = parsePageSize(pageSize);
  const where = and(
    eq(submissions.auditStatus, "approved"),
    eq(submissions.materialStatus, "complete"),
    eq(submissions.publicDisplay, true),
    isNotNull(submissions.publicConsentAt),
    eq(teamConfirmations.auditStatus, "approved"),
    eq(teams.auditStatus, "approved"),
    eq(teams.publicDisplay, true),
    isNotNull(teams.publicConsentAt),
    keyword ? ilike(submissions.projectName, `%${keyword}%`) : undefined,
  );
  const [items, totalRows] = await Promise.all([
    db
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
      .innerJoin(teamConfirmations, eq(teamConfirmations.teamId, teams.id))
      .where(where)
      .orderBy(desc(submissions.updatedAt), desc(submissions.submissionNumber))
      .limit(ps)
      .offset((p - 1) * ps),
    db
      .select({ value: count() })
      .from(submissions)
      .innerJoin(teams, eq(submissions.teamId, teams.id))
      .innerJoin(teamConfirmations, eq(teamConfirmations.teamId, teams.id))
      .where(where),
  ]);
  return {
    items,
    total: Number(totalRows[0]?.value ?? 0),
    page: p,
    pageSize: ps,
  };
}

export async function publicSubmissionDetail(id: string) {
  return (
    (
      await db
        .select({ submission: publicSubmissionFields, teamName: teams.name })
        .from(submissions)
        .innerJoin(teams, eq(submissions.teamId, teams.id))
        .innerJoin(teamConfirmations, eq(teamConfirmations.teamId, teams.id))
        .where(
          and(
            eq(submissions.id, id),
            eq(submissions.auditStatus, "approved"),
            eq(submissions.materialStatus, "complete"),
            eq(submissions.publicDisplay, true),
            isNotNull(submissions.publicConsentAt),
            eq(teamConfirmations.auditStatus, "approved"),
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
    confirmationMemberRows,
    adminRows,
  ] = await Promise.all([
    db.select().from(teams).orderBy(desc(teams.createdAt)),
    db.select().from(participants).orderBy(desc(participants.createdAt)),
    db
      .select({
        confirmation: teamConfirmations,
        teamName: teams.name,
        teamNumber: teams.teamNumber,
      })
      .from(teamConfirmations)
      .innerJoin(teams, eq(teamConfirmations.teamId, teams.id))
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
      .select()
      .from(confirmationMembers)
      .orderBy(asc(confirmationMembers.position)),
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
  const membersByConfirmation = new Map<
    string,
    (typeof confirmationMemberRows)[number][]
  >();
  for (const member of confirmationMemberRows) {
    const members = membersByConfirmation.get(member.confirmationId) ?? [];
    members.push(member);
    membersByConfirmation.set(member.confirmationId, members);
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
    confirmations: confirmationRows.map(
      ({ confirmation, teamName, teamNumber }) => ({
        ...confirmation,
        number: displayNumber("C", confirmation.confirmationNumber),
        teamNumber: displayNumber("T", teamNumber),
        teamName,
        members: membersByConfirmation.get(confirmation.id) ?? [],
      }),
    ),
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
