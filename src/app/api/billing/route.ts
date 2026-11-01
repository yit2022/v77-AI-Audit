import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ensurePlanCatalog, getOrgPlan, DEFAULT_PLANS } from "@/lib/billing/plans";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensurePlanCatalog();
  const plan = await getOrgPlan(session.orgId);
  return NextResponse.json({
    plan,
    catalog: DEFAULT_PLANS,
    note: "No payment provider is connected. All tiers are pricing on request — contact sales@vertex77.com.",
  });
}
