import { eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";

export const DEFAULT_PLANS = [
  {
    tier: "pilot",
    name: "Pilot",
    seatLimit: 5,
    priceNote: "Pricing on request",
    features: ["Core inventory & assessments", "Evidence vault", "In-app reminders"],
  },
  {
    tier: "team",
    name: "Team",
    seatLimit: 25,
    priceNote: "€499 / month (EUR display)",
    features: ["Everything in Pilot", "Approvals & Trust Center", "API keys", "Vendor questionnaires"],
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    seatLimit: 200,
    priceNote: "Pricing on request — custom MSA",
    features: ["Everything in Team", "SSO scaffolding", "Platform usage exports", "Dedicated onboarding", "Partner split billing"],
  },
] as const;

export async function ensurePlanCatalog() {
  await ensureDb();
  for (const p of DEFAULT_PLANS) {
    const existing = await db.select().from(schema.planCatalog).where(eq(schema.planCatalog.tier, p.tier)).limit(1);
    if (existing[0]) continue;
    await db.insert(schema.planCatalog).values({
      id: id(),
      tier: p.tier,
      name: p.name,
      seatLimit: p.seatLimit,
      priceNote: p.priceNote,
      featuresJson: JSON.stringify(p.features),
    });
  }
}

export async function getOrgPlan(orgId: string) {
  await ensureDb();
  await ensurePlanCatalog();
  const orgs = await db.select().from(schema.organisations).where(eq(schema.organisations.id, orgId)).limit(1);
  const org = orgs[0];
  if (!org) return null;
  const plans = await db.select().from(schema.planCatalog).where(eq(schema.planCatalog.tier, org.planTier)).limit(1);
  const plan = plans[0];
  const members = await db.select().from(schema.memberships).where(eq(schema.memberships.orgId, orgId));
  return {
    tier: org.planTier,
    seatLimit: org.seatLimit || plan?.seatLimit || 5,
    seatsUsed: members.length,
    priceNote: plan?.priceNote || "Pricing on request",
    name: plan?.name || org.planTier,
    features: plan ? (JSON.parse(plan.featuresJson || "[]") as string[]) : [],
  };
}
