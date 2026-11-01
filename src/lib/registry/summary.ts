export type RegistrySystem = {
  id: string;
  name: string;
  riskTier: string | null;
  roleInValueChain: string;
  lifecycleStatus: string;
  gpai: boolean;
};

export type RegistrySummary = {
  total: number;
  byRisk: Record<string, number>;
  byLifecycle: Record<string, number>;
  byRole: Record<string, number>;
  unclassified: number;
  gpaiCount: number;
};

export function summariseRegistry(systems: RegistrySystem[]): RegistrySummary {
  const byRisk: Record<string, number> = {};
  const byLifecycle: Record<string, number> = {};
  const byRole: Record<string, number> = {};
  let unclassified = 0;
  let gpaiCount = 0;
  for (const s of systems) {
    const tier = s.riskTier || "unclassified";
    if (!s.riskTier) unclassified++;
    byRisk[tier] = (byRisk[tier] ?? 0) + 1;
    byLifecycle[s.lifecycleStatus || "discovered"] = (byLifecycle[s.lifecycleStatus || "discovered"] ?? 0) + 1;
    byRole[s.roleInValueChain] = (byRole[s.roleInValueChain] ?? 0) + 1;
    if (s.gpai) gpaiCount++;
  }
  return { total: systems.length, byRisk, byLifecycle, byRole, unclassified, gpaiCount };
}

export function filterRegistry(
  systems: RegistrySystem[],
  opts: { riskTier?: string; lifecycleStatus?: string; role?: string } = {},
): RegistrySystem[] {
  return systems.filter((s) => {
    if (opts.riskTier && opts.riskTier !== "all") {
      const tier = s.riskTier || "unclassified";
      if (tier !== opts.riskTier) return false;
    }
    if (opts.lifecycleStatus && opts.lifecycleStatus !== "all" && s.lifecycleStatus !== opts.lifecycleStatus) {
      return false;
    }
    if (opts.role && opts.role !== "all" && s.roleInValueChain !== opts.role) return false;
    return true;
  });
}
