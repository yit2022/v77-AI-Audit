import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { isReadOnly } from "@/lib/auth/rbac";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";
import { appendAuditLog } from "@/lib/audit/log";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const rows = await db
    .select()
    .from(schema.incidents)
    .where(eq(schema.incidents.orgId, session.orgId))
    .orderBy(desc(schema.incidents.createdAt));
  return NextResponse.json({ incidents: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isReadOnly(session.role)) return NextResponse.json({ error: "Auditors are read-only" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  await ensureDb();
  if (body.id && typeof body.id === "string") {
    await db
      .update(schema.incidents)
      .set({
        title: String(body.title || "Incident"),
        severity: String(body.severity || "medium"),
        status: String(body.status || "open"),
        discoveredAt: String(body.discoveredAt || ""),
        occurredAt: String(body.occurredAt || ""),
        description: String(body.description || ""),
        impactSummary: String(body.impactSummary || ""),
        rootCause: String(body.rootCause || ""),
        correctiveActions: String(body.correctiveActions || ""),
        authorityNotified: Boolean(body.authorityNotified),
        authorityNotifiedAt: String(body.authorityNotifiedAt || ""),
        seriousIncident: Boolean(body.seriousIncident),
        euArticleRef: String(body.euArticleRef || "Art. 73"),
        systemId: body.systemId ? String(body.systemId) : null,
        updatedAt: new Date(),
      })
      .where(eq(schema.incidents.id, body.id));
    return NextResponse.json({ id: body.id });
  }
  const rowId = id();
  await db.insert(schema.incidents).values({
    id: rowId,
    orgId: session.orgId,
    systemId: body.systemId ? String(body.systemId) : null,
    title: String(body.title || "Incident"),
    severity: String(body.severity || "medium"),
    status: String(body.status || "open"),
    discoveredAt: String(body.discoveredAt || ""),
    occurredAt: String(body.occurredAt || ""),
    description: String(body.description || ""),
    impactSummary: String(body.impactSummary || ""),
    rootCause: String(body.rootCause || ""),
    correctiveActions: String(body.correctiveActions || ""),
    authorityNotified: Boolean(body.authorityNotified),
    authorityNotifiedAt: String(body.authorityNotifiedAt || ""),
    seriousIncident: Boolean(body.seriousIncident),
    euArticleRef: String(body.euArticleRef || "Art. 73"),
    createdBy: session.userId,
  });
  await appendAuditLog({
    orgId: session.orgId,
    actorUserId: session.userId,
    action: "incident.created",
    entityType: "incident",
    entityId: rowId,
    detail: { seriousIncident: Boolean(body.seriousIncident) },
  });
  return NextResponse.json({ id: rowId });
}
