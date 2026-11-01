/**
 * Control library seed + crosswalk helpers.
 * Descriptions are short original paraphrases with article/clause references only.
 * Do NOT invent or reproduce copyrighted ISO standard text.
 */

export type ControlSeed = {
  id: string;
  code: string;
  title: string;
  description: string;
  area: string;
  euRef: string;
  nistRef: string;
  isoRef: string;
  gdprRef: string;
  appliesTo: string;
};

export const CONTROL_SEEDS: ControlSeed[] = [
  { id: "ctrl-gdpr-01", code: "V77-GDPR-01", title: "Lawful basis & purpose limitation for AI processing", description: "Document lawful bases, purposes, and retention for personal data processed by or for the AI system.", area: "Data governance & bias", euRef: "AI Act Art. 10 interaction with GDPR", nistRef: "Govern privacy; Map data risks", isoRef: "ISO/IEC 42001 documented information overlapping privacy controls", gdprRef: "Arts. 5–6, 13–14", appliesTo: "high_risk,limited,gpai" },
  { id: "ctrl-gdpr-02", code: "V77-GDPR-02", title: "DPIA when AI processing is high risk", description: "Trigger and retain a DPIA where AI processing is likely high risk to rights and freedoms; link to FRIA when both apply.", area: "Impact / rights assessments", euRef: "Art. 27 FRIA complementarity", nistRef: "Map societal impact", isoRef: "ISO/IEC 42005", gdprRef: "Arts. 35–36", appliesTo: "high_risk,gpai" },

  { id: "ctrl-inv-01", code: "V77-INV-01", title: "AI system inventory & roles", description: "Maintain an inventory of AI systems with intended purpose and value-chain role (provider, deployer, importer, distributor).", area: "AI inventory & roles", euRef: "Art. 6; Annex III context; GPAI role distinctions", nistRef: "Govern 1.x; Map 1 (context)", isoRef: "ISO/IEC 42001 clauses 4–6 (AIMS context & planning); ISO/IEC 22989 roles", gdprRef: "Art. 30 (records of processing — where personal data processed)", appliesTo: "prohibited,high_risk,limited,minimal,gpai" },
  { id: "ctrl-risk-01", code: "V77-RISK-01", title: "Risk classification decision", description: "Document the risk-tier decision (prohibited / high-risk / limited / minimal / GPAI) with questionnaire evidence and exemptions.", area: "Risk classification", euRef: "Arts. 5–6; Annex I & III; Art. 50; Chapter V GPAI", nistRef: "Map 1–2 risk context", isoRef: "ISO/IEC 23894; ISO/IEC 42005 impact assessment", gdprRef: "", appliesTo: "prohibited,high_risk,limited,minimal,gpai" },
  { id: "ctrl-rms-01", code: "V77-RMS-01", title: "Risk management system", description: "Operate a lifecycle risk management process covering identification, estimation, evaluation, and mitigation for high-risk AI.", area: "Risk management system", euRef: "Art. 9", nistRef: "Govern → Map → Measure → Manage", isoRef: "ISO/IEC 23894 aligned to ISO 31000; ISO/IEC 42001 planning", gdprRef: "", appliesTo: "high_risk,gpai" },
  { id: "ctrl-data-01", code: "V77-DATA-01", title: "Training & evaluation data governance", description: "Govern datasets for relevance, representativeness, and bias examination appropriate to the intended purpose.", area: "Data governance & bias", euRef: "Art. 10", nistRef: "Measure 2 (fairness/bias); GAI profile data risks", isoRef: "ISO/IEC TR 24027 (bias concepts); ISO/IEC 5259 series (data quality)", gdprRef: "Arts. 5–6, 9, 22, 35 (special categories / automated decisions / DPIA)", appliesTo: "high_risk,gpai" },
  { id: "ctrl-doc-01", code: "V77-DOC-01", title: "Technical documentation", description: "Assemble technical documentation sufficient for conformity assessment and downstream deployer information.", area: "Technical documentation", euRef: "Art. 11; Annex IV; GPAI documentation duties", nistRef: "Map documentation; model/system cards practice", isoRef: "ISO/IEC 42001 documented information; ISO/IEC 5338 lifecycle artefacts", gdprRef: "", appliesTo: "high_risk,gpai" },
  { id: "ctrl-log-01", code: "V77-LOG-01", title: "Automatic logging & traceability", description: "Enable automatic recording of events over the system's lifetime to support traceability and post-market monitoring.", area: "Logging & traceability", euRef: "Art. 12", nistRef: "Measure/Manage monitoring & incident evidence", isoRef: "ISO/IEC 5338 continuous validation; overlap with ISO/IEC 27001 logging", gdprRef: "Arts. 5(1)(f), 32 (security of processing / logging)", appliesTo: "high_risk" },
  { id: "ctrl-trans-01", code: "V77-TRANS-01", title: "Transparency & instructions for use", description: "Provide clear instructions and transparency information so deployers and users understand capabilities and limits.", area: "Transparency & human oversight", euRef: "Art. 13; Art. 50", nistRef: "Govern transparency; Map human-AI interaction", isoRef: "ISO/IEC 22989 trustworthiness concepts", gdprRef: "Arts. 12–14 (transparency to data subjects)", appliesTo: "high_risk,limited,gpai" },
  { id: "ctrl-hov-01", code: "V77-HOV-01", title: "Human oversight measures", description: "Design oversight measures so natural persons can understand outputs, intervene, and halt the system when needed.", area: "Transparency & human oversight", euRef: "Art. 14", nistRef: "Map human-AI interaction; Govern accountability", isoRef: "ISO/IEC 22989; ISO/IEC 42001 operational controls (Annex A reference)", gdprRef: "Art. 22 (human intervention in automated decisions)", appliesTo: "high_risk" },
  { id: "ctrl-acc-01", code: "V77-ACC-01", title: "Accuracy, robustness & cybersecurity", description: "Achieve appropriate levels of accuracy and robustness and protect against cybersecurity threats and adversarial misuse.", area: "Accuracy, robustness, cybersecurity", euRef: "Art. 15; GPAI systemic-risk adversarial testing", nistRef: "Measure 2 performance & security; GAI adversarial/red-team", isoRef: "ISO/IEC TR 24029 (robustness concepts); ISO/IEC 27001 ISMS overlap", gdprRef: "", appliesTo: "high_risk,gpai" },
  { id: "ctrl-qms-01", code: "V77-QMS-01", title: "Quality / AI management system", description: "Maintain an organisational management system covering policies, roles, and continual improvement for AI compliance.", area: "Quality / AI management system", euRef: "Art. 17 QMS; EN 18286 pathway (when cited)", nistRef: "Govern function as organisational programme", isoRef: "ISO/IEC 42001 AIMS (certifiable); ISO/IEC 42006 for certification bodies", gdprRef: "", appliesTo: "high_risk,gpai" },
  { id: "ctrl-ca-01", code: "V77-CA-01", title: "Conformity assessment readiness", description: "Prepare evidence packs and procedures for conformity assessment, CE marking where applicable, and EU database registration.", area: "Conformity assessment & audit", euRef: "Art. 43; CE mark; EU database", nistRef: "Independent evaluation practices (voluntary)", isoRef: "ISO/IEC 42006; ISO/IEC 17021 base concepts", gdprRef: "", appliesTo: "high_risk" },
  { id: "ctrl-fria-01", code: "V77-FRIA-01", title: "Fundamental rights impact assessment", description: "Where required for deployers, perform and retain a fundamental rights impact assessment complementary to any DPIA.", area: "Impact / rights assessments", euRef: "Art. 27 FRIA", nistRef: "Map societal impact; Measure harms", isoRef: "ISO/IEC 42005 AI system impact assessment", gdprRef: "Arts. 35–36 DPIA (complements FRIA; does not replace)", appliesTo: "high_risk" },
  { id: "ctrl-gpai-01", code: "V77-GPAI-01", title: "GPAI provider obligations", description: "For GPAI models: publish/summary documentation, copyright policy, and training-data summary as required; escalate for systemic risk.", area: "GPAI / generative AI", euRef: "Chapter V GPAI; Code of Practice; systemic risk threshold", nistRef: "NIST AI 600-1 Generative AI Profile", isoRef: "Lifecycle & risk guidance applied to generative AI", gdprRef: "", appliesTo: "gpai" },
  { id: "ctrl-mon-01", code: "V77-MON-01", title: "Post-market monitoring & incidents", description: "Operate post-market monitoring and report serious incidents to authorities within required timelines.", area: "Continuous monitoring & post-market", euRef: "Post-market monitoring; serious-incident reporting", nistRef: "Manage 2–4 monitoring, response, improvement", isoRef: "ISO/IEC 42001 performance evaluation & continual improvement", gdprRef: "", appliesTo: "high_risk,gpai" },
  { id: "ctrl-fair-01", code: "V77-FAIR-01", title: "Fairness testing evidence", description: "Run and retain group fairness evaluations (e.g. demographic parity, equalized odds) on relevant prediction slices.", area: "Data governance & bias", euRef: "Art. 10 bias detection/correction concepts", nistRef: "Measure 2 fairness/bias", isoRef: "ISO/IEC TR 24027 bias concepts", gdprRef: "Arts. 5(1)(a), 9, 22 (fairness / special category / profiling)", appliesTo: "high_risk,limited,gpai" },
  { id: "ctrl-rt-01", code: "V77-RT-01", title: "Adversarial / red-team testing", description: "Execute jailbreak, prompt-injection, and exfiltration prompt suites against LLM/agent systems and triage failures.", area: "Accuracy, robustness, cybersecurity", euRef: "Art. 15; GPAI systemic-risk adversarial testing", nistRef: "GAI adversarial/red-team actions", isoRef: "Robustness evaluation concepts (TR 24029 family)", gdprRef: "", appliesTo: "high_risk,limited,gpai" },
];

export function controlsForTier(tier: string | null | undefined): ControlSeed[] {
  if (!tier) return CONTROL_SEEDS;
  return CONTROL_SEEDS.filter((c) => c.appliesTo.split(",").map((s) => s.trim()).includes(tier));
}

export function findControlByCode(code: string): ControlSeed | undefined {
  return CONTROL_SEEDS.find((c) => c.code === code);
}

export function crosswalkByArea(): Record<string, ControlSeed[]> {
  return CONTROL_SEEDS.reduce<Record<string, ControlSeed[]>>((acc, c) => {
    (acc[c.area] ??= []).push(c);
    return acc;
  }, {});
}
