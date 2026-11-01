import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { id } from "@/lib/ids";
import { controlsForTier } from "@/lib/crosswalk";
import { seedIfEmpty } from "@/lib/db/seed";

export async function GET() {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const rows = await db.select({
    assessment: schema.assessments, systemName: schema.aiSystems.name, riskTier: schema.aiSystems.riskTier,
  }).from(schema.assessments)
    .innerJoin(schema.aiSystems, eq(schema.assessments.systemId, schema.aiSystems.id))
    .where(eq(schema.assessments.orgId, session.orgId))
    .orderBy(desc(schema.assessments.createdAt));
  return NextResponse.json({ assessments: rows });
}

const patchSchema = z.object({
  assessmentControlId: z.string().uuid(),
  status: z.enum(["not_started", "in_progress", "implemented", "not_applicable", "waived"]).optional(),
  notes: z.string().optional(),
});

export async function PATCH(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await ensureDb();
  await db.update(schema.assessmentControls).set({
    ...(parsed.data.status ? { status: parsed.data.status } : {}),
    ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
  }).where(eq(schema.assessmentControls.id, parsed.data.assessmentControlId));
  return NextResponse.json({ ok: true });
}

const createSchema = z.object({ systemId: z.string().uuid(), name: z.string().min(1) });

export async function POST(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await ensureDb();
  const systems = await db.select().from(schema.aiSystems).where(eq(schema.aiSystems.id, parsed.data.systemId)).limit(1);
  const system = systems[0];
  if (!system || system.orgId !== session.orgId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const assessmentId = id();
  await db.insert(schema.assessments).values({
    id: assessmentId, orgId: session.orgId, systemId: system.id, name: parsed.data.name, status: "draft",
  });
  const applicable = controlsForTier(system.riskTier ?? "minimal");
  await db.insert(schema.assessmentControls).values(
    applicable.map((c) => ({
      id: id(), assessmentId, controlId: c.id, status: "not_started", ownerUserId: session.userId,
    })),
  );
  return NextResponse.json({ id: assessmentId }, { status: 201 });
}
