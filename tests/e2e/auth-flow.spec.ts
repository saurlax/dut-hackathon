import { test, expect } from "@playwright/test";

test.skip(!process.env.E2E_MAILPIT_URL, "requires Mailpit and PostgreSQL");
test("magic-link user completes registration and creates a team", async ({
  page,
  request,
}) => {
  const email = `e2e-${Date.now()}@example.com`;
  // Full magic-link flow (request -> poll Mailpit -> callback -> register ->
  // create team) needs more headroom than the default 30s test budget,
  // especially the mail-poll below on a cold dev server.
  test.setTimeout(90_000);
  await page.goto("/login?callbackUrl=/register");
  await page.getByLabel("邮箱地址").fill(email);
  await page.getByRole("button", { name: "发送登录链接" }).click();
  await page.waitForURL(/login\/verify/);
  const base = process.env.E2E_MAILPIT_URL!;
  let id = "";
  await expect
    .poll(
      async () => {
        const response = await request.get(`${base}/api/v1/messages`);
        const body = await response.json();
        id =
          body.messages?.find((message: { To?: { Address: string }[] }) =>
            message.To?.some((to) => to.Address === email),
          )?.ID ?? "";
        return id;
      },
      { timeout: 30_000, intervals: [500] },
    )
    .not.toBe("");
  const message = await (
    await request.get(`${base}/api/v1/message/${id}`)
  ).json();
  const html = message.HTML ?? message.Text ?? "";
  const link = html
    .match(/https?:\/\/[^"'<> ]+api\/auth\/callback\/nodemailer[^"'<> ]+/)?.[0]
    ?.replaceAll("&amp;", "&");
  expect(link).toBeTruthy();
  await page.goto(link!);
  await page.waitForURL(/register/);
  const values: Record<string, string> = {
    姓名: "E2E 用户",
    手机号: "13800000000",
    联系邮箱: email,
    学校: "大连理工大学",
    学院: "计算机",
    年级: "本科",
    学号: `E2E${Date.now()}`,
    公开联系方式: email,
  };
  for (const [label, value] of Object.entries(values))
    await page.getByLabel(label, { exact: false }).fill(value);
  await page.getByLabel("报名方式", { exact: false }).click();
  await page.getByRole("option", { name: "个人报名，正在找队伍" }).click();
  await page.getByRole("button", { name: "提交报名" }).click();
  await expect(page.getByRole("status")).toContainText("已保存");
  await page.goto("/create");
  await page.getByLabel("队伍名称").fill("E2E Team");
  await page.getByLabel("公开联系渠道").fill(email);
  await page.getByLabel("招募截止日期").fill("2099-12-31");
  await page.getByLabel("队伍介绍").fill("End-to-end test team");
  await page.getByRole("button", { name: "创建队伍" }).click();
  await expect(page.getByRole("status")).toContainText("已保存");
});
