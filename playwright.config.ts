import { defineConfig, devices } from "@playwright/test";

// Allow pointing the suite at a non-default origin — e.g. when port 3000 is
// already taken by another dev server, or when CI provisioned the app on a
// different port. Falls back to the historical default so behaviour is
// unchanged when E2E_BASE_URL is unset.
const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: { baseURL, trace: "on-first-retry" },
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
