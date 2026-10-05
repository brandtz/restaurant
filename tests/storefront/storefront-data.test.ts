import { describe, expect, it } from "vitest";
import { isRestaurantThemeId } from "@/design-system/tokens";
import { getStorefrontDataSource } from "@/storefront/data-source";
import { isDemoStorefrontEnabled } from "@/storefront/demo-gate";
import { fixtureStorefrontDataSource } from "@/storefront/fixtures/fixture-data-source";
import {
  laniMokuLocations,
  laniMokuMenuFor,
  laniMokuMerchant,
} from "@/storefront/fixtures/lani-moku";
import { formatMoney, formatPriceDelta } from "@/storefront/format";
import { parseClock } from "@/storefront/hours";
import { money } from "@/domain/money/money";

describe("demo storefront gate", () => {
  it.each([
    [{ DEMO_STOREFRONT_ENABLED: "1", APP_ENV: "local" }, true],
    [
      {
        DEMO_STOREFRONT_ENABLED: "1",
        APP_ENV: "preview",
        VERCEL_ENV: "preview",
      },
      true,
    ],
    [{ DEMO_STOREFRONT_ENABLED: "", APP_ENV: "local" }, false],
    [{ DEMO_STOREFRONT_ENABLED: "true", APP_ENV: "local" }, false],
    [{ DEMO_STOREFRONT_ENABLED: "1", APP_ENV: "production" }, false],
    [
      {
        DEMO_STOREFRONT_ENABLED: "1",
        APP_ENV: "preview",
        VERCEL_ENV: "production",
      },
      false,
    ],
  ])("%j enabled=%s", (env, expected) => {
    expect(isDemoStorefrontEnabled(env)).toBe(expected);
    expect(getStorefrontDataSource(env) !== null).toBe(expected);
  });
});

describe("Lani Moku prototype fixture integrity", () => {
  const menus = laniMokuLocations.map((location) =>
    laniMokuMenuFor(location.slug)!,
  );

  it("uses an approved theme and a name fallback without a logo", () => {
    expect(isRestaurantThemeId(laniMokuMerchant.themeId)).toBe(true);
    expect(laniMokuMerchant.logo).toBeNull();
  });

  it("has two locations with valid same-day opening periods", () => {
    expect(laniMokuLocations.map((location) => location.slug)).toEqual([
      "springfield",
      "eugene",
    ]);
    for (const location of laniMokuLocations) {
      const days = location.openingHours.map((period) => period.day);
      expect(new Set(days).size).toBe(days.length);
      for (const period of location.openingHours) {
        expect(parseClock(period.closes)).toBeGreaterThan(
          parseClock(period.opens),
        );
      }
    }
  });

  it("keeps ids unique, prices in integer USD cents and modifier bounds valid", () => {
    for (const menu of menus) {
      const itemIds = new Set<string>();
      for (const category of menu.categories) {
        for (const item of category.items) {
          expect(itemIds.has(item.id), item.id).toBe(false);
          itemIds.add(item.id);
          expect(Number.isSafeInteger(item.basePrice.minorUnits)).toBe(true);
          expect(item.basePrice.minorUnits).toBeGreaterThan(0);
          expect(item.basePrice.currency).toBe(menu.currency);
          const groupIds = new Set(item.modifierGroups.map((g) => g.id));
          expect(groupIds.size).toBe(item.modifierGroups.length);
          for (const group of item.modifierGroups) {
            expect(group.minSelections).toBeGreaterThanOrEqual(0);
            expect(group.maxSelections).toBeGreaterThanOrEqual(
              Math.max(1, group.minSelections),
            );
            expect(group.maxSelections).toBeLessThanOrEqual(
              group.options.length,
            );
            const optionIds = new Set(group.options.map((o) => o.id));
            expect(optionIds.size).toBe(group.options.length);
            for (const option of group.options) {
              expect(Number.isSafeInteger(option.priceDelta.minorUnits)).toBe(
                true,
              );
              expect(option.priceDelta.minorUnits).toBeGreaterThanOrEqual(0);
            }
          }
        }
      }
    }
  });

  it("scopes availability per location and rejects unknown slugs", async () => {
    await expect(
      fixtureStorefrontDataSource.getMerchant("someone-else"),
    ).resolves.toBeNull();
    await expect(
      fixtureStorefrontDataSource.listLocations("someone-else"),
    ).resolves.toEqual([]);
    await expect(
      fixtureStorefrontDataSource.getLocation("lani-moku-grill", "portland"),
    ).resolves.toBeNull();
    await expect(
      fixtureStorefrontDataSource.getPublishedMenu("someone-else", "eugene"),
    ).resolves.toBeNull();
    const eugene = await fixtureStorefrontDataSource.getPublishedMenu(
      "lani-moku-grill",
      "eugene",
    );
    const shrimp = eugene?.categories
      .flatMap((category) => category.items)
      .find((item) => item.id === "garlic-shrimp");
    expect(shrimp?.available).toBe(false);
  });
});

describe("money display", () => {
  it("formats integer minor units for display only", () => {
    expect(formatMoney(money(1250, "USD"))).toBe("$12.50");
    expect(formatMoney(money(0, "USD"))).toBe("$0.00");
    expect(formatMoney(money(500, "JPY"))).toBe("¥500");
    expect(formatPriceDelta(money(200, "USD"))).toBe("+$2.00");
    expect(formatPriceDelta(money(0, "USD"))).toBe("");
  });
});
