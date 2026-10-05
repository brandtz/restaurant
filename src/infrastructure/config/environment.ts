import { z } from "zod";

const environmentName = z.enum(["local", "test", "preview", "production"]);

export type AppEnvironment = z.infer<typeof environmentName>;
export type ConfigurationField =
  | "APP_ENV"
  | "VERCEL_ENV"
  | "DATABASE_URL"
  | "DATABASE_ENV"
  | "DATABASE_PROJECT_ID";

const fields: ReadonlySet<string> = new Set([
  "APP_ENV",
  "VERCEL_ENV",
  "DATABASE_URL",
  "DATABASE_ENV",
  "DATABASE_PROJECT_ID",
]);

const optionalSetting = (value: unknown) => (value === "" ? undefined : value);

const schema = z
  .object({
    APP_ENV: z.preprocess(optionalSetting, environmentName.default("local")),
    VERCEL_ENV: z.preprocess(
      optionalSetting,
      z.enum(["development", "preview", "production"]).optional(),
    ),
    DATABASE_URL: z.preprocess(optionalSetting, z.string().min(1).optional()),
    DATABASE_ENV: z.preprocess(optionalSetting, environmentName.optional()),
    DATABASE_PROJECT_ID: z.preprocess(
      optionalSetting,
      z
        .string()
        .regex(/^[a-zA-Z0-9_-]{1,128}$/)
        .optional(),
    ),
  })
  .superRefine((config, context) => {
    if (config.VERCEL_ENV) {
      const expected =
        config.VERCEL_ENV === "development" ? "local" : config.VERCEL_ENV;
      if (config.APP_ENV !== expected) {
        context.addIssue({
          code: "custom",
          path: ["APP_ENV"],
          message: "Application and deployment environments must match.",
        });
      }
    }

    const databaseFields = [
      config.DATABASE_URL,
      config.DATABASE_ENV,
      config.DATABASE_PROJECT_ID,
    ];
    if (databaseFields.some((value) => value !== undefined)) {
      for (const [name, value] of [
        ["DATABASE_URL", config.DATABASE_URL],
        ["DATABASE_ENV", config.DATABASE_ENV],
        ["DATABASE_PROJECT_ID", config.DATABASE_PROJECT_ID],
      ] as const) {
        if (value === undefined) {
          context.addIssue({
            code: "custom",
            path: [name],
            message: "Database configuration must be complete.",
          });
        }
      }
    }

    if (
      config.DATABASE_ENV !== undefined &&
      config.DATABASE_ENV !== config.APP_ENV
    ) {
      context.addIssue({
        code: "custom",
        path: ["DATABASE_ENV"],
        message: "Database and application environments must match.",
      });
    }

    if (config.DATABASE_URL) {
      let valid = false;
      try {
        const url = new URL(config.DATABASE_URL);
        const local = ["localhost", "127.0.0.1", "[::1]"].includes(
          url.hostname,
        );
        valid =
          ["postgres:", "postgresql:"].includes(url.protocol) &&
          Boolean(url.hostname) &&
          Boolean(url.username) &&
          url.pathname.length > 1 &&
          (local ||
            ["require", "verify-ca", "verify-full"].includes(
              url.searchParams.get("sslmode") ?? "",
            ));
      } catch (error) {
        if (!(error instanceof TypeError)) {
          throw error;
        }
      }
      if (!valid) {
        context.addIssue({
          code: "custom",
          path: ["DATABASE_URL"],
          message: "A valid PostgreSQL URL with remote TLS is required.",
        });
      }
    }
  });

export type ServerEnvironment = {
  appEnvironment: AppEnvironment;
  database:
    | { state: "not_configured" }
    | {
        state: "configured_unverified";
        url: string;
        projectId: string;
        environment: AppEnvironment;
      };
};

export class ConfigurationError extends Error {
  constructor(public readonly fields: readonly ConfigurationField[]) {
    super(`Invalid server configuration: ${fields.join(", ")}`);
    this.name = "ConfigurationError";
  }
}

export function parseEnvironment(
  input: Readonly<Record<string, string | undefined>>,
): ServerEnvironment {
  const result = schema.safeParse(input);
  if (!result.success) {
    const invalidFields = result.error.issues.flatMap((issue) => {
      const field = issue.path[0];
      return typeof field === "string" && fields.has(field)
        ? [field as ConfigurationField]
        : [];
    });
    throw new ConfigurationError([...new Set(invalidFields)].sort());
  }

  const config = result.data;
  if (
    config.DATABASE_URL !== undefined &&
    config.DATABASE_PROJECT_ID !== undefined &&
    config.DATABASE_ENV !== undefined
  ) {
    return {
      appEnvironment: config.APP_ENV,
      database: {
        state: "configured_unverified",
        url: config.DATABASE_URL,
        projectId: config.DATABASE_PROJECT_ID,
        environment: config.DATABASE_ENV,
      },
    };
  }

  return {
    appEnvironment: config.APP_ENV,
    database: { state: "not_configured" },
  };
}
