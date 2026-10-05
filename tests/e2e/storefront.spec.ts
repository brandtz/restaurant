import { expect, test } from "@playwright/test";

const landing = "/order/lani-moku-grill";

test("customer picks a location, configures a plate and reviews the cart", async ({
  page,
}) => {
  await page.goto(landing);
  await expect(page.getByTestId("demo-banner")).toContainText(
    "No orders are placed",
  );
  await expect(page.getByTestId("restaurant-identity")).toContainText(
    "Lani Moku Grill",
  );
  await expect(
    page.getByRole("heading", { level: 2, name: "Springfield" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Eugene" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Order from Springfield" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: /Springfield/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Menu categories" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Add Teriyaki Chicken" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Teriyaki Chicken" }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Add to cart/ }).click();
  const summary = page.getByRole("alert").filter({
    hasText: "Finish choosing your options",
  });
  await expect(summary).toBeFocused();
  await expect(summary).toContainText("Choose your base: choose an option.");
  await expect(summary).toContainText("Choose your side: choose an option.");

  await page.getByRole("radio", { name: /Two scoops white rice/ }).check();
  await expect(summary).not.toContainText("Choose your base");
  await page.getByRole("radio", { name: /Mac salad/ }).check();
  await expect(summary).toHaveCount(0);
  await page.getByRole("checkbox", { name: /Spam musubi/ }).check();
  await page.getByRole("button", { name: "Increase quantity" }).click();
  await expect(
    page.getByRole("button", { name: "Add to cart · $24.00" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Add to cart/ }).click();

  await expect(
    page.getByText("Added Teriyaki Chicken to your cart."),
  ).toBeVisible();
  const cartLink = page.getByRole("link", { name: /View cart/ });
  await expect(cartLink).toContainText("2 items");
  await expect(cartLink).toContainText("$24.00");

  await page.reload();
  await expect(cartLink).toContainText("2 items");

  await cartLink.click();
  await expect(page.getByRole("heading", { name: "Your cart" })).toBeVisible();
  await expect(page.getByTestId("cart-subtotal")).toHaveText("$24.00");
  await expect(
    page.getByText("Two scoops white rice, Mac salad, Spam musubi"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue to checkout" }),
  ).toBeDisabled();

  await page
    .getByRole("button", {
      name: "Decrease quantity of Teriyaki Chicken",
      exact: true,
    })
    .click();
  await expect(page.getByTestId("cart-subtotal")).toHaveText("$12.00");

  await page.getByRole("button", { name: "Remove Teriyaki Chicken" }).click();
  await expect(
    page.getByRole("heading", { name: "Your cart is empty" }),
  ).toBeVisible();
});

test("location-scoped availability and unknown routes", async ({
  page,
  request,
}) => {
  await page.goto(`${landing}/eugene`);
  const shrimp = page.getByRole("listitem").filter({
    has: page.getByRole("heading", { level: 3, name: "Garlic Shrimp" }),
  });
  await expect(shrimp).toContainText("Sold out today");
  await expect(
    page.getByRole("link", { name: "Add Garlic Shrimp" }),
  ).toHaveCount(0);

  for (const path of [
    "/order/not-a-restaurant",
    `${landing}/portland`,
    `${landing}/springfield/item/not-an-item`,
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
  }
});

test("menu reflows at 320px with customer-sized targets", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${landing}/springfield`);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  const add = page.getByRole("link", { name: "Add Kalua Pig", exact: true });
  const bounds = await add.boundingBox();
  expect(bounds?.height).toBeGreaterThanOrEqual(48);
  expect(bounds?.width).toBeGreaterThanOrEqual(48);
});
