import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getImpactTemplate, validateImpactAnswers } from "@/lib/impact/templates";
import { synthesizeImpactAnswers } from "@/lib/impact/autofill";
import { id } from "@/lib/ids";
import { seedIfEmpty } from "@/lib/db/seed";

export async function GET() {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const rows = await db
    .select()
    .from(schema.impactAssessments)
    .where(eq(schema.impactAssessments.orgId, session.orgId))
    .orderBy(desc(schema.impactAssessments.updatedAt));
  return NextResponse.json({ items: rows, templates: ["fria", "dpia"] });
}

const createSchema = z.object({
  systemId: z.string().uuid(),
  templateId: z.enum(["fria", "dpia"]),
  title: z.string().min(1).max(200).optional(),
});

export async function POST(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const template = getImpactTemplate(parsed.data.templateId);
  if (!template) return NextResponse.json({ error: "Unknown template" }, { status: 400 });
  await ensureDb();
  const systems = await db
    .select()
    .from(schema.aiSystems)
    .where(and(eq(schema.aiSystems.id, parsed.data.systemId), eq(schema.aiSystems.orgId, session.orgId)))
    .limit(1);
  if (!systems[0]) return NextResponse.json({ error: "System not found" }, { status: 404 });

  const impactId = id();
  const title = parsed.data.title || `${template.name} — ${systems[0].name}`;
  await db.insert(schema.impactAssessments).values({
    id: impactId,
    orgId: session.orgId,
    systemId: parsed.data.systemId,
    templateId: template.id,
    title,
    status: "draft",
    createdBy: session.userId,
  });
  await db.insert(schema.impactAnswers).values(
    template.questions.map((q) => ({
      id: id(),
      impactId,
      questionId: q.id,
      answer: "",
    })),
  );
  return NextResponse.json({ id: impactId }, { status: 201 });
}

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["draft", "in_review", "complete"]).optional(),
  answers: z.record(z.string(), z.string()).optional(),
  autofill: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await ensureDb();
  const rows = await db
    .select()
    .from(schema.impactAssessments)
    .where(and(eq(schema.impactAssessments.id, parsed.data.id), eq(schema.impactAssessments.orgId, session.orgId)))
    .limit(1);
  const impact = rows[0];
  if (!impact) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let answersToSave = parsed.data.answers;
  if (parsed.data.autofill) {
    const sysRows = await db
      .select()
      .from(schema.aiSystems)
      .where(and(eq(schema.aiSystems.id, impact.systemId), eq(schema.aiSystems.orgId, session.orgId)))
      .limit(1);
    const sys = sysRows[0];
    if (sys) {
      const [fairRows, rtRows, evRows] = await Promise.all([
        db
          .select()
          .from(schema.fairnessRuns)
          .where(and(eq(schema.fairnessRuns.systemId, sys.id), eq(schema.fairnessRuns.orgId, session.orgId)))
          .orderBy(desc(schema.fairnessRuns.createdAt))
          .limit(1),
        db
          .select()
          .from(schema.redteamRuns)
          .where(and(eq(schema.redteamRuns.systemId, sys.id), eq(schema.redteamRuns.orgId, session.orgId)))
          .orderBy(desc(schema.redteamRuns.createdAt))
          .limit(1),
        db
          .select()
          .from(schema.evalRuns)
          .where(and(eq(schema.evalRuns.systemId, sys.id), eq(schema.evalRuns.orgId, session.orgId)))
          .orderBy(desc(schema.evalRuns.createdAt))
          .limit(1),
      ]);
      let fairnessSummary: string | undefined;
      if (fairRows[0]?.metricsJson) {
        try {
          const fm = JSON.parse(fairRows[0].metricsJson) as {
            demographicParityDifference?: number;
            equalizedOddsDifference?: number;
          };
          fairnessSummary = `Demographic Parity Δ=${fm.demographicParityDifference ?? "N/A"}, Equalized Odds Δ=${fm.equalizedOddsDifference ?? "N/A"} (${fairRows[0].filename})`;
        } catch {
          fairnessSummary = `Evaluated (${fairRows[0].filename})`;
        }
      }
      answersToSave = synthesizeImpactAnswers({
        templateId: (impact.templateId === "dpia" ? "dpia" : "fria"),
        orgName: session.orgName,
        system: sys,
        fairnessSummary,
        redteamSummary: rtRows[0]
          ? `${rtRows[0].passCount} passed / ${rtRows[0].failCount} failed (${rtRows[0].provider})`
          : undefined,
        evalSummary: evRows[0]
          ? `Score ${(Number(evRows[0].overallScore) * 100).toFixed(0)}% (${evRows[0].passCount}/${evRows[0].passCount + evRows[0].failCount} passed)`
          : undefined,
      });
    }
  }

  if (answersToSave) {
    if (parsed.data.status === "complete" || impact.status === "complete") {
      const check = validateImpactAnswers(impact.templateId, {
        ...Object.fromEntries(
          (await db.select().from(schema.impactAnswers).where(eq(schema.impactAnswers.impactId, impact.id))).map(
            (a) => [a.questionId, a.answer],
          ),
        ),
        ...answersToSave,
      });
      if (parsed.data.status === "complete" && !check.ok) {
        return NextResponse.json({ error: "Missing required answers", missing: check.missing }, { status: 400 });
      }
    }
    for (const [questionId, answer] of Object.entries(answersToSave)) {
      const existing = await db
        .select()
        .from(schema.impactAnswers)
        .where(and(eq(schema.impactAnswers.impactId, impact.id), eq(schema.impactAnswers.questionId, questionId)))
        .limit(1);
      if (existing[0]) {
        await db
          .update(schema.impactAnswers)
          .set({ answer })
          .where(eq(schema.impactAnswers.id, existing[0].id));
      } else {
        await db.insert(schema.impactAnswers).values({ id: id(), impactId: impact.id, questionId, answer });
      }
    }
  }

  if (parsed.data.status) {
    if (parsed.data.status === "complete") {
      const answers = await db.select().from(schema.impactAnswers).where(eq(schema.impactAnswers.impactId, impact.id));
      const map = Object.fromEntries(answers.map((a) => [a.questionId, a.answer]));
      const check = validateImpactAnswers(impact.templateId, map);
      if (!check.ok) {
        return NextResponse.json({ error: "Missing required answers", missing: check.missing }, { status: 400 });
      }
    }
    await db
      .update(schema.impactAssessments)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(eq(schema.impactAssessments.id, impact.id));
  } else {
    await db
      .update(schema.impactAssessments)
      .set({ updatedAt: new Date() })
      .where(eq(schema.impactAssessments.id, impact.id));
  }

  return NextResponse.json({ ok: true, answers: answersToSave });
}
