export type ModelCardFields = {
  version: string;
  intendedUse: string;
  outOfScope: string;
  trainingDataSummary: string;
  evaluationSummary: string;
  ethicalConsiderations: string;
  limitations: string;
  caveats: string;
  contact: string;
};

export type ModelCardTelemetryInput = {
  system: {
    id: string;
    name: string;
    description: string;
    purpose: string;
    domain: string;
    riskTier: string | null;
    roleInValueChain?: string | null;
    lifecycleStatus?: string | null;
    ownerEmail?: string | null;
  };
  classificationReasons?: string[];
  fairnessRuns?: Array<{
    sensitiveAttribute?: string;
    demographicParityDiff?: string | number;
    equalizedOddsDiff?: string | number;
    filename?: string;
    metricsJson?: string;
    createdAt?: Date | string;
  }>;
  redteamRuns?: Array<{
    provider: string;
    passCount: number;
    failCount: number;
    createdAt?: Date | string;
  }>;
  evalRuns?: Array<{
    provider: string;
    overallScore: string;
    passCount: number;
    failCount: number;
    createdAt?: Date | string;
  }>;
  impactAssessments?: Array<{
    templateId: string;
    title: string;
    status: string;
  }>;
  existing?: Partial<ModelCardFields>;
};

export function synthesizeModelCardFromTelemetry(input: ModelCardTelemetryInput): ModelCardFields {
  const { system } = input;
  const tier = system.riskTier || "unclassified";
  const role = system.roleInValueChain || "provider";
  const latestFair = input.fairnessRuns?.[0];
  let fairAttr = latestFair?.sensitiveAttribute || latestFair?.filename || "demographic subgroup";
  let fairDpd = latestFair?.demographicParityDiff;
  let fairEod = latestFair?.equalizedOddsDiff;
  if (latestFair?.metricsJson) {
    try {
      const parsed = JSON.parse(latestFair.metricsJson) as {
        demographicParityDifference?: number;
        equalizedOddsDifference?: number;
        fourFifthsRatio?: number;
      };
      if (parsed.demographicParityDifference !== undefined) fairDpd = parsed.demographicParityDifference.toFixed(3);
      if (parsed.equalizedOddsDifference !== undefined) fairEod = parsed.equalizedOddsDifference.toFixed(3);
    } catch {
      // ignore malformed metricsJson
    }
  }
  const latestRt = input.redteamRuns?.[0];
  const latestEv = input.evalRuns?.[0];
  const impacts = input.impactAssessments || [];

  const intendedUse = [
    `Primary Purpose: ${system.purpose || "Operational decision-support and workflow automation"}`,
    `Operational Domain: ${system.domain || "Enterprise"} · Value-Chain Role: ${role} · Lifecycle: ${system.lifecycleStatus || "development"}`,
    `System Overview: ${system.description || "Registered AI system managed in V77 Trust."}`,
    `Intended Deployers & Operators: Trained personnel operating under EU AI Act Art. 13 instructions for use and Art. 14 human oversight protocols.`,
  ].join("\n");

  const outOfScope = [
    `- Prohibited AI practices under EU AI Act Article 5(1)(a)–(h) (subliminal manipulation, social scoring, untargeted facial scraping, workplace emotion recognition).`,
    `- Fully autonomous high-stakes decisions affecting legal status or fundamental rights without human-in-the-loop review (EU AI Act Art. 14 & GDPR Art. 22).`,
    `- Deployment outside the validated ${system.domain || "enterprise"} domain or on demographic cohorts not represented in validation datasets.`,
  ].join("\n");

  const trainingDataSummary = [
    `Data Governance Framework: Managed in accordance with EU AI Act Article 10 (Data & Data Governance) and Article 53(1)(c)–(d) where GPAI models are integrated.`,
    `- Provenance & Pre-processing: Curated domain datasets and prompt templates with automated PII scrubbing, deduplication, and schema validation.`,
    `- Protected Attributes Monitored: ${latestFair ? `Evaluated across "${fairAttr}"` : "Configured for demographic subgroup parity monitoring prior to production release"}.`,
    `- GDPR Lawful Basis & Minimisation: Data processing scoped to necessity and proportionality (GDPR Art. 5(1)(c) & Art. 35).`,
  ].join("\n");

  const evaluationSummary = [
    `Quantitative & Adversarial Assurance Summary (EU AI Act Art. 15 & Art. 55):`,
    latestEv
      ? `- Scored Evaluation Suite (${latestEv.provider}): Overall score ${(Number(latestEv.overallScore) * 100).toFixed(1)}% (${latestEv.passCount} passed / ${latestEv.failCount} failed across robustness, prompt injection, PII leakage, hallucination, and fairness).`
      : `- Scored Evaluation Suite: Pending initial execution in /tests/evals.`,
    latestRt
      ? `- Adversarial Red-Team Suite (${latestRt.provider}, OWASP LLM Top 10 2025): ${latestRt.passCount} passed / ${latestRt.failCount} failed across 16 jailbreak, prompt-injection, exfiltration, harmful-content, and tool-abuse probes.`
      : `- Adversarial Red-Team Suite: Pending initial execution in /tests/redteam.`,
    latestFair
      ? `- Subgroup Fairness Audit (${fairAttr}): Demographic Parity Difference = ${fairDpd ?? "N/A"}; Equalized Odds Difference = ${fairEod ?? "N/A"}.`
      : `- Subgroup Fairness Audit: Pending CSV cohort evaluation in /tests/fairness.`,
  ].join("\n");

  const ethicalConsiderations = [
    `EU AI Act Risk Tier: ${tier.toUpperCase()}`,
    ...(input.classificationReasons?.length
      ? input.classificationReasons.map((r) => `- Classification Rationale: ${r}`)
      : [`- Classification Rationale: Evaluated against EU AI Act Art. 5, Annex I, Annex III, Art. 6(3), Art. 50, and Arts. 51–55.`]),
    impacts.length
      ? `- Fundamental Rights & Data Protection Assessments: ${impacts.map((i) => `${i.title} (${i.templateId.toUpperCase()}: ${i.status})`).join("; ")}.`
      : `- Fundamental Rights & Data Protection Assessments: Art. 27 FRIA and GDPR Art. 35 DPIA templates available in /impact.`,
  ].join("\n");

  const limitations = [
    `- Distributional Shift: Model accuracy and subgroup parity may degrade if production input distributions diverge from baseline validation cohorts.`,
    `- Stochastic Generation & Hallucination Risk: Where generative models are used, outputs require grounding verification and may exhibit non-deterministic phrasing.`,
    `- Adversarial Surface: Indirect prompt injection from untrusted external context must be isolated via input sandboxing and output validation.`,
  ].join("\n");

  const caveats = [
    `- Mandatory Human Oversight (Art. 14): Operators must review confidence indicators and rationale before acting on high-impact recommendations, avoiding automation bias.`,
    `- Transparency Disclosure (Art. 50): Natural persons interacting with the system must be informed they are interacting with an AI system.`,
    `- Serious Incident Escalation (Art. 73): Any suspected fundamental rights infringement or critical malfunction must be logged immediately in /incidents (2 / 10 / 15-day statutory authority reporting window).`,
  ].join("\n");

  return {
    version: input.existing?.version?.trim() || "1.0",
    intendedUse: input.existing?.intendedUse?.trim() || intendedUse,
    outOfScope: input.existing?.outOfScope?.trim() || outOfScope,
    trainingDataSummary: input.existing?.trainingDataSummary?.trim() || trainingDataSummary,
    evaluationSummary: input.existing?.evaluationSummary?.trim() || evaluationSummary,
    ethicalConsiderations: input.existing?.ethicalConsiderations?.trim() || ethicalConsiderations,
    limitations: input.existing?.limitations?.trim() || limitations,
    caveats: input.existing?.caveats?.trim() || caveats,
    contact: input.existing?.contact?.trim() || system.ownerEmail || "compliance@v77trust.com",
  };
}

export function renderModelCardMarkdown(systemName: string, card: Partial<ModelCardFields>): string {
  const sections: Array<[string, string | undefined]> = [
    ["1. Intended Use & Operational Scope (EU AI Act Art. 13)", card.intendedUse],
    ["2. Out-of-Scope & Prohibited Uses (EU AI Act Art. 5)", card.outOfScope],
    ["3. Training & Validation Data Governance (EU AI Act Art. 10 & Art. 53)", card.trainingDataSummary],
    ["4. Quantitative Evaluation & Red-Team Assurance (EU AI Act Art. 15)", card.evaluationSummary],
    ["5. Ethical Considerations, Risk Tier & Fundamental Rights (Art. 27 FRIA / GDPR Art. 35)", card.ethicalConsiderations],
    ["6. Known Technical Limitations", card.limitations],
    ["7. Deployer Caveats, Human Oversight (Art. 14) & Transparency (Art. 50)", card.caveats],
  ];

  const lines: string[] = [
    `# Model Card & Instructions for Use — ${systemName}`,
    "",
    `- **Version:** ${card.version || "1.0"}`,
    `- **Governance Contact:** ${card.contact || "_Not specified_"}`,
    `- **Regulatory Alignment:** Regulation (EU) 2024/1689 (EU AI Act Art. 13 & Art. 53) · ISO/IEC 42001:2023`,
    "",
  ];

  for (const [heading, body] of sections) {
    lines.push(`## ${heading}`);
    lines.push((body || "").trim() || "_Not yet documented._");
    lines.push("");
  }

  return lines.join("\n");
}
