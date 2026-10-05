import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ActionButton,
  contrastRatio,
  demoRestaurants,
  FulfillmentBadge,
  getThemeLabel,
  isSafePublicImageSource,
  meetsNormalTextContrast,
  PaymentBadge,
  RestaurantIdentity,
  semanticStatusTokens,
} from "@/design-system";
import { designTokens, isRestaurantThemeId } from "@/design-system/tokens";

const componentCss = readFileSync(
  fileURLToPath(
    new URL("../../src/design-system/components.module.css", import.meta.url),
  ),
  "utf8",
);
const previewCss = readFileSync(
  fileURLToPath(
    new URL("../../app/design-preview/page.module.css", import.meta.url),
  ),
  "utf8",
);

describe("design tokens and theme contracts", () => {
  it("keeps fixed semantic states above the normal-text contrast target", () => {
    for (const [name, pair] of Object.entries(semanticStatusTokens)) {
      expect(
        contrastRatio(pair.foreground, pair.background),
        `status ${name}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps each theme's action and header text readable", () => {
    for (const [name, theme] of Object.entries(designTokens.themes)) {
      expect(
        meetsNormalTextContrast(theme.action, "#FFFFFF"),
        `${name} action`,
      ).toBe(true);
      expect(
        meetsNormalTextContrast(theme.onPrimary, theme.primary),
        `${name} header text`,
      ).toBe(true);
    }
  });

  it("keeps theme accents and non-text controls distinguishable", () => {
    for (const [name, theme] of Object.entries(designTokens.themes)) {
      expect(
        contrastRatio(theme.accent, "#FFFFFF"),
        `${name} accent`,
      ).toBeGreaterThanOrEqual(4.5);
    }
    expect(
      contrastRatio(designTokens.primitive.color.borderControl, "#FFFFFF"),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrastRatio(designTokens.semantic.focusRing, "#F4F5F2"),
    ).toBeGreaterThanOrEqual(3);
  });

  it("keeps semantic colors fixed when theme overrides change", () => {
    const flatten = (value: unknown): string[] =>
      typeof value === "string"
        ? [value]
        : value !== null && typeof value === "object" && !Array.isArray(value)
          ? Object.values(value).flatMap(flatten)
          : [];
    for (const color of flatten(designTokens.semantic)) {
      expect(componentCss).toContain(color.toLowerCase());
    }
  });

  it("keeps the normalized demo theme values aligned with CSS variables", () => {
    for (const [themeId, theme] of Object.entries(designTokens.themes)) {
      const marker = `data-restaurant-theme="${themeId}"`;
      const start = componentCss.indexOf(marker);
      expect(start, themeId).toBeGreaterThanOrEqual(0);
      const block = componentCss.slice(start, componentCss.indexOf("}", start));
      expect(block).toContain(theme.primary.toLowerCase());
      expect(block).toContain(theme.action.toLowerCase());
      expect(block).toContain(theme.accent.toLowerCase());
      expect(block).toContain(theme.onPrimary.toLowerCase());
    }
  });

  it("defines CSS custom properties for every mapped primitive and semantic token", () => {
    const flatten = (value: unknown): string[] =>
      typeof value === "string"
        ? [value]
        : value !== null && typeof value === "object" && !Array.isArray(value)
          ? Object.values(value).flatMap(flatten)
          : [];
    for (const group of [
      designTokens.cssVariables.primitive,
      designTokens.cssVariables.semantic,
      designTokens.cssVariables.theme,
    ]) {
      for (const property of Object.values(group)) {
        expect(componentCss).toContain(`${property}:`);
      }
    }
    for (const query of flatten(designTokens.cssVariables.mediaQueries)) {
      expect(query).toMatch(/^@media /);
    }
    expect(previewCss).toMatch(/@media\s*\(max-width:\s*600px\)/);

    const declarations = new Map(
      [...componentCss.matchAll(/(--[a-z][a-z0-9-]+):\s*([^;]+);/gi)].map(
        ([, property, value]) => [
          property!.toLowerCase(),
          value!
            .trim()
            .toLowerCase()
            .replaceAll(/["'\s]/g, ""),
        ],
      ),
    );
    for (const [tokenPath, property] of Object.entries(
      designTokens.cssVariables.primitive,
    )) {
      const [group, token] = tokenPath.split(".");
      const source = (
        designTokens.primitive as unknown as Record<
          string,
          Record<string, string>
        >
      )[group!]?.[token!];
      expect(source, tokenPath).toBeDefined();
      expect(declarations.get(property.toLowerCase()), tokenPath).toBe(
        source!.toLowerCase().replaceAll(/["'\s]/g, ""),
      );
    }
  });

  it("provides the two agreed fictional brand fixtures", () => {
    expect(demoRestaurants.map(({ id, themeId }) => [id, themeId])).toEqual([
      ["demo-hawaiian-grill", "hibiscus"],
      ["demo-taco-shop", "marigold"],
    ]);
    expect(getThemeLabel("unapproved-custom-theme")).toBe("Restaurant");
    expect(isRestaurantThemeId("unapproved-custom-theme")).toBe(false);
    const markup = renderToStaticMarkup(
      <RestaurantIdentity
        restaurantKey="unrecognized-tenant"
        name="Unrecognized Restaurant"
        themeId="unapproved-custom-theme"
      />,
    );
    expect(markup).toContain('data-restaurant-theme="platform"');
    expect(markup).not.toContain('data-restaurant-theme="hibiscus"');
  });
});

describe("accessible reusable primitives", () => {
  it("renders restaurant name as accessible identity with decorative logo", () => {
    const markup = renderToStaticMarkup(
      <RestaurantIdentity
        restaurantKey="demo-one"
        name="Demo Hawaiian Grill"
        themeId="hibiscus"
        logo={{ src: "https://assets.example.test/logo.webp" }}
      />,
    );
    expect(markup).toContain("Demo Hawaiian Grill");
    expect(markup).toContain('alt=""');
    expect(markup).toContain('data-restaurant-theme="hibiscus"');
  });

  it.each([
    "/assets/restaurant/logo.webp",
    "https://assets.example.test/logo.webp",
  ])("accepts a same-origin path or HTTPS public asset", (src) => {
    expect(isSafePublicImageSource(src)).toBe(true);
  });

  it.each([
    "javascript:alert(1)",
    "data:image/svg+xml,<svg/>",
    "//assets.example.test/logo.svg",
    "http://assets.example.test/logo.webp",
    "https://user:password@assets.example.test/logo.webp",
    "/\\attacker.example/logo.svg",
  ])("rejects unsafe public asset URL %s", (src) => {
    expect(isSafePublicImageSource(src)).toBe(false);
  });

  it("uses the restaurant name and accessible monogram when logo is absent or unsafe", () => {
    const markup = renderToStaticMarkup(
      <RestaurantIdentity
        restaurantKey="demo-two"
        name="Demo Taco Shop"
        themeId="marigold"
        logo={{ src: "javascript:alert(1)" }}
      />,
    );
    expect(markup).toContain("Demo Taco Shop");
    expect(markup).toContain("DT");
    expect(markup).not.toContain("javascript:");
  });

  it("renders explicit payment and fulfillment labels, not color-only badges", () => {
    const markup = renderToStaticMarkup(
      <>
        <PaymentBadge status="pending" />
        <FulfillmentBadge status="preparing" />
      </>,
    );
    expect(markup).toContain("Payment: Pending");
    expect(markup).toContain("Preparing");
    expect(markup).toContain('data-kind="payment"');
    expect(markup).toContain('data-kind="fulfillment"');
  });

  it("marks pending actions busy and prevents duplicate activation", () => {
    const markup = renderToStaticMarkup(
      <ActionButton pending>Saving settings…</ActionButton>,
    );
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("disabled");
    expect(markup).toContain("Saving settings…");
  });
});
