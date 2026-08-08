import type { Page } from "@playwright/test";

export async function dismissAnnouncementIfPresent(page: Page) {
  const closeButton = page.getByRole("button", { name: "关闭公告" });
  try {
    await closeButton.waitFor({ state: "visible", timeout: 1_000 });
  } catch {
    return;
  }

  await closeButton.click();
  await page.getByRole("button", { name: "不再显示", exact: true }).click();
}
