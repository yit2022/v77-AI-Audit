import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { confirmPaidReference } from "@/lib/billing/service";
import { billingEnabled } from "@/lib/billing/flags";

/** Stripe or Paystack callback lands on /billing?checkout=return&reference=…&session_id=… — client or server calls this to verify. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!billingEnabled()) return NextResponse.json({ error: "Billing disabled" }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as { reference?: string; sessionId?: string; session_id?: string };
  const reference = (body.reference || "").trim();
  const sessionId = (body.sessionId || body.session_id || "").trim();
  if ((!reference || !reference.startsWith("v77_")) && (!sessionId || !sessionId.startsWith("cs_"))) {
    return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
  }
  const result = await confirmPaidReference(reference || sessionId, {
    source: "callback",
    sessionId: sessionId || undefined,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!billingEnabled()) return NextResponse.json({ error: "Billing disabled" }, { status: 503 });
  const url = new URL(req.url);
  const reference = (url.searchParams.get("reference") || url.searchParams.get("trxref") || "").trim();
  const sessionId = (url.searchParams.get("session_id") || url.searchParams.get("sessionId") || "").trim();
  if ((!reference || !reference.startsWith("v77_")) && (!sessionId || !sessionId.startsWith("cs_"))) {
    return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
  }
  const result = await confirmPaidReference(reference || sessionId, {
    source: "callback",
    sessionId: sessionId || undefined,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
