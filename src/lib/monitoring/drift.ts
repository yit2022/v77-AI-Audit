export type ControlSnapshot = { code: string; status: string };
export type FairnessSnapshot = {
  metric?: string;
  value?: number;
  group?: string;
  [key: string]: unknown;
};

export type DriftFinding = {
  kind: "control_regression" | "fairness_drift" | "missing_baseline";
  severity: "low" | "medium" | "high";
  message: string;
};

const REGRESSION = new Set([
  "implemented->in_progress",
  "implemented->not_started",
  "implemented->gap",
  "in_progress->not_started",
  "in_progress->gap",
]);

export function detectControlDrift(
  baseline: ControlSnapshot[],
  current: ControlSnapshot[],
): DriftFinding[] {
  const findings: DriftFinding[] = [];
  const curr = new Map(current.map((c) => [c.code, c.status]));
  for (const b of baseline) {
    const now = curr.get(b.code);
    if (!now) {
      findings.push({
        kind: "control_regression",
        severity: "medium",
        message: `Control ${b.code} missing from current assessment.`,
      });
      continue;
    }
    const key = `${b.status}->${now}`;
    if (REGRESSION.has(key) || (b.status === "implemented" && now !== "implemented")) {
      findings.push({
        kind: "control_regression",
        severity: now === "gap" || now === "not_started" ? "high" : "medium",
        message: `Control ${b.code} drifted from ${b.status} to ${now}.`,
      });
    }
  }
  return findings;
}

/** Compare scalar fairness metrics; flag absolute delta above threshold. */
export function detectFairnessDrift(
  baseline: Record<string, number>,
  current: Record<string, number>,
  threshold = 0.05,
): DriftFinding[] {
  const findings: DriftFinding[] = [];
  const keys = new Set([...Object.keys(baseline), ...Object.keys(current)]);
  if (keys.size === 0) {
    return [{ kind: "missing_baseline", severity: "low", message: "No fairness metrics available to compare." }];
  }
  for (const key of keys) {
    if (!(key in baseline) || !(key in current)) {
      findings.push({
        kind: "fairness_drift",
        severity: "medium",
        message: `Fairness metric "${key}" present in only one snapshot.`,
      });
      continue;
    }
    const delta = Math.abs(current[key] - baseline[key]);
    if (delta > threshold) {
      findings.push({
        kind: "fairness_drift",
        severity: delta > threshold * 2 ? "high" : "medium",
        message: `Fairness metric "${key}" drifted by ${delta.toFixed(3)} (threshold ${threshold}).`,
      });
    }
  }
  return findings;
}

export function summariseFindings(findings: DriftFinding[]): "ok" | "drift" | "alert" {
  if (findings.some((f) => f.severity === "high")) return "alert";
  if (findings.length > 0) return "drift";
  return "ok";
}
