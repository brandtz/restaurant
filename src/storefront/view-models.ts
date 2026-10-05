import type { Money } from "@/domain/money/money";

/**
 * Public, read-only storefront view models. They are the UI's proposed input
 * to the shared tenant/menu contract (S-003/S-015): backend services must be
 * able to return exactly these shapes from published data only.
 */

/** 0 = Sunday ... 6 = Saturday, in the location's configured time zone. */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type OpeningPeriod = Readonly<{
  day: DayOfWeek;
  /** Local wall-clock time, 24-hour "HH:MM". Closes after opens, same day. */
  opens: string;
  closes: string;
}>;

export type StorefrontMerchantView = Readonly<{
  slug: string;
  name: string;
  themeId: string;
  logo: Readonly<{ src: string }> | null;
  currency: string;
}>;

export type StorefrontLocationView = Readonly<{
  slug: string;
  name: string;
  addressLines: readonly string[];
  phone: string | null;
  note: string | null;
  timeZone: string;
  /** Days without a period are closed. */
  openingHours: readonly OpeningPeriod[];
  pickupLeadMinutes: number;
  acceptingOrders: boolean;
}>;

export type ModifierOptionView = Readonly<{
  id: string;
  name: string;
  priceDelta: Money;
  available: boolean;
}>;

export type ModifierGroupView = Readonly<{
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  options: readonly ModifierOptionView[];
}>;

export type MenuItemView = Readonly<{
  id: string;
  name: string;
  description: string | null;
  basePrice: Money;
  available: boolean;
  dietaryLabels: readonly string[];
  modifierGroups: readonly ModifierGroupView[];
}>;

export type MenuCategoryView = Readonly<{
  id: string;
  name: string;
  description: string | null;
  items: readonly MenuItemView[];
}>;

export type PublishedMenuView = Readonly<{
  merchantSlug: string;
  locationSlug: string;
  version: string;
  currency: string;
  categories: readonly MenuCategoryView[];
}>;
