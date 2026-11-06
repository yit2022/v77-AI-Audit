import { createHmac, timingSafeEqual } from "node:crypto";
import { billingEnabled, stripeAutomaticTaxEnabled, stripeSecretKey, stripeWebhookSecret } from "./flags";
import type { BillingInterval } from "./currency";

export const STRIPE_CHECKOUT_DISPLAY_NAME = "V77 Trust";

/**
 * European payment methods enabled on Stripe Checkout:
 * - card: Visa / Mastercard / Amex with PSD2 SCA (3DS2)
 * - sepa_debit: SEPA Direct Debit (IBAN) for Eurozone & EU B2B accounts
 */
export const STRIPE_PAYMENT_METHODS = ["card", "sepa_debit"] as const;

function stripeApiBase(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): string {
  return (env.STRIPE_API_BASE || "https://api.stripe.com").replace(/\/$/, "");
}

/** Recursively flatten nested objects/arrays into application/x-www-form-urlencoded params for Stripe REST API. */
export function encodeStripeForm(data: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams();
  function append(prefix: string, value: unknown) {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        append(`${prefix}[${index}]`, item);
      });
      return;
    }
    if (typeof value === "object") {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        append(`${prefix}[${k}]`, v);
      }
      return;
    }
    params.append(prefix, String(value));
  }
  for (const [key, val] of Object.entries(data)) {
    append(key, val);
  }
  return params;
}

export type StripeCheckoutInput = {
  email: string;
  /** EUR net price (ex VAT) for the selected interval (e.g., 499 monthly or 4990 annual). */
  priceEur: number;
  interval: BillingInterval;
  planName?: string;
  reference: string;
  callbackUrl: string;
  cancelUrl?: string;
  customerId?: string | null;
  metadata: Record<string, unknown>;
  /** Optional Stripe Connect destination account (acct_...) for partner revenue split. */
  connectDestination?: string | null;
  /** Platform fee percent when using Stripe Connect destination (e.g. 1.5). */
  platformFeePercent?: number | null;
};

export type StripeCheckoutResult = {
  authorizationUrl: string;
  sessionId: string;
  reference: string;
  currency: "EUR";
  amountMinor: number;
  eurAmount: number;
};

export async function createStripeCheckoutSession(
  input: StripeCheckoutInput,
  fetchImpl: typeof fetch = fetch,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): Promise<StripeCheckoutResult> {
  if (!billingEnabled(env)) throw new Error("Billing is disabled (V77_BILLING_ENABLED)");
  const secret = stripeSecretKey(env);
  if (!secret) throw new Error("STRIPE_SECRET_KEY is not configured");

  const amountMinor = Math.round(input.priceEur * 100);
  const mode = env.STRIPE_CHECKOUT_MODE === "payment" ? "payment" : "subscription";
  const autoTax = stripeAutomaticTaxEnabled(env);
  const configuredPriceId =
    input.interval === "annual"
      ? env.STRIPE_PRICE_TEAM_ANNUAL?.trim()
      : env.STRIPE_PRICE_TEAM_MONTHLY?.trim();

  const sep = input.callbackUrl.includes("?") ? "&" : "?";
  const successUrl = `${input.callbackUrl}${sep}provider=stripe&reference=${encodeURIComponent(input.reference)}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl =
    input.cancelUrl ||
    input.callbackUrl.replace(/\?.*$/, "?checkout=cancelled");

  const cleanMeta: Record<string, string> = {
    app: "v77",
    source: "v77",
    reference: input.reference,
    product: STRIPE_CHECKOUT_DISPLAY_NAME,
    eur_list: String(input.priceEur),
    billing_interval: input.interval,
  };
  for (const [k, v] of Object.entries(input.metadata)) {
    if (v !== undefined && v !== null && v !== "") {
      cleanMeta[k] = String(v);
    }
  }

  const lineItem: Record<string, unknown> = configuredPriceId
    ? { price: configuredPriceId, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: amountMinor,
          tax_behavior: "exclusive",
          product_data: {
            name: `${STRIPE_CHECKOUT_DISPLAY_NAME} — ${input.planName || "Team"} (${input.interval})`,
            description: "EU AI Act & ISO/IEC 42001 governance workspace — operated by Vertex77 sp. z o.o. (Warsaw, Poland)",
            metadata: {
              app: "v77",
              seller_vat_eu: "PL5214148501",
            },
          },
          ...(mode === "subscription"
            ? {
                recurring: {
                  interval: input.interval === "annual" ? "year" : "month",
                },
              }
            : {}),
        },
      };

  const payload: Record<string, unknown> = {
    mode,
    client_reference_id: input.reference,
    success_url: successUrl,
    cancel_url: cancelUrl,
    payment_method_types: [...STRIPE_PAYMENT_METHODS],
    billing_address_collection: "required",
    tax_id_collection: { enabled: "true" },
    allow_promotion_codes: "true",
    line_items: [lineItem],
    metadata: cleanMeta,
  };

  if (autoTax) {
    payload.automatic_tax = { enabled: "true" };
  }

  const existingCustomer = input.customerId?.trim();
  if (existingCustomer && existingCustomer.startsWith("cus_")) {
    payload.customer = existingCustomer;
    payload.customer_update = { name: "auto", address: "auto" };
  } else {
    payload.customer_email = input.email;
    if (mode === "payment") {
      payload.customer_creation = "always";
    }
  }

  const connectDest = input.connectDestination?.trim();
  if (mode === "subscription") {
    const subData: Record<string, unknown> = {
      metadata: cleanMeta,
    };
    if (connectDest && connectDest.startsWith("acct_")) {
      subData.transfer_data = { destination: connectDest };
      if (typeof input.platformFeePercent === "number" && input.platformFeePercent >= 0) {
        subData.application_fee_percent = input.platformFeePercent;
      }
    }
    payload.subscription_data = subData;
  } else if (mode === "payment") {
    const piData: Record<string, unknown> = {
      metadata: cleanMeta,
    };
    if (connectDest && connectDest.startsWith("acct_")) {
      piData.transfer_data = { destination: connectDest };
      if (typeof input.platformFeePercent === "number" && input.platformFeePercent >= 0) {
        piData.application_fee_amount = Math.round((amountMinor * input.platformFeePercent) / 100);
      }
    }
    payload.payment_intent_data = piData;
  }

  const res = await fetchImpl(`${stripeApiBase(env)}/v1/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "V77Trust/1.0 (Vertex77 sp. z o.o.)",
    },
    body: encodeStripeForm(payload).toString(),
  });

  const data = (await res.json().catch(() => ({}))) as {
    id?: string;
    url?: string;
    client_reference_id?: string;
    error?: { message?: string };
  };

  if (!res.ok || !data.id || !data.url) {
    throw new Error(data.error?.message || `Stripe Checkout initialization failed (${res.status})`);
  }

  return {
    authorizationUrl: data.url,
    sessionId: data.id,
    reference: data.client_reference_id || input.reference,
    currency: "EUR",
    amountMinor,
    eurAmount: input.priceEur,
  };
}

export type VerifiedStripeSession = {
  ok: boolean;
  status: string;
  paymentStatus: string;
  sessionId: string;
  reference: string;
  customerId: string;
  subscriptionId: string;
  amountMinor: number;
  taxAmountMinor: number;
  currency: string;
  customerVatId: string;
  metadata: Record<string, unknown>;
};

export async function verifyStripeSession(
  sessionId: string,
  fetchImpl: typeof fetch = fetch,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): Promise<VerifiedStripeSession> {
  const secret = stripeSecretKey(env);
  if (!secret) throw new Error("STRIPE_SECRET_KEY is not configured");

  const res = await fetchImpl(
    `${stripeApiBase(env)}/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    {
      headers: {
        Authorization: `Bearer ${secret}`,
        "User-Agent": "V77Trust/1.0 (Vertex77 sp. z o.o.)",
      },
    },
  );
  const data = (await res.json().catch(() => ({}))) as {
    id?: string;
    status?: string;
    payment_status?: string;
    client_reference_id?: string;
    customer?: string | { id?: string };
    subscription?: string | { id?: string };
    amount_total?: number;
    amount_subtotal?: number;
    total_details?: { amount_tax?: number };
    currency?: string;
    customer_details?: {
      tax_ids?: Array<{ type?: string; value?: string }>;
    };
    metadata?: Record<string, unknown>;
  };

  const status = data.status || "";
  const paymentStatus = data.payment_status || "";
  const isPaid =
    res.ok &&
    (paymentStatus === "paid" || paymentStatus === "no_payment_required" || (status === "complete" && paymentStatus !== "unpaid"));

  const customerId =
    typeof data.customer === "string"
      ? data.customer
      : data.customer?.id || "";
  const subscriptionId =
    typeof data.subscription === "string"
      ? data.subscription
      : data.subscription?.id || "";
  const vatEntry = data.customer_details?.tax_ids?.[0];
  const meta = (data.metadata || {}) as Record<string, unknown>;
  const reference = data.client_reference_id || String(meta.reference || "");

  return {
    ok: Boolean(isPaid),
    status,
    paymentStatus,
    sessionId: data.id || sessionId,
    reference,
    customerId,
    subscriptionId,
    amountMinor: data.amount_total ?? data.amount_subtotal ?? 0,
    taxAmountMinor: data.total_details?.amount_tax ?? 0,
    currency: (data.currency || "eur").toUpperCase(),
    customerVatId: vatEntry?.value || "",
    metadata: meta,
  };
}

export async function createStripePortalSession(
  opts: { customerId: string; returnUrl: string },
  fetchImpl: typeof fetch = fetch,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): Promise<{ url: string }> {
  const secret = stripeSecretKey(env);
  if (!secret) throw new Error("STRIPE_SECRET_KEY is not configured");
  if (!opts.customerId || !opts.customerId.startsWith("cus_")) {
    throw new Error("No Stripe customer profile found for this organisation yet");
  }

  const body = encodeStripeForm({
    customer: opts.customerId,
    return_url: opts.returnUrl,
  });

  const res = await fetchImpl(`${stripeApiBase(env)}/v1/billing_portal/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "V77Trust/1.0 (Vertex77 sp. z o.o.)",
    },
    body: body.toString(),
  });
  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    error?: { message?: string };
  };
  if (!res.ok || !data.url) {
    throw new Error(data.error?.message || `Stripe Customer Portal failed (${res.status})`);
  }
  return { url: data.url };
}

/**
 * Verify Stripe-Signature header (t=<unix_ts>,v1=<hmac_sha256>) with constant-time comparison
 * and replay window tolerance (default 300 seconds).
 */
export function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string | null,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
  toleranceSec = 300,
  nowSec = Math.floor(Date.now() / 1000),
): boolean {
  const secret = stripeWebhookSecret(env);
  if (!secret || !signatureHeader) return false;

  const parts = signatureHeader.split(",").map((p) => p.trim());
  let timestamp = "";
  const signatures: string[] = [];
  for (const part of parts) {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) continue;
    const k = part.slice(0, eqIdx).trim();
    const v = part.slice(eqIdx + 1).trim();
    if (k === "t") timestamp = v;
    if (k === "v1" && v) signatures.push(v);
  }
  if (!timestamp || signatures.length === 0) return false;

  const tsNum = Number(timestamp);
  if (!Number.isFinite(tsNum)) return false;
  if (toleranceSec > 0 && Math.abs(nowSec - tsNum) > toleranceSec) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");

  for (const sig of signatures) {
    try {
      const candidateBuf = Buffer.from(sig, "utf8");
      if (candidateBuf.length === expectedBuf.length && timingSafeEqual(expectedBuf, candidateBuf)) {
        return true;
      }
    } catch {
      /* ignore malformed candidate */
    }
  }
  return false;
}

export type StripeWebhookEventPayload = {
  id?: string;
  type?: string;
  data?: {
    object?: {
      id?: string;
      object?: string;
      client_reference_id?: string | null;
      customer?: string | { id?: string } | null;
      subscription?: string | { id?: string } | null;
      payment_status?: string;
      status?: string;
      amount_total?: number;
      currency?: string;
      metadata?: Record<string, unknown> | null;
    };
  };
};

export function isV77StripeEvent(payload: StripeWebhookEventPayload): boolean {
  const obj = payload.data?.object;
  if (!obj) return false;
  const ref = obj.client_reference_id || String(obj.metadata?.reference || "");
  const meta = obj.metadata || {};
  const app = String(meta.app || meta.source || "");
  return app === "v77" || ref.startsWith("v77_");
}

export async function listStripeCheckoutSessions(
  opts: { limit?: number } = {},
  fetchImpl: typeof fetch = fetch,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): Promise<Array<{ sessionId: string; reference: string; status: string; paymentStatus: string; metadata: Record<string, unknown> }>> {
  const secret = stripeSecretKey(env);
  if (!secret) throw new Error("STRIPE_SECRET_KEY is not configured");
  const limit = opts.limit ?? 50;
  const res = await fetchImpl(`${stripeApiBase(env)}/v1/checkout/sessions?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${secret}`,
      "User-Agent": "V77Trust/1.0 (Vertex77 sp. z o.o.)",
    },
  });
  const data = (await res.json().catch(() => ({}))) as {
    data?: Array<{
      id?: string;
      client_reference_id?: string | null;
      status?: string;
      payment_status?: string;
      metadata?: Record<string, unknown> | null;
    }>;
  };
  if (!res.ok || !Array.isArray(data.data)) return [];
  return data.data.map((row) => {
    const meta = (row.metadata || {}) as Record<string, unknown>;
    return {
      sessionId: row.id || "",
      reference: row.client_reference_id || String(meta.reference || ""),
      status: row.status || "",
      paymentStatus: row.payment_status || "",
      metadata: meta,
    };
  });
}
