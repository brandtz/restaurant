import type { ConfigurationField } from "@/infrastructure/config/environment";

type LogEvent =
  | { event: "application.started" }
  | {
      event: "configuration.invalid";
      fields: readonly ConfigurationField[];
    };

const allowedFields: ReadonlySet<string> = new Set([
  "APP_ENV",
  "VERCEL_ENV",
  "DATABASE_URL",
  "DATABASE_ENV",
  "DATABASE_PROJECT_ID",
]);

export function logEvent(level: "info" | "error", input: LogEvent): void {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    event: input.event,
    ...(input.event === "configuration.invalid"
      ? { fields: input.fields.filter((field) => allowedFields.has(field)) }
      : {}),
  };
  const line = JSON.stringify(record);
  if (level === "error") {
    console.error(line);
  } else {
    console.info(line);
  }
}
