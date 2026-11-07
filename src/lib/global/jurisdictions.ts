export type JurisdictionId = "eu";

export type JurisdictionProfile = {
  id: JurisdictionId;
  flag: string;
  name: string;
  shortName: string;
  primaryRegulators: string[];
  flagshipLaws: string[];
  summary: string;
  highNeedSectors: string[];
  keyObligations: string[];
  incidentReportingWindow: string;
};

export const GLOBAL_JURISDICTIONS: JurisdictionProfile[] = [
  {
    id: "eu",
    flag: "🇪🇺",
    name: "European Union & EEA",
    shortName: "EU / EEA",
    primaryRegulators: [
      "EU AI Office",
      "National Market Surveillance Authorities",
      "EDPB / National DPAs",
      "EBA / EIOPA / ESMA (DORA & Annex III pt. 5 Banking/Insurance)",
    ],
    flagshipLaws: [
      "EU AI Act (Regulation (EU) 2024/1689)",
      "GDPR (Regulation (EU) 2016/679 Arts. 22, 35)",
      "DORA (Regulation (EU) 2022/2554)",
      "EN ISO/IEC 42001:2023 & ISO/IEC 27001:2022",
    ],
    summary:
      "Risk-tiered European Union statutory regulation prohibiting unacceptable AI practices (Art. 5), regulating Annex I/III high-risk systems including Banking Creditworthiness & Life/Health Insurance Pricing (Annex III pt. 5(b)/(c)), enforcing Art. 50 transparency, and governing GPAI models (Arts. 51–55).",
    highNeedSectors: [
      "Banking & Credit Institutions (Annex III pt. 5(b) & DORA)",
      "Life & Health Insurance (Annex III pt. 5(c) & EIOPA)",
      "HR & Employment (Annex III pt. 4)",
      "Healthcare & MedTech (Annex I / III)",
      "Critical Infrastructure & Energy (Annex III pt. 2)",
      "Public Sector & Essential Services (Annex III pt. 5(a))",
    ],
    keyObligations: [
      "Art. 5(1)(a–h) prohibited practices screening & Art. 6(3) narrow-procedural derogation checks",
      "Art. 9–15 technical controls, Annex IV technical documentation & Art. 47 EU Declaration of Conformity",
      "Art. 27 Fundamental Rights Impact Assessment (FRIA) & GDPR Art. 35 DPIA",
      "Art. 73 serious-incident reporting within 2, 10, or 15 calendar days (plus GDPR Art. 33 / DORA Art. 19)",
    ],
    incidentReportingWindow: "2 / 10 / 15 days (EU AI Act Art. 73) · 72 hours (GDPR Art. 33 / DORA Art. 19)",
  },
];

export type GlobalControlCrosswalk = {
  usRef: string;
  ukRef: string;
  auRef: string;
  nzRef: string;
};

export const GLOBAL_CONTROL_REFS: Record<string, GlobalControlCrosswalk> = {
  "V77-GDPR-01": {
    usRef: "CCPA/CPRA Notice at Collection; Colorado Privacy Act (CPA)",
    ukRef: "UK GDPR Arts. 5–6, 13–14; ICO AI & Data Protection Guidance",
    auRef: "Australian Privacy Principles (APP 1, APP 3, APP 5); DISR Guardrail 3",
    nzRef: "NZ Privacy Act 2020 IPPs 1–4 (Purpose & Collection)",
  },
  "V77-GDPR-02": {
    usRef: "Colorado AI Act (SB 24-205) § 6-1-1703(3) Impact Assessment; CCPA Risk Assessment",
    ukRef: "UK GDPR Art. 35 Mandatory AI DPIA; UK ATRS Tier 2",
    auRef: "OAIC Privacy Impact Assessment (PIA); DISR Guardrail 10 Conformity",
    nzRef: "NZ OPC Mandatory AI Privacy Impact Assessment (PIA)",
  },
  "V77-GDPR-03": {
    usRef: "CO SB 24-205 § 6-1-1703(4) (Consumer Notice & Appeal); CCPA ADMT Opt-Out/Human Review",
    ukRef: "UK GDPR Art. 22 (Data Use & Access Act 2025); UK DSIT Contestability Principle",
    auRef: "Privacy Amendment Act 2024 (APP 1.7–1.9 ADM Disclosure); DISR Guardrail 5 & 7",
    nzRef: "NZ Privacy Act 2020 IPPs 6–7 & Algorithm Charter Human Oversight / Appeal",
  },
  "V77-GDPR-04": {
    usRef: "NIST Privacy Framework; CPRA Data Minimization",
    ukRef: "UK GDPR Art. 25 Data Protection by Design & Default",
    auRef: "APP 1.2 Privacy by Design; DISR Guardrail 3 (Data Governance)",
    nzRef: "NZ Privacy Act 2020 IPP 1 (Data Minimisation) & IPP 5 (Storage/Security)",
  },
  "V77-GDPR-05": {
    usRef: "EEOC Title VII Protected Classes; IL HB 3773; CPRA Sensitive Personal Information",
    ukRef: "UK GDPR Arts. 9–10; Equality Act 2010 Protected Characteristics",
    auRef: "Privacy Act 1988 Sensitive Information (APP 3.3); DISR Guardrail 3",
    nzRef: "NZ Human Rights Act 1993 & OPC Sensitive Personal Information Guidance",
  },
  "V77-INV-01": {
    usRef: "NIST AI RMF Govern 1.2 / Map 1.1; CO SB 24-205 Developer/Deployer Inventory; OMB M-24-10",
    ukRef: "UK DSIT Accountability Principle; UK ATRS Tier 1–2; PRA SS1/23 Model Inventory",
    auRef: "DISR Guardrail 1 (Accountability) & Guardrail 8 (Supply-Chain Transparency)",
    nzRef: "NZ Algorithm Charter (Algorithm Inventory) & Public Service AI Framework",
  },
  "V77-RISK-01": {
    usRef: "CO SB 24-205 High-Risk Consequential Decision Screening; NYC LL144 AEDT Scope",
    ukRef: "UK DSIT Context-Specific Risk Classification; ICO AI Risk Screening",
    auRef: "DISR High-Risk AI Setting Classification & NSW AIAF Risk Matrix",
    nzRef: "NZ Algorithm Charter Probability × Impact Risk Matrix",
  },
  "V77-RMS-01": {
    usRef: "CO SB 24-205 § 6-1-1703(1) Risk Management Program (NIST AI RMF Affirmative Defense)",
    ukRef: "BS ISO/IEC 42001; UK DSIT Safety & Governance; PRA SS1/23",
    auRef: "DISR Guardrail 2 (Lifecycle Risk Management Process); APRA CPS 230",
    nzRef: "NZ Public Service AI Framework Risk Management & ISO/IEC 42001",
  },
  "V77-DATA-01": {
    usRef: "California AB 2013 (Training Data Summary); NIST AI 600-1 Data Provenance",
    ukRef: "ICO AI Fairness & Data Representativeness; BS ISO/IEC 42001 Annex A.7",
    auRef: "DISR Guardrail 3 (Data Quality, Provenance & Bias Mitigation)",
    nzRef: "NZ Privacy Act 2020 IPP 8 (Accuracy) & Māori Data Sovereignty Principles",
  },
  "V77-DOC-01": {
    usRef: "CO SB 24-205 § 6-1-1702 Developer Documentation for Deployers; NIST Map 5",
    ukRef: "UK ATRS Technical Documentation; PRA SS1/23 Model Documentation",
    auRef: "DISR Guardrail 8 (Supply-Chain Documentation) & Guardrail 9 (Record-Keeping)",
    nzRef: "NZ Algorithm Charter Technical Documentation & Peer Review Records",
  },
  "V77-LOG-01": {
    usRef: "NIST AI RMF Measure 2 / Manage 4 Traceability; CO SB 24-205 Record Retention",
    ukRef: "UK GDPR Art. 32 Audit Logging; PRA SS1/23 Model Monitoring Logs",
    auRef: "DISR Guardrail 9 (Keep Records for Third-Party Conformity Assessment)",
    nzRef: "NZ Privacy Act 2020 IPP 5 & Public Records Act 2005 Audit Trail",
  },
  "V77-TRANS-01": {
    usRef: "CO SB 24-205 Pre-Decision Notice; NYC LL144 10-Day Candidate Notice; CA SB 942",
    ukRef: "UK ATRS Public Disclosure; ICO/Turing Explaining Decisions Made with AI",
    auRef: "DISR Guardrail 6 (Inform End-Users of AI Decisions & Synthetic Content); APP 1 ADM",
    nzRef: "NZ Privacy Act 2020 IPP 3 & Algorithm Charter Plain-English Explainability",
  },
  "V77-HOV-01": {
    usRef: "CO SB 24-205 Human Review of Adverse Decisions; OMB M-24-10 Human-in-the-Loop",
    ukRef: "UK GDPR Art. 22 Meaningful Human Intervention; FCA Consumer Duty",
    auRef: "DISR Guardrail 5 (Enable Human Control, Intervention & Override)",
    nzRef: "NZ Algorithm Charter Human Oversight & Authority to Override",
  },
  "V77-ACC-01": {
    usRef: "NIST AI 600-1 Security & Robustness; OWASP LLM Top 10 (2025)",
    ukRef: "UK AISI Evaluation Principles; NCSC Guidelines for Secure AI System Development",
    auRef: "DISR Guardrail 4 (Pre-Release Testing & Post-Deployment Performance Monitoring); ASD Secure AI",
    nzRef: "NZ NCSC / GCSB Secure AI Guidelines & Privacy Act 2020 IPP 8 Accuracy",
  },
  "V77-QMS-01": {
    usRef: "NIST AI RMF Govern 1–6; CO SB 24-205 ISO/IEC 42001 Safe-Harbor Programme",
    ukRef: "BS ISO/IEC 42001 AI Management System; FCA Senior Managers Regime (SM&CR)",
    auRef: "DISR Guardrail 1 (Accountability & Governance Strategy); AS ISO/IEC 42001",
    nzRef: "AS/NZS ISO/IEC 42001 AIMS & GCDO AI Governance Accountability",
  },
  "V77-CA-01": {
    usRef: "CO SB 24-205 Public Statement of Compliance & AG Inspection Readiness",
    ukRef: "BS ISO/IEC 42001 Certification Readiness & UK ATRS Publication",
    auRef: "DISR Guardrail 10 (Stakeholder Engagement & Conformity Assessment)",
    nzRef: "NZ Algorithm Charter Signatory Self-Assessment & Independent Review",
  },
  "V77-FRIA-01": {
    usRef: "CO SB 24-205 § 6-1-1703(3) Annual Deployer Impact Assessment; OMB Rights-Impacting AI",
    ukRef: "UK Human Rights Act 1998 / Equality Act Impact & ICO High-Risk AI DPIA",
    auRef: "DISR Guardrail 2 & 10 Fundamental Rights / Societal Impact Assessment; NSW AIAF",
    nzRef: "NZ Bill of Rights Act 1990, Te Tiriti o Waitangi & OPC AI Impact Assessment",
  },
  "V77-GPAI-01": {
    usRef: "NIST AI 600-1 GenAI Profile; California AB 2013 & SB 942 GenAI Disclosures",
    ukRef: "UK AISI Frontier AI Safety & CMA Foundation Model Principles",
    auRef: "DISR Guardrail 6 (AI-Generated Content Watermarking) & Guardrail 8 (GPAI Supply Chain)",
    nzRef: "NZ GCDO Generative AI Guidance for the Public Service",
  },
  "V77-MON-01": {
    usRef: "CO SB 24-205 90-Day AG Algorithmic Discrimination Reporting; NIST Manage 4",
    ukRef: "UK GDPR Art. 33 (72h ICO Breach); FCA SUP 15.3 Incident Notification",
    auRef: "DISR Guardrail 4 (Ongoing Monitoring) & OAIC Notifiable Data Breaches (NDB)",
    nzRef: "NZ Privacy Act 2020 Part 6 Notifiable Privacy Breaches (OPC NotifyUs)",
  },
  "V77-FAIR-01": {
    usRef: "NYC Local Law 144 AEDT Bias Audit (Four-Fifths Rule >= 0.80); EEOC Uniform Guidelines",
    ukRef: "UK Equality Act 2010 Indirect Discrimination & ICO Statistical Fairness",
    auRef: "DISR Guardrail 3 & 4 (Subgroup Bias Testing); Australian Anti-Discrimination Laws",
    nzRef: "NZ Human Rights Act 1993 & Algorithm Charter Unintended Bias Testing",
  },
  "V77-RT-01": {
    usRef: "NIST AI 600-1 Red-Teaming; OWASP LLM Top 10 (LLM01–LLM10)",
    ukRef: "UK AISI Red-Teaming & NCSC Prompt-Injection Resilience",
    auRef: "DISR Guardrail 3 & 4 (Adversarial Robustness & Manipulation Resistance)",
    nzRef: "NZ NCSC Adversarial AI Testing & Algorithm Charter Security Review",
  },
  "V77-DORA-01": {
    usRef: "Federal Reserve SR 11-7 / OCC 2011-12 Model Risk Management; FFIEC IT Handbook",
    ukRef: "Bank of England / PRA SS1/23 Model Risk Management & FCA PS21/3 Operational Resilience",
    auRef: "APRA CPS 230 (Operational Risk Management) & CPS 234 (Information Security)",
    nzRef: "RBNZ BS11 Outsourced & Model Risk / FMA Operational Resilience",
  },
  "V77-DORA-02": {
    usRef: "Interagency Guidance on Third-Party Relationships (FIL-29-2023); CO SB 24-205 Supply Chain",
    ukRef: "PRA SS2/21 Outsourcing and Third-Party Risk Management",
    auRef: "APRA CPS 230 Material Service Provider Management; DISR Guardrail 8",
    nzRef: "NZ Privacy Act 2020 IPP 12 (Cross-Border Disclosure) & RBNZ Outsourcing Policy",
  },
  "V77-DORA-03": {
    usRef: "SEC Cybersecurity Incident Disclosure (4-Business-Day 8-K); OCC / FDIC 36-Hour Rule",
    ukRef: "FCA / PRA Material Operational Incident Reporting",
    auRef: "APRA CPS 234 72-Hour Information Security Incident Notification",
    nzRef: "RBNZ / FMA Cyber & Operational Incident Notification",
  },
  "V77-ISO27-01": {
    usRef: "NIST SP 800-53 AC-2/AC-6; SOC 2 CC6.1 Logical Access for AI Endpoints",
    ukRef: "UK Cyber Essentials Plus & NCSC Secure AI Access Controls",
    auRef: "ASD Essential Eight & APRA CPS 234 Access Control",
    nzRef: "NZ Information Security Manual (NZISM) Access Control for AI Systems",
  },
  "V77-ISO27-02": {
    usRef: "NIST SSDF (SP 800-218A Secure Software Development for AI Models)",
    ukRef: "NCSC Guidelines for Secure AI System Development (Design, Development, Deployment)",
    auRef: "ASD / ACSC Guidelines for Secure AI System Development; DISR Guardrail 3",
    nzRef: "NZ NCSC Co-Authored Guidelines for Secure AI System Development",
  },
};

export function getGlobalControlRefs(code: string): GlobalControlCrosswalk {
  return (
    GLOBAL_CONTROL_REFS[code] || {
      usRef: "NIST AI RMF 1.0 · CO SB 24-205",
      ukRef: "UK DSIT AI Principles · BS ISO/IEC 42001",
      auRef: "DISR 10 AI Guardrails (VAISS)",
      nzRef: "NZ Privacy Act 2020 IPPs · Algorithm Charter",
    }
  );
}
