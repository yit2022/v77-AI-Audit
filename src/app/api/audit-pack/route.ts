import { NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { buildAuditReportPdf } from "@/lib/reports/pdf";
import { buildAuditPackZip } from "@/lib/audit-pack/build";
import {
  buildEuDatabaseRegistrationPayload,
  renderAnnexIvMarkdown,
  renderEuDeclarationOfConformity,
  synthesizeAnnexIvFromTelemetry,
} from "@/lib/eu-ai-act/annex-iv";
import { appendAuditLog } from "@/lib/audit/log";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const systemId = new URL(req.url).searchParams.get("systemId");
  if (!systemId) return NextResponse.json({ error: "systemId required" }, { status: 400 });

  const systems = await db
    .select()
    .from(schema.aiSystems)
    .where(and(eq(schema.aiSystems.id, systemId), eq(schema.aiSystems.orgId, session.orgId)))
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

  let pdfBytes: Uint8Array | null = null;
  if (assessment) {
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
    const evidenceForPdf = await db
      .select()
      .from(schema.evidenceItems)
      .where(eq(schema.evidenceItems.systemId, system.id));
    const findingRows = await db.select().from(schema.findings).where(eq(schema.findings.systemId, system.id));
    const fairness = await db.select().from(schema.fairnessRuns).where(eq(schema.fairnessRuns.systemId, system.id));
    const redteam = await db.select().from(schema.redteamRuns).where(eq(schema.redteamRuns.systemId, system.id));
    const so = await db
      .select()
      .from(schema.auditorSignoffs)
      .where(eq(schema.auditorSignoffs.assessmentId, assessment.id))
      .limit(1);
    try {
      pdfBytes = await buildAuditReportPdf({
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
        evidence: evidenceForPdf.map((e) => ({
          title: e.title,
          filename: e.filename,
          sha256: e.sha256,
        })),
        auditorOpinion: so[0]?.opinion ?? null,
        auditorSummary: so[0]?.summary ?? null,
        generatedAt: new Date(),
      });
    } catch {
      pdfBytes = null;
    }
  }

  const evidence = await db
    .select()
    .from(schema.evidenceItems)
    .where(and(eq(schema.evidenceItems.orgId, session.orgId), eq(schema.evidenceItems.systemId, system.id)));
  const findings = await db.select().from(schema.findings).where(eq(schema.findings.systemId, system.id));
  const annex = await db
    .select()
    .from(schema.euAnnexDocs)
    .where(and(eq(schema.euAnnexDocs.orgId, session.orgId), eq(schema.euAnnexDocs.systemId, system.id)))
    .limit(1);

  const fairnessRuns = await db
    .select()
    .from(schema.fairnessRuns)
    .where(and(eq(schema.fairnessRuns.orgId, session.orgId), eq(schema.fairnessRuns.systemId, system.id)))
    .orderBy(desc(schema.fairnessRuns.createdAt));
  const redteamRuns = await db
    .select()
    .from(schema.redteamRuns)
    .where(and(eq(schema.redteamRuns.orgId, session.orgId), eq(schema.redteamRuns.systemId, system.id)))
    .orderBy(desc(schema.redteamRuns.createdAt));
  const evalRuns = await db
    .select()
    .from(schema.evalRuns)
    .where(and(eq(schema.evalRuns.orgId, session.orgId), eq(schema.evalRuns.systemId, system.id)))
    .orderBy(desc(schema.evalRuns.createdAt));
  const impacts = await db
    .select()
    .from(schema.impactAssessments)
    .where(and(eq(schema.impactAssessments.orgId, session.orgId), eq(schema.impactAssessments.systemId, system.id)))
    .orderBy(desc(schema.impactAssessments.createdAt));

  let annexAnswers: Record<string, string> = {};
  if (annex[0]) {
    try {
      annexAnswers = JSON.parse(annex[0].answersJson || "{}") as Record<string, string>;
    } catch {
      annexAnswers = {};
    }
  }
  if (Object.keys(annexAnswers).length === 0) {
    annexAnswers = synthesizeAnnexIvFromTelemetry({
      orgName: session.orgName,
      system,
      findings: findings.map((f) => ({ title: f.title, severity: f.severity, status: f.status })),
    });
  }

  const annexMarkdown = renderAnnexIvMarkdown({
    systemName: system.name,
    role: system.roleInValueChain,
    riskTier: system.riskTier || "unclassified",
    answers: annexAnswers,
  });

  const declarationOfConformityMarkdown = renderEuDeclarationOfConformity({
    orgName: session.orgName,
    systemId: system.id,
    systemName: system.name,
    versionLabel: system.versionLabel,
    intendedPurpose: system.intendedPurpose || system.description,
    riskTier: system.riskTier,
    euDatabaseId: system.euDatabaseId,
  });

  const euDatabaseRegistrationJson = buildEuDatabaseRegistrationPayload({
    orgName: session.orgName,
    system,
  });

  const zip = await buildAuditPackZip({
    orgName: session.orgName,
    system: {
      id: system.id,
      name: system.name,
      riskTier: system.riskTier,
      roleInValueChain: system.roleInValueChain,
      description: system.description,
      intendedPurpose: system.intendedPurpose,
      domain: system.domain,
      versionLabel: system.versionLabel,
      euDatabaseId: system.euDatabaseId,
      classificationNotes: system.classificationNotes,
    },
    pdfBytes,
    evidence: evidence.map((e) => ({
      id: e.id,
      filename: e.filename,
      sha256: e.sha256,
      createdAt: new Date(e.createdAt).toISOString(),
    })),
    findings: findings.map((f) => ({ title: f.title, severity: f.severity, status: f.status })),
    annexMarkdown,
    declarationOfConformityMarkdown,
    euDatabaseRegistrationJson,
    impactAssessments: impacts.map((imp) => ({
      id: imp.id,
      templateId: imp.templateId,
      title: imp.title,
      status: imp.status,
      updatedAt: new Date(imp.updatedAt).toISOString(),
    })),
    technicalTests: {
      fairnessRunCount: fairnessRuns.length,
      redteamRunCount: redteamRuns.length,
      evalRunCount: evalRuns.length,
      latestRedteam: redteamRuns[0]
        ? { provider: redteamRuns[0].provider, passCount: redteamRuns[0].passCount, failCount: redteamRuns[0].failCount }
        : null,
      latestEval: evalRuns[0]
        ? { provider: evalRuns[0].provider, overallScore: evalRuns[0].overallScore, passCount: evalRuns[0].passCount, failCount: evalRuns[0].failCount }
        : null,
    },
  });

  await appendAuditLog({
    orgId: session.orgId,
    actorUserId: session.userId,
    action: "audit_pack.export",
    entityType: "ai_system",
    entityId: system.id,
    detail: { bytes: zip.byteLength, evidenceCount: evidence.length },
  });

  return new NextResponse(Buffer.from(zip), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="v77-audit-pack-${system.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 40)}.zip"`,
    },
  });
}
