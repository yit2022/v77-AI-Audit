import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { authenticateApiKey } from "@/lib/auth/api-key";
import { getSession } from "@/lib/auth/session";
import { evaluateComplianceGate } from "@/lib/compliance/gate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureDb();
  const apiKeyAuth = await authenticateApiKey(req.headers.get("authorization"));
  const session = apiKeyAuth ? null : await getSession();
  const orgId = apiKeyAuth?.orgId ?? session?.orgId;
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const systemId = url.searchParams.get("systemId");
  const strict = url.searchParams.get("strict") === "true";
  const minReadiness = Number(url.searchParams.get("minReadiness") || "70");

  if (!systemId) {
    return NextResponse.json({ error: "systemId query parameter is required" }, { status: 400 });
  }

  const systems = await db
    .select()
    .from(schema.aiSystems)
    .where(and(eq(schema.aiSystems.id, systemId), eq(schema.aiSystems.orgId, orgId)))
    .limit(1);
  const system = systems[0];
  if (!system) {
    return NextResponse.json({ error: "AI system not found" }, { status: 404 });
  }

  const assessments = await db
    .select()
    .from(schema.assessments)
    .where(and(eq(schema.assessments.systemId, system.id), eq(schema.assessments.orgId, orgId)))
    .orderBy(desc(schema.assessments.createdAt))
    .limit(1);
  const assessment = assessments[0];

  let controlsTotal = 0;
  let controlsImplemented = 0;
  if (assessment) {
    const rows = await db
      .select({ status: schema.assessmentControls.status })
      .from(schema.assessmentControls)
      .where(eq(schema.assessmentControls.assessmentId, assessment.id));
    const applicable = rows.filter((r) => r.status !== "not_applicable");
    controlsTotal = applicable.length;
    controlsImplemented = applicable.filter((r) => r.status === "implemented").length;
  }

  const findingRows = await db
    .select()
    .from(schema.findings)
    .where(and(eq(schema.findings.orgId, orgId), eq(schema.findings.systemId, system.id)));
  const openCriticalOrHighFindings = findingRows.filter(
    (f) => (f.status === "open" || f.status === "in_progress") && (f.severity === "high" || f.severity === "critical"),
  ).length;

  const annexRows = await db
    .select()
    .from(schema.euAnnexDocs)
    .where(and(eq(schema.euAnnexDocs.orgId, orgId), eq(schema.euAnnexDocs.systemId, system.id)))
    .limit(1);
  const hasAnnexIvDraft = Boolean(annexRows[0] && annexRows[0].answersJson && annexRows[0].answersJson !== "{}");

  const redteamRows = await db
    .select()
    .from(schema.redteamRuns)
    .where(and(eq(schema.redteamRuns.orgId, orgId), eq(schema.redteamRuns.systemId, system.id)))
    .orderBy(desc(schema.redteamRuns.createdAt))
    .limit(1);

  const gate = evaluateComplianceGate({
    system,
    controlsTotal,
    controlsImplemented,
    openCriticalOrHighFindings,
    hasAnnexIvDraft,
    latestRedteamFailCount: redteamRows[0]?.failCount ?? null,
    minReadinessPercent: Number.isFinite(minReadiness) ? minReadiness : 70,
  });

  return NextResponse.json(gate, { status: strict && !gate.passed ? 422 : 200 });
}
