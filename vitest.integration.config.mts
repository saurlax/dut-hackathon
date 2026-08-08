import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        process.env.DATABASE_URL ??
        "postgresql://postgres:postgres@localhost:5432/dut_hackathon_test",
      AUTH_SECRET: "integration-test-auth-secret-0123456789abcdef",
      EMAIL_SERVER_HOST: "localhost",
      EMAIL_FROM: "test@example.com",
      TRUST_PROXY: "false",
    },
  },
});
