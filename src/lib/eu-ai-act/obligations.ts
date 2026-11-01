export type ValueChainRole = "provider" | "deployer" | "importer" | "distributor";
export type RiskTierKey = "prohibited" | "high_risk" | "limited" | "minimal" | "gpai";

export type ObligationItem = {
  id: string;
  role: ValueChainRole | "both";
  tier: RiskTierKey | "any";
  title: string;
  article: string;
  detail: string;
};

export const RISK_TIER_GUIDE: Array<{
  id: RiskTierKey;
  title: string;
  summary: string;
}> = [
  {
    id: "prohibited",
    title: "Prohibited",
    summary: "Art. 5 practices that must not be placed on the market or put into service in the Union.",
  },
  {
    id: "high_risk",
    title: "High-risk",
    summary: "Annex I / Annex III systems with Chapter III obligations for providers and deployers.",
  },
  {
    id: "limited",
    title: "Limited risk",
    summary: "Art. 50 transparency obligations (interaction, synthetic media, emotion/biometric labelling).",
  },
  {
    id: "minimal",
    title: "Minimal risk",
    summary: "No mandatory AI Act conformity path; voluntary codes and good governance still apply.",
  },
  {
    id: "gpai",
    title: "GPAI",
    summary: "Chapter V model-provider duties; systemic-risk GPAI carries additional evaluation and reporting.",
  },
];

export const OBLIGATIONS: ObligationItem[] = [
  {
    id: "prov_rms",
    role: "provider",
    tier: "high_risk",
    title: "Risk management system",
    article: "Art. 9",
    detail: "Establish, implement, document and maintain a continuous risk management system.",
  },
  {
    id: "prov_data",
    role: "provider",
    tier: "high_risk",
    title: "Data and data governance",
    article: "Art. 10",
    detail: "Training, validation and testing data sets meet quality criteria and bias mitigation where relevant.",
  },
  {
    id: "prov_techdoc",
    role: "provider",
    tier: "high_risk",
    title: "Technical documentation",
    article: "Art. 11 / Annex IV",
    detail: "Draw up Annex IV technical documentation before placing on the market and keep it up to date.",
  },
  {
    id: "prov_record",
    role: "provider",
    tier: "high_risk",
    title: "Record-keeping / logs",
    article: "Art. 12",
    detail: "Enable automatic recording of events over the system's lifetime.",
  },
  {
    id: "prov_transparency",
    role: "provider",
    tier: "high_risk",
    title: "Transparency and instructions for use",
    article: "Art. 13",
    detail: "Provide instructions enabling deployers to interpret outputs and use the system appropriately.",
  },
  {
    id: "prov_human",
    role: "provider",
    tier: "high_risk",
    title: "Human oversight measures",
    article: "Art. 14",
    detail: "Design for effective human oversight, including interrupt / stop capability where appropriate.",
  },
  {
    id: "prov_accuracy",
    role: "provider",
    tier: "high_risk",
    title: "Accuracy, robustness, cybersecurity",
    article: "Art. 15",
    detail: "Achieve an appropriate level of accuracy, robustness and cyber resilience.",
  },
  {
    id: "prov_qms",
    role: "provider",
    tier: "high_risk",
    title: "Quality management system",
    article: "Art. 17",
    detail: "Put a QMS in place covering the AI system lifecycle and regulatory compliance.",
  },
  {
    id: "prov_conformity",
    role: "provider",
    tier: "high_risk",
    title: "Conformity assessment & CE marking",
    article: "Arts. 43–48",
    detail: "Complete the applicable conformity assessment procedure and affix CE marking before placing on the market.",
  },
  {
    id: "dep_instructions",
    role: "deployer",
    tier: "high_risk",
    title: "Use per instructions",
    article: "Art. 26(1)",
    detail: "Take technical and organisational measures to use the system in accordance with instructions for use.",
  },
  {
    id: "dep_human",
    role: "deployer",
    tier: "high_risk",
    title: "Human oversight assignment",
    article: "Art. 26(2)",
    detail: "Assign human oversight to natural persons with competence, training and authority.",
  },
  {
    id: "dep_input",
    role: "deployer",
    tier: "high_risk",
    title: "Input data relevance",
    article: "Art. 26(4)",
    detail: "Ensure input data is relevant and sufficiently representative for the intended purpose.",
  },
  {
    id: "dep_monitor",
    role: "deployer",
    tier: "high_risk",
    title: "Monitoring and logging",
    article: "Art. 26(5)–(6)",
    detail: "Monitor operation, keep logs automatically generated, and report serious incidents.",
  },
  {
    id: "dep_fria",
    role: "deployer",
    tier: "high_risk",
    title: "Fundamental rights impact assessment",
    article: "Art. 27",
    detail: "Perform a FRIA before first use where required; link to a GDPR DPIA when personal data processing applies.",
  },
  {
    id: "dep_workers",
    role: "deployer",
    tier: "high_risk",
    title: "Worker information",
    article: "Art. 26(7)",
    detail: "Inform workers' representatives and affected workers that they will be subject to the high-risk system.",
  },
  {
    id: "lim_disclose",
    role: "both",
    tier: "limited",
    title: "AI interaction transparency",
    article: "Art. 50(1)",
    detail: "Inform natural persons that they are interacting with an AI system unless obvious from circumstances.",
  },
  {
    id: "lim_synthetic",
    role: "provider",
    tier: "limited",
    title: "Synthetic content marking",
    article: "Art. 50(2)",
    detail: "Mark outputs as artificially generated or manipulated in a machine-readable format where applicable.",
  },
  {
    id: "gpai_doc",
    role: "provider",
    tier: "gpai",
    title: "GPAI documentation & transparency",
    article: "Art. 53",
    detail: "Draw up and keep up-to-date technical documentation and provide information to downstream providers.",
  },
  {
    id: "gpai_copyright",
    role: "provider",
    tier: "gpai",
    title: "Copyright policy & training summary",
    article: "Art. 53",
    detail: "Put in place a copyright compliance policy and publish a sufficiently detailed training-data summary.",
  },
];

export function obligationsFor(role: ValueChainRole, tier: RiskTierKey): ObligationItem[] {
  return OBLIGATIONS.filter((o) => {
    const roleOk = o.role === "both" || o.role === role;
    const tierOk = o.tier === "any" || o.tier === tier || (tier === "high_risk" && o.tier === "high_risk");
    // Also show limited obligations for limited; gpai for gpai; high_risk set for high_risk
    if (o.tier === "limited" && tier !== "limited") return false;
    if (o.tier === "gpai" && tier !== "gpai") return false;
    if (o.tier === "high_risk" && tier !== "high_risk") return false;
    return roleOk && tierOk;
  });
}
