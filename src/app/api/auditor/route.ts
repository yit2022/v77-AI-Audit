import { NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { z } from "zod";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { id } from "@/lib/ids";
import { seedIfEmpty } from "@/lib/db/seed";
import { appendAuditLog } from "@/lib/audit/log";

const commentSchema = z.object({ assessmentId: z.string().uuid(), body: z.string().min(1) });
const signoffSchema = z.object({
  assessmentId: z.string().uuid(),
  opinion: z.enum(["pass", "pass_with_findings", "fail"]),
  summary: z.string().default(""),
});

export async function GET(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const assessmentId = new URL(req.url).searchParams.get("assessmentId");
  if (!assessmentId) return NextResponse.json({ error: "assessmentId required" }, { status: 400 });
  await ensureDb();

  const [assessmentRows, comments, signoffs] = await Promise.all([
    db
      .select()
      .from(schema.assessments)
      .where(and(eq(schema.assessments.id, assessmentId), eq(schema.assessments.orgId, session.orgId)))
      .limit(1),
    db
      .select({
        id: schema.auditorComments.id,
        body: schema.auditorComments.body,
        createdAt: schema.auditorComments.createdAt,
        authorName: schema.users.name,
      })
      .from(schema.auditorComments)
      .innerJoin(schema.users, eq(schema.auditorComments.authorUserId, schema.users.id))
      .where(eq(schema.auditorComments.assessmentId, assessmentId))
      .orderBy(desc(schema.auditorComments.createdAt)),
    db
      .select()
      .from(schema.auditorSignoffs)
      .where(eq(schema.auditorSignoffs.assessmentId, assessmentId))
      .limit(1),
  ]);

  const assessment = assessmentRows[0];
  if (!assessment) {
    return NextResponse.json({ comments, signoff: signoffs[0] ?? null });
  }

  const [
    sysRows,
    controls,
    evidence,
    findings,
    annexDocs,
    impacts,
    fairnessRuns,
    redteamRuns,
    evalRuns,
  ] = await Promise.all([
    db
      .select()
      .from(schema.aiSystems)
      .where(and(eq(schema.aiSystems.id, assessment.systemId), eq(schema.aiSystems.orgId, session.orgId)))
      .limit(1),
    db
      .select({
        id: schema.assessmentControls.id,
        status: schema.assessmentControls.status,
        notes: schema.assessmentControls.notes,
        code: schema.controls.code,
        title: schema.controls.title,
        euRef: schema.controls.euRef,
        gdprRef: schema.controls.gdprRef,
        doraRef: schema.controls.doraRef,
        isoRef: schema.controls.isoRef,
      })
      .from(schema.assessmentControls)
      .innerJoin(schema.controls, eq(schema.assessmentControls.controlId, schema.controls.id))
      .where(eq(schema.assessmentControls.assessmentId, assessmentId)),
    db
      .select()
      .from(schema.evidenceItems)
      .where(and(eq(schema.evidenceItems.systemId, assessment.systemId), eq(schema.evidenceItems.orgId, session.orgId)))
      .orderBy(desc(schema.evidenceItems.createdAt)),
    db
      .select()
      .from(schema.findings)
      .where(and(eq(schema.findings.systemId, assessment.systemId), eq(schema.findings.orgId, session.orgId)))
      .orderBy(desc(schema.findings.createdAt)),
    db
      .select()
      .from(schema.euAnnexDocs)
      .where(and(eq(schema.euAnnexDocs.systemId, assessment.systemId), eq(schema.euAnnexDocs.orgId, session.orgId)))
      .limit(1),
    db
      .select()
      .from(schema.impactAssessments)
      .where(and(eq(schema.impactAssessments.systemId, assessment.systemId), eq(schema.impactAssessments.orgId, session.orgId))),
    db
      .select()
      .from(schema.fairnessRuns)
      .where(and(eq(schema.fairnessRuns.systemId, assessment.systemId), eq(schema.fairnessRuns.orgId, session.orgId)))
      .orderBy(desc(schema.fairnessRuns.createdAt))
      .limit(1),
    db
      .select()
      .from(schema.redteamRuns)
      .where(and(eq(schema.redteamRuns.systemId, assessment.systemId), eq(schema.redteamRuns.orgId, session.orgId)))
      .orderBy(desc(schema.redteamRuns.createdAt))
      .limit(1),
    db
      .select()
      .from(schema.evalRuns)
      .where(and(eq(schema.evalRuns.systemId, assessment.systemId), eq(schema.evalRuns.orgId, session.orgId)))
      .orderBy(desc(schema.evalRuns.createdAt))
      .limit(1),
  ]);

  let annexSectionsDrafted = 0;
  if (annexDocs[0]?.answersJson) {
    try {
      const parsed = JSON.parse(annexDocs[0].answersJson) as Record<string, string>;
      annexSectionsDrafted = Object.values(parsed).filter((v) => v && v.trim().length > 0).length;
    } catch {
      annexSectionsDrafted = 0;
    }
  }

  return NextResponse.json({
    comments,
    signoff: signoffs[0] ?? null,
    dossier: {
      system: sysRows[0] ?? null,
      controls,
      evidence: evidence.map((e) => ({
        id: e.id,
        title: e.title,
        filename: e.filename,
        sha256: e.sha256,
        controlId: e.controlId,
      })),
      findings: findings.map((f) => ({
        id: f.id,
        title: f.title,
        severity: f.severity,
        status: f.status,
        frameworkRef: f.frameworkRef,
      })),
      annexSectionsDrafted,
      friaCount: impacts.filter((i) => i.templateId === "fria").length,
      dpiaCount: impacts.filter((i) => i.templateId === "dpia").length,
      latestFairness: fairnessRuns[0] ? { filename: fairnessRuns[0].filename } : null,
      latestRedteam: redteamRuns[0]
        ? { passCount: redteamRuns[0].passCount, failCount: redteamRuns[0].failCount, provider: redteamRuns[0].provider }
        : null,
      latestEval: evalRuns[0]
        ? { overallScore: evalRuns[0].overallScore, passCount: evalRuns[0].passCount, failCount: evalRuns[0].failCount }
        : null,
    },
  });
}

export async function POST(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await req.json().catch(() => null);
  await ensureDb();
  if (json?.action === "signoff") {
    if (session.role !== "auditor" && session.role !== "admin") {
      return NextResponse.json({ error: "Only auditors can sign off" }, { status: 403 });
    }
    const parsed = signoffSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    const existing = await db.select().from(schema.auditorSignoffs).where(eq(schema.auditorSignoffs.assessmentId, parsed.data.assessmentId)).limit(1);
    if (existing[0]) {
      await db.update(schema.auditorSignoffs).set({
        opinion: parsed.data.opinion, summary: parsed.data.summary,
        auditorUserId: session.userId, signedAt: new Date(),
      }).where(eq(schema.auditorSignoffs.id, existing[0].id));
    } else {
      await db.insert(schema.auditorSignoffs).values({
        id: id(), assessmentId: parsed.data.assessmentId, auditorUserId: session.userId,
        opinion: parsed.data.opinion, summary: parsed.data.summary,
      });
    }
    await db.update(schema.assessments).set({ status: "signed_off", updatedAt: new Date() }).where(eq(schema.assessments.id, parsed.data.assessmentId));
    await appendAuditLog({
      orgId: session.orgId,
      actorUserId: session.userId,
      action: "auditor.signoff",
      entityType: "assessment",
      entityId: parsed.data.assessmentId,
      detail: { opinion: parsed.data.opinion, summary: parsed.data.summary },
    });
    return NextResponse.json({ ok: true });
  }
  const parsed = commentSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await db.insert(schema.auditorComments).values({
    id: id(), orgId: session.orgId, assessmentId: parsed.data.assessmentId,
    authorUserId: session.userId, body: parsed.data.body,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
