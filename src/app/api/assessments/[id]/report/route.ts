import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { buildAuditReportPdf } from "@/lib/reports/pdf";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await ensureDb();

  const assessments = await db
    .select()
    .from(schema.assessments)
    .where(and(eq(schema.assessments.id, id), eq(schema.assessments.orgId, session.orgId)))
    .limit(1);
  const assessment = assessments[0];
  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const systems = await db
    .select()
    .from(schema.aiSystems)
    .where(eq(schema.aiSystems.id, assessment.systemId))
    .limit(1);
  const system = systems[0];
  if (!system) return NextResponse.json({ error: "System missing" }, { status: 404 });

  const controlRows = await db
    .select({
      status: schema.assessmentControls.status,
      code: schema.controls.code,
      title: schema.controls.title,
      euRef: schema.controls.euRef,
      nistRef: schema.controls.nistRef,
      isoRef: schema.controls.isoRef,
      gdprRef: schema.controls.gdprRef,
    })
    .from(schema.assessmentControls)
    .innerJoin(schema.controls, eq(schema.assessmentControls.controlId, schema.controls.id))
    .where(eq(schema.assessmentControls.assessmentId, assessment.id));

  const evidence = await db
    .select()
    .from(schema.evidenceItems)
    .where(eq(schema.evidenceItems.systemId, system.id));

  const fairness = await db
    .select()
    .from(schema.fairnessRuns)
    .where(eq(schema.fairnessRuns.systemId, system.id));

  const redteam = await db
    .select()
    .from(schema.redteamRuns)
    .where(eq(schema.redteamRuns.systemId, system.id));

  const findingRows = await db
    .select()
    .from(schema.findings)
    .where(eq(schema.findings.systemId, system.id));

  const so = await db
    .select()
    .from(schema.auditorSignoffs)
    .where(eq(schema.auditorSignoffs.assessmentId, assessment.id))
    .limit(1);

  let pdf: Uint8Array;
  try {
  pdf = await buildAuditReportPdf({
    orgName: session.orgName,
    systemName: system.name,
    systemDescription: system.description,
    riskTier: system.riskTier,
    intendedPurpose: system.intendedPurpose,
    roleInValueChain: system.roleInValueChain,
    gpai: system.gpai,
    classificationNotes: system.classificationNotes ?? "",
    assessmentName: assessment.name,
    assessmentStatus: assessment.status,
    controls: controlRows,
    findings: findingRows.map((f) => ({
      title: f.title,
      severity: f.severity,
      status: f.status,
      frameworkRef: f.frameworkRef,
    })),
    fairnessRunCount: fairness.length,
    redteamSummary: redteam[0]
      ? `${redteam.length} run(s); latest pass ${redteam[0].passCount} / fail ${redteam[0].failCount}`
      : "0 runs",
    evidence: evidence.map((e) => ({
      title: e.title,
      filename: e.filename,
      sha256: e.sha256,
    })),
    auditorOpinion: so[0]?.opinion ?? null,
    auditorSummary: so[0]?.summary ?? null,
    generatedAt: new Date(),
  });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const filename = `v77-audit-${system.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;
  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
