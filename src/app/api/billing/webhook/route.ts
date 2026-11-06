import { NextResponse } from "next/server";
import { isV77PaystackEvent, verifyPaystackSignature } from "@/lib/billing/paystack";
import { isV77StripeEvent, verifyStripeSignature, type StripeWebhookEventPayload } from "@/lib/billing/stripe";
import { activatePlanFromStripeWebhook, activatePlanFromWebhook } from "@/lib/billing/service";

export async function POST(req: Request) {
  const raw = await req.text();
  const stripeSig = req.headers.get("stripe-signature");

  if (stripeSig) {
    if (!verifyStripeSignature(raw, stripeSig)) {
      return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 401 });
    }
    let stripePayload: StripeWebhookEventPayload;
    try {
      stripePayload = JSON.parse(raw) as StripeWebhookEventPayload;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    if (!isV77StripeEvent(stripePayload)) {
      return NextResponse.json({ ok: true, ignored: true, reason: "not_v77" });
    }
    try {
      const result = await activatePlanFromStripeWebhook(stripePayload);
      return NextResponse.json(result);
    } catch (e) {
      console.error("[stripe:webhook]", e instanceof Error ? e.message : e);
      return NextResponse.json({ error: "Stripe webhook handler failed" }, { status: 500 });
    }
  }

  const signature = req.headers.get("x-paystack-signature");
  if (!verifyPaystackSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  let payload: {
    event?: string;
    data?: { reference?: string; metadata?: Record<string, unknown> | null };
  };
  try {
    payload = JSON.parse(raw) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  // Ready for forwarded events, but never process other products' charges.
  if (!isV77PaystackEvent(payload)) {
    return NextResponse.json({ ok: true, ignored: true, reason: "not_v77" });
  }
  const reference = payload.data?.reference;
  const event = payload.event || "";
  if (!reference) return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  try {
    const result = await activatePlanFromWebhook({ reference, event, rawPayload: payload });
    return NextResponse.json(result);
  } catch (e) {
    console.error("[paystack:webhook]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
