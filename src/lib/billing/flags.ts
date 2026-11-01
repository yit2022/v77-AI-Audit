/** Checkout stays off until keys exist and the flag is flipped. */
export function billingEnabled(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): boolean {
  return env.V77_BILLING_ENABLED === "true";
}

export function paystackSecretKey(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): string | null {
  const k = env.PAYSTACK_SECRET_KEY?.trim();
  return k || null;
}

export function paystackPublicKey(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): string | null {
  const k = env.PAYSTACK_PUBLIC_KEY?.trim();
  return k || null;
}
