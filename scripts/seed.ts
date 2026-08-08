import "./load-env";

import { eq } from "drizzle-orm";
import { db, pool } from "../src/db/client";
import { participants, users } from "../src/db/schema";

async function main() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_PRODUCTION_SEED !== "true"
  ) {
    throw new Error(
      "Refusing to seed production without ALLOW_PRODUCTION_SEED=true",
    );
  }
  const [user] = await db
    .insert(users)
    .values({
      email: "demo@example.com",
      name: "演示参赛者",
      emailVerified: new Date(),
    })
    .onConflictDoUpdate({ target: users.email, set: { name: "演示参赛者" } })
    .returning();
  const existing = await db
    .select()
    .from(participants)
    .where(eq(participants.userId, user.id))
    .limit(1);
  if (!existing.length) {
    await db.insert(participants).values({
      userId: user.id,
      name: "演示参赛者",
      phone: "13800000000",
      email: user.email,
      school: "大连理工大学",
      college: "创新创业学院",
      grade: "本科",
      studentId: "DEMO001",
      skills: ["产品", "前端"],
      techStack: ["Next.js", "PostgreSQL"],
      desiredRoles: ["全栈开发"],
      registrationMethod: "个人报名，正在找队伍",
      bio: "用于本地开发的演示资料。",
      publicContact: "demo@example.com",
      publicDisplay: true,
    });
  }
  console.log("Development seed applied.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
