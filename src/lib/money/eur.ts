/** Format amounts for EU-facing UI. Always displays EUR. */
export function formatEur(amount: number, locale = "en-GB"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    currencyDisplay: "symbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Parse a loose numeric/money string into a number (EUR). */
export function parseEurInput(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.,-]/g, "").replace(",", ".");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
