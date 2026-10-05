import { afterEach, describe, expect, it, vi } from "vitest";
import { register } from "../../instrumentation";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function clearConfiguration() {
  for (const field of [
    "APP_ENV",
    "VERCEL_ENV",
    "DATABASE_URL",
    "DATABASE_ENV",
    "DATABASE_PROJECT_ID",
  ]) {
    vi.stubEnv(field, "");
  }
}

describe("Next.js server instrumentation", () => {
  it("validates and reports startup in the Node.js runtime", async () => {
    clearConfiguration();
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    const output = vi
      .spyOn(console, "info")
      .mockImplementation(() => undefined);
    await register();
    expect(output).toHaveBeenCalledOnce();
    expect(String(output.mock.calls[0]?.[0])).toContain("application.started");
  });

  it("rejects invalid configuration instead of starting successfully", async () => {
    clearConfiguration();
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("APP_ENV", "invalid-sensitive-value");
    const output = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    await expect(register()).rejects.toThrow("APP_ENV");
    expect(output).toHaveBeenCalledOnce();
    expect(String(output.mock.calls[0]?.[0])).not.toContain(
      "invalid-sensitive-value",
    );
  });

  it("does not load Node-specific server configuration in another runtime", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");
    vi.stubEnv("APP_ENV", "invalid-sensitive-value");
    const output = vi
      .spyOn(console, "info")
      .mockImplementation(() => undefined);
    await expect(register()).resolves.toBeUndefined();
    expect(output).not.toHaveBeenCalled();
  });
});
