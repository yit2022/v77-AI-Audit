import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, ensureDb, schema } from "@/lib/db";
import { authenticateApiKey, roleAtLeast } from "@/lib/auth/api-key";
import { id } from "@/lib/ids";
import { seedIfEmpty } from "@/lib/db/seed";
import { appendAuditLog } from "@/lib/audit/log";

async function auth(req: Request) {
  return authenticateApiKey(req.headers.get("authorization"));
}

export async function GET(req: Request) {
  await seedIfEmpty();
  const a = await auth(req);
  if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const systems = await db.select().from(schema.aiSystems).where(eq(schema.aiSystems.orgId, a.orgId));
  return NextResponse.json({ systems });
}

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  intendedPurpose: z.string().default(""),
  roleInValueChain: z.string().default("provider"),
  domain: z.string().default(""),
  riskTier: z.enum(["prohibited", "high_risk", "limited", "minimal"]).default("minimal"),
  gpai: z.boolean().default(false),
});

export async function POST(req: Request) {
  await seedIfEmpty();
  const a = await auth(req);
  if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(a.role, "ai_owner")) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await ensureDb();
  const systemId = id();
  await db.insert(schema.aiSystems).values({
    id: systemId,
    orgId: a.orgId,
    name: parsed.data.name,
    description: parsed.data.description,
    intendedPurpose: parsed.data.intendedPurpose,
    roleInValueChain: parsed.data.roleInValueChain,
    domain: parsed.data.domain,
    riskTier: parsed.data.riskTier,
    gpai: parsed.data.gpai,
    classificationNotes: "",
  });
  await appendAuditLog({
    orgId: a.orgId,
    action: "api.system.created",
    entityType: "ai_system",
    entityId: systemId,
    detail: { via: "api_key", keyId: a.keyId, name: parsed.data.name },
  });
  return NextResponse.json({ id: systemId }, { status: 201 });
}
