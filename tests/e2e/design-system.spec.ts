import { expect, test } from "@playwright/test";

test("fictional restaurant themes render accessible identity and actions", async ({
  page,
}) => {
  await page.goto("/design-preview");

  await expect(
    page.getByRole("heading", {
      name: "Restaurant themes and accessible primitives",
    }),
  ).toBeVisible();

  const identities = page.locator(
    '#demo-hawaiian-grill [data-testid="restaurant-identity"], ' +
      '#demo-taco-shop [data-testid="restaurant-identity"]',
  );
  await expect(identities).toHaveCount(2);
  await expect(identities.nth(0)).toContainText("Demo Hawaiian Grill");
  await expect(identities.nth(1)).toContainText("Demo Taco Shop");
  await expect(
    page.getByRole("button", { name: "Preview action only" }),
  ).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Preview action only" }).first(),
  ).toBeDisabled();
  await expect(page.getByText("Payment: Paid")).toHaveCount(2);
  await expect(page.getByText("Preparing")).toHaveCount(2);
  await expect(
    page.getByText(/no restaurant service or payment is connected/i),
  ).toHaveCount(2);

  await expect(
    page.locator('[data-restaurant-theme="hibiscus"] #demo-hawaiian-grill'),
  ).toBeVisible();
  await expect(
    page.locator('[data-restaurant-theme="marigold"] #demo-taco-shop'),
  ).toBeVisible();
});

test("design preview reflows at 320px with correctly sized action targets", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/design-preview");

  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  const primary = page.getByRole("link", {
    name: "Demo Hawaiian Grill preview",
  });
  const bounds = await primary.boundingBox();
  expect(bounds?.height).toBeGreaterThanOrEqual(48);
  expect(bounds?.width).toBeGreaterThanOrEqual(48);
  const compactAction = page
    .getByRole("button", { name: "View hours" })
    .first();
  const compactBounds = await compactAction.boundingBox();
  expect(compactBounds?.height).toBeGreaterThanOrEqual(44);
  expect(compactBounds?.width).toBeGreaterThanOrEqual(44);
  expect(
    await primary.evaluate(
      (element) => getComputedStyle(element).transitionDuration,
    ),
  ).toBe("0s");
  expect(
    await page
      .getByRole("button", { name: "Preview action only" })
      .first()
      .evaluate((element) => getComputedStyle(element).transitionDuration),
  ).toBe("0s");

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(primary).toBeFocused();
  expect(
    await primary.evaluate((element) => getComputedStyle(element).outlineStyle),
  ).toBe("solid");
});

test("restaurant identity falls back on a broken logo and resets on tenant switch", async ({
  page,
}) => {
  await page.goto("/design-preview");
  const fixture = page.getByTestId("tenant-switch-fixture");

  await expect(fixture.getByText("Demo Hawaiian Grill")).toBeVisible();
  await expect(fixture.getByText("DH", { exact: true })).toBeVisible();
  await expect(fixture.locator("img")).toHaveCount(0);
  await fixture
    .getByRole("button", {
      name: "Switch to Demo Taco Shop",
    })
    .click();

  await expect(fixture.getByText("Demo Taco Shop")).toBeVisible();
  await expect(fixture.getByText("DT", { exact: true })).toBeVisible();
  await expect(fixture.locator("img")).toHaveCount(0);
  await expect(fixture.getByText("DH", { exact: true })).toHaveCount(0);
  await expect(
    fixture.getByRole("button", { name: "Switch to Demo Hawaiian Grill" }),
  ).toBeVisible();
});
