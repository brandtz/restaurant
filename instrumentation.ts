export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateStartup } = await import("@/infrastructure/config/startup");
    validateStartup(process.env);
  }
}
