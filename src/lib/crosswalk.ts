/**
 * Control library seed + crosswalk helpers.
 * Descriptions are short original paraphrases with article/clause references only.
 * Do NOT invent or reproduce copyrighted ISO standard text.
 * Clause/article numbers are cited only where confidently known from the public legal text
 * (EU AI Act, GDPR, DORA) or ISO/IEC 27001:2022 Annex A control identifiers.
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
  doraRef: string;
  iso27001Ref: string;
  appliesTo: string;
};

export const CONTROL_SEEDS: ControlSeed[] = [
  {
    id: "ctrl-gdpr-01",
    code: "V77-GDPR-01",
    title: "Lawful basis & purpose limitation for AI processing",
    description:
      "Document lawful bases, purposes, and retention for personal data processed by or for the AI system.",
    area: "Data governance & bias",
    euRef: "AI Act Art. 10 interaction with GDPR",
    nistRef: "Govern privacy; Map data risks",
    isoRef: "ISO/IEC 42001 documented information overlapping privacy controls",
    gdprRef: "Arts. 5–6, 13–14",
    doraRef: "",
    iso27001Ref: "A.5.34 (privacy and protection of PII)",
    appliesTo: "high_risk,limited,gpai",
  },
  {
    id: "ctrl-gdpr-02",
    code: "V77-GDPR-02",
    title: "DPIA when AI processing is high risk",
    description:
      "Trigger and retain a DPIA where AI processing is likely high risk to rights and freedoms; link to FRIA when both apply.",
    area: "Impact / rights assessments",
    euRef: "Art. 27 FRIA complementarity",
    nistRef: "Map societal impact",
    isoRef: "ISO/IEC 42005",
    gdprRef: "Arts. 35–36",
    doraRef: "",
    iso27001Ref: "",
    appliesTo: "high_risk,gpai",
  },
  {
    id: "ctrl-gdpr-03",
    code: "V77-GDPR-03",
    title: "Automated decision-making safeguards",
    description:
      "Identify profiling/automated decisions with legal or similarly significant effects; enable human intervention, contestability and meaningful information about the logic involved.",
    area: "Transparency & human oversight",
    euRef: "Art. 14 human oversight complementarity",
    nistRef: "Map human-AI interaction; Govern accountability",
    isoRef: "ISO/IEC 22989 trustworthiness concepts",
    gdprRef: "Arts. 22, 13(2)(f), 14(2)(g), 15(1)(h)",
    doraRef: "",
    iso27001Ref: "",
    appliesTo: "high_risk,limited,gpai",
  },
  {
    id: "ctrl-gdpr-04",
    code: "V77-GDPR-04",
    title: "Data protection by design & default for AI",
    description:
      "Implement technical and organisational measures that minimise personal data and default to privacy-preserving settings across the AI lifecycle.",
    area: "Data governance & bias",
    euRef: "Art. 10 data governance interaction",
    nistRef: "Govern privacy; Map data risks",
    isoRef: "ISO/IEC 42001 operational planning",
    gdprRef: "Art. 25",
    doraRef: "",
    iso27001Ref: "A.8.11 (data masking); A.8.12 (data leakage prevention)",
    appliesTo: "high_risk,limited,gpai",
  },
  {
    id: "ctrl-gdpr-05",
    code: "V77-GDPR-05",
    title: "Special-category data in AI training or inference",
    description:
      "Prohibit or tightly condition processing of special-category data in training, fine-tuning or inference unless a GDPR Art. 9 condition applies and is documented.",
    area: "Data governance & bias",
    euRef: "Art. 10 bias / data quality interaction",
    nistRef: "Measure fairness/bias; Map data risks",
    isoRef: "ISO/IEC TR 24027 bias concepts",
    gdprRef: "Arts. 9, 10",
    doraRef: "",
    iso27001Ref: "A.5.34",
    appliesTo: "high_risk,gpai",
  },

  {
    id: "ctrl-inv-01",
    code: "V77-INV-01",
    title: "AI system inventory & roles",
    description:
      "Maintain an inventory of AI systems with intended purpose and value-chain role (provider, deployer, importer, distributor).",
    area: "AI inventory & roles",
    euRef: "Art. 6; Annex III context; GPAI role distinctions",
    nistRef: "Govern 1.x; Map 1 (context)",
    isoRef: "ISO/IEC 42001 clauses 4–6 (AIMS context & planning); ISO/IEC 22989 roles",
    gdprRef: "Art. 30 (records of processing — where personal data processed)",
    doraRef: "Art. 8 (identification of ICT assets supporting critical/important functions)",
    iso27001Ref: "A.5.9 (inventory of information and other associated assets)",
    appliesTo: "prohibited,high_risk,limited,minimal,gpai",
  },
  {
    id: "ctrl-risk-01",
    code: "V77-RISK-01",
    title: "Risk classification decision",
    description:
      "Document the risk-tier decision (prohibited / high-risk / limited / minimal / GPAI) with questionnaire evidence and exemptions.",
    area: "Risk classification",
    euRef: "Arts. 5–6; Annex I & III; Art. 50; Chapter V GPAI",
    nistRef: "Map 1–2 risk context",
    isoRef: "ISO/IEC 23894; ISO/IEC 42005 impact assessment",
    gdprRef: "",
    doraRef: "Art. 8 (risk identification); Art. 6 (ICT risk management framework)",
    iso27001Ref: "A.5.7 (threat intelligence); A.8.8 (management of technical vulnerabilities)",
    appliesTo: "prohibited,high_risk,limited,minimal,gpai",
  },
  {
    id: "ctrl-rms-01",
    code: "V77-RMS-01",
    title: "Risk management system",
    description:
      "Operate a lifecycle risk management process covering identification, estimation, evaluation, and mitigation for high-risk AI.",
    area: "Risk management system",
    euRef: "Art. 9",
    nistRef: "Govern → Map → Measure → Manage",
    isoRef: "ISO/IEC 23894 aligned to ISO 31000; ISO/IEC 42001 planning",
    gdprRef: "",
    doraRef: "Arts. 5–6 (governance and ICT risk management framework)",
    iso27001Ref: "A.5.1 (policies for information security)",
    appliesTo: "high_risk,gpai",
  },
  {
    id: "ctrl-data-01",
    code: "V77-DATA-01",
    title: "Training & evaluation data governance",
    description:
      "Govern datasets for relevance, representativeness, and bias examination appropriate to the intended purpose.",
    area: "Data governance & bias",
    euRef: "Art. 10",
    nistRef: "Measure 2 (fairness/bias); GAI profile data risks",
    isoRef: "ISO/IEC TR 24027 (bias concepts); ISO/IEC 5259 series (data quality)",
    gdprRef: "Arts. 5–6, 9, 22, 35 (special categories / automated decisions / DPIA)",
    doraRef: "",
    iso27001Ref: "A.8.10 (information deletion); A.8.11 (data masking)",
    appliesTo: "high_risk,gpai",
  },
  {
    id: "ctrl-doc-01",
    code: "V77-DOC-01",
    title: "Technical documentation",
    description:
      "Assemble technical documentation sufficient for conformity assessment and downstream deployer information.",
    area: "Technical documentation",
    euRef: "Art. 11; Annex IV; GPAI documentation duties",
    nistRef: "Map documentation; model/system cards practice",
    isoRef: "ISO/IEC 42001 documented information; ISO/IEC 5338 lifecycle artefacts",
    gdprRef: "",
    doraRef: "Art. 6(4)–(5) (documentation of the ICT risk management framework)",
    iso27001Ref: "A.5.37 (documented operating procedures)",
    appliesTo: "high_risk,gpai",
  },
  {
    id: "ctrl-log-01",
    code: "V77-LOG-01",
    title: "Automatic logging & traceability",
    description:
      "Enable automatic recording of events over the system's lifetime to support traceability and post-market monitoring.",
    area: "Logging & traceability",
    euRef: "Art. 12",
    nistRef: "Measure/Manage monitoring & incident evidence",
    isoRef: "ISO/IEC 5338 continuous validation; overlap with ISO/IEC 27001 logging",
    gdprRef: "Arts. 5(1)(f), 32 (security of processing / logging)",
    doraRef: "Art. 10 (detection); Art. 17 (ICT-related incident management — logging context)",
    iso27001Ref: "A.8.15 (logging); A.8.16 (monitoring activities)",
    appliesTo: "high_risk",
  },
  {
    id: "ctrl-trans-01",
    code: "V77-TRANS-01",
    title: "Transparency & instructions for use",
    description:
      "Provide clear instructions and transparency information so deployers and users understand capabilities and limits.",
    area: "Transparency & human oversight",
    euRef: "Art. 13; Art. 50",
    nistRef: "Govern transparency; Map human-AI interaction",
    isoRef: "ISO/IEC 22989 trustworthiness concepts",
    gdprRef: "Arts. 12–14 (transparency to data subjects)",
    doraRef: "Art. 14 (communication)",
    iso27001Ref: "",
    appliesTo: "high_risk,limited,gpai",
  },
  {
    id: "ctrl-hov-01",
    code: "V77-HOV-01",
    title: "Human oversight measures",
    description:
      "Design oversight measures so natural persons can understand outputs, intervene, and halt the system when needed.",
    area: "Transparency & human oversight",
    euRef: "Art. 14",
    nistRef: "Map human-AI interaction; Govern accountability",
    isoRef: "ISO/IEC 22989; ISO/IEC 42001 operational controls (Annex A reference)",
    gdprRef: "Art. 22 (human intervention in automated decisions)",
    doraRef: "",
    iso27001Ref: "",
    appliesTo: "high_risk",
  },
  {
    id: "ctrl-acc-01",
    code: "V77-ACC-01",
    title: "Accuracy, robustness & cybersecurity",
    description:
      "Achieve appropriate levels of accuracy and robustness and protect against cybersecurity threats and adversarial misuse.",
    area: "Accuracy, robustness, cybersecurity",
    euRef: "Art. 15; GPAI systemic-risk adversarial testing",
    nistRef: "Measure 2 performance & security; GAI adversarial/red-team",
    isoRef: "ISO/IEC TR 24029 (robustness concepts); ISO/IEC 27001 ISMS overlap",
    gdprRef: "Art. 32 (security of processing)",
    doraRef: "Arts. 9–11 (protection, detection, response and recovery)",
    iso27001Ref: "A.8.8; A.8.16; A.5.29 (information security during disruption)",
    appliesTo: "high_risk,gpai",
  },
  {
    id: "ctrl-qms-01",
    code: "V77-QMS-01",
    title: "Quality / AI management system",
    description:
      "Maintain an organisational management system covering policies, roles, and continual improvement for AI compliance.",
    area: "Quality / AI management system",
    euRef: "Art. 17 QMS; EN 18286 pathway (when cited)",
    nistRef: "Govern function as organisational programme",
    isoRef: "ISO/IEC 42001 AIMS (certifiable); ISO/IEC 42006 for certification bodies",
    gdprRef: "",
    doraRef: "Art. 5 (governance and organisation)",
    iso27001Ref: "A.5.1; A.5.2 (information security roles and responsibilities)",
    appliesTo: "high_risk,gpai",
  },
  {
    id: "ctrl-ca-01",
    code: "V77-CA-01",
    title: "Conformity assessment readiness",
    description:
      "Prepare evidence packs and procedures for conformity assessment, CE marking where applicable, and EU database registration.",
    area: "Conformity assessment & audit",
    euRef: "Art. 43; CE mark; EU database",
    nistRef: "Independent evaluation practices (voluntary)",
    isoRef: "ISO/IEC 42006; ISO/IEC 17021 base concepts",
    gdprRef: "",
    doraRef: "",
    iso27001Ref: "",
    appliesTo: "high_risk",
  },
  {
    id: "ctrl-fria-01",
    code: "V77-FRIA-01",
    title: "Fundamental rights impact assessment",
    description:
      "Where required for deployers, perform and retain a fundamental rights impact assessment complementary to any DPIA.",
    area: "Impact / rights assessments",
    euRef: "Art. 27 FRIA",
    nistRef: "Map societal impact; Measure harms",
    isoRef: "ISO/IEC 42005 AI system impact assessment",
    gdprRef: "Arts. 35–36 DPIA (complements FRIA; does not replace)",
    doraRef: "",
    iso27001Ref: "",
    appliesTo: "high_risk",
  },
  {
    id: "ctrl-gpai-01",
    code: "V77-GPAI-01",
    title: "GPAI provider obligations",
    description:
      "For GPAI models: publish/summary documentation, copyright policy, and training-data summary as required; escalate for systemic risk.",
    area: "GPAI / generative AI",
    euRef: "Chapter V GPAI; Code of Practice; systemic risk threshold",
    nistRef: "NIST AI 600-1 Generative AI Profile",
    isoRef: "Lifecycle & risk guidance applied to generative AI",
    gdprRef: "",
    doraRef: "",
    iso27001Ref: "",
    appliesTo: "gpai",
  },
  {
    id: "ctrl-mon-01",
    code: "V77-MON-01",
    title: "Post-market monitoring & incidents",
    description:
      "Operate post-market monitoring and report serious incidents to authorities within required timelines.",
    area: "Continuous monitoring & post-market",
    euRef: "Post-market monitoring; serious-incident reporting (e.g. Art. 73 context)",
    nistRef: "Manage 2–4 monitoring, response, improvement",
    isoRef: "ISO/IEC 42001 performance evaluation & continual improvement",
    gdprRef: "Arts. 33–34 (personal-data breach notification where applicable)",
    doraRef: "Arts. 17–19 (ICT-related incident management and reporting)",
    iso27001Ref: "A.5.24–A.5.26 (incident management); A.5.27 (learning from incidents)",
    appliesTo: "high_risk,gpai",
  },
  {
    id: "ctrl-fair-01",
    code: "V77-FAIR-01",
    title: "Fairness testing evidence",
    description:
      "Run and retain group fairness evaluations (e.g. demographic parity, equalized odds) on relevant prediction slices.",
    area: "Data governance & bias",
    euRef: "Art. 10 bias detection/correction concepts",
    nistRef: "Measure 2 fairness/bias",
    isoRef: "ISO/IEC TR 24027 bias concepts",
    gdprRef: "Arts. 5(1)(a), 9, 22 (fairness / special category / profiling)",
    doraRef: "",
    iso27001Ref: "",
    appliesTo: "high_risk,limited,gpai",
  },
  {
    id: "ctrl-rt-01",
    code: "V77-RT-01",
    title: "Adversarial / red-team testing",
    description:
      "Execute jailbreak, prompt-injection, and exfiltration prompt suites against LLM/agent systems and triage failures.",
    area: "Accuracy, robustness, cybersecurity",
    euRef: "Art. 15; GPAI systemic-risk adversarial testing",
    nistRef: "GAI adversarial/red-team actions",
    isoRef: "Robustness evaluation concepts (TR 24029 family)",
    gdprRef: "",
    doraRef: "Art. 24 (advanced testing of ICT tools — digital operational resilience testing context)",
    iso27001Ref: "A.8.8; A.5.7",
    appliesTo: "high_risk,limited,gpai",
  },

  {
    id: "ctrl-dora-01",
    code: "V77-DORA-01",
    title: "ICT risk management for AI-supporting systems",
    description:
      "For financial entities in scope of DORA: include AI platforms that support critical or important functions in the ICT risk management framework, with clear accountability.",
    area: "Financial ICT resilience (DORA)",
    euRef: "AI Act risk management interaction for financial deployers",
    nistRef: "Govern organisational accountability; Manage response",
    isoRef: "ISO/IEC 42001 planning overlapping ICT risk programmes",
    gdprRef: "",
    doraRef: "Arts. 5–6 (Regulation (EU) 2022/2554)",
    iso27001Ref: "A.5.1; A.5.29",
    appliesTo: "high_risk,limited,gpai",
  },
  {
    id: "ctrl-dora-02",
    code: "V77-DORA-02",
    title: "ICT third-party risk for AI vendors",
    description:
      "Assess and contractually manage ICT third-party providers that supply AI models, hosting or related services supporting critical or important functions.",
    area: "Financial ICT resilience (DORA)",
    euRef: "Provider / deployer value-chain duties (AI Act Chapters III–V context)",
    nistRef: "Govern supply chain; Map third-party context",
    isoRef: "ISO/IEC 42001 external provider controls (Annex A themes)",
    gdprRef: "Art. 28 (processors) where personal data is processed",
    doraRef: "Arts. 28–30 (ICT third-party risk)",
    iso27001Ref: "A.5.19–A.5.21 (supplier relationships); A.5.23 (cloud services)",
    appliesTo: "high_risk,limited,gpai",
  },
  {
    id: "ctrl-dora-03",
    code: "V77-DORA-03",
    title: "ICT-related incident response for AI outages",
    description:
      "Classify, manage and report major ICT-related incidents affecting AI systems that support critical or important functions within DORA timelines.",
    area: "Financial ICT resilience (DORA)",
    euRef: "Serious-incident reporting interaction (AI Act)",
    nistRef: "Manage incident response",
    isoRef: "ISO/IEC 42001 incident-related continual improvement themes",
    gdprRef: "Arts. 33–34 where a personal-data breach coincides",
    doraRef: "Arts. 17–19",
    iso27001Ref: "A.5.24–A.5.27",
    appliesTo: "high_risk,gpai",
  },
  {
    id: "ctrl-iso27-01",
    code: "V77-ISO27-01",
    title: "Access control for AI admin & model endpoints",
    description:
      "Enforce least-privilege access to model endpoints, training pipelines, prompt stores and admin consoles; review privileged access regularly.",
    area: "Information security (ISO 27001)",
    euRef: "Art. 15 cybersecurity complementarity",
    nistRef: "Govern access; Measure security",
    isoRef: "ISO/IEC 42001 operational security themes",
    gdprRef: "Art. 32",
    doraRef: "Art. 9 (protection and prevention)",
    iso27001Ref: "A.5.15 (access control); A.8.2 (privileged access rights); A.8.3 (information access restriction)",
    appliesTo: "high_risk,limited,gpai",
  },
  {
    id: "ctrl-iso27-02",
    code: "V77-ISO27-02",
    title: "Secure development & change for AI systems",
    description:
      "Apply secure development and change-management practices to AI system releases, including review of model and prompt changes that affect security posture.",
    area: "Information security (ISO 27001)",
    euRef: "Art. 15; Art. 9 risk management lifecycle",
    nistRef: "Measure/Manage change & validation",
    isoRef: "ISO/IEC 5338 lifecycle; ISO/IEC 42001 operational planning",
    gdprRef: "",
    doraRef: "Art. 7 (ICT systems, protocols and tools); Art. 9",
    iso27001Ref: "A.8.25–A.8.29 (secure development and change themes)",
    appliesTo: "high_risk,gpai",
  },
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
