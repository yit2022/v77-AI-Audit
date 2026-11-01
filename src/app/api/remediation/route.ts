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
  const findingId = new URL(req.url).searchParams.get("findingId");
  await ensureDb();
  const rows = findingId
    ? await db
        .select()
        .from(schema.remediationTasks)
        .where(
          and(
            eq(schema.remediationTasks.orgId, session.orgId),
            eq(schema.remediationTasks.findingId, findingId),
          ),
        )
        .orderBy(desc(schema.remediationTasks.createdAt))
    : await db
        .select()
        .from(schema.remediationTasks)
        .where(eq(schema.remediationTasks.orgId, session.orgId))
        .orderBy(desc(schema.remediationTasks.createdAt));
  return NextResponse.json({ tasks: rows });
}

const createSchema = z.object({
  findingId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().default(""),
  ownerUserId: z.string().uuid().optional().nullable(),
  ownerName: z.string().default(""),
  dueDate: z.string().optional().nullable(),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "in_progress", "done", "cancelled"]).optional(),
  ownerName: z.string().optional(),
  ownerUserId: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  description: z.string().optional(),
});

export async function POST(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await ensureDb();
  const finding = await db
    .select()
    .from(schema.findings)
    .where(and(eq(schema.findings.id, parsed.data.findingId), eq(schema.findings.orgId, session.orgId)))
    .limit(1);
  if (!finding[0]) return NextResponse.json({ error: "Finding not found" }, { status: 404 });
  const taskId = id();
  await db.insert(schema.remediationTasks).values({
    id: taskId,
    orgId: session.orgId,
    findingId: parsed.data.findingId,
    title: parsed.data.title,
    description: parsed.data.description,
    ownerUserId: parsed.data.ownerUserId ?? null,
    ownerName: parsed.data.ownerName,
    dueDate: parsed.data.dueDate ?? null,
  });
  await appendAuditLog({
    orgId: session.orgId,
    actorUserId: session.userId,
    action: "remediation.created",
    entityType: "remediation_task",
    entityId: taskId,
    detail: { findingId: parsed.data.findingId, title: parsed.data.title, dueDate: parsed.data.dueDate },
  });
  return NextResponse.json({ id: taskId }, { status: 201 });
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
    .from(schema.remediationTasks)
    .where(and(eq(schema.remediationTasks.id, parsed.data.id), eq(schema.remediationTasks.orgId, session.orgId)))
    .limit(1);
  if (!existing[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const patch: Partial<typeof schema.remediationTasks.$inferInsert> = { updatedAt: new Date() };
  if (parsed.data.status) patch.status = parsed.data.status;
  if (parsed.data.ownerName !== undefined) patch.ownerName = parsed.data.ownerName;
  if (parsed.data.ownerUserId !== undefined) patch.ownerUserId = parsed.data.ownerUserId;
  if (parsed.data.dueDate !== undefined) patch.dueDate = parsed.data.dueDate;
  if (parsed.data.description !== undefined) patch.description = parsed.data.description;
  await db.update(schema.remediationTasks).set(patch).where(eq(schema.remediationTasks.id, parsed.data.id));
  await appendAuditLog({
    orgId: session.orgId,
    actorUserId: session.userId,
    action: "remediation.updated",
    entityType: "remediation_task",
    entityId: parsed.data.id,
    detail: patch,
  });
  return NextResponse.json({ ok: true });
}
