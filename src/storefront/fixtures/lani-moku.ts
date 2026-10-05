import { money } from "@/domain/money/money";
import type {
  MenuCategoryView,
  MenuItemView,
  ModifierGroupView,
  PublishedMenuView,
  StorefrontLocationView,
  StorefrontMerchantView,
} from "../view-models";

/*
 * PROTOTYPE FIXTURE - NOT MERCHANT-APPROVED DATA.
 * Names, hours and prices were transcribed from public listings in
 * October 2026 to make the Lani Moku pilot prototype realistic. Option
 * groups, a-la-carte/kids/drink prices and pickup lead time are
 * placeholders. Everything here must be confirmed with the merchant and
 * replaced by published menu data before any real ordering use (O-001/O-013).
 */

const usd = (minorUnits: number) => money(minorUnits, "USD");
const free = usd(0);

export const laniMokuMerchant: StorefrontMerchantView = {
  slug: "lani-moku-grill",
  name: "Lani Moku Grill",
  themeId: "lani-moku",
  logo: null,
  currency: "USD",
};

const weekly = (
  days: readonly (0 | 1 | 2 | 3 | 4 | 5 | 6)[],
  opens: string,
  closes: string,
) => days.map((day) => ({ day, opens, closes }));

export const laniMokuLocations: readonly StorefrontLocationView[] = [
  {
    slug: "springfield",
    name: "Springfield",
    addressLines: ["5547 Main St", "Springfield, OR 97478"],
    phone: "(541) 653-6352",
    note: null,
    timeZone: "America/Los_Angeles",
    openingHours: weekly([1, 2, 3, 4, 5, 6], "11:00", "21:00"),
    pickupLeadMinutes: 20,
    acceptingOrders: true,
  },
  {
    slug: "eugene",
    name: "Eugene",
    addressLines: ["777 W 6th Ave", "Eugene, OR 97402"],
    phone: "(541) 653-6352",
    note: "Inside the beer garden on West 6th.",
    timeZone: "America/Los_Angeles",
    openingHours: [
      ...weekly([0, 2, 3, 6], "11:30", "21:00"),
      { day: 4, opens: "11:30", closes: "22:00" },
      { day: 5, opens: "11:30", closes: "23:00" },
    ],
    pickupLeadMinutes: 20,
    acceptingOrders: true,
  },
];

const plateBase: ModifierGroupView = {
  id: "plate-base",
  name: "Choose your base",
  minSelections: 1,
  maxSelections: 1,
  options: [
    {
      id: "white-rice",
      name: "Two scoops white rice",
      priceDelta: free,
      available: true,
    },
    {
      id: "yakisoba",
      name: "Yakisoba noodles",
      priceDelta: free,
      available: true,
    },
  ],
};

const plateSide: ModifierGroupView = {
  id: "plate-side",
  name: "Choose your side",
  minSelections: 1,
  maxSelections: 1,
  options: [
    { id: "mac-salad", name: "Mac salad", priceDelta: free, available: true },
    {
      id: "sesame-slaw",
      name: "Asian sesame slaw",
      priceDelta: free,
      available: true,
    },
  ],
};

const plateAddOns: ModifierGroupView = {
  id: "plate-add-ons",
  name: "Add-ons",
  minSelections: 0,
  maxSelections: 2,
  options: [
    {
      id: "add-musubi",
      name: "Spam musubi",
      priceDelta: usd(200),
      available: true,
    },
    {
      id: "add-mac-salad",
      name: "Extra scoop mac salad",
      priceDelta: usd(150),
      available: true,
    },
  ],
};

const plateGroups = [plateBase, plateSide, plateAddOns] as const;

const proteinOptions = (
  idPrefix: string,
  premiumDelta: number,
): ModifierGroupView["options"] => [
  {
    id: `${idPrefix}-teriyaki-chicken`,
    name: "Teriyaki chicken",
    priceDelta: free,
    available: true,
  },
  {
    id: `${idPrefix}-garlic-chicken`,
    name: "Garlic chicken",
    priceDelta: free,
    available: true,
  },
  {
    id: `${idPrefix}-kalua-pig`,
    name: "Kalua pig",
    priceDelta: free,
    available: true,
  },
  {
    id: `${idPrefix}-pele-chicken`,
    name: "Pele chicken",
    priceDelta: free,
    available: true,
  },
  {
    id: `${idPrefix}-teriyaki-beef`,
    name: "Teriyaki beef",
    priceDelta: usd(premiumDelta),
    available: true,
  },
  {
    id: `${idPrefix}-garlic-shrimp`,
    name: "Garlic shrimp",
    priceDelta: usd(premiumDelta),
    available: true,
  },
];

const plate = (
  id: string,
  name: string,
  priceMinor: number,
  description: string,
  extra: Partial<Pick<MenuItemView, "dietaryLabels" | "modifierGroups">> = {},
): MenuItemView => ({
  id,
  name,
  description,
  basePrice: usd(priceMinor),
  available: true,
  dietaryLabels: extra.dietaryLabels ?? [],
  modifierGroups: extra.modifierGroups ?? plateGroups,
});

const simple = (
  id: string,
  name: string,
  priceMinor: number,
  description: string | null,
  modifierGroups: readonly ModifierGroupView[] = [],
  dietaryLabels: readonly string[] = [],
): MenuItemView => ({
  id,
  name,
  description,
  basePrice: usd(priceMinor),
  available: true,
  dietaryLabels,
  modifierGroups,
});

const baseCategories: readonly MenuCategoryView[] = [
  {
    id: "plate-lunches",
    name: "Plate lunches",
    description: "Served with rice or yakisoba noodles and a side.",
    items: [
      plate(
        "teriyaki-chicken",
        "Teriyaki Chicken",
        1000,
        "Grilled chicken glazed with house teriyaki.",
      ),
      plate(
        "garlic-chicken",
        "Garlic Chicken",
        1000,
        "Crispy chicken tossed in garlic butter sauce.",
      ),
      plate(
        "kalua-pig",
        "Kalua Pig",
        1000,
        "Slow-roasted, smoky shredded pork.",
      ),
      plate(
        "pele-chicken",
        "Pele Chicken",
        1000,
        "Chicken in a sweet and spicy pele sauce.",
      ),
      plate(
        "chicken-katsu",
        "Chicken Katsu",
        1100,
        "Panko-crusted chicken with katsu sauce.",
      ),
      plate(
        "pele-beef",
        "Pele Beef",
        1200,
        "Beef in a sweet and spicy pele sauce.",
      ),
      plate(
        "teriyaki-beef",
        "Teriyaki Beef",
        1200,
        "Grilled beef glazed with house teriyaki.",
      ),
      plate(
        "garlic-shrimp",
        "Garlic Shrimp",
        1200,
        "Shrimp sauteed in garlic butter.",
      ),
      plate(
        "loco-moco",
        "Loco Moco",
        1200,
        "Hamburger patty over rice with a fried egg and gravy.",
        {
          modifierGroups: [plateSide, plateAddOns],
        },
      ),
      plate("mixed-plate", "Mixed Plate", 1200, "Pick any two proteins.", {
        modifierGroups: [
          {
            id: "mixed-proteins",
            name: "Choose two proteins",
            minSelections: 2,
            maxSelections: 2,
            options: proteinOptions("mixed", 0),
          },
          ...plateGroups,
        ],
      }),
      plate(
        "tempeh-plate",
        "Tempeh Plate",
        1000,
        "Grilled tempeh with your choice of sauce.",
        {
          dietaryLabels: ["Vegetarian"],
          modifierGroups: [
            {
              id: "tempeh-sauce",
              name: "Choose your sauce",
              minSelections: 1,
              maxSelections: 1,
              options: [
                {
                  id: "teriyaki-sauce",
                  name: "Teriyaki",
                  priceDelta: free,
                  available: true,
                },
                {
                  id: "pele-sauce",
                  name: "Pele (spicy)",
                  priceDelta: free,
                  available: true,
                },
              ],
            },
            ...plateGroups,
          ],
        },
      ),
    ],
  },
  {
    id: "starters",
    name: "Starters",
    description: null,
    items: [
      simple(
        "spam-musubi",
        "Spam Musubi",
        200,
        "Grilled Spam on rice wrapped in nori. Priced per piece.",
      ),
      simple(
        "kalua-sliders",
        "Kalua Pig Sliders",
        900,
        "Three sliders with kalua pig and slaw.",
      ),
      simple(
        "kalua-tacos",
        "Kalua Pig Tacos",
        900,
        "Three tacos with kalua pig.",
      ),
      simple(
        "island-salad",
        "Island Salad",
        900,
        "Greens with your choice of protein.",
        [
          {
            id: "salad-protein",
            name: "Choose your protein",
            minSelections: 1,
            maxSelections: 1,
            options: proteinOptions("salad", 200),
          },
        ],
      ),
    ],
  },
  {
    id: "a-la-carte",
    name: "A la carte",
    description: null,
    items: [
      simple("side-mac-salad", "Mac Salad", 350, null),
      simple(
        "side-sesame-slaw",
        "Asian Sesame Slaw",
        350,
        null,
        [],
        ["Vegetarian"],
      ),
      simple("side-white-rice", "Steamed White Rice", 300, null, [], ["Vegan"]),
    ],
  },
  {
    id: "kids",
    name: "Kids",
    description: null,
    items: [
      simple(
        "kids-mini-plate",
        "Kids Mini Plate",
        700,
        "Protein, rice or noodles, a side and fruit.",
        [
          {
            id: "kids-protein",
            name: "Choose a protein",
            minSelections: 1,
            maxSelections: 1,
            options: proteinOptions("kids", 0).slice(0, 4),
          },
          plateBase,
        ],
      ),
    ],
  },
  {
    id: "drinks",
    name: "Drinks",
    description: null,
    items: [
      simple(
        "island-soda",
        "Island Soda",
        300,
        "Tropical canned soda. Ask staff for flavors.",
      ),
    ],
  },
];

/** Demonstrates location-scoped availability in the prototype. */
const unavailableByLocation: Readonly<Record<string, readonly string[]>> = {
  springfield: [],
  eugene: ["garlic-shrimp"],
};

export function laniMokuMenuFor(
  locationSlug: string,
): PublishedMenuView | null {
  const unavailable = unavailableByLocation[locationSlug];
  if (!unavailable) {
    return null;
  }
  return {
    merchantSlug: laniMokuMerchant.slug,
    locationSlug,
    version: "fixture-2026-10-05",
    currency: laniMokuMerchant.currency,
    categories: baseCategories.map((category) => ({
      ...category,
      items: category.items.map((item) =>
        unavailable.includes(item.id) ? { ...item, available: false } : item,
      ),
    })),
  };
}
