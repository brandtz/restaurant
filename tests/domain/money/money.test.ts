import { describe, expect, it } from "vitest";
import {
  addMoney,
  compareMoney,
  currencyCode,
  MoneyError,
  money,
  scaleMoney,
  subtractMoney,
} from "@/domain/money/money";

describe("currency-qualified integer minor-unit money", () => {
  it("creates an immutable value with an explicit currency", () => {
    const value = money(1234, "USD");

    expect(value).toEqual({ minorUnits: 1234, currency: "USD" });
    expect(Object.isFrozen(value)).toBe(true);
  });

  it("accepts zero, negative values and currencies with different minor-unit scales", () => {
    expect(money(0, "USD").minorUnits).toBe(0);
    expect(money(-125, "USD").minorUnits).toBe(-125);
    expect(money(1234, "JPY").minorUnits).toBe(1234);
    expect(money(1234, "KWD").minorUnits).toBe(1234);
  });

  it.each(["usd", "US", "USDD", "1SD", "", " USD"])(
    "rejects malformed currency code %j",
    (code) => {
      expect(() => currencyCode(code)).toThrowError(
        expect.objectContaining({ code: "invalid_currency" }),
      );
    },
  );

  it.each([1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53])(
    "rejects non-safe-integer minor amount %s",
    (amount) => {
      expect(() => money(amount, "USD")).toThrowError(
        expect.objectContaining({ code: "invalid_amount" }),
      );
    },
  );

  it("adds and subtracts exact minor units without floating point", () => {
    expect(addMoney(money(199, "USD"), money(201, "USD"))).toEqual({
      minorUnits: 400,
      currency: "USD",
    });
    expect(subtractMoney(money(10, "USD"), money(25, "USD"))).toEqual({
      minorUnits: -15,
      currency: "USD",
    });
  });

  it("compares exact amounts only when currencies match", () => {
    expect(compareMoney(money(99, "USD"), money(100, "USD"))).toBe(-1);
    expect(compareMoney(money(100, "USD"), money(100, "USD"))).toBe(0);
    expect(compareMoney(money(101, "USD"), money(100, "USD"))).toBe(1);
  });

  it.each([
    (left: ReturnType<typeof money>, right: ReturnType<typeof money>) =>
      addMoney(left, right),
    (left: ReturnType<typeof money>, right: ReturnType<typeof money>) =>
      subtractMoney(left, right),
    (left: ReturnType<typeof money>, right: ReturnType<typeof money>) =>
      compareMoney(left, right),
  ])("rejects mixed-currency arithmetic/comparison", (operation) => {
    expect(() => operation(money(100, "USD"), money(100, "EUR"))).toThrowError(
      expect.objectContaining({ code: "currency_mismatch" }),
    );
  });

  it("scales by an exact safe integer factor", () => {
    expect(scaleMoney(money(125, "USD"), 3)).toEqual({
      minorUnits: 375,
      currency: "USD",
    });
    expect(scaleMoney(money(125, "USD"), 0).minorUnits).toBe(0);
    expect(scaleMoney(money(125, "USD"), -2).minorUnits).toBe(-250);
  });

  it.each([1.25, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53])(
    "rejects non-safe-integer scale factor %s",
    (factor) => {
      expect(() => scaleMoney(money(100, "USD"), factor)).toThrowError(
        expect.objectContaining({ code: "invalid_factor" }),
      );
    },
  );

  it("rejects arithmetic overflow instead of rounding", () => {
    expect(() =>
      addMoney(money(Number.MAX_SAFE_INTEGER, "USD"), money(1, "USD")),
    ).toThrowError(expect.objectContaining({ code: "overflow" }));
    expect(() =>
      subtractMoney(money(Number.MIN_SAFE_INTEGER, "USD"), money(1, "USD")),
    ).toThrowError(expect.objectContaining({ code: "overflow" }));
    expect(() =>
      scaleMoney(money(Number.MAX_SAFE_INTEGER, "USD"), 2),
    ).toThrowError(expect.objectContaining({ code: "overflow" }));
  });

  it("uses safe, value-free domain errors", () => {
    try {
      addMoney(money(100, "USD"), money(100, "EUR"));
      expect.fail("Expected a currency mismatch.");
    } catch (error) {
      expect(error).toBeInstanceOf(MoneyError);
      expect(String(error)).not.toContain("100");
      expect(String(error)).not.toContain("USD");
      expect(String(error)).not.toContain("EUR");
    }
  });
});
