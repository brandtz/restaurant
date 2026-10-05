import type { NextConfig } from "next";
import { validateConfiguration } from "./src/infrastructure/config/startup";

validateConfiguration(process.env);

const isolatedDistDirectory = process.env.NEXT_ISOLATED_DIST_DIR || undefined;
if (
  isolatedDistDirectory &&
  (!/^\.next-[a-z0-9][a-z0-9-]{0,31}$/.test(isolatedDistDirectory) ||
    !["local", "test"].includes(process.env.APP_ENV ?? ""))
) {
  throw new Error(
    "NEXT_ISOLATED_DIST_DIR is allowed only for a named local/test build directory.",
  );
}

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  ...(isolatedDistDirectory ? { distDir: isolatedDistDirectory } : {}),
};

export default config;
