import { ConfigurationError } from "@/infrastructure/config/environment";
import { getServerEnvironment } from "@/infrastructure/config/server";
import { logEvent } from "@/infrastructure/observability/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): Response {
  try {
    const config = getServerEnvironment();
    return Response.json(
      {
        status: "ok",
        scope: "application",
        integrations: {
          database: config.database.state,
          authentication: "not_configured",
          assetStorage: "not_configured",
          payments: "not_configured",
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (!(error instanceof ConfigurationError)) {
      throw error;
    }
    logEvent("error", {
      event: "configuration.invalid",
      fields: error.fields,
    });
    return Response.json(
      { status: "error", code: "invalid_configuration", scope: "application" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
