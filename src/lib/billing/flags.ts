export type BillingProvider = "stripe" | "paystack";

/** Checkout stays off until keys exist and the flag is flipped. */
export function billingEnabled(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): boolean {
  return env.V77_BILLING_ENABLED === "true";
}

export function stripeSecretKey(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): string | null {
  const k = env.STRIPE_SECRET_KEY?.trim();
  return k || null;
}

export function stripePublishableKey(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): string | null {
  const k = (env.STRIPE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)?.trim();
  return k || null;
}

export function stripeWebhookSecret(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): string | null {
  const k = env.STRIPE_WEBHOOK_SECRET?.trim();
  return k || null;
}

export function stripeAutomaticTaxEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  const raw = env.STRIPE_AUTOMATIC_TAX?.trim().toLowerCase();
  if (raw === "false" || raw === "0") return false;
  return true;
}

export function paystackSecretKey(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): string | null {
  const k = env.PAYSTACK_SECRET_KEY?.trim();
  return k || null;
}

export function paystackPublicKey(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): string | null {
  const k = env.PAYSTACK_PUBLIC_KEY?.trim();
  return k || null;
}

/**
 * Resolve active billing provider.
 * Defaults to "stripe" for EU native EUR + VAT/VIES checkout.
 * Falls back to "paystack" only when explicitly requested via V77_BILLING_PROVIDER=paystack
 * or when PAYSTACK_SECRET_KEY is configured without STRIPE_SECRET_KEY.
 */
export function billingProvider(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): BillingProvider {
  const explicit = env.V77_BILLING_PROVIDER?.trim().toLowerCase();
  if (explicit === "paystack") return "paystack";
  if (explicit === "stripe") return "stripe";
  if (stripeSecretKey(env)) return "stripe";
  if (paystackSecretKey(env)) return "paystack";
  return "stripe";
}
