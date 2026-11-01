import { desc, eq, sql } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";

/** Platform owner emails (comma-separated). Defaults to demo admin for local/sale demos. */
export function isPlatformAdminEmail(email: string, env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env.V77_PLATFORM_ADMIN_EMAILS?.trim();
  const list = (raw ? raw.split(",") : ["admin@v77.local"]).map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

export async function listPlatformOrgs() {
  await ensureDb();
  const orgs = await db.select().from(schema.organisations).orderBy(desc(schema.organisations.createdAt));
  const out = [];
  for (const org of orgs) {
    const memberCount = await db
      .select({ n: sql<number>`count(*)` })
      .from(schema.memberships)
      .where(eq(schema.memberships.orgId, org.id));
    const systemCount = await db
      .select({ n: sql<number>`count(*)` })
      .from(schema.aiSystems)
      .where(eq(schema.aiSystems.orgId, org.id));
    out.push({
      id: org.id,
      name: org.name,
      slug: org.slug,
      planTier: org.planTier,
      seatLimit: org.seatLimit,
      members: Number(memberCount[0]?.n || 0),
      systems: Number(systemCount[0]?.n || 0),
      trustPublic: org.trustPublic,
      createdAt: org.createdAt,
    });
  }
  return out;
}

export async function listUsage(limit = 30) {
  await ensureDb();
  return db.select().from(schema.platformUsageDaily).orderBy(desc(schema.platformUsageDaily.day)).limit(limit);
}
