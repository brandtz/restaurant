import { expect, test } from "@playwright/test";

test("foundation is honest about services and exposes application liveness", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Restaurant platform", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Ordering, payments, and restaurant sign-in are not enabled.",
      {
        exact: false,
      },
    ),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
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
  expect(response.headers()["x-powered-by"]).toBeUndefined();
});

test("keyboard skip link and main action are accessible", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "View application health" }),
  ).toBeFocused();
});

test("320px reflow and real primary target meet the foundation thresholds", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  const action = page.getByRole("link", { name: "View application health" });
  const bounds = await action.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds?.height).toBeGreaterThanOrEqual(48);
  expect(bounds?.width).toBeGreaterThanOrEqual(48);
  await expect(action).toBeVisible();
});

test("design-only preview is not served by the production application", async ({
  request,
}) => {
  const response = await request.get("/design-preview");
  expect(response.status()).toBe(404);
});
