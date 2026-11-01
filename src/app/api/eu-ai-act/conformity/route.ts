import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { id } from "@/lib/ids";

export async function GET(req: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const systemId = new URL(req.url).searchParams.get("systemId");
  if (!systemId) return NextResponse.json({ error: "systemId required" }, { status: 400 });
  const rows = await db
    .select()
    .from(schema.euConformitySteps)
    .where(and(eq(schema.euConformitySteps.orgId, session.orgId), eq(schema.euConformitySteps.systemId, systemId)));
  return NextResponse.json({ steps: rows });
}

const patchSchema = z.object({
  systemId: z.string().uuid(),
  stepId: z.string().min(1),
  status: z.enum(["not_started", "in_progress", "done", "blocked"]),
  notes: z.string().max(4000).optional(),
});

export async function PATCH(req: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "auditor") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const system = await db
    .select()
    .from(schema.aiSystems)
    .where(and(eq(schema.aiSystems.id, parsed.data.systemId), eq(schema.aiSystems.orgId, session.orgId)))
    .limit(1);
  if (!system[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await db
    .select()
    .from(schema.euConformitySteps)
    .where(
      and(
        eq(schema.euConformitySteps.orgId, session.orgId),
        eq(schema.euConformitySteps.systemId, parsed.data.systemId),
        eq(schema.euConformitySteps.stepId, parsed.data.stepId),
      ),
    )
    .limit(1);
  const now = new Date();
  if (existing[0]) {
    await db
      .update(schema.euConformitySteps)
      .set({
        status: parsed.data.status,
        ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
        updatedAt: now,
      })
      .where(eq(schema.euConformitySteps.id, existing[0].id));
    return NextResponse.json({ ok: true, id: existing[0].id });
  }
  const rowId = id();
  await db.insert(schema.euConformitySteps).values({
    id: rowId,
    orgId: session.orgId,
    systemId: parsed.data.systemId,
    stepId: parsed.data.stepId,
    status: parsed.data.status,
    notes: parsed.data.notes ?? "",
    updatedAt: now,
  });
  return NextResponse.json({ ok: true, id: rowId }, { status: 201 });
}
