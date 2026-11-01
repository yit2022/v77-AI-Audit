import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { isReadOnly } from "@/lib/auth/rbac";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const systemId = req.nextUrl.searchParams.get("systemId");
  await ensureDb();
  if (systemId) {
    const rows = await db
      .select()
      .from(schema.modelCards)
      .where(and(eq(schema.modelCards.orgId, session.orgId), eq(schema.modelCards.systemId, systemId)))
      .limit(1);
    return NextResponse.json({ card: rows[0] || null });
  }
  const rows = await db.select().from(schema.modelCards).where(eq(schema.modelCards.orgId, session.orgId));
  return NextResponse.json({ cards: rows });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isReadOnly(session.role)) return NextResponse.json({ error: "Auditors are read-only" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as Record<string, string>;
  if (!body.systemId) return NextResponse.json({ error: "systemId required" }, { status: 400 });
  await ensureDb();
  const existing = await db
    .select()
    .from(schema.modelCards)
    .where(and(eq(schema.modelCards.orgId, session.orgId), eq(schema.modelCards.systemId, body.systemId)))
    .limit(1);
  const fields = {
    version: body.version || "1.0",
    intendedUse: body.intendedUse || "",
    outOfScope: body.outOfScope || "",
    trainingDataSummary: body.trainingDataSummary || "",
    evaluationSummary: body.evaluationSummary || "",
    ethicalConsiderations: body.ethicalConsiderations || "",
    limitations: body.limitations || "",
    caveats: body.caveats || "",
    contact: body.contact || "",
    updatedBy: session.userId,
    updatedAt: new Date(),
  };
  if (existing[0]) {
    await db.update(schema.modelCards).set(fields).where(eq(schema.modelCards.id, existing[0].id));
    return NextResponse.json({ id: existing[0].id });
  }
  const rowId = id();
  await db.insert(schema.modelCards).values({ id: rowId, orgId: session.orgId, systemId: body.systemId, ...fields });
  return NextResponse.json({ id: rowId });
}
