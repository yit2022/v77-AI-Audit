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
