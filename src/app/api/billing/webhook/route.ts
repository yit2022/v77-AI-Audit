import { NextResponse } from "next/server";
import { verifyPaystackSignature } from "@/lib/billing/paystack";
import { activatePlanFromWebhook } from "@/lib/billing/service";

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  if (!verifyPaystackSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  let payload: { event?: string; data?: { reference?: string } };
  try {
    payload = JSON.parse(raw) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const reference = payload.data?.reference;
  const event = payload.event || "";
  if (!reference) return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  try {
    const result = await activatePlanFromWebhook({ reference, event, rawPayload: payload });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[paystack:webhook]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
