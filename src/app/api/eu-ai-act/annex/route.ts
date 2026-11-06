import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { id } from "@/lib/ids";
import { synthesizeAnnexIvFromTelemetry } from "@/lib/eu-ai-act/annex-iv";

export async function GET(req: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const systemId = new URL(req.url).searchParams.get("systemId");
  if (!systemId) return NextResponse.json({ error: "systemId required" }, { status: 400 });
  const rows = await db
    .select()
    .from(schema.euAnnexDocs)
    .where(and(eq(schema.euAnnexDocs.orgId, session.orgId), eq(schema.euAnnexDocs.systemId, systemId)))
    .limit(1);
  return NextResponse.json({ doc: rows[0] ?? null });
}

const putSchema = z.object({
  systemId: z.string().uuid(),
  answers: z.record(z.string(), z.string()),
});

export async function PUT(req: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "auditor") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = putSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const system = await db
    .select()
    .from(schema.aiSystems)
    .where(and(eq(schema.aiSystems.id, parsed.data.systemId), eq(schema.aiSystems.orgId, session.orgId)))
    .limit(1);
  if (!system[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await db
    .select()
    .from(schema.euAnnexDocs)
    .where(and(eq(schema.euAnnexDocs.orgId, session.orgId), eq(schema.euAnnexDocs.systemId, parsed.data.systemId)))
    .limit(1);
  const now = new Date();
  const answersJson = JSON.stringify(parsed.data.answers);
  if (existing[0]) {
    await db
      .update(schema.euAnnexDocs)
      .set({ answersJson, updatedAt: now })
      .where(eq(schema.euAnnexDocs.id, existing[0].id));
    return NextResponse.json({ ok: true, id: existing[0].id });
  }
  const docId = id();
  await db.insert(schema.euAnnexDocs).values({
    id: docId,
    orgId: session.orgId,
    systemId: parsed.data.systemId,
    answersJson,
    updatedAt: now,
    createdAt: now,
  });
  return NextResponse.json({ ok: true, id: docId }, { status: 201 });
}

const autofillSchema = z.object({
  systemId: z.string().uuid(),
});

export async function POST(req: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "auditor") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = autofillSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const systems = await db
    .select()
    .from(schema.aiSystems)
    .where(and(eq(schema.aiSystems.id, parsed.data.systemId), eq(schema.aiSystems.orgId, session.orgId)))
    .limit(1);
  const system = systems[0];
  if (!system) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const assessments = await db
    .select()
    .from(schema.assessments)
    .where(and(eq(schema.assessments.systemId, system.id), eq(schema.assessments.orgId, session.orgId)))
    .orderBy(desc(schema.assessments.createdAt))
    .limit(1);
  const assessment = assessments[0];

  let controlRows: Array<{ code: string; title: string; status: string; euRef: string; isoRef: string }> = [];
  if (assessment) {
    controlRows = await db
      .select({
        code: schema.controls.code,
        title: schema.controls.title,
        status: schema.assessmentControls.status,
        euRef: schema.controls.euRef,
        isoRef: schema.controls.isoRef,
      })
      .from(schema.assessmentControls)
      .innerJoin(schema.controls, eq(schema.assessmentControls.controlId, schema.controls.id))
      .where(eq(schema.assessmentControls.assessmentId, assessment.id));
  }

  const findingRows = await db
    .select()
    .from(schema.findings)
    .where(and(eq(schema.findings.orgId, session.orgId), eq(schema.findings.systemId, system.id)));
  const fairness = await db
    .select()
    .from(schema.fairnessRuns)
    .where(and(eq(schema.fairnessRuns.orgId, session.orgId), eq(schema.fairnessRuns.systemId, system.id)))
    .orderBy(desc(schema.fairnessRuns.createdAt))
    .limit(1);
  const redteam = await db
    .select()
    .from(schema.redteamRuns)
    .where(and(eq(schema.redteamRuns.orgId, session.orgId), eq(schema.redteamRuns.systemId, system.id)))
    .orderBy(desc(schema.redteamRuns.createdAt))
    .limit(1);
  const evals = await db
    .select()
    .from(schema.evalRuns)
    .where(and(eq(schema.evalRuns.orgId, session.orgId), eq(schema.evalRuns.systemId, system.id)))
    .orderBy(desc(schema.evalRuns.createdAt))
    .limit(1);

  let fairnessSummary: string | undefined;
  if (fairness[0]) {
    try {
      const m = JSON.parse(fairness[0].metricsJson);
      fairnessSummary = `Latest run (${fairness[0].filename}): Demographic Parity Δ = ${Number(m.demographicParityDifference ?? 0).toFixed(3)}, Four-Fifths Ratio = ${Number(m.demographicParityRatio ?? 1).toFixed(3)}, Equalized Odds Δ = ${Number(m.equalizedOddsDifference ?? 0).toFixed(3)}, Accuracy = ${(Number(m.overallAccuracy ?? 0) * 100).toFixed(1)}%.`;
    } catch {
      fairnessSummary = undefined;
    }
  }

  const redteamSummary = redteam[0]
    ? `Latest run (${redteam[0].provider}): ${redteam[0].passCount} passed / ${redteam[0].failCount} failed.`
    : undefined;
  const evalSummary = evals[0]
    ? `Latest run (${evals[0].provider}): Overall score ${(Number(evals[0].overallScore) * 100).toFixed(0)}% (${evals[0].passCount} passed / ${evals[0].failCount} failed).`
    : undefined;

  const drafted = synthesizeAnnexIvFromTelemetry({
    orgName: session.orgName,
    system,
    controls: controlRows,
    findings: findingRows.map((f) => ({ title: f.title, severity: f.severity, status: f.status })),
    fairnessSummary,
    redteamSummary,
    evalSummary,
  });

  const existing = await db
    .select()
    .from(schema.euAnnexDocs)
    .where(and(eq(schema.euAnnexDocs.orgId, session.orgId), eq(schema.euAnnexDocs.systemId, system.id)))
    .limit(1);
  const now = new Date();
  const answersJson = JSON.stringify(drafted);
  if (existing[0]) {
    await db
      .update(schema.euAnnexDocs)
      .set({ answersJson, updatedAt: now })
      .where(eq(schema.euAnnexDocs.id, existing[0].id));
  } else {
    await db.insert(schema.euAnnexDocs).values({
      id: id(),
      orgId: session.orgId,
      systemId: system.id,
      answersJson,
      updatedAt: now,
      createdAt: now,
    });
  }

  return NextResponse.json({ ok: true, answers: drafted });
}
