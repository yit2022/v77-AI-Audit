import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { id } from "@/lib/ids";
import { seedIfEmpty } from "@/lib/db/seed";
import { appendAuditLog } from "@/lib/audit/log";

export async function GET(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const systemId = new URL(req.url).searchParams.get("systemId");
  await ensureDb();
  const rows = systemId
    ? await db
        .select()
        .from(schema.findings)
        .where(and(eq(schema.findings.orgId, session.orgId), eq(schema.findings.systemId, systemId)))
        .orderBy(desc(schema.findings.createdAt))
    : await db
        .select()
        .from(schema.findings)
        .where(eq(schema.findings.orgId, session.orgId))
        .orderBy(desc(schema.findings.createdAt));
  return NextResponse.json({ findings: rows });
}

const createSchema = z.object({
  systemId: z.string().uuid(),
  assessmentId: z.string().uuid().optional().nullable(),
  title: z.string().min(1),
  description: z.string().default(""),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  frameworkRef: z.string().default(""),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "in_progress", "resolved", "accepted"]).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  description: z.string().optional(),
});

export async function POST(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await ensureDb();
  const findingId = id();
  await db.insert(schema.findings).values({
    id: findingId,
    orgId: session.orgId,
    systemId: parsed.data.systemId,
    assessmentId: parsed.data.assessmentId ?? null,
    title: parsed.data.title,
    description: parsed.data.description,
    severity: parsed.data.severity,
    frameworkRef: parsed.data.frameworkRef,
    createdBy: session.userId,
  });
  await appendAuditLog({
    orgId: session.orgId,
    actorUserId: session.userId,
    action: "finding.created",
    entityType: "finding",
    entityId: findingId,
    detail: { title: parsed.data.title, severity: parsed.data.severity },
  });
  return NextResponse.json({ id: findingId }, { status: 201 });
}

export async function PATCH(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await ensureDb();
  const existing = await db
    .select()
    .from(schema.findings)
    .where(and(eq(schema.findings.id, parsed.data.id), eq(schema.findings.orgId, session.orgId)))
    .limit(1);
  if (!existing[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const patch: Partial<typeof schema.findings.$inferInsert> = { updatedAt: new Date() };
  if (parsed.data.status) patch.status = parsed.data.status;
  if (parsed.data.severity) patch.severity = parsed.data.severity;
  if (parsed.data.description !== undefined) patch.description = parsed.data.description;
  await db.update(schema.findings).set(patch).where(eq(schema.findings.id, parsed.data.id));
  await appendAuditLog({
    orgId: session.orgId,
    actorUserId: session.userId,
    action: "finding.updated",
    entityType: "finding",
    entityId: parsed.data.id,
    detail: patch,
  });
  return NextResponse.json({ ok: true });
}
