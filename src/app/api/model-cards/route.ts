import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { isReadOnly } from "@/lib/auth/rbac";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";
import { synthesizeModelCardFromTelemetry } from "@/lib/model-cards";

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

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isReadOnly(session.role)) return NextResponse.json({ error: "Auditors are read-only" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { systemId?: string; overwrite?: boolean };
  if (!body.systemId) return NextResponse.json({ error: "systemId required" }, { status: 400 });
  await ensureDb();

  const sysRows = await db
    .select()
    .from(schema.aiSystems)
    .where(and(eq(schema.aiSystems.id, body.systemId), eq(schema.aiSystems.orgId, session.orgId)))
    .limit(1);
  const sys = sysRows[0];
  if (!sys) return NextResponse.json({ error: "System not found" }, { status: 404 });

  const [fairRows, rtRows, evRows, impactRows, existingRows] = await Promise.all([
    db
      .select()
      .from(schema.fairnessRuns)
      .where(and(eq(schema.fairnessRuns.systemId, sys.id), eq(schema.fairnessRuns.orgId, session.orgId)))
      .orderBy(desc(schema.fairnessRuns.createdAt))
      .limit(3),
    db
      .select()
      .from(schema.redteamRuns)
      .where(and(eq(schema.redteamRuns.systemId, sys.id), eq(schema.redteamRuns.orgId, session.orgId)))
      .orderBy(desc(schema.redteamRuns.createdAt))
      .limit(3),
    db
      .select()
      .from(schema.evalRuns)
      .where(and(eq(schema.evalRuns.systemId, sys.id), eq(schema.evalRuns.orgId, session.orgId)))
      .orderBy(desc(schema.evalRuns.createdAt))
      .limit(3),
    db
      .select()
      .from(schema.impactAssessments)
      .where(and(eq(schema.impactAssessments.systemId, sys.id), eq(schema.impactAssessments.orgId, session.orgId))),
    db
      .select()
      .from(schema.modelCards)
      .where(and(eq(schema.modelCards.orgId, session.orgId), eq(schema.modelCards.systemId, sys.id)))
      .limit(1),
  ]);

  let classificationReasons: string[] = [];
  if (sys.classificationNotes) {
    classificationReasons = sys.classificationNotes.split("; ").filter(Boolean);
  }

  const synthesized = synthesizeModelCardFromTelemetry({
    system: {
      id: sys.id,
      name: sys.name,
      description: sys.description,
      purpose: sys.intendedPurpose,
      domain: sys.domain,
      riskTier: sys.riskTier,
      roleInValueChain: sys.roleInValueChain,
      lifecycleStatus: sys.lifecycleStatus,
      ownerEmail: session.email,
    },
    classificationReasons,
    fairnessRuns: fairRows,
    redteamRuns: rtRows,
    evalRuns: evRows,
    impactAssessments: impactRows,
    existing: body.overwrite ? undefined : existingRows[0] || undefined,
  });

  const fields = {
    ...synthesized,
    updatedBy: session.userId,
    updatedAt: new Date(),
  };

  if (existingRows[0]) {
    await db.update(schema.modelCards).set(fields).where(eq(schema.modelCards.id, existingRows[0].id));
  } else {
    await db.insert(schema.modelCards).values({ id: id(), orgId: session.orgId, systemId: sys.id, ...fields });
  }

  return NextResponse.json({ card: synthesized });
}
