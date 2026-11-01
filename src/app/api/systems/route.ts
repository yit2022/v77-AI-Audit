import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { id } from "@/lib/ids";
import { seedIfEmpty } from "@/lib/db/seed";
import { filterRegistry, summariseRegistry } from "@/lib/registry/summary";

export async function GET(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const url = new URL(req.url);
  const riskTier = url.searchParams.get("riskTier") ?? "all";
  const lifecycleStatus = url.searchParams.get("lifecycleStatus") ?? "all";
  const role = url.searchParams.get("role") ?? "all";
  const format = url.searchParams.get("format");

  const systems = await db
    .select()
    .from(schema.aiSystems)
    .where(eq(schema.aiSystems.orgId, session.orgId))
    .orderBy(desc(schema.aiSystems.createdAt));

  const filtered = filterRegistry(
    systems.map((s) => ({
      id: s.id,
      name: s.name,
      riskTier: s.riskTier,
      roleInValueChain: s.roleInValueChain,
      lifecycleStatus: s.lifecycleStatus,
      gpai: s.gpai,
    })),
    { riskTier, lifecycleStatus, role },
  );
  const idSet = new Set(filtered.map((f) => f.id));
  const rows = systems.filter((s) => idSet.has(s.id));
  const summary = summariseRegistry(
    systems.map((s) => ({
      id: s.id,
      name: s.name,
      riskTier: s.riskTier,
      roleInValueChain: s.roleInValueChain,
      lifecycleStatus: s.lifecycleStatus,
      gpai: s.gpai,
    })),
  );

  if (format === "registry") {
    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      orgId: session.orgId,
      orgName: session.orgName,
      summary,
      systems: rows,
    });
  }
  return NextResponse.json({ systems: rows, summary });
}

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  intendedPurpose: z.string().optional(),
  roleInValueChain: z.enum(["provider", "deployer", "importer", "distributor"]).optional(),
  domain: z.string().optional(),
  lifecycleStatus: z.enum(["discovered", "pilot", "production", "retired"]).optional(),
  versionLabel: z.string().optional(),
  vendorName: z.string().optional(),
  euDatabaseId: z.string().optional(),
});

export async function POST(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await ensureDb();
  const systemId = id();
  await db.insert(schema.aiSystems).values({
    id: systemId,
    orgId: session.orgId,
    name: parsed.data.name,
    description: parsed.data.description ?? "",
    intendedPurpose: parsed.data.intendedPurpose ?? "",
    roleInValueChain: parsed.data.roleInValueChain ?? "provider",
    domain: parsed.data.domain ?? "general",
    ownerUserId: session.userId,
    lifecycleStatus: parsed.data.lifecycleStatus ?? "discovered",
    versionLabel: parsed.data.versionLabel ?? "",
    vendorName: parsed.data.vendorName ?? "",
    euDatabaseId: parsed.data.euDatabaseId ?? "",
  });
  const rows = await db.select().from(schema.aiSystems).where(eq(schema.aiSystems.id, systemId));
  return NextResponse.json({ system: rows[0] }, { status: 201 });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  lifecycleStatus: z.enum(["discovered", "pilot", "production", "retired"]).optional(),
  versionLabel: z.string().optional(),
  vendorName: z.string().optional(),
  euDatabaseId: z.string().optional(),
  markReviewed: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await ensureDb();
  const existing = await db
    .select()
    .from(schema.aiSystems)
    .where(eq(schema.aiSystems.id, parsed.data.id))
    .limit(1);
  if (!existing[0] || existing[0].orgId !== session.orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await db
    .update(schema.aiSystems)
    .set({
      ...(parsed.data.lifecycleStatus ? { lifecycleStatus: parsed.data.lifecycleStatus } : {}),
      ...(parsed.data.versionLabel !== undefined ? { versionLabel: parsed.data.versionLabel } : {}),
      ...(parsed.data.vendorName !== undefined ? { vendorName: parsed.data.vendorName } : {}),
      ...(parsed.data.euDatabaseId !== undefined ? { euDatabaseId: parsed.data.euDatabaseId } : {}),
      ...(parsed.data.markReviewed ? { lastReviewedAt: new Date() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.aiSystems.id, parsed.data.id));
  return NextResponse.json({ ok: true });
}
