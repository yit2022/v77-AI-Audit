export type FrameworkKey = "eu_ai_act" | "nist" | "iso42001" | "gdpr" | "dora" | "iso27001";

export type ControlStatusRow = {
  status: string;
  euRef: string;
  nistRef: string;
  isoRef: string;
  gdprRef: string;
  doraRef?: string;
  iso27001Ref?: string;
};

export type FindingRiskRow = {
  id: string;
  title: string;
  severity: string;
  status: string;
  frameworkRef: string;
  systemId: string;
};

export type RemediationRow = {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  findingId: string;
};

export type TrendPoint = { label: string; openFindings: number; readiness: number };

const IMPLEMENTED = new Set(["implemented", "complete", "done", "satisfied"]);

function applies(ref: string | undefined): boolean {
  return Boolean(ref && ref.trim() && ref.trim() !== "-");
}

export function readinessByFramework(controls: ControlStatusRow[]): Record<FrameworkKey, number> {
  const buckets: Record<FrameworkKey, { done: number; total: number }> = {
    eu_ai_act: { done: 0, total: 0 },
    nist: { done: 0, total: 0 },
    iso42001: { done: 0, total: 0 },
    gdpr: { done: 0, total: 0 },
    dora: { done: 0, total: 0 },
    iso27001: { done: 0, total: 0 },
  };
  for (const c of controls) {
    const done = IMPLEMENTED.has(c.status.toLowerCase());
    const pairs: Array<[FrameworkKey, string | undefined]> = [
      ["eu_ai_act", c.euRef],
      ["nist", c.nistRef],
      ["iso42001", c.isoRef],
      ["gdpr", c.gdprRef],
      ["dora", c.doraRef],
      ["iso27001", c.iso27001Ref],
    ];
    for (const [key, ref] of pairs) {
      if (applies(ref)) {
        buckets[key].total++;
        if (done) buckets[key].done++;
      }
    }
  }
  const out = {} as Record<FrameworkKey, number>;
  for (const k of Object.keys(buckets) as FrameworkKey[]) {
    const b = buckets[k];
    out[k] = b.total ? Math.round((b.done / b.total) * 100) : 0;
  }
  return out;
}

const SEV_RANK: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export function topRisks(findings: FindingRiskRow[], limit = 5): FindingRiskRow[] {
  return [...findings]
    .filter((f) => f.status === "open" || f.status === "in_progress")
    .sort((a, b) => (SEV_RANK[b.severity] || 0) - (SEV_RANK[a.severity] || 0))
    .slice(0, limit);
}

export function overdueRemediation(tasks: RemediationRow[], now = new Date()): RemediationRow[] {
  const today = now.toISOString().slice(0, 10);
  return tasks.filter((t) => {
    if (t.status === "done" || t.status === "closed") return false;
    if (!t.dueDate) return false;
    return t.dueDate < today;
  });
}

/** Simple synthetic trend from current snapshot (stable for tests / UI). */
export function buildTrend(opts: {
  openFindings: number;
  overallReadiness: number;
}): TrendPoint[] {
  const { openFindings, overallReadiness } = opts;
  return [
    { label: "W-3", openFindings: openFindings + 3, readiness: Math.max(0, overallReadiness - 12) },
    { label: "W-2", openFindings: openFindings + 2, readiness: Math.max(0, overallReadiness - 7) },
    { label: "W-1", openFindings: openFindings + 1, readiness: Math.max(0, overallReadiness - 3) },
    { label: "Now", openFindings, readiness: overallReadiness },
  ];
}

export function overallReadiness(
  scores: Record<FrameworkKey, number>,
  active?: FrameworkKey[],
): number {
  const keys = active && active.length ? active : (Object.keys(scores) as FrameworkKey[]);
  const vals = keys.map((k) => scores[k] ?? 0);
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

/** Frameworks that have at least one mapped control reference in the rows. */
export function activeFrameworks(controls: ControlStatusRow[]): FrameworkKey[] {
  const probe: Record<FrameworkKey, boolean> = {
    eu_ai_act: false,
    nist: false,
    iso42001: false,
    gdpr: false,
    dora: false,
    iso27001: false,
  };
  for (const c of controls) {
    if (applies(c.euRef)) probe.eu_ai_act = true;
    if (applies(c.nistRef)) probe.nist = true;
    if (applies(c.isoRef)) probe.iso42001 = true;
    if (applies(c.gdprRef)) probe.gdpr = true;
    if (applies(c.doraRef)) probe.dora = true;
    if (applies(c.iso27001Ref)) probe.iso27001 = true;
  }
  return (Object.keys(probe) as FrameworkKey[]).filter((k) => probe[k]);
}
