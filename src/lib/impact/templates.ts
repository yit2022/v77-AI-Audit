export type ImpactQuestion = {
  id: string;
  prompt: string;
  guidance: string;
  euRef: string;
  required: boolean;
};

export type ImpactTemplateId =
  | "fria"
  | "dpia"
  | "us_aia"
  | "uk_atrs"
  | "au_guardrails"
  | "nz_charter";

export type ImpactTemplate = {
  id: ImpactTemplateId;
  jurisdiction?: "eu" | "us" | "uk" | "au" | "nz";
  name: string;
  description: string;
  legalBasis: string;
  questions: ImpactQuestion[];
};

export const FRIA_TEMPLATE: ImpactTemplate = {
  id: "fria",
  name: "Fundamental Rights Impact Assessment (FRIA)",
  description:
    "Deployer FRIA for high-risk AI systems under Article 27 of the EU AI Act. Complements — does not replace — a GDPR DPIA.",
  legalBasis: "EU AI Act Art. 27",
  questions: [
    {
      id: "fria_processes",
      prompt: "Describe the processes in which the high-risk AI system will be used.",
      guidance: "Cover intended purpose, operational context, and human roles.",
      euRef: "Art. 27(1)(a)",
      required: true,
    },
    {
      id: "fria_period_frequency",
      prompt: "Over what period and with what frequency will the system be used?",
      guidance: "State start window, cadence, and whether use is continuous or episodic.",
      euRef: "Art. 27(1)(b)",
      required: true,
    },
    {
      id: "fria_categories_persons",
      prompt: "Which categories of natural persons and groups are likely to be affected?",
      guidance: "Include workers, customers, vulnerable groups, and any proxies for protected characteristics.",
      euRef: "Art. 27(1)(c)",
      required: true,
    },
    {
      id: "fria_specific_risks",
      prompt: "What specific risks of harm to fundamental rights are reasonably foreseeable?",
      guidance: "Map to Charter rights (e.g. non-discrimination, privacy, fair trial, labour rights).",
      euRef: "Art. 27(1)(d)",
      required: true,
    },
    {
      id: "fria_human_oversight",
      prompt: "What human oversight measures will be implemented per the instructions for use?",
      guidance: "Describe who can intervene, override, or stop the system and how.",
      euRef: "Art. 27(1)(e)",
      required: true,
    },
    {
      id: "fria_risk_measures",
      prompt: "Which measures will be taken if risks materialise, including internal governance and complaint mechanisms?",
      guidance: "Include escalation paths, redress channels, and incident response.",
      euRef: "Art. 27(1)(f)",
      required: true,
    },
    {
      id: "fria_notify_authority",
      prompt: "Will the completed FRIA (or summary) be notified to the relevant market surveillance authority where required?",
      guidance: "Record the authority, timing, and any exemptions relied upon.",
      euRef: "Art. 27(3)",
      required: false,
    },
  ],
};

export const DPIA_TEMPLATE: ImpactTemplate = {
  id: "dpia",
  name: "Data Protection Impact Assessment (DPIA)",
  description:
    "GDPR Arts. 35–36 DPIA template aligned for AI processing. Complements an Art. 27 FRIA when both apply; neither replaces the other.",
  legalBasis: "GDPR Arts. 35–36 (complements EU AI Act Art. 27)",
  questions: [
    {
      id: "dpia_processing_description",
      prompt: "Describe the processing operations, purposes, and legal bases.",
      guidance: "Include controllers/processors, data flows, and AI inference steps.",
      euRef: "GDPR Art. 35(7)(a)",
      required: true,
    },
    {
      id: "dpia_necessity_proportionality",
      prompt: "Assess necessity and proportionality of the processing relative to purposes.",
      guidance: "Justify data minimisation, retention, and alternatives considered.",
      euRef: "GDPR Art. 35(7)(b)",
      required: true,
    },
    {
      id: "dpia_risks_rights",
      prompt: "What risks to the rights and freedoms of data subjects does the AI processing create?",
      guidance: "Cover bias, profiling, automated decisions, security, and special-category data.",
      euRef: "GDPR Art. 35(7)(c)",
      required: true,
    },
    {
      id: "dpia_measures",
      prompt: "Which measures address those risks (technical and organisational)?",
      guidance: "Include access control, anonymisation, human review, DPA consultation triggers.",
      euRef: "GDPR Art. 35(7)(d)",
      required: true,
    },
    {
      id: "dpia_consultation",
      prompt: "Is prior consultation with a supervisory authority required under Art. 36?",
      guidance: "State residual high risk after measures and any consultation outcome.",
      euRef: "GDPR Art. 36",
      required: false,
    },
  ],
};

export const US_AIA_TEMPLATE: ImpactTemplate = {
  id: "us_aia",
  jurisdiction: "us",
  name: "US High-Risk AI & Bias Impact Assessment (CO SB 24-205 / NYC LL144 / NIST AI RMF)",
  description:
    "Unified US impact & bias audit assessment covering Colorado SB 24-205 High-Risk AI annual impact assessments, NYC Local Law 144 AEDT independent bias audit requirements, California CCPA ADMT risk assessments, and NIST AI RMF 1.0 (GOVERN / MAP / MEASURE / MANAGE).",
  legalBasis: "Colorado SB 24-205 § 6-1-1703(3) · NYC Local Law 144 · NIST AI RMF 1.0",
  questions: [
    {
      id: "us_purpose_benefits",
      prompt: "State the purpose, intended use cases, deployment context, and benefits of the high-risk AI system.",
      guidance: "Document specific consequential decisions supported (employment, credit, insurance, healthcare, housing, education, legal).",
      euRef: "CO SB 24-205 § 6-1-1703(3)(a)(I) · NIST MAP 1.1",
      required: true,
    },
    {
      id: "us_algorithmic_discrimination_analysis",
      prompt: "Analyze whether the deployment poses any known or reasonably foreseeable risks of algorithmic discrimination and steps taken to mitigate them.",
      guidance: "Include NYC LL144 / EEOC Uniform Guidelines Four-Fifths (80%) impact ratio results across sex, race/ethnicity, and intersectional subgroups.",
      euRef: "CO SB 24-205 § 6-1-1703(3)(a)(II) · NYC LL144 § 20-871 · NIST MEASURE 2.11",
      required: true,
    },
    {
      id: "us_data_categories_outputs",
      prompt: "Describe the categories of data processed as inputs and the outputs produced by the high-risk AI system.",
      guidance: "Include training/customization data provenance, California AB 2013 synthetic data summary, and PII/CCPA ADMT safeguards.",
      euRef: "CO SB 24-205 § 6-1-1703(3)(a)(III)–(IV) · CA AB 2013",
      required: true,
    },
    {
      id: "us_performance_transparency_metrics",
      prompt: "Summarize the performance metrics, known limitations, and pre-deployment evaluation results.",
      guidance: "Reference V77 Trust Scored Evals and OWASP LLM Top 10 / NIST AI 600-1 adversarial red-team runs.",
      euRef: "CO SB 24-205 § 6-1-1703(3)(a)(V) · NIST MEASURE 2.5–2.7",
      required: true,
    },
    {
      id: "us_consumer_notice_adverse_action",
      prompt: "Describe the pre-decision consumer notice, human oversight, adverse action explanation, and appeal/opt-out rights.",
      guidance: "Cover Colorado consumer notice & correction/appeal rights, NYC LL144 10-business-day candidate notice, and CCPA ADMT opt-out.",
      euRef: "CO SB 24-205 § 6-1-1703(4)–(5) · CA CCPA ADMT",
      required: true,
    },
    {
      id: "us_post_deployment_ag_reporting",
      prompt: "Outline ongoing post-deployment monitoring and the 90-day Attorney General notification protocol if algorithmic discrimination is discovered.",
      guidance: "Specify monitoring cadence, affirmative defense alignment with NIST AI RMF (§ 6-1-1706), and AG disclosure triggers.",
      euRef: "CO SB 24-205 § 6-1-1703(7) & § 6-1-1706 · NIST MANAGE 4.1",
      required: true,
    },
  ],
};

export const UK_ATRS_TEMPLATE: ImpactTemplate = {
  id: "uk_atrs",
  jurisdiction: "uk",
  name: "UK Algorithmic Transparency (ATRS) & ICO AI Data Protection Assessment",
  description:
    "Combined UK assessment covering the UK Algorithmic Transparency Recording Standard (ATRS Tier 1 & Tier 2) for public-sector and regulated suppliers, UK GDPR Art. 22 / Art. 35 AI DPIA, and the UK DSIT 5 Cross-Sector AI Principles.",
  legalBasis: "UK GDPR Arts. 22 & 35 · Data (Use and Access) Act 2025 · UK DSIT 5 Principles · UK ATRS",
  questions: [
    {
      id: "uk_atrs_tier1_summary",
      prompt: "Tier 1 Public Summary: How is this algorithmic tool used, why is it used, and who is accountable for the decision?",
      guidance: "Write in plain English suitable for public ATRS publication, naming the Senior Responsible Owner (SRO) and organizational role.",
      euRef: "UK ATRS Tier 1 · DSIT Contestability & Redress",
      required: true,
    },
    {
      id: "uk_atrs_architecture_data",
      prompt: "Tier 2 Technical Specification: Describe system architecture, model type, training/operational data sources, and lawful basis under UK GDPR.",
      guidance: "Cover UK GDPR Art. 5(1)(a) fairness, Art. 6 lawful basis, and data sharing/retention schedules.",
      euRef: "UK ATRS Tier 2 · UK GDPR Arts. 5, 6 & 35",
      required: true,
    },
    {
      id: "uk_equality_fairness_impact",
      prompt: "Equality Act 2010 & Fairness Assessment: How have risks of direct or indirect discrimination across protected characteristics been tested and mitigated?",
      guidance: "Include Public Sector Equality Duty (PSED s.149) considerations and subgroup parity metrics.",
      euRef: "UK Equality Act 2010 s.149 · ICO AI Guidance (Fairness)",
      required: true,
    },
    {
      id: "uk_safety_robustness_testing",
      prompt: "Safety, Security & Robustness: What adversarial testing, hallucination benchmarks, and model risk management controls are in place?",
      guidance: "Reference UK AISI / NCSC Guidelines for Secure AI System Development and PRA SS1/23 / FCA Consumer Duty where applicable.",
      euRef: "DSIT Principle 1 (Safety, Security & Robustness) · NCSC AI Guidelines",
      required: true,
    },
    {
      id: "uk_human_oversight_contestability",
      prompt: "Human Oversight, Explainability & Contestability: How can affected individuals understand outcomes, request human intervention, and contest decisions?",
      guidance: "Align with UK GDPR Art. 22 / Data (Use and Access) Act 2025 safeguards and ICO 'Explaining Decisions Made with AI'.",
      euRef: "UK GDPR Art. 22 · DSIT Principle 2 & 5",
      required: true,
    },
  ],
};

export const AU_GUARDRAILS_TEMPLATE: ImpactTemplate = {
  id: "au_guardrails",
  jurisdiction: "au",
  name: "Australia 10 Mandatory High-Risk AI Guardrails (VAISS) & OAIC APP 1 Assessment",
  description:
    "Conformity assessment against Australia's 10 Mandatory Guardrails for AI in High-Risk Settings (DISR / Voluntary AI Safety Standard VAISS), Privacy Act 1988 APP 1 Automated Decision-Making (ADM) transparency, and NSW AI Assessment Framework.",
  legalBasis: "Australia DISR 10 Mandatory High-Risk AI Guardrails · Privacy Act 1988 (APP 1 ADM) · APRA CPS 230/234",
  questions: [
    {
      id: "au_guardrails_1_2_accountability_risk",
      prompt: "Guardrails 1 & 2 (Accountability & Risk Management): Identify the accountable executive owner and continuous AI risk management processes.",
      guidance: "Specify governance structures, regulatory compliance owners, and ongoing risk registers across the AI lifecycle.",
      euRef: "AU Guardrail 1 & 2 · APRA CPS 230",
      required: true,
    },
    {
      id: "au_guardrails_3_4_data_testing",
      prompt: "Guardrails 3 & 4 (Data Governance, Testing & Monitoring): How is data provenance governed and how is the system tested pre- and post-deployment?",
      guidance: "Include Privacy Act 1988 compliance, bias/fairness testing, adversarial red-teaming, and APRA CPS 234 security controls.",
      euRef: "AU Guardrail 3 & 4 · OAIC Privacy Act · APRA CPS 234",
      required: true,
    },
    {
      id: "au_guardrails_5_6_7_oversight_disclosure_contestability",
      prompt: "Guardrails 5, 6 & 7 (Human Oversight, End-User Disclosure & Contestability): How is meaningful human control maintained and how are users informed and able to challenge AI outcomes?",
      guidance: "Include Privacy Act APP 1 privacy policy disclosure of Automated Decision-Making (ADM) that significantly affects individuals' rights.",
      euRef: "AU Guardrail 5, 6 & 7 · Privacy Act APP 1 (ADM Reform)",
      required: true,
    },
    {
      id: "au_guardrails_8_9_10_supply_chain_conformity",
      prompt: "Guardrails 8, 9 & 10 (Supply Chain Transparency, Audit Records & Conformity Assessment): How are upstream models documented, logs retained, and conformity verified?",
      guidance: "Detail supply-chain model cards, tamper-evident compliance records (Guardrail 9), and internal/third-party conformity sign-off (Guardrail 10).",
      euRef: "AU Guardrail 8, 9 & 10",
      required: true,
    },
  ],
};

export const NZ_CHARTER_TEMPLATE: ImpactTemplate = {
  id: "nz_charter",
  jurisdiction: "nz",
  name: "New Zealand Privacy Act 2020 (IPP 1–13) & Algorithm Charter Assessment",
  description:
    "Assessment aligned with the Office of the Privacy Commissioner (OPC) AI & IPP 1–13 Guidance, the Algorithm Charter for Aotearoa New Zealand, the NZ Public Service AI Framework, and Te Tiriti o Waitangi / Māori Data Sovereignty principles.",
  legalBasis: "NZ Privacy Act 2020 (IPP 1–13) · Algorithm Charter for Aotearoa NZ · NZ Public Service AI Framework",
  questions: [
    {
      id: "nz_purpose_ipp1_3_transparency",
      prompt: "IPP 1–4 & Algorithm Charter Transparency: Plainly explain how the algorithm works, why personal information is collected, and how affected individuals are notified.",
      guidance: "Align with Privacy Act 2020 IPP 1 (purpose), IPP 3 (openness/notification), and Algorithm Charter transparency commitments.",
      euRef: "NZ Privacy Act 2020 IPP 1–4 · Algorithm Charter (Transparency)",
      required: true,
    },
    {
      id: "nz_te_tiriti_maori_data_sovereignty",
      prompt: "Partnership & Māori Data Sovereignty: How does the system embed a Te Tiriti o Waitangi perspective and safeguard Māori data governance and equity?",
      guidance: "Detail stakeholder consultation, assessment of disparate impact on Māori and Pasifika communities, and data governance safeguards.",
      euRef: "Algorithm Charter (Partnership) · Te Mana Raraunga Principles",
      required: true,
    },
    {
      id: "nz_ipp8_accuracy_bias_testing",
      prompt: "IPP 8 Accuracy, Bias & Safety Testing: What steps verify that AI inputs/outputs are accurate, up to date, complete, not misleading, and free from unfair bias?",
      guidance: "Before using information via an AI system, IPP 8 requires taking reasonable steps to ensure accuracy; reference V77 Evals, Fairness, and Red-Team results.",
      euRef: "NZ Privacy Act 2020 IPP 8 · Algorithm Charter (Data & Peer Review)",
      required: true,
    },
    {
      id: "nz_human_oversight_appeals_ipp11",
      prompt: "Human Oversight, Appeals & IPP 5/11/12 Safeguards: Nominate the accountable point of contact, appeal channel, security controls, and cross-border disclosure rules.",
      guidance: "Cover human review of significant decisions, appeals process, IPP 5 security safeguards, and IPP 12 cross-border cloud LLM protections.",
      euRef: "NZ Privacy Act 2020 IPP 5, 11 & 12 · Algorithm Charter (Human Oversight)",
      required: true,
    },
  ],
};

export const IMPACT_TEMPLATES: ImpactTemplate[] = [
  FRIA_TEMPLATE,
  DPIA_TEMPLATE,
  US_AIA_TEMPLATE,
  UK_ATRS_TEMPLATE,
  AU_GUARDRAILS_TEMPLATE,
  NZ_CHARTER_TEMPLATE,
];

export function getImpactTemplate(id: string): ImpactTemplate | undefined {
  return IMPACT_TEMPLATES.find((t) => t.id === id);
}

export function validateImpactAnswers(
  templateId: string,
  answers: Record<string, string>,
): { ok: boolean; missing: string[] } {
  const template = getImpactTemplate(templateId);
  if (!template) return { ok: false, missing: ["unknown_template"] };
  const missing = template.questions
    .filter((q) => q.required && !(answers[q.id]?.trim()))
    .map((q) => q.id);
  return { ok: missing.length === 0, missing };
}
