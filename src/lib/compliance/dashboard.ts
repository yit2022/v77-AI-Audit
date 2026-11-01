export type FrameworkKey = "eu_ai_act" | "nist" | "iso42001" | "gdpr";

export type ControlStatusRow = {
  status: string;
  euRef: string;
  nistRef: string;
  isoRef: string;
  gdprRef: string;
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

function applies(ref: string): boolean {
  return Boolean(ref && ref.trim() && ref.trim() !== "-");
}

export function readinessByFramework(controls: ControlStatusRow[]): Record<FrameworkKey, number> {
  const buckets: Record<FrameworkKey, { done: number; total: number }> = {
    eu_ai_act: { done: 0, total: 0 },
    nist: { done: 0, total: 0 },
    iso42001: { done: 0, total: 0 },
    gdpr: { done: 0, total: 0 },
  };
  for (const c of controls) {
    const done = IMPLEMENTED.has(c.status.toLowerCase());
    if (applies(c.euRef)) {
      buckets.eu_ai_act.total++;
      if (done) buckets.eu_ai_act.done++;
    }
    if (applies(c.nistRef)) {
      buckets.nist.total++;
      if (done) buckets.nist.done++;
    }
    if (applies(c.isoRef)) {
      buckets.iso42001.total++;
      if (done) buckets.iso42001.done++;
    }
    if (applies(c.gdprRef)) {
      buckets.gdpr.total++;
      if (done) buckets.gdpr.done++;
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

export function overallReadiness(scores: Record<FrameworkKey, number>): number {
  const vals = Object.values(scores);
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}
