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
    features: ["14-day trial", "Up to 3 AI systems", "5 users", "6 frameworks", "Evidence vault"],
  },
  {
    tier: "team",
    name: "Team",
    priceEurMonthly: 499,
    priceEurAnnual: 4990,
    seatLimit: 25,
    features: ["Everything in Pilot", "50 AI systems", "25 users", "8 frameworks", "Approvals & Trust Center", "API keys"],
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    priceEurMonthly: null,
    priceEurAnnual: null,
    seatLimit: 200,
    features: ["Everything in Team", "Custom limits", "SSO scaffolding", "Dedicated onboarding", "Partner split billing"],
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
