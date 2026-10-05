export function isDemoStorefrontEnabled(
  env: Readonly<Record<string, string | undefined>>,
): boolean {
  return (
    env.DEMO_STOREFRONT_ENABLED === "1" &&
    env.APP_ENV !== "production" &&
    env.VERCEL_ENV !== "production"
  );
}
