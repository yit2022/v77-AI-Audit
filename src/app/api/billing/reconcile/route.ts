import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isPlatformAdminEmail } from "@/lib/platform/admin";
import { reconcileV77Payments } from "@/lib/billing/service";
import { billingEnabled } from "@/lib/billing/flags";

function cronAuthorized(req: Request): boolean {
  const secret = process.env.V77_BILLING_CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const header = req.headers.get("x-v77-cron-secret") || "";
  return bearer === secret || header === secret;
}

/** Scheduled or manual reconciliation — does not rely on Paystack webhooks. */
export async function POST(req: Request) {
  if (!billingEnabled()) return NextResponse.json({ error: "Billing disabled" }, { status: 503 });
  const session = await getSession();
  const allowed =
    cronAuthorized(req) || (session && isPlatformAdminEmail(session.email));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const result = await reconcileV77Payments();
  return NextResponse.json(result);
}

export async function GET(req: Request) {
  return POST(req);
}
