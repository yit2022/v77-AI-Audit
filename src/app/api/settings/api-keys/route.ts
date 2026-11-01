import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { createApiKey } from "@/lib/auth/api-key";
import { seedIfEmpty } from "@/lib/db/seed";
import { appendAuditLog } from "@/lib/audit/log";
import { ROLES } from "@/lib/db/schema";

export async function GET() {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  await ensureDb();
  const keys = await db
    .select({
      id: schema.apiKeys.id,
      name: schema.apiKeys.name,
      keyPrefix: schema.apiKeys.keyPrefix,
      role: schema.apiKeys.role,
      createdAt: schema.apiKeys.createdAt,
      lastUsedAt: schema.apiKeys.lastUsedAt,
      revokedAt: schema.apiKeys.revokedAt,
    })
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.orgId, session.orgId))
    .orderBy(desc(schema.apiKeys.createdAt));
  return NextResponse.json({ keys });
}

const createSchema = z.object({
  name: z.string().min(1),
  role: z.enum(ROLES).default("ai_owner"),
});

export async function POST(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const created = await createApiKey({
    orgId: session.orgId,
    name: parsed.data.name,
    role: parsed.data.role,
    createdBy: session.userId,
  });
  await appendAuditLog({
    orgId: session.orgId,
    actorUserId: session.userId,
    action: "api_key.created",
    entityType: "api_key",
    entityId: created.id,
    detail: { name: parsed.data.name, role: parsed.data.role, prefix: created.prefix },
  });
  // Raw secret returned once only
  return NextResponse.json(
    { id: created.id, name: parsed.data.name, key: created.raw, prefix: created.prefix },
    { status: 201 },
  );
}

const revokeSchema = z.object({ id: z.string().uuid() });

export async function DELETE(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const parsed = revokeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await ensureDb();
  const rows = await db
    .select()
    .from(schema.apiKeys)
    .where(and(eq(schema.apiKeys.id, parsed.data.id), eq(schema.apiKeys.orgId, session.orgId), isNull(schema.apiKeys.revokedAt)))
    .limit(1);
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.update(schema.apiKeys).set({ revokedAt: new Date() }).where(eq(schema.apiKeys.id, parsed.data.id));
  await appendAuditLog({
    orgId: session.orgId,
    actorUserId: session.userId,
    action: "api_key.revoked",
    entityType: "api_key",
    entityId: parsed.data.id,
  });
  return NextResponse.json({ ok: true });
}
