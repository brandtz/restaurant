import { describe, expect, it } from "vitest";
import {
  addCartLine,
  evaluateCart,
  findMenuItem,
  MAX_LINE_QUANTITY,
  parseStoredCart,
  removeCartLine,
  setCartLineQuantity,
  unitPrice,
  validateLineInput,
  validateSelections,
  type CartLine,
} from "@/storefront/cart";
import { laniMokuMenuFor } from "@/storefront/fixtures/lani-moku";

const springfield = laniMokuMenuFor("springfield")!;
const eugene = laniMokuMenuFor("eugene")!;
const item = (id: string) => findMenuItem(springfield, id)!;

const plateSelections = {
  "plate-base": ["white-rice"],
  "plate-side": ["mac-salad"],
};

const line = (overrides: Partial<CartLine> = {}): CartLine => ({
  lineId: "line-1",
  itemId: "teriyaki-chicken",
  quantity: 1,
  selections: plateSelections,
  instructions: "",
  ...overrides,
});

describe("modifier selection rules", () => {
  it("accepts a complete required selection", () => {
    expect(
      validateSelections(item("teriyaki-chicken"), plateSelections),
    ).toEqual([]);
  });

  it("reports each missing required group", () => {
    const codes = validateSelections(item("teriyaki-chicken"), {}).map(
      (issue) => [issue.code, issue.groupId],
    );
    expect(codes).toEqual([
      ["below_minimum", "plate-base"],
      ["below_minimum", "plate-side"],
    ]);
  });

  it("enforces exact counts and rejects duplicates and unknown options", () => {
    const mixed = item("mixed-plate");
    const base = { ...plateSelections };
    expect(
      validateSelections(mixed, {
        ...base,
        "mixed-proteins": ["mixed-kalua-pig"],
      }).map((issue) => issue.code),
    ).toEqual(["below_minimum"]);
    expect(
      validateSelections(mixed, {
        ...base,
        "mixed-proteins": [
          "mixed-kalua-pig",
          "mixed-garlic-chicken",
          "mixed-pele-chicken",
        ],
      }).map((issue) => issue.code),
    ).toEqual(["above_maximum"]);
    expect(
      validateSelections(mixed, {
        ...base,
        "mixed-proteins": ["mixed-kalua-pig", "mixed-kalua-pig"],
      }).map((issue) => issue.code),
    ).toEqual(["duplicate_option", "below_minimum"]);
    expect(
      validateSelections(mixed, {
        ...base,
        "mixed-proteins": ["mixed-kalua-pig", "not-real"],
      }).map((issue) => issue.code),
    ).toEqual(["unknown_option"]);
    expect(
      validateSelections(mixed, { ...base, bogus: ["x"] }).map(
        (issue) => issue.code,
      ),
    ).toContain("unknown_option");
  });

  it("validates quantity and instruction bounds", () => {
    expect(validateLineInput(1, "")).toEqual([]);
    expect(validateLineInput(0, "")[0]?.code).toBe("invalid_quantity");
    expect(validateLineInput(1.5, "")[0]?.code).toBe("invalid_quantity");
    expect(validateLineInput(MAX_LINE_QUANTITY + 1, "")[0]?.code).toBe(
      "invalid_quantity",
    );
    expect(validateLineInput(1, "x".repeat(201))[0]?.code).toBe(
      "instructions_too_long",
    );
  });
});

describe("preview pricing in integer minor units", () => {
  it("adds option deltas to the base price", () => {
    expect(
      unitPrice(item("teriyaki-chicken"), {
        ...plateSelections,
        "plate-add-ons": ["add-musubi", "add-mac-salad"],
      }).minorUnits,
    ).toBe(1000 + 200 + 150);
    expect(
      unitPrice(item("island-salad"), {
        "salad-protein": ["salad-garlic-shrimp"],
      }).minorUnits,
    ).toBe(1100);
  });

  it("totals only valid lines and blocks checkout when any line has issues", () => {
    const valid = evaluateCart(springfield, [
      line({ quantity: 2 }),
      line({
        lineId: "line-2",
        itemId: "spam-musubi",
        selections: {},
        quantity: 3,
      }),
    ]);
    expect(valid.subtotal).toEqual({ minorUnits: 2600, currency: "USD" });
    expect(valid.itemCount).toBe(5);
    expect(valid.orderable).toBe(true);

    const withIssues = evaluateCart(springfield, [
      line(),
      line({ lineId: "line-2", selections: {} }),
      line({ lineId: "line-3", itemId: "retired-item" }),
    ]);
    expect(withIssues.subtotal.minorUnits).toBe(1000);
    expect(withIssues.orderable).toBe(false);
    expect(withIssues.lines[2]?.issues[0]?.code).toBe("unknown_item");
  });

  it("flags items sold out at the cart's location", () => {
    const shrimp = line({ itemId: "garlic-shrimp" });
    expect(evaluateCart(springfield, [shrimp]).orderable).toBe(true);
    const atEugene = evaluateCart(eugene, [shrimp]);
    expect(atEugene.orderable).toBe(false);
    expect(atEugene.lines[0]?.issues[0]?.code).toBe("item_unavailable");
  });

  it("represents an empty cart as zero and not orderable", () => {
    const empty = evaluateCart(springfield, []);
    expect(empty.subtotal.minorUnits).toBe(0);
    expect(empty.orderable).toBe(false);
  });
});

describe("cart line operations", () => {
  it("merges identical lines regardless of selection order and caps quantity", () => {
    const first = line({
      selections: { "plate-side": ["mac-salad"], "plate-base": ["white-rice"] },
      quantity: 15,
    });
    const merged = addCartLine(
      [first],
      line({ lineId: "line-2", quantity: 10 }),
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.quantity).toBe(MAX_LINE_QUANTITY);

    const different = addCartLine(
      merged,
      line({ lineId: "line-3", instructions: "No sauce" }),
    );
    expect(different).toHaveLength(2);
  });

  it("updates, clamps and removes lines", () => {
    const lines = [line(), line({ lineId: "line-2" })];
    expect(setCartLineQuantity(lines, "line-1", 4)[0]?.quantity).toBe(4);
    expect(setCartLineQuantity(lines, "line-1", 99)[0]?.quantity).toBe(
      MAX_LINE_QUANTITY,
    );
    expect(setCartLineQuantity(lines, "line-1", 0)).toHaveLength(1);
    expect(setCartLineQuantity(lines, "line-1", Number.NaN)).toBe(lines);
    expect(
      removeCartLine(lines, "line-2").map((entry) => entry.lineId),
    ).toEqual(["line-1"]);
  });
});

describe("stored cart parsing", () => {
  it("round-trips valid lines", () => {
    const lines = [line()];
    expect(parseStoredCart(JSON.stringify(lines))).toEqual(lines);
  });

  it.each([
    null,
    "",
    "not json",
    "{}",
    JSON.stringify([{ ...line(), quantity: 0 }]),
    JSON.stringify([{ ...line(), quantity: 1000 }]),
    JSON.stringify([{ ...line(), instructions: "x".repeat(500) }]),
    JSON.stringify([{ ...line(), itemId: 42 }]),
  ])("treats untrusted storage %# as an empty cart", (raw) => {
    expect(parseStoredCart(raw)).toEqual([]);
  });
});
