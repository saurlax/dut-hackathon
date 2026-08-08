import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { Pool } from "pg";
import { announcementContentVersion } from "../../src/lib/announcement";

const databaseUrl = process.env.E2E_DATABASE_URL;

test("active announcement is public and respects browser dismissal choices", async ({
  browser,
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "the global announcement row is exercised once on desktop Chromium",
  );
  test.skip(!databaseUrl, "requires an isolated E2E_DATABASE_URL");

  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  const first = {
    title: "E2E 全站公告",
    content: [
      "**游客和登录用户都可以看到这条公告。**",
      "",
      "| 日期 | 安排 |",
      "| --- | --- |",
      "| 8 月 8 日 | 现场签到 |",
    ].join("\n"),
  };
  const second = {
    title: "E2E 公告已更新",
    content: "公告内容版本已经变化。",
  };
  const firstVersion = announcementContentVersion(first);
  const secondVersion = announcementContentVersion(second);
  const sessionToken = `e2e-announcement-${randomUUID()}`;
  const userId = randomUUID();
  const email = `e2e-announcement-${randomUUID()}@example.com`;
  let loggedContext: Awaited<ReturnType<typeof browser.newContext>> | null =
    null;

  const previousResult = await pool.query<{
    id: string;
    title: string;
    content: string;
    content_version: string;
    enabled: boolean;
    created_at: Date;
    updated_at: Date;
  }>(`SELECT * FROM "announcements" WHERE "id" = 'current'`);
  const previous = previousResult.rows[0] ?? null;

  try {
    await pool.query(
      `INSERT INTO "announcements"
        ("id", "title", "content", "content_version", "enabled", "updated_at")
       VALUES ('current', $1, $2, $3, true, now())
       ON CONFLICT ("id") DO UPDATE SET
         "title" = EXCLUDED."title",
         "content" = EXCLUDED."content",
         "content_version" = EXCLUDED."content_version",
         "enabled" = true,
         "updated_at" = now()`,
      [first.title, first.content, firstVersion],
    );

    await page.goto("/");
    const guestDialog = page.getByRole("dialog");
    await expect(guestDialog).toBeVisible();
    await expect(
      guestDialog.getByRole("heading", { name: first.title }),
    ).toBeVisible();
    await expect(guestDialog.getByRole("table")).toBeVisible();

    await pool.query(
      `INSERT INTO "users" ("id", "email", "email_verified", "role")
       VALUES ($1, $2, now(), 'participant')`,
      [userId, email],
    );
    await pool.query(
      `INSERT INTO "sessions" ("session_token", "user_id", "expires")
       VALUES ($1, $2, $3)`,
      [sessionToken, userId, new Date(Date.now() + 60 * 60 * 1_000)],
    );

    const origin = new URL(page.url()).origin;
    loggedContext = await browser.newContext();
    await loggedContext.addCookies([
      {
        name: "authjs.session-token",
        value: sessionToken,
        url: origin,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    const loggedPage = await loggedContext.newPage();
    await loggedPage.goto(origin);
    await expect(
      loggedPage.getByRole("heading", { name: first.title }),
    ).toBeVisible();
    await loggedPage.getByRole("button", { name: "关闭公告" }).click();
    await loggedPage
      .getByRole("button", { name: "关闭本次（今天不再显示）" })
      .click();
    await expect(
      loggedPage.getByRole("button", { name: "我的" }),
    ).toBeVisible();
    await loggedContext.close();
    loggedContext = null;

    await page.getByRole("button", { name: "关闭公告" }).click();
    await page
      .getByRole("button", { name: "关闭本次（今天不再显示）" })
      .click();
    await expect(guestDialog).not.toBeVisible();
    await page.reload();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await pool.query(
      `UPDATE "announcements"
       SET "title" = $1,
           "content" = $2,
           "content_version" = $3,
           "updated_at" = now()
       WHERE "id" = 'current'`,
      [second.title, second.content, secondVersion],
    );
    await page.reload();
    await expect(
      page.getByRole("heading", { name: second.title }),
    ).toBeVisible();

    await page.getByRole("button", { name: "关闭公告" }).click();
    await page.getByRole("button", { name: "不再显示", exact: true }).click();
    await page.reload();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  } finally {
    await loggedContext?.close();
    await pool.query(`DELETE FROM "sessions" WHERE "session_token" = $1`, [
      sessionToken,
    ]);
    await pool.query(`DELETE FROM "users" WHERE "id" = $1`, [userId]);
    if (previous) {
      await pool.query(
        `INSERT INTO "announcements"
          ("id", "title", "content", "content_version", "enabled", "created_at", "updated_at")
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT ("id") DO UPDATE SET
           "title" = EXCLUDED."title",
           "content" = EXCLUDED."content",
           "content_version" = EXCLUDED."content_version",
           "enabled" = EXCLUDED."enabled",
           "created_at" = EXCLUDED."created_at",
           "updated_at" = EXCLUDED."updated_at"`,
        [
          previous.id,
          previous.title,
          previous.content,
          previous.content_version,
          previous.enabled,
          previous.created_at,
          previous.updated_at,
        ],
      );
    } else {
      await pool.query(`DELETE FROM "announcements" WHERE "id" = 'current'`);
    }
    await pool.end();
  }
});
