/**
 * EU AI Act risk-classification questionnaire (MVP heuristic).
 * Paraphrases of statutory categories — not legal advice.
 */

export type Answer = "yes" | "no" | "na";
export type RiskTier =
  | "prohibited"
  | "high_risk"
  | "limited"
  | "minimal"
  | "gpai";

export type ClassificationQuestion = {
  id: string;
  section: "prohibited" | "high_risk" | "limited" | "gpai" | "context";
  prompt: string;
  help: string;
  weight: "hard" | "soft";
};

export const CLASSIFICATION_QUESTIONS: ClassificationQuestion[] = [
  { id: "proh_social_score", section: "prohibited", prompt: "Does the system perform social scoring of natural persons by public authorities based on social behaviour or personal characteristics?", help: "Maps to EU AI Act prohibited practices (Art. 5).", weight: "hard" },
  { id: "proh_biometric_real_time", section: "prohibited", prompt: "Is this a real-time remote biometric identification system in publicly accessible spaces for law enforcement (outside narrow exceptions)?", help: "Art. 5 prohibited / heavily restricted biometric uses.", weight: "hard" },
  { id: "proh_emotion_workplace", section: "prohibited", prompt: "Does the system infer emotions in the workplace or educational institutions (outside medical/safety exceptions)?", help: "Art. 5 emotion recognition prohibitions.", weight: "hard" },
  { id: "proh_untargeted_scraping", section: "prohibited", prompt: "Does it create or expand facial recognition databases through untargeted scraping of images from the internet or CCTV?", help: "Art. 5 untargeted facial-image scraping.", weight: "hard" },
  { id: "hr_annex_i_product", section: "high_risk", prompt: "Is the AI a safety component of a product covered by Annex I Union harmonisation legislation (e.g. machinery, medical devices, toys, radio equipment)?", help: "Annex I embedded high-risk AI in regulated products.", weight: "hard" },
  { id: "hr_annex_iii_employment", section: "high_risk", prompt: "Is the system used for recruitment, selection, promotion, termination, or task allocation affecting workers?", help: "Annex III — employment and workers' management.", weight: "hard" },
  { id: "hr_annex_iii_credit", section: "high_risk", prompt: "Is it used to evaluate creditworthiness or establish credit scores of natural persons (excluding fraud detection)?", help: "Annex III — access to essential private services / credit.", weight: "hard" },
  { id: "hr_annex_iii_education", section: "high_risk", prompt: "Is it used to determine access to education, evaluate learning outcomes, or monitor prohibited student behaviour?", help: "Annex III — education and vocational training.", weight: "hard" },
  { id: "hr_annex_iii_biometric", section: "high_risk", prompt: "Is it a remote biometric identification or biometric categorisation system (where not prohibited)?", help: "Annex III — biometrics (non-prohibited uses).", weight: "hard" },
  { id: "hr_annex_iii_critical", section: "high_risk", prompt: "Is it a safety component of critical digital infrastructure, road traffic, or supply of water/gas/heating/electricity?", help: "Annex III — critical infrastructure.", weight: "hard" },
  { id: "hr_annex_iii_law", section: "high_risk", prompt: "Is it used by law enforcement for risk assessment of offending, polygraphs, evidence evaluation, or profiling?", help: "Annex III — law enforcement.", weight: "hard" },
  { id: "hr_annex_iii_migration", section: "high_risk", prompt: "Is it used for border control, migration, or asylum (e.g. risk assessment, polygraphs, evidence authenticity)?", help: "Annex III — migration, asylum and border control.", weight: "hard" },
  { id: "hr_annex_iii_justice", section: "high_risk", prompt: "Is it used to assist judicial authorities in researching/interpreting facts or applying the law?", help: "Annex III — administration of justice.", weight: "hard" },
  { id: "lim_interaction", section: "limited", prompt: "Do natural persons interact with the AI system (chatbot, virtual assistant, agent) without it being obvious?", help: "Art. 50 transparency — AI interaction disclosure.", weight: "soft" },
  { id: "lim_synthetic", section: "limited", prompt: "Does the system generate or manipulate image, audio, or video content that could be mistaken for authentic (deepfakes / synthetic media)?", help: "Art. 50 synthetic content labelling.", weight: "soft" },
  { id: "lim_emotion_biometric_other", section: "limited", prompt: "Does it perform emotion recognition or biometric categorisation outside prohibited/high-risk contexts?", help: "Art. 50 transparency obligations.", weight: "soft" },
  { id: "gpai_model", section: "gpai", prompt: "Is this (or does it embed) a general-purpose AI model that can perform a wide range of distinct tasks?", help: "GPAI obligations (Chapter V) apply to providers of GPAI models.", weight: "soft" },
  { id: "gpai_systemic", section: "gpai", prompt: "If GPAI: does training compute exceed ~10^25 FLOPs or has the Commission designated systemic risk?", help: "Systemic-risk GPAI additional obligations.", weight: "soft" },
];

export type ClassificationInput = Record<string, Answer>;

export type ClassificationResult = {
  tier: RiskTier;
  reasons: string[];
  gpai: boolean;
  systemicRiskFlag: boolean;
};

export function classifyAiSystem(answers: ClassificationInput): ClassificationResult {
  const reasons: string[] = [];
  const yes = (qid: string) => answers[qid] === "yes";

  for (const q of CLASSIFICATION_QUESTIONS.filter((x) => x.section === "prohibited")) {
    if (yes(q.id)) reasons.push(`Prohibited practice indicated (${q.id}).`);
  }
  if (reasons.some((r) => r.startsWith("Prohibited"))) {
    return { tier: "prohibited", reasons, gpai: yes("gpai_model"), systemicRiskFlag: yes("gpai_systemic") };
  }

  for (const q of CLASSIFICATION_QUESTIONS.filter((x) => x.section === "high_risk")) {
    if (yes(q.id)) reasons.push(`High-risk Annex III indicator (${q.id}).`);
  }
  if (reasons.some((r) => r.includes("High-risk"))) {
    return { tier: "high_risk", reasons, gpai: yes("gpai_model"), systemicRiskFlag: yes("gpai_systemic") };
  }

  for (const q of CLASSIFICATION_QUESTIONS.filter((x) => x.section === "limited")) {
    if (yes(q.id)) reasons.push(`Limited-risk transparency trigger (${q.id}).`);
  }
  if (reasons.some((r) => r.includes("Limited-risk"))) {
    return { tier: "limited", reasons, gpai: yes("gpai_model"), systemicRiskFlag: yes("gpai_systemic") };
  }

  if (yes("gpai_model")) {
    reasons.push("GPAI model with no Annex III / Art. 50 triggers → treat as GPAI focus.");
    return { tier: "gpai", reasons, gpai: true, systemicRiskFlag: yes("gpai_systemic") };
  }

  reasons.push("No prohibited, Annex III, or Art. 50 triggers answered yes → minimal risk.");
  return { tier: "minimal", reasons, gpai: false, systemicRiskFlag: false };
}
