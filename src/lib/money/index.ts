/** Display helpers — quotes are EUR-first for EU customers. */
export const DISPLAY_CURRENCY = "EUR" as const;

export function formatMoney(amount: number, currency: string = DISPLAY_CURRENCY, locale = "en-IE"): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export const PRICING_NOTE =
  "Pricing on request. Quotes are provided in EUR (euro) after a short discovery call with sales.";

export { formatEur, parseEurInput } from "./eur";
