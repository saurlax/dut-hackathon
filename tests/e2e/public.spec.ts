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
  // Scope to the site header: the home hero also exposes buttons whose
  // accessible names substr-match the nav labels (e.g. "寻找队友" matches
  // "找队友"), which breaks strict-mode locators. The header owns the global
  // nav links exclusively.
  const nav = page.locator("header");
  await expect(nav.getByRole("link", { name: "队伍大厅" })).toHaveAttribute(
    "href",
    "/browse-teams",
  );
  await expect(nav.getByRole("link", { name: "找队友" })).toHaveAttribute(
    "href",
    "/browse-pool",
  );
  await expect(nav.getByRole("link", { name: "作品展示" })).toHaveAttribute(
    "href",
    "/showcase",
  );
});
