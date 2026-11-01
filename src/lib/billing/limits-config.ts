export type PlanLimits = {
  systems: number;
  users: number;
  frameworks: number;
  storageBytes: number;
};

/** Soft limits for self-serve tiers. Enterprise is high but still bounded. */
export const PLAN_LIMITS: Record<string, PlanLimits> = {
  pilot: { systems: 3, users: 5, frameworks: 6, storageBytes: 500 * 1024 * 1024 },
  team: { systems: 50, users: 25, frameworks: 8, storageBytes: 20 * 1024 * 1024 * 1024 },
  enterprise: { systems: 500, users: 200, frameworks: 20, storageBytes: 200 * 1024 * 1024 * 1024 },
};

export function limitsForTier(tier: string): PlanLimits {
  return PLAN_LIMITS[tier] || PLAN_LIMITS.pilot;
}
