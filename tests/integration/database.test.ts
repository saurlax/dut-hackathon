import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db, pool } from "../../src/db/client";
import {
  participants,
  teamApplications,
  teamMembers,
  teams,
  users,
} from "../../src/db/schema";

const suffix = () => randomUUID().slice(0, 8);
async function makeParticipant(name = "测试参赛者") {
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
    })
    .returning();
  return participant;
}
async function makeTeam(leaderId: string, maxSize = 4) {
  const [team] = await db
    .insert(teams)
    .values({
      name: `Team-${suffix()}`,
      leaderParticipantId: leaderId,
      contact: "contact",
      description: "desc",
      recruitmentDeadline: "2026-12-31",
      maxSize,
    })
    .returning();
  await db.insert(teamMembers).values({
    teamId: team.id,
    participantId: leaderId,
    role: "队长",
    position: 1,
  });
  return team;
}

describe("PostgreSQL business constraints", () => {
  beforeEach(async () => {
    await db.delete(teamApplications);
    await db.delete(teamMembers);
    await db.delete(teams);
    await db.delete(participants);
    await db.delete(users);
  });
  afterAll(async () => {
    await pool.end();
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
            recruitmentDeadline: "2026-12-31",
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
    expect(application.status).toBe("pending");
  });
});
