import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const nextCli = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);
const playwrightCli = fileURLToPath(
  new URL("../node_modules/@playwright/test/cli.js", import.meta.url),
);
const build = spawnSync(process.execPath, [nextCli, "build"], {
  env: {
    ...process.env,
    APP_ENV: "local",
    VERCEL_ENV: "",
    DATABASE_URL: "",
    DATABASE_ENV: "",
    DATABASE_PROJECT_ID: "",
    NEXT_ISOLATED_DIST_DIR: ".next-storefront-demo",
    DEMO_STOREFRONT_ENABLED: "",
  },
  stdio: "inherit",
});

if (build.error) {
  throw build.error;
}
if (build.status !== 0) {
  process.exitCode = build.status ?? 1;
} else {
  const tests = spawnSync(
    process.execPath,
    [playwrightCli, "test", "tests/e2e/storefront.spec.ts"],
    {
      env: { ...process.env, STOREFRONT_DEMO_E2E: "1" },
      stdio: "inherit",
    },
  );
  if (tests.error) {
    throw tests.error;
  }
  process.exitCode = tests.status ?? 1;
}
