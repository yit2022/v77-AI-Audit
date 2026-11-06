export type AnnexIvSection = {
  id: string;
  title: string;
  annexRef: string;
  guidance: string;
};

/** Annex IV technical documentation outline (high-risk AI systems). */
export const ANNEX_IV_SECTIONS: AnnexIvSection[] = [
  {
    id: "iv_1_general",
    title: "General description of the AI system",
    annexRef: "Annex IV (1)",
    guidance: "Intended purpose, provider identity, version, interaction with hardware/software, and user instructions overview.",
  },
  {
    id: "iv_2_elements",
    title: "Detailed description of elements and development process",
    annexRef: "Annex IV (2)",
    guidance: "Design specifications, system architecture, computational resources, data requirements, training methodologies, validation and testing procedures.",
  },
  {
    id: "iv_3_monitoring",
    title: "Monitoring, functioning and control",
    annexRef: "Annex IV (3)",
    guidance: "Capabilities and limitations, foreseeable unintended outcomes, human oversight measures, and input data specifications.",
  },
  {
    id: "iv_4_risk",
    title: "Risk management system description",
    annexRef: "Annex IV (4) / Art. 9",
    guidance: "Describe the risk management system applied across the lifecycle, residual risks and mitigation measures.",
  },
  {
    id: "iv_5_changes",
    title: "Changes through the lifecycle",
    annexRef: "Annex IV (5)",
    guidance: "Describe any pre-determined changes and the associated change-control / performance evaluation process.",
  },
  {
    id: "iv_6_standards",
    title: "Harmonised standards and common specifications",
    annexRef: "Annex IV (6)",
    guidance: "List applied harmonised standards, common specifications or alternative solutions demonstrating conformity.",
  },
  {
    id: "iv_7_declarations",
    title: "EU declaration of conformity copy",
    annexRef: "Annex IV (7)",
    guidance: "Attach a copy of the EU declaration of conformity.",
  },
  {
    id: "iv_8_performance",
    title: "Performance metrics and robustness",
    annexRef: "Annex IV (8) related",
    guidance: "Document accuracy metrics, robustness/cybersecurity testing and known performance envelopes for intended populations.",
  },
];

export type AnnexIvAnswers = Record<string, string>;

export type AnnexIvTelemetryInput = {
  orgName: string;
  system: {
    id: string;
    name: string;
    description: string;
    intendedPurpose: string;
    roleInValueChain: string;
    domain: string;
    riskTier: string | null;
    gpai: boolean;
    versionLabel?: string;
    vendorName?: string;
    euDatabaseId?: string;
    classificationNotes?: string | null;
  };
  controls?: Array<{ code: string; title: string; status: string; euRef: string; isoRef: string }>;
  findings?: Array<{ title: string; severity: string; status: string }>;
  fairnessSummary?: string;
  redteamSummary?: string;
  evalSummary?: string;
  existingAnswers?: AnnexIvAnswers;
};

/**
 * Synthesizes complete Annex IV (1)–(8) technical documentation drafts directly from
 * system registry metadata, risk classification rationale, control implementation status,
 * and technical evaluation runs (Fairness, Red-Team, Scored Evals).
 */
export function synthesizeAnnexIvFromTelemetry(input: AnnexIvTelemetryInput): AnnexIvAnswers {
  const { orgName, system } = input;
  const controls = input.controls ?? [];
  const findings = input.findings ?? [];
  const implControls = controls.filter((c) => c.status === "implemented");
  const openFindings = findings.filter((f) => f.status === "open" || f.status === "in_progress");
  const version = system.versionLabel?.trim() || "1.0.0";
  const tier = (system.riskTier || "unclassified").replaceAll("_", " ");

  const drafted: AnnexIvAnswers = {
    iv_1_general: [
      `System Name: ${system.name} (Version: ${version})`,
      `Organisation (${system.roleInValueChain}): ${orgName}`,
      system.vendorName ? `Upstream Vendor / Model Supplier: ${system.vendorName}` : null,
      `Domain: ${system.domain} | Classified EU AI Act Tier: ${tier}${system.gpai ? " (embeds/provides GPAI model)" : ""}`,
      `Intended Purpose: ${system.intendedPurpose || system.description || "Enterprise AI decision-support and automation workflow."}`,
      `General Description: ${system.description || "AI system registered and governed within the V77 Trust AIMS workspace."}`,
      system.classificationNotes ? `Classification Rationale (Arts. 5–6 / Annex III): ${system.classificationNotes}` : null,
    ]
      .filter(Boolean)
      .join("\n"),

    iv_2_elements: [
      `Architecture & Modality: ${system.gpai ? "General-purpose / foundation model integration with domain-specific prompting, guardrails, and application orchestration." : "Domain-specific predictive / analytical AI model pipeline."}`,
      `Data Governance (Art. 10): Training, validation, and testing slices are governed under V77-DATA-01 and V77-GDPR-01..05 controls for relevance, representativeness, and special-category data exclusion.`,
      `Validation & Testing Procedures: Automated pre-deployment evaluation via V77 Trust Scored Eval Suite (robustness, prompt injection, PII leakage, grounding) and quantitative group-fairness testing (Demographic Parity & Equalized Odds).`,
    ].join("\n"),

    iv_3_monitoring: [
      `Human Oversight (Art. 14 / Art. 26(2)): Assigned AI system owner and operational reviewers maintain human-in-the-loop override and emergency stop capabilities (V77-HOV-01).`,
      `Automatic Record-Keeping (Art. 12): System events, control transitions, and evidence artefacts are recorded in a SHA-256 hash-chained tamper-evident audit log (V77-LOG-01).`,
      `Foreseeable Unintended Outcomes: Monitored via scheduled drift detection (control regression and fairness metric delta alerts) and the Art. 73 serious-incident register.`,
    ].join("\n"),

    iv_4_risk: [
      `Risk Management System (Art. 9 / ISO/IEC 23894): Continuous lifecycle risk identification, estimation, evaluation, and mitigation operated through V77 Trust.`,
      `Control Implementation Snapshot: ${implControls.length} of ${controls.length} applicable controls marked Implemented (${controls.length ? Math.round((implControls.length / controls.length) * 100) : 0}% coverage).`,
      openFindings.length > 0
        ? `Residual Risks & Active Remediations: ${openFindings.length} open/in-progress finding(s) tracked (${openFindings.map((f) => `${f.title} [${f.severity}]`).join("; ")}).`
        : `Residual Risks: No open critical or high-severity findings at time of documentation synthesis; residual risk deemed acceptable under instructions for use.`,
    ].join("\n"),

    iv_5_changes: [
      `Lifecycle & Change Control (Annex IV(5) / ISO/IEC 5338): Current tracked release is ${version}.`,
      `Substantial Modification Guardrail (Art. 25): Any change to intended purpose, model architecture, or fine-tuning dataset triggers mandatory reassessment and control re-verification via scheduled reassessment cadences.`,
    ].join("\n"),

    iv_6_standards: [
      `Applied Harmonised Standards & Specifications:`,
      `- EN ISO/IEC 42001:2023 (Information technology — Artificial intelligence — Management system / AIMS)`,
      `- ISO/IEC 23894:2023 (Artificial intelligence — Guidance on risk management, aligned to EU AI Act Art. 9)`,
      `- ISO/IEC 27001:2022 Annex A cybersecurity controls (aligned to EU AI Act Art. 15)`,
      `- NIST AI RMF 1.0 & NIST AI 600-1 Generative AI Profile`,
      `- GDPR (Regulation (EU) 2016/679) Arts. 5, 6, 9, 22, 25, 32, 35`,
    ].join("\n"),

    iv_7_declarations: [
      `EU Declaration of Conformity (Art. 47 / Annex V): Generated and maintained alongside this Annex IV dossier within the V77 Trust Audit Pack.`,
      `EU Database Registration (Art. 49 / Annex VIII): ${system.euDatabaseId ? `Registered under EU Database ID: ${system.euDatabaseId}` : "Registration payload prepared in Annex VIII machine-readable format (pending market placement / registration ID assignment)."}`,
    ].join("\n"),

    iv_8_performance: [
      `Accuracy, Robustness & Cybersecurity (Art. 15):`,
      `- Scored Evaluation Suite: ${input.evalSummary || "Configured for robustness, prompt-injection resistance, PII non-disclosure, and hallucination grounding."}`,
      `- Adversarial Red-Team Suite (OWASP LLM Top 10 / Art. 15): ${input.redteamSummary || "16-scenario adversarial suite covering jailbreaks, indirect prompt injection, data exfiltration, harmful outputs, and unauthorized tool agency."}`,
      `- Quantitative Fairness & Bias (Art. 10): ${input.fairnessSummary || "Demographic Parity Difference, Four-Fifths Ratio, and Equalized Odds evaluated across protected slices."}`,
    ].join("\n"),
  };

  return drafted;
}

export function renderAnnexIvMarkdown(opts: {
  systemName: string;
  role: string;
  riskTier: string;
  answers: AnnexIvAnswers;
}): string {
  const lines = [
    `# Annex IV technical documentation — ${opts.systemName}`,
    "",
    `_Generated by V77 Trust. Not legal advice. Role: ${opts.role}. Risk tier: ${opts.riskTier}._`,
    "",
  ];
  for (const s of ANNEX_IV_SECTIONS) {
    lines.push(`## ${s.title}`);
    lines.push(`*${s.annexRef}* — ${s.guidance}`);
    lines.push("");
    lines.push(opts.answers[s.id]?.trim() || "_Not yet completed._");
    lines.push("");
  }
  return lines.join("\n");
}

/**
 * Generates an EU Declaration of Conformity template structured per Article 47 and Annex V
 * of the EU AI Act (Regulation (EU) 2024/1689).
 */
export function renderEuDeclarationOfConformity(opts: {
  orgName: string;
  systemId: string;
  systemName: string;
  versionLabel?: string;
  intendedPurpose: string;
  riskTier: string | null;
  euDatabaseId?: string;
  generatedAt?: Date;
}): string {
  const dateStr = (opts.generatedAt ?? new Date()).toISOString().slice(0, 10);
  const ver = opts.versionLabel?.trim() || "1.0.0";
  return [
    `# EU DECLARATION OF CONFORMITY (Regulation (EU) 2024/1689 — Article 47 & Annex V)`,
    "",
    `> **Notice:** Drafted via V77 Trust AI Governance & Audit Platform. Must be reviewed and signed by an authorised representative of the Provider before placing a high-risk AI system on the Union market or putting it into service.`,
    "",
    `## 1. AI System Identification (Annex V, Point 1)`,
    `- **AI System Name:** ${opts.systemName}`,
    `- **AI System Type / Version:** ${ver}`,
    `- **Unique System Reference (V77 Registry ID):** \`${opts.systemId}\``,
    `- **EU Database Registration ID (Art. 49):** ${opts.euDatabaseId?.trim() || "Pending registration prior to market placement"}`,
    `- **Classified Risk Tier:** ${(opts.riskTier || "high_risk").replaceAll("_", " ")}`,
    `- **Intended Purpose:** ${opts.intendedPurpose || "As specified in Annex IV Section 1 technical documentation."}`,
    "",
    `## 2. Provider Identification (Annex V, Point 2)`,
    `- **Provider / Legal Entity Name:** ${opts.orgName}`,
    `- **Declaration Responsibility:** This declaration of conformity is issued under the sole responsibility of the provider (${opts.orgName}).`,
    "",
    `## 3. Statement of Union Legislation Conformity (Annex V, Point 3 & 4)`,
    `The AI system described above is in conformity with:`,
    `- **Regulation (EU) 2024/1689** of the European Parliament and of the Council of 13 June 2024 laying down harmonised rules on artificial intelligence (**EU AI Act**);`,
    `- Where the AI system involves the processing of personal data, compliance with **Regulation (EU) 2016/679 (GDPR)** and applicable Union/Member State data protection law.`,
    "",
    `## 4. Harmonised Standards & Common Specifications Applied (Annex V, Point 5)`,
    `- **EN ISO/IEC 42001:2023** — Artificial Intelligence Management System (AIMS)`,
    `- **ISO/IEC 23894:2023** — AI Risk Management (aligned to EU AI Act Art. 9)`,
    `- **ISO/IEC 27001:2022** — Information Security & Cybersecurity Controls (aligned to EU AI Act Art. 15)`,
    `- **EU AI Act Annex IV** — Technical Documentation Dossier maintained in V77 Trust`,
    "",
    `## 5. Conformity Assessment Procedure (Annex V, Point 6)`,
    `- **Procedure Followed:** Internal control conformity assessment procedure pursuant to **Article 43(2) and Annex VI** (or Annex VII notified-body assessment where applicable).`,
    "",
    `## 6. Signature Block (Annex V, Point 7)`,
    `- **Signed for and on behalf of:** ${opts.orgName}`,
    `- **Date of Issue:** ${dateStr}`,
    `- **Name & Function of Authorised Signatory:** ________________________________________`,
    `- **Signature:** ________________________________________`,
    "",
  ].join("\n");
}

/**
 * Builds a machine-readable EU Database Registration payload aligned to Article 49 and Annex VIII
 * of the EU AI Act (Regulation (EU) 2024/1689).
 */
export function buildEuDatabaseRegistrationPayload(opts: {
  orgName: string;
  contactEmail?: string;
  system: {
    id: string;
    name: string;
    description: string;
    intendedPurpose: string;
    roleInValueChain: string;
    domain: string;
    riskTier: string | null;
    versionLabel?: string;
    euDatabaseId?: string;
    classificationNotes?: string | null;
  };
}) {
  const isArt6_3 = (opts.system.classificationNotes || "").includes("Art. 6(3) Derogation applied");
  return {
    schemaVersion: "eu-ai-act-annex-viii-v1",
    regulation: "Regulation (EU) 2024/1689",
    articleReference: isArt6_3 ? "Article 49(2) / Annex VIII Section B (Art. 6(3) Derogation)" : "Article 49(1) / Annex VIII Section A",
    generatedAt: new Date().toISOString(),
    providerOrDeployer: {
      legalName: opts.orgName,
      roleInValueChain: opts.system.roleInValueChain,
      contactEmail: opts.contactEmail || "compliance@example.eu",
    },
    aiSystem: {
      internalRegistryId: opts.system.id,
      euDatabaseId: opts.system.euDatabaseId || null,
      tradeName: opts.system.name,
      version: opts.system.versionLabel || "1.0.0",
      domain: opts.system.domain,
      riskTier: opts.system.riskTier || "unclassified",
      intendedPurpose: opts.system.intendedPurpose || opts.system.description,
      statusOnMarket: "in_service_or_pre_market_audit",
      art6_3ExemptionClaimed: isArt6_3,
      classificationRationale: opts.system.classificationNotes || "",
    },
    memberStatesOfPlacement: ["EU-27", "EEA"],
  };
}
