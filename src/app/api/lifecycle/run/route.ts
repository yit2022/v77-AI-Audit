import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isPlatformAdminEmail } from "@/lib/platform/admin";
import { runLifecycleEmails } from "@/lib/lifecycle/run";
import { applyPeriodEndCancellations } from "@/lib/billing/service";

function cronAuthorized(req: Request): boolean {
  const secret = process.env.V77_BILLING_CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const header = req.headers.get("x-v77-cron-secret") || "";
  return bearer === secret || header === secret;
}

export async function POST(req: Request) {
  const session = await getSession().catch(() => null);
  const ok =
    cronAuthorized(req) || (session && isPlatformAdminEmail(session.email));
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const lifecycle = await runLifecycleEmails();
  const period = await applyPeriodEndCancellations();
  return NextResponse.json({ ok: true, lifecycle, period });
}
