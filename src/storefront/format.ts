import type { Money } from "@/domain/money/money";

const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: string): Intl.NumberFormat {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    });
    formatters.set(currency, formatter);
  }
  return formatter;
}

/** Display-only conversion; arithmetic always stays in integer minor units. */
export function formatMoney(value: Money): string {
  const formatter = formatterFor(value.currency);
  const exponent = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(value.minorUnits / 10 ** exponent);
}

export function formatPriceDelta(value: Money): string {
  return value.minorUnits > 0 ? `+${formatMoney(value)}` : "";
}
