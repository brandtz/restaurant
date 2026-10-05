import { ConfigurationError, parseEnvironment } from "./environment";
import { logEvent } from "../observability/logger";

export function validateConfiguration(
  input: Readonly<Record<string, string | undefined>>,
): void {
  try {
    parseEnvironment(input);
  } catch (error) {
    if (error instanceof ConfigurationError) {
      logEvent("error", {
        event: "configuration.invalid",
        fields: error.fields,
      });
    }
    throw error;
  }
}

export function validateStartup(
  input: Readonly<Record<string, string | undefined>>,
): void {
  validateConfiguration(input);
  logEvent("info", { event: "application.started" });
}
