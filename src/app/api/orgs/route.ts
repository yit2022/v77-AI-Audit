import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession, createSession } from "@/lib/auth/session";
import { id } from "@/lib/ids";
import { seedIfEmpty } from "@/lib/db/seed";
import { appendAuditLog } from "@/lib/audit/log";

export async function GET() {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const orgs = await db
    .select({
      id: schema.organisations.id,
      name: schema.organisations.name,
      slug: schema.organisations.slug,
      role: schema.memberships.role,
    })
    .from(schema.memberships)
    .innerJoin(schema.organisations, eq(schema.memberships.orgId, schema.organisations.id))
    .where(eq(schema.memberships.userId, session.userId));
  return NextResponse.json({ orgs, currentOrgId: session.orgId });
}

const createSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
});

export async function POST(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await ensureDb();
  const orgId = id();
  try {
    await db.insert(schema.organisations).values({
      id: orgId,
      name: parsed.data.name,
      slug: parsed.data.slug,
    });
  } catch {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }
  await db.insert(schema.memberships).values({
    id: id(),
    orgId,
    userId: session.userId,
    role: "admin",
  });
  await appendAuditLog({
    orgId,
    actorUserId: session.userId,
    action: "org.created",
    entityType: "organisation",
    entityId: orgId,
    detail: { name: parsed.data.name, slug: parsed.data.slug },
  });
  return NextResponse.json({ id: orgId }, { status: 201 });
}

const switchSchema = z.object({ orgId: z.string().uuid(), action: z.literal("switch") });

export async function PATCH(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = switchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await ensureDb();
  const membership = await db
    .select()
    .from(schema.memberships)
    .where(eq(schema.memberships.userId, session.userId));
  const ok = membership.find((m) => m.orgId === parsed.data.orgId);
  if (!ok) return NextResponse.json({ error: "Not a member" }, { status: 403 });
  await createSession(session.userId, parsed.data.orgId);
  return NextResponse.json({ ok: true, orgId: parsed.data.orgId });
}
