import { defineConfig, devices } from "@playwright/test";

type Mode = "foundation" | "design" | "storefront";

const mode: Mode =
  process.env.DESIGN_PREVIEW_E2E === "1"
    ? "design"
    : process.env.STOREFRONT_DEMO_E2E === "1"
      ? "storefront"
      : "foundation";

const settings = {
  foundation: {
    port: 3217,
    testMatch: "**/foundation.spec.ts",
    readyPath: "/api/health",
    distDir: "",
  },
  design: {
    port: 3219,
    testMatch: "**/design-system.spec.ts",
    readyPath: "/design-preview",
    distDir: ".next-design-preview",
  },
  storefront: {
    port: 3221,
    testMatch: "**/storefront.spec.ts",
    readyPath: "/order/lani-moku-grill",
    distDir: ".next-storefront-demo",
  },
}[mode];

const baseURL = `http://127.0.0.1:${settings.port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: settings.testMatch,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects:
    mode === "storefront"
      ? [{ name: "mobile-chromium", use: { ...devices["Pixel 7"] } }]
      : [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      mode === "foundation"
        ? `pnpm start --hostname 127.0.0.1 --port ${settings.port}`
        : `pnpm exec next start --hostname 127.0.0.1 --port ${settings.port}`,
    url: `${baseURL}${settings.readyPath}`,
    reuseExistingServer: false,
    env: {
      APP_ENV: "test",
      VERCEL_ENV: "",
      DATABASE_URL: "",
      DATABASE_ENV: "",
      DATABASE_PROJECT_ID: "",
      NEXT_ISOLATED_DIST_DIR: settings.distDir,
      DESIGN_PREVIEW_ENABLED: mode === "design" ? "1" : "",
      DEMO_STOREFRONT_ENABLED: mode === "storefront" ? "1" : "",
    },
  },
});
