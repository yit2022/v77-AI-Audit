import { eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";

export const TRIAL_DAYS = 14;

export type OrgAccess = {
  billingStatus: string;
  planTier: string;
  trialEndsAt: Date | null;
  trialActive: boolean;
  trialExpired: boolean;
  readOnly: boolean;
  daysLeft: number | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  billingInterval: string;
};

export function computeOrgAccess(org: {
  billingStatus?: string | null;
  planTier?: string | null;
  trialEndsAt?: Date | null;
  cancelAtPeriodEnd?: boolean | null;
  currentPeriodEnd?: Date | null;
  billingInterval?: string | null;
}, now = new Date()): OrgAccess {
  const billingStatus = org.billingStatus || "none";
  const trialEndsAt = org.trialEndsAt ?? null;
  const paid = billingStatus === "active" || billingStatus === "past_due";
  const trialActive = !paid && !!trialEndsAt && trialEndsAt.getTime() > now.getTime();
  const trialExpired =
    !paid &&
    ((!!trialEndsAt && trialEndsAt.getTime() <= now.getTime()) ||
      (billingStatus === "trialing" && !trialEndsAt));
  const readOnly = trialExpired || billingStatus === "canceled";
  const daysLeft =
    trialActive && trialEndsAt
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
      : null;
  return {
    billingStatus,
    planTier: org.planTier || "pilot",
    trialEndsAt,
    trialActive,
    trialExpired,
    readOnly,
    daysLeft,
    cancelAtPeriodEnd: !!org.cancelAtPeriodEnd,
    currentPeriodEnd: org.currentPeriodEnd ?? null,
    billingInterval: org.billingInterval || "monthly",
  };
}

export function trialEndsAtFrom(now = new Date(), days = TRIAL_DAYS): Date {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function getOrgAccess(orgId: string): Promise<OrgAccess | null> {
  await ensureDb();
  const rows = await db.select().from(schema.organisations).where(eq(schema.organisations.id, orgId)).limit(1);
  const org = rows[0];
  if (!org) return null;
  return computeOrgAccess(org);
}

/** Throws a structured error if the org may not mutate data. */
export async function assertOrgWritable(orgId: string) {
  const access = await getOrgAccess(orgId);
  if (!access) throw Object.assign(new Error("Organisation not found"), { status: 404, code: "org_not_found" });
  if (access.readOnly) {
    throw Object.assign(
      new Error("Your trial has ended. Upgrade to continue making changes."),
      { status: 402, code: "trial_expired_readonly" },
    );
  }
  return access;
}
