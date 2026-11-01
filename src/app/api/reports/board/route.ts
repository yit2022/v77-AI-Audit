import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db, ensureDb, schema } from "@/lib/db";
import { activeFrameworks, overallReadiness, readinessByFramework, topRisks } from "@/lib/compliance/dashboard";
import { buildBoardReportPdf } from "@/lib/reports/board-pdf";
import { listEvidenceRequests, summarizeExpiry } from "@/lib/evidence-requests/service";
import { getPartnerForUser } from "@/lib/partner/service";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();

  const orgs = await db.select().from(schema.organisations).where(eq(schema.organisations.id, session.orgId)).limit(1);
  const org = orgs[0];
  if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

  const systems = await db.select().from(schema.aiSystems).where(eq(schema.aiSystems.orgId, session.orgId));
  const systemIds = systems.map((s) => s.id);

  const assessments = systemIds.length
    ? await db.select().from(schema.assessments).where(inArray(schema.assessments.systemId, systemIds))
    : [];
  const assessmentIds = assessments.map((a) => a.id);

  let controlRows: Array<{
    status: string;
    euRef: string;
    nistRef: string;
    isoRef: string;
    gdprRef: string;
    doraRef: string;
    iso27001Ref: string;
  }> = [];
  if (assessmentIds.length) {
    controlRows = await db
      .select({
        status: schema.assessmentControls.status,
        euRef: schema.controls.euRef,
        nistRef: schema.controls.nistRef,
        isoRef: schema.controls.isoRef,
        gdprRef: schema.controls.gdprRef,
        doraRef: schema.controls.doraRef,
        iso27001Ref: schema.controls.iso27001Ref,
      })
      .from(schema.assessmentControls)
      .innerJoin(schema.controls, eq(schema.assessmentControls.controlId, schema.controls.id))
      .where(inArray(schema.assessmentControls.assessmentId, assessmentIds));
  }

  const findings = await db.select().from(schema.findings).where(eq(schema.findings.orgId, session.orgId));
  const openFindings = findings.filter((f) => f.status === "open" || f.status === "in_progress");
  const criticalFindings = openFindings.filter((f) => f.severity === "critical" || f.severity === "high");
  const evidence = await db.select().from(schema.evidenceItems).where(eq(schema.evidenceItems.orgId, session.orgId));
  const evidenceReqs = await listEvidenceRequests(session.orgId);
  const summary = summarizeExpiry(evidenceReqs);
  const scores = readinessByFramework(controlRows);
  const overall = overallReadiness(scores, activeFrameworks(controlRows));
  const partner = await getPartnerForUser(session.userId);

  const pdf = await buildBoardReportPdf({
    orgName: org.name,
    generatedAt: new Date(),
    overallReadiness: overall,
    frameworkScores: scores,
    openFindings: openFindings.length,
    criticalFindings: criticalFindings.length,
    systemsCount: systems.length,
    evidenceCount: evidence.length,
    overdueEvidenceRequests: summary.overdue,
    topRisks: topRisks(
      findings.map((f) => ({
        id: f.id,
        title: f.title,
        severity: f.severity,
        status: f.status,
        frameworkRef: f.frameworkRef,
        systemId: f.systemId || "",
      })),
      8,
    ).map((r) => ({ title: r.title, severity: r.severity })),
    partnerName: partner?.name,
    primaryColor: partner?.primaryColor || "#0F2A4A",
    accentColor: partner?.accentColor || "#6FCDF5",
  });

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="v77-board-report-${org.slug}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
