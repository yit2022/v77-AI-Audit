export type ImpactQuestion = {
  id: string;
  prompt: string;
  guidance: string;
  euRef: string;
  required: boolean;
};

export type ImpactTemplate = {
  id: "fria" | "dpia";
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

export const IMPACT_TEMPLATES: ImpactTemplate[] = [FRIA_TEMPLATE, DPIA_TEMPLATE];

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
