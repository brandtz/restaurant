import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../../app/api/health/route";

function clearSettings() {
  for (const name of [
    "APP_ENV",
    "VERCEL_ENV",
    "DATABASE_URL",
    "DATABASE_ENV",
    "DATABASE_PROJECT_ID",
  ]) {
    vi.stubEnv(name, "");
  }
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("application liveness", () => {
  it("exposes safe exact liveness shape with no integrations configured", async () => {
    clearSettings();
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      status: "ok",
      scope: "application",
      integrations: {
        database: "not_configured",
        authentication: "not_configured",
        assetStorage: "not_configured",
        payments: "not_configured",
      },
    });
  });

  it("never leaks configured connection strings or project IDs", async () => {
    clearSettings();
    vi.stubEnv("APP_ENV", "test");
    vi.stubEnv("DATABASE_ENV", "test");
    vi.stubEnv("DATABASE_PROJECT_ID", "private-project");
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://app:private-password@restaurant.invalid/db?sslmode=require",
    );
    const response = GET();
    const text = await response.text();
    expect(text).toContain("configured_unverified");
    expect(text).not.toContain("private");
    expect(text).not.toContain("restaurant.invalid");
  });

  it("returns observable 503 without exposing invalid environment values", async () => {
    clearSettings();
    vi.stubEnv("APP_ENV", "private-invalid-value");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      status: "error",
      code: "invalid_configuration",
      scope: "application",
    });
    expect(log).toHaveBeenCalledOnce();
    const record = JSON.parse(log.mock.calls[0]?.[0] as string);
    expect(record.event).toBe("configuration.invalid");
    expect(record.fields).toEqual(["APP_ENV"]);
    expect(JSON.stringify(record)).not.toContain("private-invalid-value");
  });
});
