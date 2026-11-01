import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { classifyAiSystem, CLASSIFICATION_QUESTIONS } from "@/lib/classification";
import { controlsForTier } from "@/lib/crosswalk";
import { id } from "@/lib/ids";
import { seedIfEmpty } from "@/lib/db/seed";

export async function GET() {
  return NextResponse.json({ questions: CLASSIFICATION_QUESTIONS });
}

const submitSchema = z.object({
  systemId: z.string().uuid(),
  answers: z.record(z.enum(["yes", "no", "na"])),
  createAssessment: z.boolean().optional(),
});

export async function POST(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = submitSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  await ensureDb();
  const systems = await db.select().from(schema.aiSystems).where(eq(schema.aiSystems.id, parsed.data.systemId)).limit(1);
  const system = systems[0];
  if (!system || system.orgId !== session.orgId) return NextResponse.json({ error: "System not found" }, { status: 404 });
  const result = classifyAiSystem(parsed.data.answers);
  await db.delete(schema.classificationAnswers).where(eq(schema.classificationAnswers.systemId, system.id));
  await db.insert(schema.classificationAnswers).values(
    Object.entries(parsed.data.answers).map(([questionId, answer]) => ({
      id: id(), systemId: system.id, questionId, answer, rationale: "",
    })),
  );
  await db.update(schema.aiSystems).set({
    riskTier: result.tier, gpai: result.gpai,
    classificationNotes: result.reasons.join(" "), updatedAt: new Date(),
  }).where(eq(schema.aiSystems.id, system.id));

  let assessmentId: string | null = null;
  if (parsed.data.createAssessment !== false) {
    assessmentId = id();
    await db.insert(schema.assessments).values({
      id: assessmentId, orgId: session.orgId, systemId: system.id,
      name: `${system.name} — ${result.tier} assessment`, status: "draft",
    });
    const applicable = controlsForTier(result.tier);
    if (applicable.length) {
      await db.insert(schema.assessmentControls).values(
        applicable.map((c) => ({
          id: id(), assessmentId: assessmentId!, controlId: c.id,
          status: "not_started", ownerUserId: session.userId,
        })),
      );
    }
  }
  return NextResponse.json({ result, assessmentId });
}
