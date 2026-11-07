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

  if (input.templateId === "us_aia") {
    return {
      us_purpose_benefits:
        input.existingAnswers?.us_purpose_benefits?.trim() ||
        `Deployer / Developer: ${orgName} (${role}). System: ${system.name} operating in the ${system.domain || "enterprise"} domain. Intended purpose and consequential decision context: ${purpose}. Expected benefits include consistent, auditable decision support under human review.`,
      us_algorithmic_discrimination_analysis:
        input.existingAnswers?.us_algorithmic_discrimination_analysis?.trim() ||
        `Evaluated against Colorado SB 24-205 § 6-1-1703(3) and NYC Local Law 144 / EEOC Four-Fifths (80%) impact ratio thresholds. Subgroup fairness telemetry: ${input.fairnessSummary || "Monitored in V77 Fairness Lab (/tests/fairness) across protected demographic classes"}. Features acting as direct proxies for protected classes are excluded prior to inference.`,
      us_data_categories_outputs:
        input.existingAnswers?.us_data_categories_outputs?.trim() ||
        `Input categories: structured and unstructured records strictly necessary for ${purpose} within ${system.domain || "enterprise"} workflows. Outputs: advisory recommendations and confidence scores presented to trained human reviewers. Direct PII is minimized and governed per California CCPA ADMT and AB 2013 data provenance requirements.`,
      us_performance_transparency_metrics:
        input.existingAnswers?.us_performance_transparency_metrics?.trim() ||
        `Pre-deployment & continuous evaluation results:\n- Scored Evaluation Suite (NIST AI RMF MEASURE 2.5): ${input.evalSummary || "10-case quality, groundedness & PII suite"}\n- Adversarial Red-Team (NIST AI 600-1 / OWASP LLM Top 10): ${input.redteamSummary || "16-scenario adversarial suite"}`,
      us_consumer_notice_adverse_action:
        input.existingAnswers?.us_consumer_notice_adverse_action?.trim() ||
        `Consumers/candidates receive pre-decision notice that ${system.name} assists evaluation (CO SB 24-205 § 6-1-1703(4); NYC LL144 10-business-day notice). Where an adverse consequential decision occurs, affected individuals receive principal reason disclosures, the right to correct inaccurate personal data, and a human appeal workflow.`,
      us_post_deployment_ag_reporting:
        input.existingAnswers?.us_post_deployment_ag_reporting?.trim() ||
        `Continuous post-deployment drift and bias monitoring is active under NIST AI RMF MANAGE 4.1 (establishing affirmative defense alignment under CO SB 24-205 § 6-1-1706). Any credible discovery of algorithmic discrimination triggers the V77 Incident Register workflow for mandatory Colorado Attorney General disclosure within 90 days (§ 6-1-1703(7)).`,
    };
  }

  if (input.templateId === "uk_atrs") {
    return {
      uk_atrs_tier1_summary:
        input.existingAnswers?.uk_atrs_tier1_summary?.trim() ||
        `Organisation: ${orgName} (${role}). System: ${system.name} (${system.domain || "enterprise"}). Plain-English summary (ATRS Tier 1): This algorithmic system supports ${purpose} by providing structured recommendations to qualified human decision-makers, who retain final accountability.`,
      uk_atrs_architecture_data:
        input.existingAnswers?.uk_atrs_architecture_data?.trim() ||
        `ATRS Tier 2 Technical Specification: ${system.name} processes domain-specific inputs for ${purpose} under UK GDPR Art. 6 lawful basis and Data (Use and Access) Act 2025 safeguards. All evaluation runs, model versions, and audit logs are cryptographically hashed (SHA-256) in the V77 Evidence Vault.`,
      uk_equality_fairness_impact:
        input.existingAnswers?.uk_equality_fairness_impact?.trim() ||
        `Assessed under UK Equality Act 2010 (including s.149 Public Sector Equality Duty) and ICO AI Fairness guidance. Subgroup parity and equalized odds telemetry: ${input.fairnessSummary || "Monitored via V77 Fairness Lab across protected characteristics"}.`,
      uk_safety_robustness_testing:
        input.existingAnswers?.uk_safety_robustness_testing?.trim() ||
        `Verified against UK DSIT Principle 1 (Safety, Security & Robustness) and NCSC Guidelines for Secure AI System Development:\n- Adversarial Red-Teaming: ${input.redteamSummary || "16-scenario OWASP LLM Top 10 suite"}\n- Scored Evaluation Benchmark: ${input.evalSummary || "10-case robustness & hallucination benchmark"}`,
      uk_human_oversight_contestability:
        input.existingAnswers?.uk_human_oversight_contestability?.trim() ||
        `Enforces UK GDPR Art. 22 / Data (Use and Access) Act 2025 human intervention safeguards and DSIT Principles 2 & 5 (Transparency, Explainability & Contestability). Affected individuals are notified of AI assistance, provided clear explanations per ICO guidance, and can request human review or redress.`,
    };
  }

  if (input.templateId === "au_guardrails") {
    return {
      au_guardrails_1_2_accountability_risk:
        input.existingAnswers?.au_guardrails_1_2_accountability_risk?.trim() ||
        `Guardrails 1 & 2: ${orgName} has designated an accountable executive owner for ${system.name} (${system.domain || "enterprise"}, risk tier: ${tier}). Continuous risk management and operational resilience controls are maintained in alignment with DISR Mandatory Guardrails and APRA CPS 230.`,
      au_guardrails_3_4_data_testing:
        input.existingAnswers?.au_guardrails_3_4_data_testing?.trim() ||
        `Guardrails 3 & 4: Data governance complies with the Australian Privacy Act 1988 and APRA CPS 234 information security standards. Pre- and post-deployment testing telemetry:\n- Subgroup Fairness: ${input.fairnessSummary || "Monitored in V77 Fairness Lab"}\n- Adversarial Red-Teaming: ${input.redteamSummary || "16-scenario OWASP LLM Top 10 suite"}\n- Scored Evaluation Suite: ${input.evalSummary || "10-case accuracy & safety benchmark"}`,
      au_guardrails_5_6_7_oversight_disclosure_contestability:
        input.existingAnswers?.au_guardrails_5_6_7_oversight_disclosure_contestability?.trim() ||
        `Guardrails 5, 6 & 7: Meaningful human-in-the-loop oversight is enforced with override and stop capability (Guardrail 5). End-users are informed when interacting with or evaluated by ${system.name} per Guardrail 6 and Privacy Act APP 1 Automated Decision-Making (ADM) transparency rules, with a documented contestability and redress channel (Guardrail 7).`,
      au_guardrails_8_9_10_supply_chain_conformity:
        input.existingAnswers?.au_guardrails_8_9_10_supply_chain_conformity?.trim() ||
        `Guardrails 8, 9 & 10: Upstream model provenance and system instructions are documented in V77 Model Cards (Guardrail 8); immutable SHA-256 compliance logs are retained in the Evidence Vault (Guardrail 9); and this conformity assessment is maintained for regulatory inspection under Guardrail 10.`,
    };
  }

  if (input.templateId === "nz_charter") {
    return {
      nz_purpose_ipp1_3_transparency:
        input.existingAnswers?.nz_purpose_ipp1_3_transparency?.trim() ||
        `Agency / Organisation: ${orgName} (${role}). System: ${system.name} (${system.domain || "enterprise"}). Purpose (NZ Privacy Act 2020 IPP 1): ${purpose}. Plain-language transparency and collection notice are provided to affected individuals in compliance with IPP 3 and the Algorithm Charter for Aotearoa New Zealand.`,
      nz_te_tiriti_maori_data_sovereignty:
        input.existingAnswers?.nz_te_tiriti_maori_data_sovereignty?.trim() ||
        `Aligned with the Algorithm Charter Partnership commitment and Te Mana Raraunga (Māori Data Sovereignty) principles: data governance respects collective privacy interests, and subgroup parity testing explicitly monitors against inequitable outcomes across Māori, Pasifika, and other demographic groups.`,
      nz_ipp8_accuracy_bias_testing:
        input.existingAnswers?.nz_ipp8_accuracy_bias_testing?.trim() ||
        `NZ Privacy Act 2020 IPP 8 (Accuracy before use) & Algorithm Charter Peer Review verification:\n- Scored Evaluation Suite: ${input.evalSummary || "10-case groundedness & accuracy suite"}\n- Subgroup Fairness Parity: ${input.fairnessSummary || "Monitored via V77 Fairness Lab"}\n- Adversarial Red-Teaming: ${input.redteamSummary || "16-scenario OWASP LLM Top 10 suite"}`,
      nz_human_oversight_appeals_ipp11:
        input.existingAnswers?.nz_human_oversight_appeals_ipp11?.trim() ||
        `Human oversight is retained for all significant decisions with a nominated accountable contact and clear channel to appeal automated recommendations. Security safeguards (IPP 5), disclosure limits (IPP 11), and cross-border cloud AI protections (IPP 12) are enforced and logged.`,
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
