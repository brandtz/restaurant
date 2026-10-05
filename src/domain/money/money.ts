export type CurrencyCode = string & {
  readonly __currencyCode: unique symbol;
};

export type Money = Readonly<{
  minorUnits: number;
  currency: CurrencyCode;
}>;

export type MoneyErrorCode =
  | "invalid_amount"
  | "invalid_currency"
  | "invalid_factor"
  | "currency_mismatch"
  | "overflow";

export class MoneyError extends Error {
  constructor(
    public readonly code: MoneyErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "MoneyError";
  }
}

export function currencyCode(value: string): CurrencyCode {
  if (!/^[A-Z]{3}$/.test(value)) {
    throw new MoneyError(
      "invalid_currency",
      "Currency must be a three-letter uppercase code.",
    );
  }
  return value as CurrencyCode;
}

export function money(minorUnits: number, currency: string): Money {
  if (!Number.isSafeInteger(minorUnits)) {
    throw new MoneyError(
      "invalid_amount",
      "Money minor units must be a safe integer.",
    );
  }

  return Object.freeze({
    minorUnits,
    currency: currencyCode(currency),
  });
}

function assertMoney(value: Money): void {
  if (!Number.isSafeInteger(value.minorUnits)) {
    throw new MoneyError(
      "invalid_amount",
      "Money minor units must be a safe integer.",
    );
  }
  currencyCode(value.currency);
}

function assertSameCurrency(left: Money, right: Money): void {
  assertMoney(left);
  assertMoney(right);
  if (left.currency !== right.currency) {
    throw new MoneyError(
      "currency_mismatch",
      "Money operations require matching currencies.",
    );
  }
}

function checkedResult(minorUnits: number, currency: CurrencyCode): Money {
  if (!Number.isSafeInteger(minorUnits)) {
    throw new MoneyError(
      "overflow",
      "Money arithmetic exceeded safe integer range.",
    );
  }
  return Object.freeze({ minorUnits, currency });
}

export function addMoney(left: Money, right: Money): Money {
  assertSameCurrency(left, right);
  return checkedResult(left.minorUnits + right.minorUnits, left.currency);
}

export function subtractMoney(left: Money, right: Money): Money {
  assertSameCurrency(left, right);
  return checkedResult(left.minorUnits - right.minorUnits, left.currency);
}

export function scaleMoney(value: Money, factor: number): Money {
  assertMoney(value);
  if (!Number.isSafeInteger(factor)) {
    throw new MoneyError(
      "invalid_factor",
      "Money scale factor must be a safe integer.",
    );
  }
  return checkedResult(value.minorUnits * factor, value.currency);
}

export function compareMoney(left: Money, right: Money): -1 | 0 | 1 {
  assertSameCurrency(left, right);
  if (left.minorUnits === right.minorUnits) {
    return 0;
  }
  return left.minorUnits < right.minorUnits ? -1 : 1;
}
