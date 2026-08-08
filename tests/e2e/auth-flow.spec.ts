import { test, expect } from "@playwright/test";
import { dismissAnnouncementIfPresent } from "./announcement-helper";

test.skip(!process.env.E2E_MAILPIT_URL, "requires Mailpit and PostgreSQL");
test("magic-link user completes registration and creates a team", async ({
  page,
  request,
}) => {
  const ip =
    test.info().project.name === "mobile"
      ? `203.0.113.${Math.floor(Math.random() * 54) + 201}`
      : `203.0.113.${Math.floor(Math.random() * 200) + 1}`;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": ip });
  const runKey = `${test.info().project.name}-${Date.now()}`;
  const email = `e2e-${runKey}@example.com`;
  const participantName = `E2E ${runKey}`;
  const publicContact = `微信 e2e-${runKey}`;
  // Full magic-link flow (request -> poll Mailpit -> callback -> register ->
  // create team) needs more headroom than the default 30s test budget,
  // especially the mail-poll below on a cold dev server.
  test.setTimeout(90_000);
  await page.goto("/login?callbackUrl=/register");
  await dismissAnnouncementIfPresent(page);
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
  await dismissAnnouncementIfPresent(page);
  await page.waitForURL(/register/);
  const values: Record<string, string> = {
    姓名: participantName,
    手机号: "13800000000",
    联系邮箱: email,
    学校: "大连理工大学",
    学院: "计算机",
    年级: "本科",
    学号: `E2E${Date.now()}`,
    可投入时间: "每周 20 小时",
    队内角色: "全栈开发",
    "GitHub 或作品集": "https://example.com/e2e-portfolio",
    公开联系方式: publicContact,
    项目经历: "完成过端到端项目",
    个人简介: "希望寻找互补的黑客松伙伴",
  };
  for (const [label, value] of Object.entries(values))
    await page.getByLabel(label, { exact: false }).fill(value);
  await page.getByLabel("报名方式", { exact: false }).click();
  await page.getByRole("option", { name: "个人报名，正在找队伍" }).click();
  await page.getByLabel("前端", { exact: true }).check();
  await page.getByLabel("React", { exact: true }).check();
  await page.getByLabel("前端开发", { exact: true }).check();
  await page.getByLabel("我是校内学生").check();
  await page.getByLabel("同意在找队友页面公开展示").check();
  await page.getByRole("button", { name: "提交报名" }).click();
  await expect(page.getByRole("status")).toContainText("已保存");

  await page.goto(`/browse-pool?q=${encodeURIComponent(participantName)}`);
  await dismissAnnouncementIfPresent(page);
  await page
    .getByRole("button", { name: `查看 ${participantName} 的公开资料` })
    .click();
  const profile = page.getByRole("dialog");
  await expect(profile).toBeVisible();
  await expect(profile.getByText(/P\d{4} · 完整公开资料/)).toBeVisible();
  await expect(profile.getByText("校内学生")).toBeVisible();
  await expect(profile.getByText("前端", { exact: true })).toBeVisible();
  await expect(profile.getByText("React", { exact: true })).toBeVisible();
  await expect(profile.getByText("前端开发", { exact: true })).toBeVisible();
  await expect(profile.getByText("每周 20 小时")).toBeVisible();
  await expect(profile.getByText("全栈开发")).toBeVisible();
  await expect(profile.getByText("完成过端到端项目")).toBeVisible();
  await expect(profile.getByText("希望寻找互补的黑客松伙伴")).toBeVisible();
  await expect(profile.getByText(publicContact)).toBeVisible();
  await expect(
    profile.getByRole("link", { name: /example.com\/e2e-portfolio/ }),
  ).toHaveAttribute("href", "https://example.com/e2e-portfolio");
  await expect(profile).not.toContainText("13800000000");
  await expect(profile).not.toContainText(email);
  await expect(profile).not.toContainText(values.学号);
  await profile.getByRole("button", { name: "关闭" }).click();

  await page.goto("/create");
  await dismissAnnouncementIfPresent(page);
  await page.getByLabel("队伍名称").fill("E2E Team");
  await page.getByLabel("公开联系渠道").fill(email);
  await page.getByLabel("招募截止日期").fill("2099-12-31");
  await page.getByLabel("队伍介绍").fill("End-to-end test team");
  await page.getByRole("button", { name: "创建队伍" }).click();
  await expect(page.getByRole("status")).toContainText("已保存");
});

test("magic-link sending is rate limited per IP for one minute", async ({
  page,
}) => {
  const ip =
    test.info().project.name === "mobile"
      ? `198.51.100.${Math.floor(Math.random() * 54) + 1}`
      : `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": ip });
  const email = `e2e-rate-${Date.now()}@example.com`;

  await page.goto("/login");
  await dismissAnnouncementIfPresent(page);
  await page.getByLabel("邮箱地址").fill(email);
  await page.getByRole("button", { name: "发送登录链接" }).click();
  await page.waitForURL(/login\/verify/);

  await page.goto("/login");
  await dismissAnnouncementIfPresent(page);
  await page.getByLabel("邮箱地址").fill(email);
  await page.getByRole("button", { name: "发送登录链接" }).click();
  await expect(page.getByRole("status")).toContainText(
    "发送太频繁，请一分钟后再试",
  );
});
