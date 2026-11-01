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

export type PricedPlan = {
  tier: string;
  name: string;
  /** List price in EUR (display currency for EU buyers). null = pricing on request / custom. */
  priceEurMonthly: number | null;
  seatLimit: number;
  features: string[];
};

export const BILLABLE_PLANS: PricedPlan[] = [
  {
    tier: "pilot",
    name: "Pilot",
    priceEurMonthly: null,
    seatLimit: 5,
    features: ["Core inventory & assessments", "Evidence vault", "In-app reminders"],
  },
  {
    tier: "team",
    name: "Team",
    priceEurMonthly: 499,
    seatLimit: 25,
    features: ["Everything in Pilot", "Approvals & Trust Center", "API keys", "Vendor questionnaires"],
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    priceEurMonthly: null,
    seatLimit: 200,
    features: ["Everything in Team", "SSO scaffolding", "Platform usage exports", "Dedicated onboarding", "Partner split billing"],
  },
];

export function displayPriceEur(plan: PricedPlan, locale = "en-GB"): string {
  if (plan.priceEurMonthly == null) return "Pricing on request";
  return `${formatEur(plan.priceEurMonthly, locale)} / month`;
}

/** Convert EUR list price into the smallest currency unit for Paystack (kobo/cents). */
export function chargeAmountMinor(
  priceEurMonthly: number,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): { currency: ChargeCurrency; amountMinor: number; eurAmount: number; usdAmount?: number } {
  const currency = paystackCurrency(env);
  if (currency === "EUR") {
    return { currency, amountMinor: Math.round(priceEurMonthly * 100), eurAmount: priceEurMonthly };
  }
  const usd = Math.round(priceEurMonthly * eurToUsdRate(env) * 100) / 100;
  return { currency: "USD", amountMinor: Math.round(usd * 100), eurAmount: priceEurMonthly, usdAmount: usd };
}
