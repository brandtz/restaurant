import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfigurationError } from "@/infrastructure/config/environment";
import { validateStartup } from "@/infrastructure/config/startup";
import { logEvent } from "@/infrastructure/observability/logger";

afterEach(() => vi.restoreAllMocks());

describe("startup observability", () => {
  it("reports application start without serializing process environment", () => {
    const output = vi
      .spyOn(console, "info")
      .mockImplementation(() => undefined);
    validateStartup({ APP_ENV: "test", SECRET_TOKEN: "never-print-me" });
    expect(output).toHaveBeenCalledOnce();
    expect(String(output.mock.calls[0]?.[0])).toContain("application.started");
    expect(String(output.mock.calls[0]?.[0])).not.toContain("never-print-me");
  });

  it("logs safe fields then fails startup for invalid configuration", () => {
    const output = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    expect(() => validateStartup({ APP_ENV: "never-print-me" })).toThrow(
      ConfigurationError,
    );
    expect(output).toHaveBeenCalledOnce();
    expect(String(output.mock.calls[0]?.[0])).not.toContain("never-print-me");
  });

  it("serializes only the explicit event allowlist, not extra properties", () => {
    const output = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const input = {
      event: "configuration.invalid" as const,
      fields: ["DATABASE_URL"] as const,
      password: "never-print-me",
    };
    logEvent("error", input);
    expect(JSON.parse(String(output.mock.calls[0]?.[0]))).toEqual({
      timestamp: expect.any(String),
      level: "error",
      event: "configuration.invalid",
      fields: ["DATABASE_URL"],
    });
  });
});
