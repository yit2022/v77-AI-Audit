import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { canAdmin } from "@/lib/auth/rbac";
import { db, ensureDb, schema } from "@/lib/db";
import { appendAuditLog } from "@/lib/audit/log";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const rows = await db.select().from(schema.organisations).where(eq(schema.organisations.id, session.orgId)).limit(1);
  const org = rows[0];
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    slug: org.slug,
    trustPublic: org.trustPublic,
    trustSummary: org.trustSummary,
    trustContactEmail: org.trustContactEmail,
    publicUrl: `/trust/${org.slug}`,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAdmin(session.role)) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as {
    trustPublic?: boolean;
    trustSummary?: string;
    trustContactEmail?: string;
  };
  await ensureDb();
  await db
    .update(schema.organisations)
    .set({
      trustPublic: Boolean(body.trustPublic),
      trustSummary: String(body.trustSummary ?? "").slice(0, 4000),
      trustContactEmail: String(body.trustContactEmail ?? "").slice(0, 320),
    })
    .where(eq(schema.organisations.id, session.orgId));
  await appendAuditLog({
    orgId: session.orgId,
    actorUserId: session.userId,
    action: "trust.updated",
    entityType: "organisation",
    entityId: session.orgId,
    detail: { trustPublic: Boolean(body.trustPublic) },
  });
  return NextResponse.json({ ok: true });
}
