import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { id } from "@/lib/ids";
import { seedIfEmpty } from "@/lib/db/seed";

export async function GET() {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const systems = await db.select().from(schema.aiSystems).where(eq(schema.aiSystems.orgId, session.orgId)).orderBy(desc(schema.aiSystems.createdAt));
  return NextResponse.json({ systems });
}

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  intendedPurpose: z.string().optional(),
  roleInValueChain: z.enum(["provider", "deployer", "importer", "distributor"]).optional(),
  domain: z.string().optional(),
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
    id: systemId, orgId: session.orgId, name: parsed.data.name,
    description: parsed.data.description ?? "", intendedPurpose: parsed.data.intendedPurpose ?? "",
    roleInValueChain: parsed.data.roleInValueChain ?? "provider",
    domain: parsed.data.domain ?? "general", ownerUserId: session.userId,
  });
  const rows = await db.select().from(schema.aiSystems).where(eq(schema.aiSystems.id, systemId));
  return NextResponse.json({ system: rows[0] }, { status: 201 });
}
