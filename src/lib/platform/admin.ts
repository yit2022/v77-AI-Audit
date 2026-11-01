import { desc, eq, sql } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";

async function resolvePlatformAdminEnv(env?: NodeJS.ProcessEnv): Promise<NodeJS.ProcessEnv> {
  if (env) return env;
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const cfEnv = (ctx?.env || {}) as Record<string, unknown>;
    // Merge CF bindings/secrets over process.env without mutating globals.
    const merged: Record<string, string | undefined> = { ...process.env };
    for (const [k, v] of Object.entries(cfEnv)) {
      if (typeof v === "string") merged[k] = v;
    }
    return merged as NodeJS.ProcessEnv;
  } catch {
    return process.env;
  }
}

/** Platform owner emails (comma-separated). Defaults to demo admin for local/sale demos. Never render this list in public UI. */
export function isPlatformAdminEmail(email: string, env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env.V77_PLATFORM_ADMIN_EMAILS?.trim();
  const list = (raw ? raw.split(",") : ["admin@v77.local"]).map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

export async function isPlatformAdminEmailAsync(email: string): Promise<boolean> {
  const env = await resolvePlatformAdminEnv();
  return isPlatformAdminEmail(email, env);
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
