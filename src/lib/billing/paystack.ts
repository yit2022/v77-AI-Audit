import { createHmac, timingSafeEqual } from "node:crypto";
import { billingEnabled, paystackSecretKey } from "./flags";
import { chargeAmountMinor, type ChargeCurrency } from "./currency";

export const CHECKOUT_DISPLAY_NAME = "V77 Trust";

/** Card only — never enable M-Pesa / mobile money. */
export const PAYSTACK_CHANNELS = ["card"] as const;

export type InitializeInput = {
  email: string;
  priceEurMonthly: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
  /** Partner revenue share: Paystack subaccount code and/or transaction split code. */
  subaccount?: string | null;
  splitCode?: string | null;
  transactionCharge?: number | null;
};

export type InitializeResult = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  currency: ChargeCurrency;
  amountMinor: number;
  eurAmount: number;
  usdAmount?: number;
};

function apiBase(): string {
  return (process.env.PAYSTACK_API_BASE || "https://api.paystack.co").replace(/\/$/, "");
}

export async function initializeTransaction(
  input: InitializeInput,
  fetchImpl: typeof fetch = fetch,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): Promise<InitializeResult> {
  if (!billingEnabled(env)) throw new Error("Billing is disabled (V77_BILLING_ENABLED)");
  const secret = paystackSecretKey(env);
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured");

  const priced = chargeAmountMinor(input.priceEurMonthly, env);
  const body: Record<string, unknown> = {
    email: input.email,
    amount: priced.amountMinor,
    currency: priced.currency,
    reference: input.reference,
    callback_url: input.callbackUrl,
    channels: [...PAYSTACK_CHANNELS],
    metadata: {
      ...input.metadata,
      custom_fields: [
        { display_name: "Product", variable_name: "product", value: CHECKOUT_DISPLAY_NAME },
        { display_name: "EUR list price", variable_name: "eur_list", value: String(priced.eurAmount) },
      ],
    },
  };
  if (input.splitCode) body.split_code = input.splitCode;
  else if (input.subaccount) {
    body.subaccount = input.subaccount;
    if (input.transactionCharge != null) body.transaction_charge = input.transactionCharge;
  }

  const res = await fetchImpl(`${apiBase()}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      "User-Agent": "V77Trust/1.0",
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    message?: string;
    data?: { authorization_url?: string; access_code?: string; reference?: string };
  };
  if (!res.ok || !data.status || !data.data?.authorization_url) {
    throw new Error(data.message || `Paystack initialize failed (${res.status})`);
  }
  return {
    authorizationUrl: data.data.authorization_url!,
    accessCode: data.data.access_code || "",
    reference: data.data.reference || input.reference,
    currency: priced.currency,
    amountMinor: priced.amountMinor,
    eurAmount: priced.eurAmount,
    usdAmount: priced.usdAmount,
  };
}

export function verifyPaystackSignature(
  rawBody: string,
  signatureHeader: string | null,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  const secret = paystackSecretKey(env);
  if (!secret || !signatureHeader) return false;
  const hash = createHmac("sha512", secret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(hash, "utf8");
    const b = Buffer.from(signatureHeader, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function verifyTransaction(
  reference: string,
  fetchImpl: typeof fetch = fetch,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): Promise<{ ok: boolean; status: string; amountMinor: number; currency: string; metadata: Record<string, unknown> }> {
  const secret = paystackSecretKey(env);
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  const res = await fetchImpl(`${apiBase()}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}`, "User-Agent": "V77Trust/1.0" },
  });
  const data = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    data?: { status?: string; amount?: number; currency?: string; metadata?: Record<string, unknown> };
  };
  const st = data.data?.status || "";
  return {
    ok: Boolean(data.status && st === "success"),
    status: st,
    amountMinor: data.data?.amount ?? 0,
    currency: data.data?.currency || "",
    metadata: data.data?.metadata || {},
  };
}

export function isV77PaystackEvent(payload: {
  data?: { reference?: string; metadata?: Record<string, unknown> | null };
}): boolean {
  const ref = payload.data?.reference || "";
  const meta = payload.data?.metadata || {};
  const app = meta && typeof meta === "object" ? String((meta as { app?: unknown }).app || (meta as { source?: unknown }).source || "") : "";
  return app === "v77" || ref.startsWith("v77_");
}

export async function listTransactions(
  opts: { perPage?: number; page?: number; status?: string } = {},
  fetchImpl: typeof fetch = fetch,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): Promise<Array<{ reference: string; status: string; metadata: Record<string, unknown>; amount: number; currency: string }>> {
  const secret = paystackSecretKey(env);
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  const params = new URLSearchParams();
  params.set("perPage", String(opts.perPage ?? 50));
  params.set("page", String(opts.page ?? 1));
  if (opts.status) params.set("status", opts.status);
  const res = await fetchImpl(`${apiBase()}/transaction?${params.toString()}`, {
    headers: { Authorization: `Bearer ${secret}`, "User-Agent": "V77Trust/1.0" },
  });
  const data = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    data?: Array<{ reference?: string; status?: string; metadata?: Record<string, unknown> | null; amount?: number; currency?: string }>;
  };
  if (!res.ok || !data.status) return [];
  return (data.data || []).map((row) => ({
    reference: row.reference || "",
    status: row.status || "",
    metadata: (row.metadata || {}) as Record<string, unknown>,
    amount: row.amount ?? 0,
    currency: row.currency || "",
  }));
}
