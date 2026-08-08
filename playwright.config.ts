import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

loadEnvConfig(process.cwd(), true);

const port = process.env.E2E_PORT ?? "3000";
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;
const isolatedDatabaseUrl = process.env.E2E_DATABASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: { baseURL, trace: "on-first-retry" },
  webServer: {
    command:
      process.env.E2E_SERVER_COMMAND ??
      (isolatedDatabaseUrl
        ? `npm run db:migrate && npm run dev -- -p ${port}`
        : `npm run dev -- -p ${port}`),
    url: baseURL,
    reuseExistingServer: !process.env.CI && !isolatedDatabaseUrl,
    timeout: 120000,
    env: {
      ...process.env,
      ...(isolatedDatabaseUrl
        ? {
            DATABASE_URL: isolatedDatabaseUrl,
          }
        : {}),
      AUTH_URL: baseURL,
      TRUST_PROXY: "true",
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
