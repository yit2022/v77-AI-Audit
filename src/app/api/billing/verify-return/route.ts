import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { confirmPaidReference } from "@/lib/billing/service";
import { billingEnabled } from "@/lib/billing/flags";

/** Paystack callback lands on /billing?checkout=return&reference=… — client or server calls this to verify. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!billingEnabled()) return NextResponse.json({ error: "Billing disabled" }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as { reference?: string };
  const reference = (body.reference || "").trim();
  if (!reference || !reference.startsWith("v77_")) {
    return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
  }
  const result = await confirmPaidReference(reference, { source: "callback" });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!billingEnabled()) return NextResponse.json({ error: "Billing disabled" }, { status: 503 });
  const url = new URL(req.url);
  const reference = (url.searchParams.get("reference") || url.searchParams.get("trxref") || "").trim();
  if (!reference || !reference.startsWith("v77_")) {
    return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
  }
  const result = await confirmPaidReference(reference, { source: "callback" });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
