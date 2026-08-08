import { test, expect } from "@playwright/test";
test("home and email login are responsive", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /找到同频的人/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "邮箱登录" }).click();
  await expect(page.getByRole("heading", { name: "邮箱登录" })).toBeVisible();
  await expect(page.getByLabel("邮箱地址")).toBeEditable();
});
test("public navigation exposes the migrated routes", async ({ page }) => {
  await page.goto("/");
  const header = page.locator("header");
  await expect(header.getByRole("link", { name: "队伍大厅" })).toHaveAttribute(
    "href",
    "/browse-teams",
  );
  await expect(header.getByRole("link", { name: "找队友" })).toHaveAttribute(
    "href",
    "/browse-pool",
  );
  await expect(header.getByRole("link", { name: "作品展示" })).toHaveAttribute(
    "href",
    "/showcase",
  );
});
