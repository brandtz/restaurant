import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const landing = "/order/lani-moku-grill";

async function testPhoto(
  page: Page,
  width = 640,
  height = 480,
  color = "#176568",
) {
  const data = await page.evaluate(
    ({ width, height, color }) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.fillStyle = color;
      context.fillRect(0, 0, width, height);
      return canvas.toDataURL("image/png").split(",")[1]!;
    },
    { width, height, color },
  );
  return {
    name: "test-item.png",
    mimeType: "image/png",
    buffer: Buffer.from(data, "base64"),
  };
}

test("branded homepage and both location pages lead to the pickup flow", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/lani-moku-grill$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "A little aloha.A lot of flavor.",
  );
  const navigation = page.getByRole("navigation", {
    name: "Restaurant navigation",
  });
  await navigation.getByRole("link", { name: "Eugene", exact: true }).click();
  await expect(page).toHaveURL(/\/lani-moku-grill\/eugene$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Eugene" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Order from Eugene", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`${landing}/eugene$`));
  await navigation
    .getByRole("link", { name: "Springfield", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Springfield" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Order from Springfield", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`${landing}/springfield$`));
});

test("local item-photo editor previews, describes, replaces and removes photos without uploading", async ({
  page,
}) => {
  let uploads = 0;
  page.on("request", (request) => {
    if (["POST", "PUT", "PATCH"].includes(request.method())) uploads++;
  });
  await page.goto("/demo-admin/lani-moku-grill/menu");
  await page
    .getByRole("textbox", { name: "Photo description", exact: true })
    .fill("Teriyaki plate with white rice");
  await page.locator('input[type="file"]').setInputFiles(await testPhoto(page));
  await expect(
    page.getByRole("img", { name: "Teriyaki plate with white rice" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Local photo preview updated for Teriyaki Chicken. Nothing was uploaded.",
    ),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Photo description", exact: true })
    .fill("Teriyaki chicken and rice");
  await page
    .getByRole("button", { name: "Apply description to local preview" })
    .click();
  await expect(
    page.getByRole("img", { name: "Teriyaki chicken and rice" }),
  ).toBeVisible();

  await page
    .getByRole("link", { name: "Preview Teriyaki Chicken on the storefront" })
    .click();
  await expect(
    page.getByRole("img", { name: "Teriyaki chicken and rice" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to menu", exact: false }).click();
  await expect(
    page.getByRole("img", { name: "Teriyaki chicken and rice" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Add Teriyaki Chicken", exact: true })
    .click();
  await page.getByRole("radio", { name: "Two scoops white rice" }).check();
  await page.getByRole("radio", { name: "Mac salad", exact: true }).check();
  await page
    .getByRole("button", { name: "Add to cart · $10.00", exact: true })
    .click();
  await page.getByRole("link", { name: /View cart/ }).click();
  await expect(
    page.getByRole("img", { name: "Teriyaki chicken and rice" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Restaurant navigation" })
    .getByRole("link", { name: "Home", exact: true })
    .click();
  await page.getByRole("link", { name: "Photo editor demo" }).click();
  await expect(
    page.getByRole("img", { name: "Teriyaki chicken and rice" }),
  ).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles({
    name: "bad.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg/>"),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "SVG and GIF" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Teriyaki chicken and rice" }),
  ).toBeVisible();
  await page
    .locator('input[type="file"]')
    .setInputFiles(await testPhoto(page, 100, 100));
  await expect(
    page.getByRole("alert").filter({ hasText: "320 and 4096" }),
  ).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({
    name: "corrupt.png",
    mimeType: "image/png",
    buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "could not be opened" }),
  ).toBeVisible();
  await page
    .locator('input[type="file"]')
    .setInputFiles(await testPhoto(page, 640, 480, "#b74252"));
  await expect(
    page.getByRole("alert").filter({ hasText: "Your previous photo" }),
  ).toHaveCount(0);

  await page
    .getByRole("navigation", { name: "Photo editor locations" })
    .getByRole("link", { name: "Eugene" })
    .click();
  await expect(
    page.getByRole("img", { name: "Teriyaki chicken and rice" }),
  ).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Photo editor locations" })
    .getByRole("link", { name: "Springfield" })
    .click();
  await expect(
    page.getByRole("img", { name: "Teriyaki chicken and rice" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Remove item photo" }).click();
  await expect(
    page.getByRole("img", { name: "Teriyaki chicken and rice" }),
  ).toHaveCount(0);
  await expect(page.getByText("Item photo coming soon")).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles(await testPhoto(page));
  await expect(
    page.getByRole("img", { name: "Teriyaki chicken and rice" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("img", { name: "Teriyaki chicken and rice" }),
  ).toHaveCount(0);
  expect(uploads).toBe(0);
});

test("marketing, location and photo-editor pages reflow and support keyboard at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const path of [
    "/lani-moku-grill",
    "/lani-moku-grill/springfield",
    "/demo-admin/lani-moku-grill/menu",
  ]) {
    await page.goto(path);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      path,
    ).toBeLessThanOrEqual(320);
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Skip to main content" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    const order = page
      .locator("header")
      .getByRole("link", { name: "Order now", exact: true });
    const bounds = await order.boundingBox();
    expect(bounds?.height).toBeGreaterThanOrEqual(48);
    expect(bounds?.width).toBeGreaterThanOrEqual(48);
  }
});

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
