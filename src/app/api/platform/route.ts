import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { isPlatformAdminEmailAsync, listPlatformOrgs, listUsage } from "@/lib/platform/admin";
import { db, ensureDb, schema } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await isPlatformAdminEmailAsync(session.email)) {
    return NextResponse.json({ error: "Platform admin only" }, { status: 403 });
  }
  const orgs = await listPlatformOrgs();
  const usage = await listUsage(40);
  return NextResponse.json({ orgs, usage });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await isPlatformAdminEmailAsync(session.email)) {
    return NextResponse.json({ error: "Platform admin only" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as { orgId?: string; planTier?: string; seatLimit?: number };
  if (!body.orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });
  await ensureDb();
  await db
    .update(schema.organisations)
    .set({
      planTier: body.planTier || "pilot",
      seatLimit: body.seatLimit ?? 5,
    })
    .where(eq(schema.organisations.id, body.orgId));
  return NextResponse.json({ ok: true });
}
