import { getImpactTemplate, type ImpactTemplateId } from "./templates";

export type ImpactAutofillTelemetry = {
  templateId: ImpactTemplateId;
  orgName: string;
  system: {
    id: string;
    name: string;
    description: string;
    purpose?: string;
    intendedPurpose?: string;
    domain: string;
    riskTier: string | null;
    roleInValueChain?: string | null;
    classificationNotes?: string | null;
  };
  fairnessSummary?: string;
  redteamSummary?: string;
  evalSummary?: string;
  existingAnswers?: Record<string, string>;
};

export function synthesizeImpactAnswers(input: ImpactAutofillTelemetry): Record<string, string> {
  const { system, orgName } = input;
  const tier = system.riskTier || "high_risk";
  const role = system.roleInValueChain || "deployer";
  const purpose = system.purpose || system.intendedPurpose || system.description || "Decision-support workflow";

  if (input.templateId === "fria") {
    return {
      fria_processes:
        input.existingAnswers?.fria_processes?.trim() ||
        `${system.name} is deployed by ${orgName} (${role}) within the ${system.domain || "enterprise"} domain. Intended operational purpose: ${purpose}. All outputs are presented to trained human operators prior to any final decision affecting natural persons.`,
      fria_period_frequency:
        input.existingAnswers?.fria_period_frequency?.trim() ||
        `Continuous production operation during business workflows, subject to quarterly governance review and continuous post-market monitoring under EU AI Act Art. 26(5) and Art. 72.`,
      fria_categories_persons:
        input.existingAnswers?.fria_categories_persons?.trim() ||
        `Natural persons interacting with or evaluated within ${system.domain || "enterprise"} workflows (including applicants, customers, employees, or service recipients). Protected subgroup parity is monitored via V77 Trust fairness evaluations (${input.fairnessSummary || "scheduled prior to release"}).`,
      fria_specific_risks:
        input.existingAnswers?.fria_specific_risks?.trim() ||
        `Potential fundamental rights impacts under the EU Charter of Fundamental Rights: Art. 21 (Non-discrimination / algorithmic bias across demographic subgroups), Art. 8 (Protection of personal data), Art. 47 (Right to an effective remedy / explanation), and automation bias. Classification context (${tier.toUpperCase()}): ${system.classificationNotes || "Assessed under EU AI Act Annex III."}`,
      fria_human_oversight:
        input.existingAnswers?.fria_human_oversight?.trim() ||
        `Human-in-the-loop oversight enforced per EU AI Act Art. 14 and Art. 26(2): designated oversight officers have authority and technical capability to inspect rationale, override any AI recommendation, or invoke an immediate stop/fallback switch.`,
      fria_risk_measures:
        input.existingAnswers?.fria_risk_measures?.trim() ||
        `Technical & governance mitigations:\n- Adversarial red-teaming: ${input.redteamSummary || "16-scenario OWASP LLM Top 10 suite"}\n- Scored evaluation suite: ${input.evalSummary || "10-case robustness, PII & hallucination suite"}\n- Subgroup fairness threshold: Four-Fifths Rule (>= 0.80) monitored in /tests/fairness\n- Affected persons may contest outcomes and request human review; serious incidents trigger Art. 73 notification workflows (2 / 10 / 15-day statutory window).`,
      fria_notify_authority:
        input.existingAnswers?.fria_notify_authority?.trim() ||
        `Where required under EU AI Act Art. 27(3) for public bodies or Annex III points 5(b)/(c) deployers, the completed FRIA summary is prepared for notification to the national Market Surveillance Authority using the standardized template.`,
    };
  }

  return {
    dpia_processing_description:
      input.existingAnswers?.dpia_processing_description?.trim() ||
      `Controller / Deployer: ${orgName}. AI System: ${system.name} (${system.domain || "enterprise"}). Purpose: ${purpose}. Lawful basis assessed under GDPR Art. 6(1)(b)/(c)/(f) with explicit human review preventing solely automated decisions under GDPR Art. 22.`,
    dpia_necessity_proportionality:
      input.existingAnswers?.dpia_necessity_proportionality?.trim() ||
      `Processing is strictly limited to features required for ${purpose} (GDPR Art. 5(1)(c) data minimisation). Direct identifiers are pseudonymised/scrubbed prior to model inference, and inference logs follow defined retention schedules aligned with EU AI Act Art. 12 and Art. 19.`,
    dpia_risks_rights:
      input.existingAnswers?.dpia_risks_rights?.trim() ||
      `Identified risks to data subjects (GDPR Art. 35(7)(c)): potential subgroup disparity (${input.fairnessSummary || "monitored via demographic parity & equalized odds"}), prompt injection or training/context PII leakage (${input.redteamSummary || "verified via adversarial testing"}), and inaccurate inference outputs (${input.evalSummary || "verified via groundedness evals"}).`,
    dpia_measures:
      input.existingAnswers?.dpia_measures?.trim() ||
      `Technical & organisational measures (GDPR Art. 32 & Art. 35(7)(d)): role-based access control (RBAC), SHA-256 tamper-evident audit logging, PII refusal guardrails, mandatory human-in-the-loop review (GDPR Art. 22(3)), and continuous post-market drift & incident monitoring.`,
    dpia_consultation:
      input.existingAnswers?.dpia_consultation?.trim() ||
      `Residual risk after technical and organisational controls is assessed as Low-to-Moderate; prior supervisory authority consultation under GDPR Art. 36 is not triggered unless unmitigated high residual risk is identified during DPO review.`,
  };
}

export function renderImpactMarkdown(opts: {
  title: string;
  templateId: string;
  status: string;
  answers: Record<string, string>;
}): string {
  const template = getImpactTemplate(opts.templateId);
  const lines: string[] = [
    `# ${opts.title}`,
    "",
    `- **Template:** ${template?.name || opts.templateId.toUpperCase()}`,
    `- **Legal Basis:** ${template?.legalBasis || "EU AI Act Art. 27 / GDPR Art. 35"}`,
    `- **Status:** ${opts.status.replaceAll("_", " ")}`,
    `- **Exported At:** ${new Date().toISOString()}`,
    "",
  ];
  for (const q of template?.questions || []) {
    lines.push(`## ${q.prompt} (${q.euRef})`);
    lines.push(`_${q.guidance}_`);
    lines.push("");
    lines.push((opts.answers[q.id] || "").trim() || "_Not yet answered._");
    lines.push("");
  }
  return lines.join("\n");
}
