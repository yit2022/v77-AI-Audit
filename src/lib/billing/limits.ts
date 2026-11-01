import { eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";

export type PlanLimits = {
  systems: number;
  users: number;
  frameworks: number;
  storageBytes: number;
};

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  pilot: { systems: 3, users: 5, frameworks: 2, storageBytes: 500 * 1024 * 1024 },
  team: { systems: 50, users: 25, frameworks: 8, storageBytes: 20 * 1024 * 1024 * 1024 },
  enterprise: { systems: 500, users: 200, frameworks: 20, storageBytes: 200 * 1024 * 1024 * 1024 },
};

export function limitsForTier(tier: string): PlanLimits {
  return PLAN_LIMITS[tier] || PLAN_LIMITS.pilot;
}

export type UsageSnapshot = {
  tier: string;
  limits: PlanLimits;
  systems: number;
  users: number;
  frameworks: number;
  storageBytes: number;
};

async function countFrameworkPacks(orgId: string): Promise<number> {
  const assessments = await db.select().from(schema.assessments).where(eq(schema.assessments.orgId, orgId));
  if (!assessments.length) return 0;
  const packs = new Set<string>();
  for (const a of assessments) {
    const links = await db
      .select({
        euRef: schema.controls.euRef,
        nistRef: schema.controls.nistRef,
        isoRef: schema.controls.isoRef,
        gdprRef: schema.controls.gdprRef,
        doraRef: schema.controls.doraRef,
        iso27001Ref: schema.controls.iso27001Ref,
      })
      .from(schema.assessmentControls)
      .innerJoin(schema.controls, eq(schema.assessmentControls.controlId, schema.controls.id))
      .where(eq(schema.assessmentControls.assessmentId, a.id));
    for (const c of links) {
      if (c.euRef) packs.add("eu_ai_act");
      if (c.nistRef) packs.add("nist_ai_rmf");
      if (c.isoRef) packs.add("iso_42001");
      if (c.gdprRef) packs.add("gdpr");
      if (c.doraRef) packs.add("dora");
      if (c.iso27001Ref) packs.add("iso_27001");
    }
  }
  return packs.size;
}

export async function getOrgUsage(orgId: string): Promise<UsageSnapshot | null> {
  await ensureDb();
  const orgs = await db.select().from(schema.organisations).where(eq(schema.organisations.id, orgId)).limit(1);
  const org = orgs[0];
  if (!org) return null;
  const limits = limitsForTier(org.planTier);
  const systems = (await db.select().from(schema.aiSystems).where(eq(schema.aiSystems.orgId, orgId))).length;
  const users = (await db.select().from(schema.memberships).where(eq(schema.memberships.orgId, orgId))).length;
  let frameworks = 0;
  try {
    frameworks = await countFrameworkPacks(orgId);
  } catch {
    frameworks = 0;
  }
  let storageBytes = 0;
  try {
    const ev = await db.select().from(schema.evidenceItems).where(eq(schema.evidenceItems.orgId, orgId));
    storageBytes = ev.length * 256 * 1024;
  } catch {
    storageBytes = 0;
  }
  return { tier: org.planTier, limits, systems, users, frameworks, storageBytes };
}

export type LimitKind = "systems" | "users" | "frameworks" | "storageBytes";

export async function assertUnderLimit(orgId: string, kind: LimitKind, adding = 1) {
  const usage = await getOrgUsage(orgId);
  if (!usage) throw Object.assign(new Error("Organisation not found"), { status: 404, code: "org_not_found" });
  const used = usage[kind];
  const limit = usage.limits[kind];
  const over = adding <= 0 ? used >= limit : used + adding > limit;
  if (over) {
    throw Object.assign(
      new Error(`Plan limit reached for ${kind}. Upgrade your plan to continue.`),
      { status: 402, code: "plan_limit", kind, used, limit },
    );
  }
  return usage;
}
