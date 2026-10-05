import { describe, expect, it } from "vitest";
import {
  ConfigurationError,
  parseEnvironment,
} from "@/infrastructure/config/environment";

const database = {
  DATABASE_URL:
    "postgresql://app:fixture-password@restaurant.invalid/restaurant?sslmode=require",
  DATABASE_PROJECT_ID: "restaurant-test",
  DATABASE_ENV: "test",
};

describe("server configuration", () => {
  it("runs without credentials without claiming integrations are ready", () => {
    expect(parseEnvironment({})).toEqual({
      appEnvironment: "local",
      database: { state: "not_configured" },
    });
  });

  it("treats blank optional settings as absent", () => {
    expect(
      parseEnvironment({ DATABASE_URL: "", DATABASE_ENV: "" }).database,
    ).toEqual({ state: "not_configured" });
  });

  it("marks a configured database unverified, not connected", () => {
    expect(parseEnvironment({ APP_ENV: "test", ...database }).database).toEqual(
      {
        state: "configured_unverified",
        url: database.DATABASE_URL,
        projectId: database.DATABASE_PROJECT_ID,
        environment: "test",
      },
    );
  });

  it.each(["local", "test", "preview"])(
    "rejects production database configuration in %s",
    (environment) => {
      expect(() =>
        parseEnvironment({
          APP_ENV: environment,
          ...database,
          DATABASE_ENV: "production",
        }),
      ).toThrow("DATABASE_ENV");
    },
  );

  it.each([
    { APP_ENV: "preview", VERCEL_ENV: "production" },
    { APP_ENV: "production", VERCEL_ENV: "preview" },
    { VERCEL_ENV: "preview" },
    { APP_ENV: "test", VERCEL_ENV: "development" },
  ])("rejects inconsistent hosting context: %j", (config) => {
    expect(() => parseEnvironment(config)).toThrow("APP_ENV");
  });

  it.each([
    { VERCEL_ENV: "development", APP_ENV: "local" },
    { VERCEL_ENV: "preview", APP_ENV: "preview" },
    { VERCEL_ENV: "production", APP_ENV: "production" },
  ])("accepts matching hosting context: %j", (config) => {
    expect(parseEnvironment(config).appEnvironment).toBe(config.APP_ENV);
  });

  it.each(["DATABASE_URL", "DATABASE_ENV", "DATABASE_PROJECT_ID"])(
    "requires complete database settings when %s alone is present",
    (field) => {
      expect(() =>
        parseEnvironment({
          APP_ENV: "test",
          [field]: database[field as keyof typeof database],
        }),
      ).toThrow(ConfigurationError);
    },
  );

  it.each([
    "not-a-url",
    "https://app:secret@restaurant.invalid/db?sslmode=require",
    "postgresql://app:secret@restaurant.invalid/db",
    "postgresql://app:secret@restaurant.invalid/db?sslmode=disable",
    "postgresql://restaurant.invalid/db?sslmode=require",
    "postgresql://app:secret@restaurant.invalid/?sslmode=require",
  ])("rejects invalid or insecure database URL", (url) => {
    expect(() =>
      parseEnvironment({ APP_ENV: "test", ...database, DATABASE_URL: url }),
    ).toThrow("DATABASE_URL");
  });

  it("allows explicit local PostgreSQL for isolated tests", () => {
    expect(
      parseEnvironment({
        APP_ENV: "test",
        ...database,
        DATABASE_URL: "postgresql://app:fixture@127.0.0.1/restaurant_test",
      }).database.state,
    ).toBe("configured_unverified");
  });

  it("reports only field names, never invalid credential values", () => {
    const secret = "secret-that-must-not-be-logged";
    try {
      parseEnvironment({
        APP_ENV: secret,
        DATABASE_URL: `postgresql://app:${secret}@restaurant.invalid/db`,
      });
      expect.fail("Expected configuration to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigurationError);
      expect(String(error)).not.toContain(secret);
      expect(JSON.stringify(error)).not.toContain(secret);
    }
  });
});
