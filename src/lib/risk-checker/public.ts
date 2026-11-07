import {
  CLASSIFICATION_QUESTIONS,
  classifyAiSystem,
  type Answer,
  type ClassificationInput,
  type RiskTier,
} from "@/lib/classification";

/** Shorter public lead-magnet set — still uses the same classifyAiSystem engine. */
export const PUBLIC_RISK_QUESTION_IDS = [
  "proh_social_score",
  "proh_biometric_real_time",
  "proh_emotion_workplace",
  "hr_annex_iii_employment",
  "hr_annex_iii_credit",
  "hr_annex_iii_education",
  "hr_annex_iii_biometric",
  "hr_annex_iii_critical",
  "ctx_art6_3_narrow_preparatory",
  "ctx_art6_3_profiling",
  "ctx_art25_substantial_mod",
  "lim_interaction",
  "lim_synthetic",
  "gpai_model",
] as const;

export const PUBLIC_RISK_QUESTIONS = CLASSIFICATION_QUESTIONS.filter((q) =>
  (PUBLIC_RISK_QUESTION_IDS as readonly string[]).includes(q.id),
);

export type PublicRiskResult = {
  tier: RiskTier;
  label: string;
  summary: string;
  nextSteps: string[];
  disclaimer: string;
};

const LABELS: Record<RiskTier, string> = {
  prohibited: "Prohibited",
  high_risk: "High-risk",
  limited: "Limited risk",
  minimal: "Minimal risk",
  gpai: "GPAI focus",
};

export function runPublicRiskCheck(answers: ClassificationInput): PublicRiskResult {
  // Fill unanswered public questions as "no" so classifyAiSystem can run; full wizard lives in-app.
  const full: ClassificationInput = {};
  for (const q of CLASSIFICATION_QUESTIONS) {
    full[q.id] = answers[q.id] || "no";
  }
  for (const id of Object.keys(answers)) {
    const a = answers[id];
    if (a === "yes" || a === "no" || a === "na") full[id] = a;
  }
  const result = classifyAiSystem(full);
  const nextSteps: string[] = [];
  if (result.tier === "prohibited") {
    nextSteps.push("Stop deployment plans until counsel confirms an Art. 5 exception applies.");
    nextSteps.push("Document the use case and seek specialist legal review.");
  } else if (result.tier === "high_risk") {
    nextSteps.push("Register the system in an inventory and start a conformity assessment path.");
    nextSteps.push("Map Annex III obligations: risk management, data governance, logging, human oversight.");
  } else if (result.tier === "limited") {
    nextSteps.push("Plan Art. 50 transparency: disclose AI interaction and label synthetic media where required.");
  } else if (result.tier === "gpai") {
    nextSteps.push("Review Chapter V GPAI provider duties (documentation, copyright policy, systemic-risk if designated).");
  } else {
    nextSteps.push("Keep a lightweight inventory entry and re-check if the use case expands into Annex III.");
  }
  if (result.art6_3ExemptionClaimed) {
    nextSteps.push(
      "Art. 6(3) derogation claimed: document the non-high-risk assessment under Art. 6(4) before market placement and register under Art. 49(2).",
    );
  }
  if (result.art25ProviderEscalation) {
    nextSteps.push(
      "Art. 25(1) Provider Escalation: substantial modification or rebranding makes your organisation the legal Provider under the EU AI Act.",
    );
  }
  nextSteps.push("Request a V77 Trust pilot to turn this heuristic into evidence-backed controls.");
  return {
    tier: result.tier,
    label: LABELS[result.tier],
    summary: result.reasons[0] || `Indicative tier: ${LABELS[result.tier]}.`,
    nextSteps,
    disclaimer:
      "Indicative only — not legal advice. Based on a shortened EU AI Act questionnaire. Confirm with counsel before compliance decisions.",
  };
}

export function isAnswer(v: unknown): v is Answer {
  return v === "yes" || v === "no" || v === "na";
}
