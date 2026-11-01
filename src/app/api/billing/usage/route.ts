import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOrgUsage } from "@/lib/billing/limits";
import { getOrgAccess } from "@/lib/billing/trial";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [usage, access] = await Promise.all([getOrgUsage(session.orgId), getOrgAccess(session.orgId)]);
  return NextResponse.json({ usage, access });
}
