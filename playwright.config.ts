import { defineConfig, devices } from "@playwright/test";

const designPreview = process.env.DESIGN_PREVIEW_E2E === "1";
const port = designPreview ? 3219 : 3217;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: designPreview
    ? "**/design-system.spec.ts"
    : "**/foundation.spec.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: designPreview
      ? `pnpm exec next start --hostname 127.0.0.1 --port ${port}`
      : `pnpm start --hostname 127.0.0.1 --port ${port}`,
    url: designPreview ? `${baseURL}/design-preview` : `${baseURL}/api/health`,
    reuseExistingServer: false,
    env: {
      APP_ENV: "test",
      VERCEL_ENV: "",
      DATABASE_URL: "",
      DATABASE_ENV: "",
      DATABASE_PROJECT_ID: "",
      NEXT_ISOLATED_DIST_DIR: designPreview ? ".next-design-preview" : "",
      DESIGN_PREVIEW_ENABLED: designPreview ? "1" : "",
    },
  },
});
