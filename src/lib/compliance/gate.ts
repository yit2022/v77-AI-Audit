export type GateEvaluationInput = {
  system: {
    id: string;
    name: string;
    riskTier: string | null;
    roleInValueChain: string;
  };
  controlsTotal: number;
  controlsImplemented: number;
  openCriticalOrHighFindings: number;
  hasAnnexIvDraft: boolean;
  latestRedteamFailCount?: number | null;
  minReadinessPercent?: number;
};

export type GateEvaluationResult = {
  passed: boolean;
  status: "pass" | "blocked";
  systemId: string;
  systemName: string;
  riskTier: string | null;
  readinessPercent: number;
  blockers: string[];
  warnings: string[];
  evaluatedAt: string;
};

export function evaluateComplianceGate(input: GateEvaluationInput): GateEvaluationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const minReadiness = input.minReadinessPercent ?? 70;
  const readinessPercent =
    input.controlsTotal > 0 ? Math.round((input.controlsImplemented / input.controlsTotal) * 100) : 0;

  if (!input.system.riskTier) {
    blockers.push("AI system has not completed EU AI Act risk classification (Arts. 5–6).");
  } else if (input.system.riskTier === "prohibited") {
    blockers.push("AI system is classified under Article 5 Prohibited AI Practices and cannot be placed on the Union market.");
  }

  if (input.openCriticalOrHighFindings > 0) {
    blockers.push(`${input.openCriticalOrHighFindings} open high/critical finding(s) must be remediated before release.`);
  }

  if (input.system.riskTier === "high_risk") {
    if (input.controlsTotal === 0) {
      blockers.push("High-risk AI system has no linked control assessment (Arts. 8–17).");
    } else if (readinessPercent < minReadiness) {
      blockers.push(
        `High-risk control readiness is ${readinessPercent}%, below required gate threshold of ${minReadiness}%.`,
      );
    }
    if (!input.hasAnnexIvDraft) {
      blockers.push("High-risk AI system is missing Annex IV technical documentation draft (Art. 11).");
    }
  }

  if (typeof input.latestRedteamFailCount === "number" && input.latestRedteamFailCount > 0) {
    if (input.system.riskTier === "high_risk" || input.system.riskTier === "gpai") {
      blockers.push(
        `Latest adversarial red-team run recorded ${input.latestRedteamFailCount} failed scenario(s) (Art. 15 / Art. 55).`,
      );
    } else {
      warnings.push(`Latest red-team run recorded ${input.latestRedteamFailCount} failed scenario(s).`);
    }
  }

  const passed = blockers.length === 0;
  return {
    passed,
    status: passed ? "pass" : "blocked",
    systemId: input.system.id,
    systemName: input.system.name,
    riskTier: input.system.riskTier,
    readinessPercent,
    blockers,
    warnings,
    evaluatedAt: new Date().toISOString(),
  };
}
