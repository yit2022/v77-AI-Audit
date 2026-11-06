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
  { id: "proh_subliminal_manipulative", section: "prohibited", prompt: "Does the system deploy subliminal, purposefully manipulative, or deceptive techniques to materially distort behaviour and cause significant harm?", help: "Art. 5(1)(a) prohibition on subliminal/manipulative AI practices.", weight: "hard" },
  { id: "proh_vulnerability_exploitation", section: "prohibited", prompt: "Does the system exploit vulnerabilities of a specific group of persons due to their age, disability, or specific social or economic situation?", help: "Art. 5(1)(b) prohibition on exploiting vulnerable groups.", weight: "hard" },
  { id: "proh_social_score", section: "prohibited", prompt: "Does the system perform social scoring of natural persons by public or private actors based on social behaviour or personal characteristics?", help: "Maps to EU AI Act prohibited practices (Art. 5(1)(c)).", weight: "hard" },
  { id: "proh_predictive_policing_profiling", section: "prohibited", prompt: "Does it assess or predict the risk of a natural person committing a criminal offence based solely on profiling or personality traits?", help: "Art. 5(1)(d) prohibition on individual predictive policing based solely on profiling.", weight: "hard" },
  { id: "proh_untargeted_scraping", section: "prohibited", prompt: "Does it create or expand facial recognition databases through untargeted scraping of images from the internet or CCTV?", help: "Art. 5(1)(e) untargeted facial-image scraping.", weight: "hard" },
  { id: "proh_emotion_workplace", section: "prohibited", prompt: "Does the system infer emotions in the workplace or educational institutions (outside medical/safety exceptions)?", help: "Art. 5(1)(f) emotion recognition prohibitions.", weight: "hard" },
  { id: "proh_biometric_sensitive_categorisation", section: "prohibited", prompt: "Does it perform biometric categorisation to deduce race, political opinions, trade union membership, religious/philosophical beliefs, sex life, or sexual orientation?", help: "Art. 5(1)(g) sensitive biometric categorisation prohibition.", weight: "hard" },
  { id: "proh_biometric_real_time", section: "prohibited", prompt: "Is this a real-time remote biometric identification system in publicly accessible spaces for law enforcement (outside narrow exceptions)?", help: "Art. 5(1)(h) prohibited / heavily restricted biometric uses.", weight: "hard" },
  { id: "hr_annex_i_product", section: "high_risk", prompt: "Is the AI a safety component of a product covered by Annex I Union harmonisation legislation (e.g. machinery, medical devices, toys, radio equipment)?", help: "Art. 6(1) / Annex I embedded high-risk AI in regulated products.", weight: "hard" },
  { id: "hr_annex_iii_biometric", section: "high_risk", prompt: "Is it a remote biometric identification, biometric categorisation, or emotion recognition system (where not prohibited under Art. 5)?", help: "Annex III point 1 — biometrics (non-prohibited uses).", weight: "hard" },
  { id: "hr_annex_iii_critical", section: "high_risk", prompt: "Is it a safety component of critical digital infrastructure, road traffic, or supply of water/gas/heating/electricity?", help: "Annex III point 2 — critical infrastructure.", weight: "hard" },
  { id: "hr_annex_iii_education", section: "high_risk", prompt: "Is it used to determine access to education, evaluate learning outcomes, assess educational level, or monitor prohibited student behaviour?", help: "Annex III point 3 — education and vocational training.", weight: "hard" },
  { id: "hr_annex_iii_employment", section: "high_risk", prompt: "Is the system used for recruitment, selection, promotion, termination, task allocation, or performance monitoring affecting workers?", help: "Annex III point 4 — employment, workers' management and access to self-employment.", weight: "hard" },
  { id: "hr_annex_iii_credit", section: "high_risk", prompt: "Is it used to evaluate creditworthiness/credit scores of natural persons, risk/pricing in life and health insurance, or emergency priority dispatch?", help: "Annex III point 5 — access to essential private and public services and benefits.", weight: "hard" },
  { id: "hr_annex_iii_law", section: "high_risk", prompt: "Is it used by law enforcement for victim risk assessment, polygraphs, evidence evaluation, or profiling in criminal investigations?", help: "Annex III point 6 — law enforcement.", weight: "hard" },
  { id: "hr_annex_iii_migration", section: "high_risk", prompt: "Is it used for border control, migration, visa examination, or asylum (e.g. risk assessment, polygraphs, document authenticity)?", help: "Annex III point 7 — migration, asylum and border control management.", weight: "hard" },
  { id: "hr_annex_iii_justice", section: "high_risk", prompt: "Is it used to assist judicial authorities in researching/interpreting facts or the law, or influencing the outcome of elections/referenda?", help: "Annex III point 8 — administration of justice and democratic processes.", weight: "hard" },
  { id: "ctx_art6_3_narrow_preparatory", section: "context", prompt: "Art. 6(3) Derogation check: If an Annex III category applies, is the AI strictly limited to a narrow procedural task, improving a completed human activity, detecting patterns without replacing human review, or a preparatory task?", help: "Art. 6(3) exempts Annex III systems that do not pose a significant risk of harm (unless profiling is performed).", weight: "soft" },
  { id: "ctx_art6_3_profiling", section: "context", prompt: "Profiling check (Art. 6(3) final subparagraph): Does the system perform profiling of natural persons within the meaning of GDPR Art. 4(4)?", help: "An Annex III system that performs profiling of natural persons is ALWAYS considered high-risk and cannot claim the Art. 6(3) exemption.", weight: "hard" },
  { id: "ctx_art25_substantial_mod", section: "context", prompt: "Value-chain role escalation (Art. 25): Have you placed your trademark on a third-party system, modified its intended purpose into a high-risk use, or made a substantial modification?", help: "Under Art. 25(1), any deployer, distributor, or importer doing so becomes the Provider with full Art. 8–17 & 43 obligations.", weight: "soft" },
  { id: "lim_interaction", section: "limited", prompt: "Do natural persons interact with the AI system (chatbot, virtual assistant, agent) without it being obvious?", help: "Art. 50(1) transparency — AI interaction disclosure.", weight: "soft" },
  { id: "lim_synthetic", section: "limited", prompt: "Does the system generate or manipulate image, audio, text, or video content that could be mistaken for authentic (deepfakes / synthetic media)?", help: "Art. 50(2) & 50(4) machine-readable synthetic content marking & deepfake disclosure.", weight: "soft" },
  { id: "lim_emotion_biometric_other", section: "limited", prompt: "Does it perform emotion recognition or biometric categorisation outside prohibited/high-risk contexts?", help: "Art. 50(3) transparency and GDPR notice obligations.", weight: "soft" },
  { id: "gpai_model", section: "gpai", prompt: "Is this (or does it embed) a general-purpose AI model that can perform a wide range of distinct tasks?", help: "GPAI obligations (Chapter V, Arts. 51–55) apply to providers of GPAI models.", weight: "soft" },
  { id: "gpai_systemic", section: "gpai", prompt: "If GPAI: does training compute exceed ~10^25 FLOPs or has the Commission designated systemic risk?", help: "Art. 51(2) & Art. 55 systemic-risk GPAI additional red-teaming, incident & cybersecurity obligations.", weight: "soft" },
];

export type ClassificationInput = Record<string, Answer>;

export type ClassificationResult = {
  tier: RiskTier;
  reasons: string[];
  gpai: boolean;
  systemicRiskFlag: boolean;
  art6_3ExemptionClaimed?: boolean;
  art25ProviderEscalation?: boolean;
};

export function classifyAiSystem(answers: ClassificationInput): ClassificationResult {
  const reasons: string[] = [];
  const yes = (qid: string) => answers[qid] === "yes";
  const art25ProviderEscalation = yes("ctx_art25_substantial_mod");

  if (art25ProviderEscalation) {
    reasons.push(
      "Art. 25(1) Role Escalation: Substantial modification, purpose change, or rebranding indicated — entity assumes full Provider obligations.",
    );
  }

  for (const q of CLASSIFICATION_QUESTIONS.filter((x) => x.section === "prohibited")) {
    if (yes(q.id)) reasons.push(`Prohibited practice indicated (${q.id}).`);
  }
  if (reasons.some((r) => r.startsWith("Prohibited"))) {
    return {
      tier: "prohibited",
      reasons,
      gpai: yes("gpai_model"),
      systemicRiskFlag: yes("gpai_systemic"),
      art6_3ExemptionClaimed: false,
      art25ProviderEscalation,
    };
  }

  const annexIProduct = yes("hr_annex_i_product");
  const annexIiiHits = CLASSIFICATION_QUESTIONS.filter(
    (x) => x.section === "high_risk" && x.id !== "hr_annex_i_product" && yes(x.id),
  );

  if (annexIProduct) {
    reasons.push("High-risk Annex I indicator (hr_annex_i_product).");
  }
  for (const q of annexIiiHits) {
    reasons.push(`High-risk Annex III indicator (${q.id}).`);
  }

  if (annexIProduct || annexIiiHits.length > 0) {
    // Check Art. 6(3) derogation (only applies to Annex III systems, never Annex I, and never when profiling is performed)
    const canClaimArt6_3 =
      !annexIProduct &&
      annexIiiHits.length > 0 &&
      yes("ctx_art6_3_narrow_preparatory") &&
      !yes("ctx_art6_3_profiling");

    if (canClaimArt6_3) {
      reasons.push(
        "Art. 6(3) Derogation applied: Annex III use case is restricted to narrow procedural/preparatory tasks without profiling. Mandatory Art. 6(4) written assessment and Art. 49(2) EU database registration still apply.",
      );
    } else {
      if (yes("ctx_art6_3_narrow_preparatory") && yes("ctx_art6_3_profiling")) {
        reasons.push(
          "Art. 6(3) Derogation overridden: System performs profiling of natural persons (Art. 6(3) final subparagraph) and therefore remains High-Risk.",
        );
      }
      return {
        tier: "high_risk",
        reasons,
        gpai: yes("gpai_model"),
        systemicRiskFlag: yes("gpai_systemic"),
        art6_3ExemptionClaimed: false,
        art25ProviderEscalation,
      };
    }
  }

  const art6_3ExemptionClaimed =
    !annexIProduct &&
    annexIiiHits.length > 0 &&
    yes("ctx_art6_3_narrow_preparatory") &&
    !yes("ctx_art6_3_profiling");

  for (const q of CLASSIFICATION_QUESTIONS.filter((x) => x.section === "limited")) {
    if (yes(q.id)) reasons.push(`Limited-risk transparency trigger (${q.id}).`);
  }
  if (reasons.some((r) => r.includes("Limited-risk"))) {
    return {
      tier: "limited",
      reasons,
      gpai: yes("gpai_model"),
      systemicRiskFlag: yes("gpai_systemic"),
      art6_3ExemptionClaimed,
      art25ProviderEscalation,
    };
  }

  if (yes("gpai_model")) {
    reasons.push("GPAI model with no Annex III / Art. 50 triggers → treat as GPAI focus.");
    return {
      tier: "gpai",
      reasons,
      gpai: true,
      systemicRiskFlag: yes("gpai_systemic"),
      art6_3ExemptionClaimed,
      art25ProviderEscalation,
    };
  }

  if (!art6_3ExemptionClaimed) {
    reasons.push("No prohibited, Annex III, or Art. 50 triggers answered yes → minimal risk.");
  }
  return {
    tier: "minimal",
    reasons,
    gpai: false,
    systemicRiskFlag: false,
    art6_3ExemptionClaimed,
    art25ProviderEscalation,
  };
}
