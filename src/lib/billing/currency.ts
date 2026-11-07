import { formatEur } from "@/lib/money/eur";

/** Charge currency for Paystack. Docs commonly list KES/USD for Kenya; EUR when enabled by Paystack for the account. */
export type ChargeCurrency = "USD" | "EUR";

export function paystackCurrency(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): ChargeCurrency {
  const raw = (env.PAYSTACK_CURRENCY || "USD").trim().toUpperCase();
  return raw === "EUR" ? "EUR" : "USD";
}

/** EUR→USD rate used only when charging in USD. Override with PAYSTACK_EUR_USD_RATE. */
export function eurToUsdRate(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): number {
  const n = Number(env.PAYSTACK_EUR_USD_RATE || "1.08");
  return Number.isFinite(n) && n > 0 ? n : 1.08;
}

export type BillingInterval = "monthly" | "annual";

export type DisplayCurrency = "EUR" | "USD" | "GBP" | "AUD" | "NZD";

export const DISPLAY_CURRENCIES: Array<{
  code: DisplayCurrency;
  label: string;
  locale: string;
  rateFromEur: number;
  regionHint: string;
}> = [
  { code: "EUR", label: "EUR (€)", locale: "en-IE", rateFromEur: 1, regionHint: "EU / EEA (Stripe EUR & SEPA)" },
  { code: "USD", label: "USD ($)", locale: "en-US", rateFromEur: 1.08, regionHint: "United States" },
  { code: "GBP", label: "GBP (£)", locale: "en-GB", rateFromEur: 0.85, regionHint: "United Kingdom" },
  { code: "AUD", label: "AUD (A$)", locale: "en-AU", rateFromEur: 1.65, regionHint: "Australia" },
  { code: "NZD", label: "NZD (NZ$)", locale: "en-NZ", rateFromEur: 1.80, regionHint: "New Zealand" },
];

export type PricedPlan = {
  tier: string;
  name: string;
  /** List price in EUR (display currency for EU buyers). null = pricing on request / custom. */
  priceEurMonthly: number | null;
  /** Annual list EUR = 10× monthly (2 months free). null when monthly is null. */
  priceEurAnnual: number | null;
  seatLimit: number;
  features: string[];
};

export const BILLABLE_PLANS: PricedPlan[] = [
  {
    tier: "pilot",
    name: "Pilot",
    priceEurMonthly: null,
    priceEurAnnual: null,
    seatLimit: 5,
    features: [
      "14-day self-serve trial",
      "Up to 3 AI systems & 5 users",
      "EU AI Act Art. 5 / Annex III / Art. 6(3) classifier",
      "6 frameworks & SHA-256 evidence vault",
    ],
  },
  {
    tier: "team",
    name: "Team",
    priceEurMonthly: 499,
    priceEurAnnual: 4990,
    seatLimit: 25,
    features: [
      "Everything in Pilot (up to 50 AI systems & 25 users)",
      "Auto-drafted Annex IV, Model Cards, FRIA & GDPR DPIA",
      "Art. 47 Declaration of Conformity & Art. 49 EU DB JSON",
      "Live OWASP LLM Top 10 red-teaming & Four-Fifths fairness",
      "CI/CD Compliance Gate API (/api/v1/compliance-gate)",
    ],
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    priceEurMonthly: 1890,
    priceEurAnnual: 18900,
    seatLimit: 200,
    features: [
      "Everything in Team (up to 500 AI systems & 200 users)",
      "10-artifact Audit Pack ZIP & external Auditor Sign-Off",
      "Art. 73 serious-incident authority dossiers (2/10/15d)",
      "Custom OIDC SSO, white-label Partner Portal & custom MSA",
      "Dedicated EU compliance onboarding & SEPA / PO invoicing",
    ],
  },
];

export function listPriceEur(plan: PricedPlan, interval: BillingInterval = "monthly"): number | null {
  if (interval === "annual") return plan.priceEurAnnual;
  return plan.priceEurMonthly;
}

export function displayPriceEur(plan: PricedPlan, locale = "en-GB", interval: BillingInterval = "monthly"): string {
  const amount = listPriceEur(plan, interval);
  if (amount == null) return "Pricing on request";
  if (interval === "annual") return `${formatEur(amount, locale)} / year`;
  return `${formatEur(amount, locale)} / month`;
}

export function displayPriceForCurrency(
  plan: PricedPlan,
  currency: DisplayCurrency = "EUR",
  interval: BillingInterval = "monthly",
): string {
  if (currency === "EUR") return displayPriceEur(plan, "en-GB", interval);
  const eurAmount = listPriceEur(plan, interval);
  if (eurAmount == null) return "Pricing on request";
  const meta = DISPLAY_CURRENCIES.find((c) => c.code === currency) || DISPLAY_CURRENCIES[0];
  const converted = Math.round((eurAmount * meta.rateFromEur) / 10) * 10;
  const formatted = new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: meta.code,
    maximumFractionDigits: 0,
  }).format(converted);
  return interval === "annual" ? `${formatted} / year` : `${formatted} / month`;
}

/** Convert EUR list price into the smallest currency unit for Paystack (cents). */
export function chargeAmountMinor(
  priceEur: number,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): { currency: ChargeCurrency; amountMinor: number; eurAmount: number; usdAmount?: number } {
  const currency = paystackCurrency(env);
  if (currency === "EUR") {
    return { currency, amountMinor: Math.round(priceEur * 100), eurAmount: priceEur };
  }
  const usd = Math.round(priceEur * eurToUsdRate(env) * 100) / 100;
  return { currency: "USD", amountMinor: Math.round(usd * 100), eurAmount: priceEur, usdAmount: usd };
}
