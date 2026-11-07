export type EuIndustryId =
  | "banking_credit"
  | "insurance_risk"
  | "employment_hr"
  | "healthcare_medtech"
  | "critical_infrastructure"
  | "manufacturing_automotive"
  | "education_edtech"
  | "public_sector"
  | "biometrics_identity"
  | "ecommerce_media"
  | "b2b_saas_gpai";

export type EuSystemArchetype = {
  id: string;
  label: string;
  name: string;
  description: string;
  intendedPurpose: string;
  roleInValueChain: "provider" | "deployer" | "importer" | "distributor";
  lifecycleStatus: "production" | "pilot" | "discovered" | "retired";
  vendorName: string;
  versionLabel: string;
  euDatabaseId: string;
  /** Pre-populated answers for the 25-question EU AI Act statutory classifier */
  classifierYesIds: string[];
};

export type EuIndustryPlaybook = {
  id: EuIndustryId;
  name: string;
  shortLabel: string;
  defaultRiskTierHint: "high_risk" | "limited" | "gpai";
  euAiActBasis: string;
  coRegulations: string[];
  competentAuthorities: string[];
  typicalSystems: string[];
  keyAuditCheckpoints: string[];
  archetypes: EuSystemArchetype[];
  presetExample: {
    name: string;
    description: string;
    intendedPurpose: string;
    roleInValueChain: "provider" | "deployer";
  };
};

export const VENDOR_PRESETS: string[] = [
  "Internal Proprietary ML / Risk Engineering Team",
  "Mistral AI (Mistral Large / Enterprise EU Cloud — Paris)",
  "OpenAI (Azure OpenAI EU Data Boundary — Frankfurt/Sweden)",
  "Anthropic (Claude 3.7 Sonnet via AWS Bedrock Frankfurt eu-central-1)",
  "Google Cloud Vertex AI (Gemini — europe-west1 Belgium / europe-west3 Frankfurt)",
  "Aleph Alpha (Luminous — Sovereign European AI, Heidelberg)",
  "SAP Business AI / Databricks / Snowflake EU Region",
  "Third-Party Regulated European SaaS Vendor",
];

export const VERSION_PRESETS: string[] = [
  "v1.0.0-eu-prod",
  "v1.2.0-rc1 (Pre-Deployment Conformity)",
  "v2.0.0-dora-compliant",
  "v2.4.1-annex-iv-verified",
  "2026.11-lts",
];

export const EU_INDUSTRY_PLAYBOOKS: EuIndustryPlaybook[] = [
  {
    id: "banking_credit",
    name: "Banking, FinTech & Creditworthiness Scoring",
    shortLabel: "Banking & Credit (Annex III pt. 5(b) / DORA)",
    defaultRiskTierHint: "high_risk",
    euAiActBasis: "EU AI Act Art. 6(2) & Annex III Point 5(b) · Art. 9(9) DORA Integration · Art. 27 FRIA",
    coRegulations: [
      "DORA (Regulation (EU) 2022/2554 Arts. 5–19 & 28)",
      "Consumer Credit Directive II (Directive (EU) 2023/2225 Art. 18)",
      "GDPR Art. 22 (Automated Credit Profiling) & Art. 35 DPIA",
      "EBA Guidelines on Loan Origination & Monitoring",
    ],
    competentAuthorities: ["EBA / ECB", "National Financial Supervisors (BaFin, ACPR, KNF, DNB, Banco de España)", "National DPAs"],
    typicalSystems: [
      "Retail creditworthiness & credit score calculation",
      "Automated mortgage & SME loan underwriting",
      "Buy-Now-Pay-Later (BNPL) instant affordability scoring",
      "AI anti-money laundering (AML) & fraud anomaly triage",
    ],
    keyAuditCheckpoints: [
      "Confirm whether the system evaluates creditworthiness of natural persons (High-Risk Annex III pt. 5(b)) or is strictly financial fraud detection (exempt under pt. 5(b) exception).",
      "Verify Art. 9(9) integration with DORA ICT/model risk management and Art. 26(5) continuous drift monitoring.",
      "Verify Consumer Credit Directive II & GDPR Art. 22 right to human intervention and clear explanation of credit denial.",
      "Complete Art. 27 FRIA, GDPR Art. 35 DPIA, and Annex IV technical file.",
    ],
    archetypes: [
      {
        id: "retail_credit_scoring",
        label: "Retail Consumer Creditworthiness & Loan Scoring Engine (Annex III pt. 5(b) — High-Risk)",
        name: "CreditGuard EU — Retail Creditworthiness & Loan Scoring Engine",
        description:
          "Ensemble gradient-boosted decision tree (XGBoost) and explainable SHAP attribution pipeline processing applicant income, repayment history, debt-to-income ratio, and PSD2 open-banking cashflow signals under mandatory human credit-officer review.",
        intendedPurpose:
          "Evaluate the creditworthiness and probability of default of natural persons applying for retail consumer loans and credit cards in the European Union (EU AI Act Annex III Point 5(b) & Consumer Credit Directive II Art. 18).",
        roleInValueChain: "provider",
        lifecycleStatus: "production",
        vendorName: "Internal Proprietary ML / Risk Engineering Team",
        versionLabel: "v2.0.0-dora-compliant",
        euDatabaseId: "EU-AI-DB-2026-BNK-05B-001",
        classifierYesIds: ["essential_services", "profiling_natural_persons"],
      },
      {
        id: "mortgage_underwriting",
        label: "Automated Mortgage Affordability & Underwriting Assistant (Annex III pt. 5(b) — High-Risk)",
        name: "EuroMortgage AI — Residential Mortgage Underwriting & Risk Scorer",
        description:
          "Automated mortgage underwriting model combining credit bureau records, collateral valuation bands, and macroeconomic stress-test parameters with human underwriter sign-off.",
        intendedPurpose:
          "Assess residential mortgage affordability and borrower credit risk for natural persons across EU Member States under EU AI Act Annex III Point 5(b), DORA Art. 6, and EBA Loan Origination Guidelines.",
        roleInValueChain: "deployer",
        lifecycleStatus: "production",
        vendorName: "SAP Business AI / Databricks / Snowflake EU Region",
        versionLabel: "v1.2.0-rc1 (Pre-Deployment Conformity)",
        euDatabaseId: "EU-AI-DB-2026-BNK-05B-002",
        classifierYesIds: ["essential_services", "profiling_natural_persons"],
      },
      {
        id: "bnpl_affordability",
        label: "Buy-Now-Pay-Later (BNPL) Real-Time Point-of-Sale Credit Scorer (Annex III pt. 5(b) — High-Risk)",
        name: "InstantPay EU — BNPL Real-Time Credit & Affordability Engine",
        description:
          "Low-latency point-of-sale credit scoring microservice evaluating short-term installment eligibility with automated adverse-action reason codes and instant human contestability routing.",
        intendedPurpose:
          "Determine real-time BNPL installment credit eligibility for EU consumers in compliance with EU AI Act Annex III Point 5(b), CCD II, and GDPR Art. 22.",
        roleInValueChain: "provider",
        lifecycleStatus: "production",
        vendorName: "Internal Proprietary ML / Risk Engineering Team",
        versionLabel: "v2.4.1-annex-iv-verified",
        euDatabaseId: "EU-AI-DB-2026-BNK-05B-003",
        classifierYesIds: ["essential_services", "profiling_natural_persons"],
      },
      {
        id: "aml_fraud_detection",
        label: "Financial Fraud & AML Transaction Anomaly Detection (Annex III pt. 5(b) Fraud Exemption)",
        name: "SentinelAML EU — Real-Time Payment Fraud & AML Triage AI",
        description:
          "Graph neural network and anomaly detection engine flagging suspicious SEPA wire transfers and card transactions for compliance analyst investigation.",
        intendedPurpose:
          "Detect financial fraud and money-laundering anomalies in payment flows (explicitly carved out from Annex III pt. 5(b) high-risk credit scoring, governed under DORA and AMLD6).",
        roleInValueChain: "deployer",
        lifecycleStatus: "production",
        vendorName: "Internal Proprietary ML / Risk Engineering Team",
        versionLabel: "v1.0.0-eu-prod",
        euDatabaseId: "EU-AI-DB-2026-BNK-AML-004",
        classifierYesIds: [],
      },
    ],
    presetExample: {
      name: "CreditGuard EU — Retail Creditworthiness & Loan Scoring Engine",
      description:
        "Ensemble gradient-boosted decision tree (XGBoost) and explainable SHAP attribution pipeline processing applicant income, repayment history, debt-to-income ratio, and PSD2 open-banking cashflow signals under mandatory human credit-officer review.",
      intendedPurpose:
        "Evaluate the creditworthiness and probability of default of natural persons applying for retail consumer loans and credit cards in the European Union (EU AI Act Annex III Point 5(b) & Consumer Credit Directive II Art. 18).",
      roleInValueChain: "provider",
    },
  },
  {
    id: "insurance_risk",
    name: "Insurance (Life, Health & Claims Underwriting)",
    shortLabel: "Insurance (Annex III pt. 5(c) / EIOPA / DORA)",
    defaultRiskTierHint: "high_risk",
    euAiActBasis: "EU AI Act Art. 6(2) & Annex III Point 5(c) · Art. 27 FRIA · Art. 14 Human Oversight",
    coRegulations: [
      "DORA (Regulation (EU) 2022/2554)",
      "Solvency II & Insurance Distribution Directive (IDD)",
      "EIOPA AI Governance Principles",
      "GDPR Art. 9 (Health Data) & Art. 22",
    ],
    competentAuthorities: ["EIOPA", "National Insurance Supervisors (BaFin, ACPR, IVASS, KNF)", "National DPAs"],
    typicalSystems: [
      "Life and health insurance risk assessment & dynamic pricing",
      "Automated medical underwriting & policy eligibility scoring",
      "Claims triage, bodily-injury valuation & subrogation AI",
    ],
    keyAuditCheckpoints: [
      "Verify High-Risk obligations under Annex III pt. 5(c) for risk assessment and pricing in relation to natural persons for life and health insurance.",
      "Examine Actuarial & Demographic Fairness (Art. 10) to prevent unlawful proxy discrimination (EU Gender Directive / Charter Art. 21).",
      "Verify GDPR Art. 9 explicit consent / legal basis for special-category health data processing.",
    ],
    archetypes: [
      {
        id: "life_health_pricing",
        label: "Life & Health Insurance Risk Assessment & Premium Pricing AI (Annex III pt. 5(c) — High-Risk)",
        name: "InsurePulse EU — Life & Health Underwriting & Pricing Engine",
        description:
          "Actuarial machine-learning risk stratification and premium calculation model evaluating applicant health questionnaires, morbidity tables, and lifestyle indicators with human chief-underwriter oversight.",
        intendedPurpose:
          "Perform risk assessment and policy pricing in relation to natural persons for individual life and health insurance policies across the EU (EU AI Act Annex III Point 5(c), EIOPA AI Principles & GDPR Art. 9/22).",
        roleInValueChain: "provider",
        lifecycleStatus: "production",
        vendorName: "Internal Proprietary ML / Risk Engineering Team",
        versionLabel: "v2.0.0-dora-compliant",
        euDatabaseId: "EU-AI-DB-2026-INS-05C-001",
        classifierYesIds: ["essential_services", "profiling_natural_persons"],
      },
      {
        id: "medical_claims_triage",
        label: "Health Insurance Pre-Authorization & Claims Triage AI (Annex III pt. 5(c) — High-Risk)",
        name: "MediClaim EU — Health Policy Coverage & Claims Triage Assistant",
        description:
          "Clinical NLP and rules-hybrid assistant reviewing ICD-10 diagnostic codes and policy terms to recommend reimbursement eligibility to human claims adjusters.",
        intendedPurpose:
          "Assist human claims adjusters in evaluating health insurance coverage eligibility and reimbursement levels for insured natural persons (Annex III Point 5(c) & GDPR Art. 9).",
        roleInValueChain: "deployer",
        lifecycleStatus: "production",
        vendorName: "Mistral AI (Mistral Large / Enterprise EU Cloud — Paris)",
        versionLabel: "v1.0.0-eu-prod",
        euDatabaseId: "EU-AI-DB-2026-INS-05C-002",
        classifierYesIds: ["essential_services", "profiling_natural_persons", "interacts_with_humans"],
      },
    ],
    presetExample: {
      name: "InsurePulse EU — Life & Health Underwriting & Pricing Engine",
      description:
        "Actuarial machine-learning risk stratification and premium calculation model evaluating applicant health questionnaires, morbidity tables, and lifestyle indicators with human chief-underwriter oversight.",
      intendedPurpose:
        "Perform risk assessment and policy pricing in relation to natural persons for individual life and health insurance policies across the EU (EU AI Act Annex III Point 5(c), EIOPA AI Principles & GDPR Art. 9/22).",
      roleInValueChain: "provider",
    },
  },
  {
    id: "employment_hr",
    name: "HR, Recruitment & Workforce Management",
    shortLabel: "HR & Recruitment (Annex III pt. 4)",
    defaultRiskTierHint: "high_risk",
    euAiActBasis: "EU AI Act Art. 6(2) & Annex III Point 4(a)–(b) · Art. 5(1)(f) Workplace Emotion Ban · Art. 26(7) Worker Notice",
    coRegulations: [
      "GDPR Art. 22 & Art. 88 (Employment Data)",
      "EU Platform Work Directive (EU) 2024/2831",
      "EU Pay Transparency & Equal Treatment Directives",
      "National Works Council Co-Determination (e.g. BetrVG § 87 / CSE)",
    ],
    competentAuthorities: ["National Market Surveillance Authorities", "National Data Protection Authorities (DPAs)", "National Labour Inspectorates & Equality Bodies"],
    typicalSystems: [
      "Automated CV screening & candidate ranking",
      "AI video interview analysis & competency scoring",
      "Workforce performance evaluation, promotion & task allocation",
      "Internal talent mobility & attrition prediction",
    ],
    keyAuditCheckpoints: [
      "Verify Art. 5(1)(f) prohibition: confirm no emotion recognition is used in the workplace unless strictly for safety/medical reasons.",
      "Verify Art. 10(2)(f)–(g) & Four-Fifths Rule (>= 0.80) subgroup parity across gender, age, ethnicity, and disability proxies.",
      "Verify Art. 26(7) mandatory prior notification to workers and Works Councils before putting high-risk HR AI into service.",
      "Complete both Art. 27 FRIA and GDPR Art. 35 DPIA with human-in-the-loop override (Art. 14).",
    ],
    archetypes: [
      {
        id: "cv_screening_ranking",
        label: "Automated CV Screening & Candidate Shortlisting Engine (Annex III pt. 4(a) — High-Risk)",
        name: "TalentRank EU — Candidate CV Screening & Shortlisting AI",
        description:
          "Semantic competency extraction and structured rubric matching model that scores job applications against role requirements while stripping protected demographic proxies prior to inference.",
        intendedPurpose:
          "Filter, score, and shortlist job applicants for recruitment interviews under mandatory human recruiter review (EU AI Act Annex III Point 4(a) & GDPR Art. 22/88).",
        roleInValueChain: "deployer",
        lifecycleStatus: "production",
        vendorName: "OpenAI (Azure OpenAI EU Data Boundary — Frankfurt/Sweden)",
        versionLabel: "v2.4.1-annex-iv-verified",
        euDatabaseId: "EU-AI-DB-2026-HR-04A-001",
        classifierYesIds: ["employment", "profiling_natural_persons"],
      },
      {
        id: "workforce_performance_allocation",
        label: "Workforce Performance Evaluation, Promotion & Task Allocation AI (Annex III pt. 4(b) — High-Risk)",
        name: "WorkForcePulse EU — Employee Performance & Shift Allocation AI",
        description:
          "Workforce analytics and shift/task allocation engine evaluating KPI attainment, skill matrices, and operational demand with Works Council (Betriebsrat / CSE) transparency.",
        intendedPurpose:
          "Support human managers in task allocation, promotion readiness review, and workforce performance evaluation (EU AI Act Annex III Point 4(b), Art. 26(7) Worker Notification & Platform Work Directive).",
        roleInValueChain: "deployer",
        lifecycleStatus: "production",
        vendorName: "SAP Business AI / Databricks / Snowflake EU Region",
        versionLabel: "v1.0.0-eu-prod",
        euDatabaseId: "EU-AI-DB-2026-HR-04B-002",
        classifierYesIds: ["employment", "profiling_natural_persons"],
      },
    ],
    presetExample: {
      name: "TalentRank EU — Candidate CV Screening & Shortlisting AI",
      description:
        "Semantic competency extraction and structured rubric matching model that scores job applications against role requirements while stripping protected demographic proxies prior to inference.",
      intendedPurpose:
        "Filter, score, and shortlist job applicants for recruitment interviews under mandatory human recruiter review (EU AI Act Annex III Point 4(a) & GDPR Art. 22/88).",
      roleInValueChain: "deployer",
    },
  },
  {
    id: "healthcare_medtech",
    name: "Healthcare, MedTech (MDR/IVDR) & Clinical Triage",
    shortLabel: "Healthcare & MedTech (Annex I MDR/IVDR & Annex III pt. 5(d))",
    defaultRiskTierHint: "high_risk",
    euAiActBasis: "EU AI Act Art. 6(1) & Annex I Section A (Points 11–12 MDR/IVDR) · Annex III Point 5(d) Emergency Healthcare Triage",
    coRegulations: [
      "Medical Device Regulation (MDR (EU) 2017/745)",
      "In Vitro Diagnostic Regulation (IVDR (EU) 2017/746)",
      "European Health Data Space (EHDS Regulation)",
      "GDPR Art. 9(2)(h)–(i) Health Data & ISO 13485 / IEC 62304",
    ],
    competentAuthorities: ["Designated Notified Bodies (TÜV, BSI, DEKRA)", "EMA & National Competent Authorities (BfArM, ANSM, Aemps)"],
    typicalSystems: [
      "AI Software as a Medical Device (SaMD) & radiology/pathology diagnostics",
      "Emergency department patient triage & ambulance dispatch prioritization",
      "Clinical decision support (CDSS) & hospital readmission prediction",
      "Pharmacovigilance & clinical trial patient matching",
    ],
    keyAuditCheckpoints: [
      "Verify third-party Notified Body conformity assessment alignment under Art. 43(3) and MDR/IVDR technical file integration (Art. 11(2)).",
      "Verify clinical accuracy, sensitivity/specificity across patient demographics (Art. 10 & Art. 15), and cybersecurity resilience.",
      "Ensure clinician-in-the-loop override controls (Art. 14) and Art. 73 serious-incident reporting (10-day window for death / 15-day standard).",
    ],
    archetypes: [
      {
        id: "radiology_samd_mdr",
        label: "Class IIa/IIb AI Medical Device Diagnostic Imaging (Art. 6(1) Annex I MDR 2017/745 — High-Risk)",
        name: "RadAssist MDR — Thoracic CT & Oncology Diagnostic SaMD",
        description:
          "Deep convolutional vision transformer trained on multi-center European hospital DICOM cohorts to highlight pulmonary nodules and acute thoracic pathologies for board-certified radiologists.",
        intendedPurpose:
          "Operate as a Class IIa Software as a Medical Device (SaMD) assisting licensed physicians in diagnostic imaging interpretation under Regulation (EU) 2017/745 (MDR) and EU AI Act Art. 6(1) Annex I.",
        roleInValueChain: "provider",
        lifecycleStatus: "production",
        vendorName: "Internal Proprietary ML / Risk Engineering Team",
        versionLabel: "v2.4.1-annex-iv-verified",
        euDatabaseId: "EU-AI-DB-2026-MED-MDR-001",
        classifierYesIds: ["annex_i_product_safety"],
      },
      {
        id: "emergency_patient_triage",
        label: "Emergency Department & 112 Ambulance Patient Triage AI (Annex III pt. 5(d) — High-Risk)",
        name: "TriageGuard EU — Emergency Clinical Acuity & Dispatch Prioritization AI",
        description:
          "Multimodal clinical acuity scoring system combining vital signs, symptom intake, and triage nurse notes to prioritize emergency care urgency.",
        intendedPurpose:
          "Evaluate and classify emergency healthcare calls and hospital ED arrivals to establish priority in the dispatching of emergency first-aid services (EU AI Act Annex III Point 5(d)).",
        roleInValueChain: "deployer",
        lifecycleStatus: "production",
        vendorName: "Internal Proprietary ML / Risk Engineering Team",
        versionLabel: "v1.0.0-eu-prod",
        euDatabaseId: "EU-AI-DB-2026-MED-05D-002",
        classifierYesIds: ["essential_services"],
      },
    ],
    presetExample: {
      name: "RadAssist MDR — Thoracic CT & Oncology Diagnostic SaMD",
      description:
        "Deep convolutional vision transformer trained on multi-center European hospital DICOM cohorts to highlight pulmonary nodules and acute thoracic pathologies for board-certified radiologists.",
      intendedPurpose:
        "Operate as a Class IIa Software as a Medical Device (SaMD) assisting licensed physicians in diagnostic imaging interpretation under Regulation (EU) 2017/745 (MDR) and EU AI Act Art. 6(1) Annex I.",
      roleInValueChain: "provider",
    },
  },
  {
    id: "critical_infrastructure",
    name: "Critical Infrastructure, Energy, Utilities & Transport",
    shortLabel: "Critical Infrastructure & Energy (Annex III pt. 2 / NIS2)",
    defaultRiskTierHint: "high_risk",
    euAiActBasis: "EU AI Act Art. 6(2) & Annex III Point 2 (Safety Components in Digital Infrastructure, Road/Rail/Water/Air Traffic, Water/Gas/Heating/Electricity)",
    coRegulations: [
      "NIS2 Directive (EU) 2022/2555 (Essential & Important Entities)",
      "Critical Entities Resilience (CER) Directive (EU) 2022/2557",
      "EU Cyber Resilience Act (CRA Regulation (EU) 2024/2847)",
      "EN ISO/IEC 27001:2022 & IEC 62443",
    ],
    competentAuthorities: ["ENISA", "National CSIRT / NIS2 Authorities (BSI, ANSSI, NCSC)", "National Energy & Transport Regulators"],
    typicalSystems: [
      "Smart-grid load balancing & electricity/gas/water supply safety controllers",
      "Road, rail, maritime & aviation traffic management AI",
      "Core telecom & cloud digital infrastructure anomaly/routing safety systems",
    ],
    keyAuditCheckpoints: [
      "Verify Art. 15 fail-safe robustness, redundancy, and adversarial cyber-resilience against data poisoning and model manipulation.",
      "Verify 2-day (48-hour) rapid statutory reporting readiness under EU AI Act Art. 73(3) for critical infrastructure disruption, coordinated with NIS2 24h/72h reporting.",
      "Verify Art. 14 physical/operational emergency stop ('kill-switch') and manual fallback procedures.",
    ],
    archetypes: [
      {
        id: "smart_grid_load_safety",
        label: "Electricity Smart-Grid Load Balancing & Substation Safety Component (Annex III pt. 2 — High-Risk)",
        name: "GridGuardian EU — High-Voltage Smart Grid Protection & Load AI",
        description:
          "Real-time SCADA telemetry inference engine predicting transformer thermal overload and executing automated load-shedding recommendations with control-room engineer override.",
        intendedPurpose:
          "Operate as a safety component in the management and supply of electricity and district heating across EU Member States (EU AI Act Annex III Point 2 & NIS2 Directive).",
        roleInValueChain: "provider",
        lifecycleStatus: "production",
        vendorName: "Internal Proprietary ML / Risk Engineering Team",
        versionLabel: "2026.11-lts",
        euDatabaseId: "EU-AI-DB-2026-INF-02-001",
        classifierYesIds: ["critical_infrastructure"],
      },
      {
        id: "road_rail_traffic_safety",
        label: "Road & Rail Traffic Management Safety Component (Annex III pt. 2 — High-Risk)",
        name: "TransitFlow EU — Intelligent Road & Rail Traffic Safety Controller",
        description:
          "Sensor-fusion traffic signal and rail-corridor congestion safety component with deterministic hardware fallback interlocks.",
        intendedPurpose:
          "Serve as a safety component in the management and operation of road and rail traffic across European transport corridors (EU AI Act Annex III Point 2).",
        roleInValueChain: "deployer",
        lifecycleStatus: "production",
        vendorName: "Third-Party Regulated European SaaS Vendor",
        versionLabel: "v1.0.0-eu-prod",
        euDatabaseId: "EU-AI-DB-2026-INF-02-002",
        classifierYesIds: ["critical_infrastructure"],
      },
    ],
    presetExample: {
      name: "GridGuardian EU — High-Voltage Smart Grid Protection & Load AI",
      description:
        "Real-time SCADA telemetry inference engine predicting transformer thermal overload and executing automated load-shedding recommendations with control-room engineer override.",
      intendedPurpose:
        "Operate as a safety component in the management and supply of electricity and district heating across EU Member States (EU AI Act Annex III Point 2 & NIS2 Directive).",
      roleInValueChain: "provider",
    },
  },
  {
    id: "manufacturing_automotive",
    name: "Automotive, Industrial Manufacturing, Robotics & Machinery",
    shortLabel: "Automotive, Robotics & Machinery (Annex I Product Safety)",
    defaultRiskTierHint: "high_risk",
    euAiActBasis: "EU AI Act Art. 6(1) & Annex I Section A & Section B (Machinery, Toys, Lifts, Radio Equipment, Automotive, Aviation, Rail, Marine)",
    coRegulations: [
      "EU Machinery Regulation (EU) 2023/1230",
      "Motor Vehicle General Safety & Automated Driving Regulation (EU) 2019/2144",
      "EU Cyber Resilience Act (CRA) & EU Product Liability Directive (2024)",
      "ISO 26262 / ISO 21448 (SOTIF) / EN ISO 13849",
    ],
    competentAuthorities: ["Notified Bodies", "KBA / UTAC / RDW (Type-Approval Authorities)", "National Market Surveillance Authorities"],
    typicalSystems: [
      "Autonomous mobile robots (AMRs) & collaborative industrial cobots",
      "Automotive ADAS, driver monitoring & automated driving perception systems",
      "AI-driven safety shutoff components in industrial machinery & lifts",
    ],
    keyAuditCheckpoints: [
      "Verify single EU Declaration of Conformity (Art. 47(1)) covering both the EU AI Act and applicable Union harmonisation legislation in Annex I.",
      "Verify Art. 12 automatic event logging (black-box traceability) and Art. 15 robustness under edge-case environmental conditions.",
      "Verify CE marking (Art. 48) and Notified Body involvement where required by the sector regulation.",
    ],
    archetypes: [
      {
        id: "industrial_cobot_safety",
        label: "Collaborative Industrial Robot (Cobot) Safety Vision Component (Art. 6(1) Annex I Machinery Reg — High-Risk)",
        name: "CobotSafe Vision — Industrial Machinery Human-Proximity Safety AI",
        description:
          "3D LiDAR and stereo-vision safety perception module that detects human workers entering hazard zones and triggers immediate speed/torque reduction or emergency stop.",
        intendedPurpose:
          "Function as a safety component of industrial machinery under Regulation (EU) 2023/1230 (Machinery Regulation) and EU AI Act Art. 6(1) Annex I Section A.",
        roleInValueChain: "provider",
        lifecycleStatus: "production",
        vendorName: "Internal Proprietary ML / Risk Engineering Team",
        versionLabel: "v2.4.1-annex-iv-verified",
        euDatabaseId: "EU-AI-DB-2026-MFG-ANX1-001",
        classifierYesIds: ["annex_i_product_safety"],
      },
      {
        id: "automotive_adas_perception",
        label: "Automotive ADAS Pedestrian & Lane Safety Perception Module (Art. 6(1) Annex I Reg. 2019/2144 — High-Risk)",
        name: "AutoDriveSense EU — ADAS Emergency Braking & Pedestrian Perception AI",
        description:
          "Embedded automotive neural perception stack for vulnerable road user (VRU) detection and autonomous emergency braking (AEB) validated under ISO 21448 (SOTIF).",
        intendedPurpose:
          "Provide safety-critical pedestrian and obstacle detection for EU type-approved motor vehicles under Regulation (EU) 2019/2144 and EU AI Act Art. 6(1) Annex I Section B.",
        roleInValueChain: "provider",
        lifecycleStatus: "production",
        vendorName: "Internal Proprietary ML / Risk Engineering Team",
        versionLabel: "2026.11-lts",
        euDatabaseId: "EU-AI-DB-2026-AUT-ANX1-002",
        classifierYesIds: ["annex_i_product_safety"],
      },
    ],
    presetExample: {
      name: "CobotSafe Vision — Industrial Machinery Human-Proximity Safety AI",
      description:
        "3D LiDAR and stereo-vision safety perception module that detects human workers entering hazard zones and triggers immediate speed/torque reduction or emergency stop.",
      intendedPurpose:
        "Function as a safety component of industrial machinery under Regulation (EU) 2023/1230 (Machinery Regulation) and EU AI Act Art. 6(1) Annex I Section A.",
      roleInValueChain: "provider",
    },
  },
  {
    id: "education_edtech",
    name: "Education, Universities, EdTech & Vocational Training",
    shortLabel: "Education & EdTech (Annex III pt. 3)",
    defaultRiskTierHint: "high_risk",
    euAiActBasis: "EU AI Act Art. 6(2) & Annex III Point 3(a)–(d) · Art. 5(1)(f) Ban on Emotion Recognition in Education",
    coRegulations: [
      "GDPR Art. 8 (Children/Minors Data Protection) & Art. 35 DPIA",
      "European Accessibility Act (Directive (EU) 2019/882)",
      "National Higher Education & Examination Acts",
    ],
    competentAuthorities: ["National Ministries of Education", "National DPAs", "National Market Surveillance Authorities"],
    typicalSystems: [
      "University & school admissions scoring and placement AI (pt. 3(a))",
      "Automated essay/exam grading & learning outcome evaluation (pt. 3(b))",
      "Adaptive level-placement & streaming systems (pt. 3(c))",
      "Remote exam proctoring & cheating detection AI (pt. 3(d))",
    ],
    keyAuditCheckpoints: [
      "Verify strict compliance with Art. 5(1)(f): ensure remote proctoring or classroom AI does NOT infer student emotions from facial/vocal biometrics.",
      "Verify subgroup fairness across native vs. non-native language speakers and neurodivergent students (Art. 10 & Charter Art. 21).",
      "Complete Art. 27 FRIA and GDPR Art. 35 DPIA prior to academic deployment.",
    ],
    archetypes: [
      {
        id: "university_admissions_grading",
        label: "University Admissions & Automated Exam Grading AI (Annex III pt. 3(a)–(b) — High-Risk)",
        name: "ScholarEval EU — University Admissions & Exam Assessment AI",
        description:
          "Multilingual rubric-aligned grading and admissions ranking assistant with mandatory academic faculty review and student appeal workflow.",
        intendedPurpose:
          "Assist European universities and vocational institutions in evaluating learning outcomes and admissions applications (EU AI Act Annex III Point 3(a)–(b)).",
        roleInValueChain: "deployer",
        lifecycleStatus: "production",
        vendorName: "Mistral AI (Mistral Large / Enterprise EU Cloud — Paris)",
        versionLabel: "v1.0.0-eu-prod",
        euDatabaseId: "EU-AI-DB-2026-EDU-03B-001",
        classifierYesIds: ["education", "profiling_natural_persons"],
      },
      {
        id: "exam_proctoring_integrity",
        label: "Remote Exam Integrity & Proctoring Monitor without Emotion Recognition (Annex III pt. 3(d) — High-Risk)",
        name: "ExamIntegrity EU — Remote Examination Proctoring Assistant",
        description:
          "Browser-lockdown and gaze/second-screen anomaly flagger that routes suspicious clips to human invigilators without performing prohibited emotion recognition (Art. 5(1)(f)).",
        intendedPurpose:
          "Monitor and detect prohibited behaviour of students during remote tests under mandatory human invigilator review (EU AI Act Annex III Point 3(d)).",
        roleInValueChain: "deployer",
        lifecycleStatus: "production",
        vendorName: "Third-Party Regulated European SaaS Vendor",
        versionLabel: "v1.2.0-rc1 (Pre-Deployment Conformity)",
        euDatabaseId: "EU-AI-DB-2026-EDU-03D-002",
        classifierYesIds: ["education"],
      },
    ],
    presetExample: {
      name: "ScholarEval EU — University Admissions & Exam Assessment AI",
      description:
        "Multilingual rubric-aligned grading and admissions ranking assistant with mandatory academic faculty review and student appeal workflow.",
      intendedPurpose:
        "Assist European universities and vocational institutions in evaluating learning outcomes and admissions applications (EU AI Act Annex III Point 3(a)–(b)).",
      roleInValueChain: "deployer",
    },
  },
  {
    id: "public_sector",
    name: "Public Sector, GovTech, Welfare, Justice & Migration",
    shortLabel: "Public Sector & GovTech (Annex III pts. 5(a), 6–8)",
    defaultRiskTierHint: "high_risk",
    euAiActBasis: "EU AI Act Annex III Points 5(a) (Public Benefits), 6 (Law Enforcement), 7 (Migration/Border), 8 (Justice/Democracy) · Art. 27 Mandatory FRIA · Art. 49(2) EU DB Registration",
    coRegulations: [
      "GDPR & Law Enforcement Directive (LED (EU) 2016/680)",
      "Interoperable Europe Act (Regulation (EU) 2024/903)",
      "EU Charter of Fundamental Rights (Arts. 41, 47, 48)",
    ],
    competentAuthorities: ["EDPS / National DPAs", "National Fundamental Rights Bodies", "National Market Surveillance Authorities"],
    typicalSystems: [
      "Social security, welfare, housing & unemployment benefit eligibility AI (pt. 5(a))",
      "Public emergency call (112) dispatch prioritization (pt. 5(d))",
      "Judicial case-law research & administrative decision-support systems (pt. 8(a))",
      "Visa, asylum & border document authenticity assessment (pt. 7)",
    ],
    keyAuditCheckpoints: [
      "Verify mandatory Deployer registration in the EU Database under Art. 49(2) & Annex VIII Section C.",
      "Verify mandatory Fundamental Rights Impact Assessment (Art. 27) and notification to the Market Surveillance Authority (Art. 27(3)).",
      "Verify dual human verification where required (Art. 14(5)) and citizen right to explanation.",
    ],
    archetypes: [
      {
        id: "public_benefits_eligibility",
        label: "Public Social Security & Welfare Benefit Eligibility Assistant (Annex III pt. 5(a) — High-Risk)",
        name: "CivicBenefit EU — Municipal Social Assistance & Benefit Eligibility AI",
        description:
          "Rule-grounded decision-support model assisting municipal caseworkers in verifying eligibility for housing, family, and unemployment assistance.",
        intendedPurpose:
          "Evaluate natural persons' eligibility for essential public assistance benefits and services on behalf of a public authority (EU AI Act Annex III Point 5(a) & Art. 27 Mandatory FRIA).",
        roleInValueChain: "deployer",
        lifecycleStatus: "production",
        vendorName: "Aleph Alpha (Luminous — Sovereign European AI, Heidelberg)",
        versionLabel: "v1.0.0-eu-prod",
        euDatabaseId: "EU-AI-DB-2026-PUB-05A-001",
        classifierYesIds: ["essential_services", "profiling_natural_persons"],
      },
      {
        id: "judicial_case_support",
        label: "Judicial Legal Research & Fact-Analysis Assistant (Annex III pt. 8(a) — High-Risk)",
        name: "LexCuria EU — Judicial Case-Law & Fact Synthesis Assistant",
        description:
          "Citation-grounded retrieval-augmented generation (RAG) system assisting court clerks and judges in researching EU/national jurisprudence.",
        intendedPurpose:
          "Assist judicial authorities in researching and interpreting facts and the law under strict human judge authority (EU AI Act Annex III Point 8(a)).",
        roleInValueChain: "deployer",
        lifecycleStatus: "pilot",
        vendorName: "Aleph Alpha (Luminous — Sovereign European AI, Heidelberg)",
        versionLabel: "v1.2.0-rc1 (Pre-Deployment Conformity)",
        euDatabaseId: "EU-AI-DB-2026-PUB-08A-002",
        classifierYesIds: ["justice_democracy"],
      },
    ],
    presetExample: {
      name: "CivicBenefit EU — Municipal Social Assistance & Benefit Eligibility AI",
      description:
        "Rule-grounded decision-support model assisting municipal caseworkers in verifying eligibility for housing, family, and unemployment assistance.",
      intendedPurpose:
        "Evaluate natural persons' eligibility for essential public assistance benefits and services on behalf of a public authority (EU AI Act Annex III Point 5(a) & Art. 27 Mandatory FRIA).",
      roleInValueChain: "deployer",
    },
  },
  {
    id: "biometrics_identity",
    name: "Biometrics, Identity Verification (eKYC) & Security",
    shortLabel: "Biometrics & Identity (Art. 5 & Annex III pt. 1)",
    defaultRiskTierHint: "high_risk",
    euAiActBasis: "EU AI Act Art. 5(1)(e)–(h) Prohibitions · Annex III Point 1(a)–(c) · Art. 14(5) Two-Person Verification · Art. 43(1) Notified Body Assessment",
    coRegulations: [
      "GDPR Art. 9 (Biometric Data for Unique Identification)",
      "eIDAS 2.0 (European Digital Identity Wallet Regulation (EU) 2024/1183)",
      "EN ISO/IEC 30107-3 (Presentation Attack Detection)",
    ],
    competentAuthorities: ["National DPAs", "Notified Bodies (Art. 43(1))", "National Market Surveillance Authorities"],
    typicalSystems: [
      "Remote biometric identification & liveness detection (Annex III pt. 1(a))",
      "Sensitive biometric categorisation systems (pt. 1(b))",
      "One-to-one (1:1) identity verification / eKYC (excluded from pt. 1(a), governed by GDPR Art. 9)",
    ],
    keyAuditCheckpoints: [
      "Distinguish 1:N remote biometric identification (High-Risk Annex III pt. 1(a)) from 1:1 authentication/verification.",
      "Screen strictly against Art. 5(1)(e) untargeted facial scraping ban and Art. 5(1)(g) sensitive biometric categorisation ban.",
      "Enforce Art. 14(5) requirement that no action or decision be taken based on remote biometric ID unless separately verified by at least two natural persons.",
    ],
    archetypes: [
      {
        id: "remote_biometric_id",
        label: "1:N Remote Biometric Identification & Liveness System (Annex III pt. 1(a) — High-Risk)",
        name: "BioVerify EU — Biometric Identification & Liveness Verification Engine",
        description:
          "ISO/IEC 30107-3 compliant facial template matching and presentation-attack liveness detector enforcing Art. 14(5) dual-operator confirmation.",
        intendedPurpose:
          "Perform post-event biometric identification and liveness verification with mandatory two-person human verification (EU AI Act Annex III Point 1(a) & Art. 14(5)).",
        roleInValueChain: "provider",
        lifecycleStatus: "production",
        vendorName: "Internal Proprietary ML / Risk Engineering Team",
        versionLabel: "v2.4.1-annex-iv-verified",
        euDatabaseId: "EU-AI-DB-2026-BIO-01A-001",
        classifierYesIds: ["biometrics"],
      },
    ],
    presetExample: {
      name: "BioVerify EU — Biometric Identification & Liveness Verification Engine",
      description:
        "ISO/IEC 30107-3 compliant facial template matching and presentation-attack liveness detector enforcing Art. 14(5) dual-operator confirmation.",
      intendedPurpose:
        "Perform post-event biometric identification and liveness verification with mandatory two-person human verification (EU AI Act Annex III Point 1(a) & Art. 14(5)).",
      roleInValueChain: "provider",
    },
  },
  {
    id: "ecommerce_media",
    name: "E-Commerce, Retail, Telecom, Media & Customer AI",
    shortLabel: "E-Commerce, Telecom & Media (Art. 50 Transparency / DSA)",
    defaultRiskTierHint: "limited",
    euAiActBasis: "EU AI Act Art. 50(1)–(4) Transparency Obligations · Art. 5(1)(a)–(b) Ban on Subliminal/Manipulative Dark Patterns",
    coRegulations: [
      "Digital Services Act (DSA Regulation (EU) 2022/2065)",
      "European Accessibility Act (EAA) & Omnibus Consumer Protection Directive",
      "GDPR Art. 6, Art. 13–14 & Art. 22",
    ],
    competentAuthorities: ["National AI Market Surveillance Authorities", "Digital Services Coordinators (DSA)", "National Consumer Protection & DPAs"],
    typicalSystems: [
      "Customer service chatbots & voice AI agents (Art. 50(1))",
      "Generative AI marketing, synthetic audio/image/video & virtual try-on (Art. 50(2) & 50(4))",
      "Dynamic pricing, personalized recommender systems & churn prevention",
    ],
    keyAuditCheckpoints: [
      "Verify Art. 50(1): natural persons are clearly informed at first interaction that they are interacting with an AI system.",
      "Verify Art. 50(2) & 50(4): synthetic audio, image, video, or text outputs are marked in a machine-readable format (e.g. C2PA metadata / watermarking) and deepfakes are disclosed.",
      "Verify OWASP LLM Top 10 prompt-injection and PII leakage guardrails via V77 Red-Team and Scored Evals.",
    ],
    archetypes: [
      {
        id: "customer_support_voice_bot",
        label: "Multilingual Customer Support Chatbot & Voice AI Agent (Art. 50(1) — Limited Risk)",
        name: "EuroCare Concierge — Customer Support & Order Resolution AI",
        description:
          "RAG-grounded customer service chatbot and voice agent handling order inquiries, returns, and billing questions with upfront Art. 50(1) AI disclosure.",
        intendedPurpose:
          "Interact directly with EU consumers to resolve customer support inquiries while disclosing AI interaction under EU AI Act Article 50(1).",
        roleInValueChain: "deployer",
        lifecycleStatus: "production",
        vendorName: "Mistral AI (Mistral Large / Enterprise EU Cloud — Paris)",
        versionLabel: "v1.0.0-eu-prod",
        euDatabaseId: "EU-AI-DB-2026-COM-50-001",
        classifierYesIds: ["interacts_with_humans"],
      },
      {
        id: "synthetic_media_generator",
        label: "Generative Marketing Studio & Synthetic Audio/Video Creator (Art. 50(2) & 50(4) — C2PA Watermarked)",
        name: "StudioSynth EU — C2PA-Watermarked Marketing Content Generator",
        description:
          "Multimodal image, video, and voice synthesis pipeline embedding cryptographic C2PA provenance metadata and visible synthetic content labels.",
        intendedPurpose:
          "Generate localized marketing visuals and voiceovers marked with machine-readable provenance per EU AI Act Article 50(2) and 50(4).",
        roleInValueChain: "deployer",
        lifecycleStatus: "production",
        vendorName: "Google Cloud Vertex AI (Gemini — europe-west1 Belgium / europe-west3 Frankfurt)",
        versionLabel: "v1.0.0-eu-prod",
        euDatabaseId: "EU-AI-DB-2026-COM-50-002",
        classifierYesIds: ["interacts_with_humans", "synthetic_content"],
      },
    ],
    presetExample: {
      name: "EuroCare Concierge — Customer Support & Order Resolution AI",
      description:
        "RAG-grounded customer service chatbot and voice agent handling order inquiries, returns, and billing questions with upfront Art. 50(1) AI disclosure.",
      intendedPurpose:
        "Interact directly with EU consumers to resolve customer support inquiries while disclosing AI interaction under EU AI Act Article 50(1).",
      roleInValueChain: "deployer",
    },
  },
  {
    id: "b2b_saas_gpai",
    name: "B2B SaaS, Foundation Model (GPAI) Providers & AI Consultancies",
    shortLabel: "B2B SaaS & GPAI Providers (Chapter V Arts. 51–55 & Art. 25)",
    defaultRiskTierHint: "gpai",
    euAiActBasis: "EU AI Act Chapter V (Articles 51–55 GPAI) · Annex XI & Annex XII · Art. 25 Value-Chain Escalation · Art. 13 Downstream Instructions",
    coRegulations: [
      "EU DSM Copyright Directive (EU) 2019/790 Art. 4(3) (TDM Opt-Out)",
      "EU AI Office General-Purpose AI Code of Practice",
      "EN ISO/IEC 42001:2023 & EN ISO/IEC 27001:2022",
    ],
    competentAuthorities: ["EU AI Office (European Commission)", "National Market Surveillance Authorities", "National DPAs"],
    typicalSystems: [
      "General-Purpose AI (GPAI) foundation models & fine-tuned domain LLMs (Arts. 51–55)",
      "Enterprise RAG copilots, legal/coding/compliance SaaS platforms",
      "Downstream B2B AI modules integrated into high-risk customer workflows (Art. 25)",
    ],
    keyAuditCheckpoints: [
      "Verify Art. 53(1)(a)–(b) Annex XI/XII technical documentation for the AI Office and downstream providers.",
      "Verify Art. 53(1)(c) EU Copyright Directive Art. 4(3) text-and-data-mining (TDM) reservation compliance and Art. 53(1)(d) public training data summary.",
      "For Systemic Risk GPAI (>= 10^25 FLOPs, Art. 51/55): verify adversarial red-teaming, serious incident reporting to the EU AI Office, and cybersecurity protections.",
    ],
    archetypes: [
      {
        id: "gpai_foundation_model",
        label: "General-Purpose AI (GPAI) Foundation / Fine-Tuned Enterprise Model (Chapter V Art. 53)",
        name: "EuroMind-7B — Enterprise Multilingual GPAI Model & API",
        description:
          "General-purpose transformer language model trained on copyright-cleared European corpora with Annex XI/XII documentation and downstream provider integration pack.",
        intendedPurpose:
          "Serve as a General-Purpose AI (GPAI) model providing text generation, summarization, and reasoning via API to downstream EU deployers (EU AI Act Chapter V Article 53).",
        roleInValueChain: "provider",
        lifecycleStatus: "production",
        vendorName: "Internal Proprietary ML / Risk Engineering Team",
        versionLabel: "2026.11-lts",
        euDatabaseId: "EU-AI-DB-2026-GPAI-53-001",
        classifierYesIds: ["interacts_with_humans", "synthetic_content", "is_gpai"],
      },
      {
        id: "systemic_gpai_model",
        label: "Frontier GPAI Model with Systemic Risk (>= 10^25 FLOPs — Chapter V Art. 51 & Art. 55)",
        name: "EuroFrontier-70B — Systemic-Risk Multimodal GPAI Foundation Model",
        description:
          "High-capability multimodal foundation model exceeding 10^25 training FLOPs with continuous EU AI Office adversarial red-teaming and cybersecurity safeguards.",
        intendedPurpose:
          "Provide frontier multimodal reasoning and code generation across the European Union under EU AI Act Articles 51, 53, and 55.",
        roleInValueChain: "provider",
        lifecycleStatus: "production",
        vendorName: "Internal Proprietary ML / Risk Engineering Team",
        versionLabel: "2026.11-lts",
        euDatabaseId: "EU-AI-DB-2026-GPAI-55-002",
        classifierYesIds: ["interacts_with_humans", "synthetic_content", "is_gpai", "gpai_systemic_risk"],
      },
    ],
    presetExample: {
      name: "EuroMind-7B — Enterprise Multilingual GPAI Model & API",
      description:
        "General-purpose transformer language model trained on copyright-cleared European corpora with Annex XI/XII documentation and downstream provider integration pack.",
      intendedPurpose:
        "Serve as a General-Purpose AI (GPAI) model providing text generation, summarization, and reasoning via API to downstream EU deployers (EU AI Act Chapter V Article 53).",
      roleInValueChain: "provider",
    },
  },
];

export function getEuIndustryPlaybook(domainOrId: string | null | undefined): EuIndustryPlaybook {
  const norm = (domainOrId || "").toLowerCase().trim();
  const exact = EU_INDUSTRY_PLAYBOOKS.find((p) => p.id === norm);
  if (exact) return exact;
  if (norm.includes("hr") || norm.includes("employ") || norm.includes("recruit")) {
    return EU_INDUSTRY_PLAYBOOKS.find((p) => p.id === "employment_hr")!;
  }
  if (norm.includes("insur")) {
    return EU_INDUSTRY_PLAYBOOKS.find((p) => p.id === "insurance_risk")!;
  }
  if (norm.includes("bank") || norm.includes("credit") || norm.includes("fin")) {
    return EU_INDUSTRY_PLAYBOOKS.find((p) => p.id === "banking_credit")!;
  }
  if (norm.includes("health") || norm.includes("med") || norm.includes("clinic")) {
    return EU_INDUSTRY_PLAYBOOKS.find((p) => p.id === "healthcare_medtech")!;
  }
  if (norm.includes("infra") || norm.includes("energy") || norm.includes("grid") || norm.includes("util")) {
    return EU_INDUSTRY_PLAYBOOKS.find((p) => p.id === "critical_infrastructure")!;
  }
  if (norm.includes("auto") || norm.includes("manufact") || norm.includes("robot") || norm.includes("machin")) {
    return EU_INDUSTRY_PLAYBOOKS.find((p) => p.id === "manufacturing_automotive")!;
  }
  if (norm.includes("edu") || norm.includes("school") || norm.includes("exam")) {
    return EU_INDUSTRY_PLAYBOOKS.find((p) => p.id === "education_edtech")!;
  }
  if (norm.includes("public") || norm.includes("gov") || norm.includes("welfare") || norm.includes("justice")) {
    return EU_INDUSTRY_PLAYBOOKS.find((p) => p.id === "public_sector")!;
  }
  if (norm.includes("biomet") || norm.includes("kyc") || norm.includes("ident")) {
    return EU_INDUSTRY_PLAYBOOKS.find((p) => p.id === "biometrics_identity")!;
  }
  if (norm.includes("gpai") || norm.includes("saas") || norm.includes("llm")) {
    return EU_INDUSTRY_PLAYBOOKS.find((p) => p.id === "b2b_saas_gpai")!;
  }
  return EU_INDUSTRY_PLAYBOOKS.find((p) => p.id === "banking_credit")!;
}

/** Pre-populated statutory implementation notes for the 24-control crosswalk */
export const CONTROL_IMPLEMENTATION_TEMPLATES: Record<string, string[]> = {
  default: [
    "Implemented & verified: Statutory control is active in production, governed by documented SOPs, human-in-the-loop oversight (Art. 14), and immutable SHA-256 evidence in the V77 Vault.",
    "In progress: Technical control is deployed in staging; final DPO / Compliance Officer sign-off and Annex IV attachment scheduled prior to EU market release.",
    "Implemented via upstream provider contractual assurances (Art. 25 / Art. 28) combined with deployer monitoring under Art. 26(5).",
  ],
  "V77-RMS-01": [
    "Continuous iterative Risk Management System established per EU AI Act Art. 9(1)–(8) and EN ISO/IEC 42001 Clause 6.1, integrated with sectoral governance (Art. 9(9)) and reviewed quarterly.",
  ],
  "V77-DATA-01": [
    "Training, validation, and testing datasets governed under EU AI Act Art. 10(2)–(5): provenance documented, direct PII minimized, and demographic subgroup parity verified via Four-Fifths Ratio (>= 0.80).",
  ],
  "V77-DOC-01": [
    "Annex IV Technical Documentation (all 8 sections, Art. 11) and Art. 13 Instructions for Use are auto-drafted and maintained in V77 Trust for 10 years per Art. 18.",
  ],
  "V77-LOG-01": [
    "Automatic tamper-evident event logging enabled per EU AI Act Art. 12 and Art. 19 (>= 6 months retention) with cryptographic SHA-256 hash chaining.",
  ],
  "V77-HOV-01": [
    "Human-in-the-loop oversight enforced per EU AI Act Art. 14 and Art. 26(2): trained operators review model rationale, hold full authority to override recommendations, and can trigger an immediate stop switch.",
  ],
  "V77-ACC-01": [
    "Accuracy, robustness, and cybersecurity verified per EU AI Act Art. 15 via V77 Scored Evaluation Suites (10 cases) and OWASP LLM Top 10 Adversarial Red-Teaming (16 scenarios).",
  ],
};

/** Pre-populated European Institutions / Client Entities / Business Units per industry sector */
export const INSTITUTION_PRESETS_BY_SECTOR: Record<string, string[]> = {
  banking_credit: [
    "EuroBank AG — Retail & SME Credit Division (Frankfurt, DE)",
    "BNP Paribas / EuroFin — Consumer Lending & Mortgage Risk (Paris, FR)",
    "ING Group EU — Digital Banking & Credit Analytics (Amsterdam, NL)",
    "Banco Santander EU — Retail Credit & AML Compliance (Madrid, ES)",
    "Internal Banking & Credit Risk Division (Current Workspace Entity)",
  ],
  insurance_risk: [
    "Allianz Europe SE — Life & Health Actuarial Underwriting (Munich, DE)",
    "AXA Group EU — Health & Protection Pricing Division (Paris, FR)",
    "Generali Group — European Life & Claims Operations (Trieste, IT)",
    "Zurich Insurance EU — Personal Lines Underwriting (Dublin, IE)",
    "Internal Insurance Actuarial & Underwriting Division (Current Workspace Entity)",
  ],
  employment_hr: [
    "Siemens AG — European Talent Acquisition & People Analytics (Munich, DE)",
    "Randstad Enterprise EU — Automated Recruitment Operations (Amsterdam, NL)",
    "SAP SE — Global & EU Workforce Operations (Walldorf, DE)",
    "Internal Human Resources & Talent Acquisition Department (Current Workspace Entity)",
  ],
  healthcare_medtech: [
    "Charité – Universitätsmedizin Berlin — Diagnostic Radiology & AI Lab (Berlin, DE)",
    "Philips Healthcare EU — Clinical Diagnostic Software Division (Eindhoven, NL)",
    "Siemens Healthineers — Medical Imaging & IVDR Diagnostics (Erlangen, DE)",
    "AP-HP Hôpitaux de Paris — Emergency & Clinical Triage Unit (Paris, FR)",
    "Internal Clinical / MedTech R&D & Quality Assurance (Current Workspace Entity)",
  ],
  critical_infrastructure: [
    "Siemens Energy AG — European Transmission Grid Operations (Munich, DE)",
    "Enel S.p.A. — Smart Grid & Distribution Forecasting (Rome, IT)",
    "Électricité de France (EDF) — Grid Stability & Load Balancing (Paris, FR)",
    "Veolia Environnement EU — Municipal Water & Utility Operations (Paris, FR)",
    "Internal Critical Infrastructure & OT Security Division (Current Workspace Entity)",
  ],
  manufacturing_automotive: [
    "Volkswagen Group EU — Autonomous Driving & ADAS Safety Division (Wolfsburg, DE)",
    "Robert Bosch GmbH — Industrial Robotics & Vision Systems (Stuttgart, DE)",
    "ABB Robotics Europe — Collaborative Factory Automation (Västerås, SE)",
    "Renault Group — Vehicle Safety & Embedded AI Engineering (Paris, FR)",
    "Internal Manufacturing & Product Safety Engineering (Current Workspace Entity)",
  ],
  education_edtech: [
    "TU Munich (TUM) — Digital Admissions & Academic Testing Office (Munich, DE)",
    "Sorbonne Université — Student Evaluation & Digital Learning (Paris, FR)",
    "University of Amsterdam — Academic Assessment Board (Amsterdam, NL)",
    "Internal Academic & Vocational Assessment Division (Current Workspace Entity)",
  ],
  public_sector: [
    "Federal Employment & Social Benefits Agency — Citizen Services (Berlin, DE)",
    "Municipality of Amsterdam — Social Assistance & Housing Directorate (NL)",
    "Ministry of Justice & Digital Public Administration — Legal Research Unit (EU)",
    "Internal Public Authority / GovTech Directorate (Current Workspace Entity)",
  ],
  biometrics_identity: [
    "IDnow GmbH — European eKYC & Biometric Verification Center (Munich, DE)",
    "Thales DIS Europe — Biometric Identity & Border Security (Paris, FR)",
    "Veriff EU — Regulated Financial & eIDAS Identity Verification (Tallinn, EE)",
    "Internal Identity, Security & Trust Operations (Current Workspace Entity)",
  ],
  ecommerce_media: [
    "Zalando SE — European Customer Care & Generative Merchandising (Berlin, DE)",
    "Deutsche Telekom AG — Consumer Voice AI & Omnichannel Support (Bonn, DE)",
    "Carrefour Group EU — Digital Retail & Customer Experience (Paris, FR)",
    "Internal Digital Commerce & Customer Experience Division (Current Workspace Entity)",
  ],
  b2b_saas_gpai: [
    "Mistral AI / European Frontier Lab — Enterprise GPAI Platform (Paris, FR)",
    "Aleph Alpha GmbH — Sovereign European AI & Public Sector Cloud (Heidelberg, DE)",
    "Enterprise B2B SaaS & AI Engineering Division (Current Workspace Entity)",
  ],
};

/**
 * Formats Audited Institution / Client Entity + Model Vendor into `vendorName`
 * so both are persisted cleanly in D1 without schema breaking changes.
 */
export function formatInstitutionAndVendor(institutionName: string, modelVendor: string): string {
  const inst = institutionName.trim();
  const vend = modelVendor.trim();
  if (inst && vend) {
    return `${inst} | ${vend}`;
  }
  return inst || vend || "Current Workspace Entity | Internal Proprietary Model";
}

/**
 * Parses `vendorName` back into `{ institution, modelVendor }`.
 * Falls back gracefully to `fallbackOrgName` when no explicit pipe separator is present.
 */
export function parseInstitutionAndVendor(
  rawVendorName: string | null | undefined,
  fallbackOrgName?: string,
): { institution: string; modelVendor: string } {
  const raw = (rawVendorName || "").trim();
  if (raw.includes(" | ")) {
    const [inst, ...rest] = raw.split(" | ");
    return {
      institution: inst.trim() || fallbackOrgName || "Primary Audited Institution",
      modelVendor: rest.join(" | ").trim() || "Internal / Proprietary Model",
    };
  }
  return {
    institution: fallbackOrgName || "Primary Audited Institution",
    modelVendor: raw || "Internal / Proprietary Model",
  };
}

export interface EuStatutoryPolicyPack {
  id: string;
  code: string;
  title: string;
  euRegulations: string;
  description: string;
  mandatoryCheckpoints: string[];
}

/**
 * Stackable European Statutory Policy Packs (Beating Credo AI's Policy Packs with deep EU Lex Specialis coverage).
 */
export const EU_STATUTORY_POLICY_PACKS: EuStatutoryPolicyPack[] = [
  {
    id: "eu_high_risk_core",
    code: "EU-PACK-CORE",
    title: "EU AI Act Chapter III High-Risk Core & EN ISO/IEC 42001",
    euRegulations: "Reg. (EU) 2024/1689 Arts. 8–27, 43, 47–49, 72–73 · EN ISO/IEC 42001:2023",
    description:
      "Mandatory horizontal conformity pack for High-Risk AI systems placed on the Union market or put into service in the EEA.",
    mandatoryCheckpoints: [
      "Art. 9 Continuous Risk Management System & residual risk acceptability sign-off",
      "Art. 10 Data Governance & Four-Fifths Ratio (>= 0.80) bias verification",
      "Art. 11 Annex IV Technical Documentation (all 8 sections) & 10-year retention (Art. 18)",
      "Art. 12 Automatic Event Logging (>= 6 months retention under Art. 19)",
      "Art. 13 Instructions for Use & Art. 14 Human Oversight override & stop switch",
      "Art. 15 Accuracy, Robustness & OWASP LLM/ML Cybersecurity verification",
      "Art. 47 EU Declaration of Conformity, Art. 48 CE Marking & Art. 49 EU DB Registration",
    ],
  },
  {
    id: "eu_dora_finance",
    code: "EU-PACK-DORA",
    title: "Banking, Credit & Insurance DORA + Solvency II + Art. 27 FRIA Pack",
    euRegulations: "EU AI Act Annex III pt. 5(b)–(c) · DORA Reg. (EU) 2022/2554 · CCD II (EU) 2023/2225 · Solvency II · GDPR Art. 22",
    description:
      "Integrated financial-services pack satisfying EU AI Act Art. 9(9) single-audit alignment with ECB/EBA/EIOPA supervisory rules.",
    mandatoryCheckpoints: [
      "Art. 27 Mandatory Fundamental Rights Impact Assessment (FRIA) prior to credit/insurance deployment",
      "DORA Art. 6–16 ICT Risk Management & Art. 28 Third-Party AI Model Provider Register of Information",
      "Consumer Credit Directive II Art. 18 & GDPR Art. 22 right to human intervention and credit explanation (Art. 86)",
      "Solvency II Art. 41 Actuarial Data Quality & Gender-Neutral Pricing Directive (2004/113/EC) verification",
    ],
  },
  {
    id: "eu_mdr_medtech",
    code: "EU-PACK-MDR",
    title: "MedTech, Clinical AI & Healthcare MDR / IVDR + MDCG 2025-6 Pack",
    euRegulations: "EU AI Act Art. 6(1) & Annex I Sec. A pts. 11–12 · MDR (EU) 2017/745 · IVDR (EU) 2017/746 · EHDS · MDCG 2025-6",
    description:
      "Joint conformity pack for Software as a Medical Device (SaMD), in-vitro diagnostics, and hospital clinical triage AI.",
    mandatoryCheckpoints: [
      "Art. 43(3) Single Notified Body Conformity Assessment combining MDR/IVDR Annex IX–XI and EU AI Act Annex IV",
      "EN ISO 14971 Medical Risk Management & EN IEC 62304 Software Lifecycle traceability",
      "Clinical Evaluation Report (CER) / Performance Evaluation Report (PER) subgroup sensitivity across EU demographics",
      "Post-Market Clinical Follow-up (PMCF) integrated with EU AI Act Art. 72 Post-Market Monitoring Plan",
    ],
  },
  {
    id: "eu_nis2_machinery",
    code: "EU-PACK-NIS2",
    title: "Critical Infrastructure, Energy & Industrial Safety (NIS2 + Machinery Reg)",
    euRegulations: "EU AI Act Annex III pt. 2 & Annex I · NIS2 Directive (EU) 2022/2555 · CER (EU) 2022/2557 · Machinery Reg. (EU) 2023/1230",
    description:
      "Operational-technology (OT), smart-grid, water/utility, automotive ADAS, and industrial robotics safety pack.",
    mandatoryCheckpoints: [
      "Deterministic safety-envelope override and hardware emergency stop (EN ISO 13849 / IEC 61508)",
      "NIS2 Art. 21 Supply-Chain & OT Cybersecurity resilience against adversarial sensor spoofing (Art. 15(5))",
      "Dual Incident Reporting alignment: NIS2 24h CSIRT early warning + EU AI Act Art. 73 2/10/15-day incident SLA",
    ],
  },
  {
    id: "eu_hr_workplace",
    code: "EU-PACK-HR",
    title: "Employment, Works Council (Art. 26(7)) & EU Platform Work Directive Pack",
    euRegulations: "EU AI Act Annex III pt. 4(a)–(b) · Art. 5(1)(f) · Art. 26(7) · Platform Work Directive (EU) 2024/2831 · GDPR Art. 88",
    description:
      "Workplace, recruitment, talent analytics, and algorithmic management governance pack for European employers and HR SaaS.",
    mandatoryCheckpoints: [
      "Art. 5(1)(f) Verification that no workplace emotion recognition or affective state inference is performed",
      "Art. 26(7) Mandatory prior formal notification to Works Council (Betriebsrat / CSE) and affected employees",
      "EU Pay Transparency Directive (2023/970) & Four-Fifths gender/age/disability selection parity audit",
    ],
  },
  {
    id: "eu_gpai_code",
    code: "EU-PACK-GPAI",
    title: "EU AI Office GPAI Code of Practice & Chapter V (Arts. 51–55) Pack",
    euRegulations: "EU AI Act Chapter V (Arts. 51–55) · Annex XI & Annex XII · EU DSM Copyright Directive (EU) 2019/790 Art. 4(3)",
    description:
      "Foundation model, fine-tuned LLM, and B2B AI provider pack aligned with the European Commission AI Office GPAI Code.",
    mandatoryCheckpoints: [
      "Art. 53(1)(a)–(b) Annex XI (AI Office) & Annex XII (Downstream Provider) technical documentation",
      "Art. 53(1)(c) EU Copyright Directive Art. 4(3) machine-readable TDM opt-out compliance policy",
      "Art. 53(1)(d) Public summary of training content using the official EU AI Office template",
      "Art. 55 Systemic Risk (>= 10^25 FLOPs) adversarial red-teaming & EU AI Office incident reporting",
    ],
  },
  {
    id: "eu_agentic_ai",
    code: "EU-PACK-AGENTIC",
    title: "EU Autonomous & Agentic AI Tool-Boundary & Human-Gate Pack",
    euRegulations: "EU AI Act Art. 14 (Human Oversight) · Art. 15 (Cybersecurity/Confused Deputy) · Art. 12 (Tool-Call Logging) · OWASP Agentic Top 10",
    description:
      "Purpose-built European governance pack for autonomous AI agents that plan, invoke external APIs/tools, query databases, or orchestrate sub-agents.",
    mandatoryCheckpoints: [
      "Agent Autonomy Tier classification (L1 Copilot → L2 Human-Approved Tool Use → L3 Bounded Autonomy → L4 Multi-Agent)",
      "Least-privilege API/Tool permission manifest & blast-radius financial/operational transaction cap",
      "Art. 14 Mandatory Human-in-the-Loop approval gate before irreversible external actions (payments, contract changes, citizen decisions)",
      "Art. 15 Indirect Prompt Injection & Confused-Deputy privilege escalation red-team verification",
    ],
  },
];

export function getRecommendedPolicyPacks(
  domain: string | null | undefined,
  riskTier: string | null | undefined,
  gpai?: boolean,
): EuStatutoryPolicyPack[] {
  const pb = getEuIndustryPlaybook(domain);
  const packs: EuStatutoryPolicyPack[] = [EU_STATUTORY_POLICY_PACKS[0]]; // Core pack always included
  if (pb.id === "banking_credit" || pb.id === "insurance_risk") {
    packs.push(EU_STATUTORY_POLICY_PACKS.find((p) => p.id === "eu_dora_finance")!);
  } else if (pb.id === "healthcare_medtech") {
    packs.push(EU_STATUTORY_POLICY_PACKS.find((p) => p.id === "eu_mdr_medtech")!);
  } else if (pb.id === "critical_infrastructure" || pb.id === "manufacturing_automotive") {
    packs.push(EU_STATUTORY_POLICY_PACKS.find((p) => p.id === "eu_nis2_machinery")!);
  } else if (pb.id === "employment_hr") {
    packs.push(EU_STATUTORY_POLICY_PACKS.find((p) => p.id === "eu_hr_workplace")!);
  }
  if (gpai || riskTier === "gpai" || pb.id === "b2b_saas_gpai") {
    packs.push(EU_STATUTORY_POLICY_PACKS.find((p) => p.id === "eu_gpai_code")!);
  }
  packs.push(EU_STATUTORY_POLICY_PACKS.find((p) => p.id === "eu_agentic_ai")!);
  return packs;
}

/**
 * Classifies the EU Data & Model Sovereignty posture of a system based on its model vendor.
 */
export function classifyEuSovereigntyPosture(modelVendor: string | null | undefined): {
  tierLabel: string;
  shortBadge: string;
  badgeClass: string;
  gdprRequirement: string;
} {
  const v = (modelVendor || "").toLowerCase();
  if (
    v.includes("mistral") ||
    v.includes("aleph alpha") ||
    v.includes("internal") ||
    v.includes("on-prem") ||
    v.includes("sovereign") ||
    v.includes("xgboost") ||
    v.includes("pytorch")
  ) {
    return {
      tierLabel: "Tier 1: EU Sovereign Model & EEA-Native Hosting",
      shortBadge: "🇪🇺 Tier 1: EU Sovereign AI",
      badgeClass: "border-emerald-300 bg-emerald-50 text-emerald-900",
      gdprRequirement: "100% EEA data residency & model sovereignty; no third-country data transfer under GDPR Chapter V.",
    };
  }
  if (
    v.includes("eu-") ||
    v.includes("europe-") ||
    v.includes("frankfurt") ||
    v.includes("sweden") ||
    v.includes("belgium") ||
    v.includes("dublin") ||
    v.includes("paris") ||
    v.includes("european")
  ) {
    return {
      tierLabel: "Tier 2: EU Cloud Region (EEA Data Boundary + Zero Retention)",
      shortBadge: "🇪🇺 Tier 2: EU Cloud Region (EEA)",
      badgeClass: "border-sky-300 bg-sky-50 text-sky-900",
      gdprRequirement: "Hosted in EEA region (Frankfurt/Sweden/Belgium); verify GDPR Art. 28 DPA & zero-training-retention flag.",
    };
  }
  return {
    tierLabel: "Tier 3: Global / Third-Country Model Endpoint (GDPR Chapter V Check)",
    shortBadge: "🌐 Tier 3: GDPR Art. 46 SCCs Required",
    badgeClass: "border-amber-300 bg-amber-50 text-amber-900",
    gdprRequirement: "Verify GDPR Art. 46 Standard Contractual Clauses (SCCs), Transfer Impact Assessment (TIA), and PII pseudonymization.",
  };
}

export const AGENTIC_AUTONOMY_TIERS = [
  {
    id: "L0_deterministic",
    label: "L0: Non-Agentic ML / Statistical Scoring Model (No Autonomous Tool Calls)",
  },
  {
    id: "L1_copilot",
    label: "L1: Assistive Copilot / RAG Assistant (Read-Only Retrieval — 100% Human Action)",
  },
  {
    id: "L2_human_gated",
    label: "L2: Human-Gated AI Agent (Proposes Tool/API Calls — Mandatory Art. 14 Human Approval Gate)",
  },
  {
    id: "L3_bounded_autonomy",
    label: "L3: Bounded Autonomous Agent (Executes Whitelisted APIs within Strict Policy Caps + Instant Kill-Switch)",
  },
  {
    id: "L4_multi_agent",
    label: "L4: Multi-Agent Orchestrator (Delegates Sub-Tasks Across Agents — High-Scrutiny Art. 14 & Art. 15 Controls)",
  },
] as const;

export type EuStatutoryDeliverableKind =
  | "art48_ce_marking"
  | "art6_4_derogation"
  | "art26_7_works_council"
  | "art86_explanation"
  | "art14_agentic_charter";

export function generateEuStatutoryDeliverable(
  kind: EuStatutoryDeliverableKind,
  ctx: {
    institutionName: string;
    systemName: string;
    systemId: string;
    domain: string;
    roleInValueChain: string;
    riskTier: string | null;
    intendedPurpose: string;
    modelVendor: string;
    autonomyTier?: string;
  },
): { title: string; filename: string; content: string } {
  const dateStr = new Date().toISOString().slice(0, 10);
  const playbook = getEuIndustryPlaybook(ctx.domain);
  const sov = classifyEuSovereigntyPosture(ctx.modelVendor);

  switch (kind) {
    case "art48_ce_marking":
      return {
        title: "Article 48 Digital CE Marking of Conformity & Notified Body Dossier",
        filename: `eu-ai-act-art48-ce-marking-${ctx.systemId.slice(0, 8)}.md`,
        content: `# EUROPEAN UNION — ARTICLE 48 DIGITAL CE MARKING OF CONFORMITY DOSSIER
**Regulation (EU) 2024/1689 (Artificial Intelligence Act) — Articles 43, 47 & 48**

---
## 1. CE Conformity Marking Certificate Summary
- **CE Marking Symbol:** **C E** (Digital Conformity Marking affixed pursuant to Article 48(2) of Regulation (EU) 2024/1689)
- **Audited Institution / Provider / Deployer Entity:** ${ctx.institutionName}
- **AI System Name & Identifier:** ${ctx.systemName} (\`${ctx.systemId}\`)
- **Regulated European Sector:** ${playbook.name} (${playbook.euAiActBasis})
- **Classified EU AI Act Risk Tier:** ${(ctx.riskTier || "high_risk").toUpperCase()}
- **Model & Sovereign Hosting Posture:** ${ctx.modelVendor} — ${sov.tierLabel}
- **Date of Digital CE Affixing:** ${dateStr}

## 2. Statutory Conformity Assessment Procedure Executed (Article 43)
1. **Quality Management System (Article 17 & EN ISO/IEC 42001:2023):** Verified across 24 statutory controls.
2. **Annex IV Technical Documentation (Article 11):** All 8 statutory sections compiled and retained for 10 years pursuant to Article 18.
3. **EU Declaration of Conformity (Article 47 & Annex V):** Executed and linked to EU Database Registration (Article 49).
4. **Co-Regulated Union Harmonisation Legislation:** ${playbook.coRegulations.join(" · ")}.
5. **Competent Supervisory Authorities:** ${playbook.competentAuthorities.join(" · ")}.

## 3. Digital CE Affixing Statement (Article 48(2)–(5))
For high-risk AI systems provided digitally, this digital **CE** marking is made easily accessible via the system interface, machine-readable metadata, and accompanying Article 13 Instructions for Use.`,
      };

    case "art6_4_derogation":
      return {
        title: "Article 6(3) & 6(4) Non-High-Risk Derogation Assessment & Art. 49(2) Filing",
        filename: `eu-ai-act-art6-3-derogation-dossier-${ctx.systemId.slice(0, 8)}.md`,
        content: `# EU AI ACT ARTICLE 6(3) & 6(4) DEROGATION ASSESSMENT DOSSIER
**Mandatory Documentation Before Putting into Service (Regulation (EU) 2024/1689 Art. 6(3), Art. 6(4) & Art. 49(2))**

---
## 1. Entity & AI System Identification
- **Audited Institution / Operator:** ${ctx.institutionName}
- **AI System Name:** ${ctx.systemName} (\`${ctx.systemId}\`)
- **Annex III Reference Domain:** ${playbook.name}
- **Intended Purpose (Art. 3(12)):** ${ctx.intendedPurpose}
- **Assessment Date:** ${dateStr}

## 2. Statutory Derogation Criteria Verification (Article 6(3))
Pursuant to Article 6(3), an AI system referred to in Annex III shall not be considered high-risk where it does not pose a significant risk of harm to the health, safety or fundamental rights of natural persons, including by not materially influencing the outcome of decision making, and fulfills one or more of the following conditions:
- [x] **(a) Narrow Procedural Task:** Performs a narrow procedural task subject to human workflow governance; OR
- [x] **(b) Improvement of Prior Human Activity:** Intended to improve the result of a previously completed human activity; OR
- [x] **(c) Preparatory Task:** Performs a preparatory task to an assessment relevant for the purposes of the use cases listed in Annex III.

## 3. Mandatory Profiling Override Check (Article 6(3) Final Subparagraph)
> *"Notwithstanding the first subparagraph, an AI system referred to in Annex III shall always be considered to be high-risk where the AI system performs profiling of natural persons."*
- **Profiling Check Result:** If the system performs automated profiling of natural persons within the meaning of GDPR Article 4(4), this derogation **does not apply** and full Chapter III High-Risk obligations are enforced.

## 4. Mandatory Article 49(2) EU Database Registration & National Authority Availability
Pursuant to **Article 6(4)** and **Article 49(2)** (Annex VIII Section B), this documented assessment is retained by **${ctx.institutionName}**, registered in the EU Database, and made available upon request to the National Competent Authority (${playbook.competentAuthorities.join(", ")}).`,
      };

    case "art26_7_works_council":
      return {
        title: "Article 26(7) European Works Council (Betriebsrat / CSE) & Employee Notification",
        filename: `eu-ai-act-art26-7-works-council-notice-${ctx.systemId.slice(0, 8)}.md`,
        content: `# STATUTORY WORKPLACE AI NOTIFICATION TO WORKERS' REPRESENTATIVES & EMPLOYEES
**Pursuant to Article 26(7) of Regulation (EU) 2024/1689 (EU AI Act), Directive (EU) 2024/2831 & GDPR Art. 13/88**

---
- **Deploying Institution / Employer:** ${ctx.institutionName}
- **Recipient:** European Works Council (*Betriebsrat* / *Comité Social et Économique — CSE* / Trade Union & Affected Employees)
- **AI System Name:** ${ctx.systemName} (\`${ctx.systemId}\`)
- **Date of Prior Notification:** ${dateStr}

## 1. Statutory Notice Under EU AI Act Article 26(7)
Before putting into service or using a high-risk AI system at the workplace, **${ctx.institutionName}** hereby formally informs workers' representatives and the affected workers that they will be subject to the use of the above-referenced AI system, in accordance with Union and national law and practice on information and consultation of workers.

## 2. Purpose, Scope & Operational Boundaries of the AI System
- **Intended Purpose (Art. 3(12)):** ${ctx.intendedPurpose}
- **Prohibition of Workplace Emotion Recognition (Art. 5(1)(f)):** This system is strictly prohibited from inferring emotions of natural persons in the workplace.
- **Human Oversight & Right of Review (Art. 14 & Art. 26(2)):** Trained human supervisors with necessary competence and authority review all system outputs. No automated adverse employment decision is taken without meaningful human intervention (GDPR Art. 22).

## 3. Data Protection & Works Council Consultation Reference
- **GDPR Art. 35 DPIA & Art. 27 FRIA Status:** Completed and available for Works Council inspection in the V77 Trust Evidence Vault.`,
      };

    case "art86_explanation":
      return {
        title: "Article 86 Right to Explanation of Individual Decision-Making Notice",
        filename: `eu-ai-act-art86-right-to-explanation-${ctx.systemId.slice(0, 8)}.md`,
        content: `# STATUTORY NOTICE: RIGHT TO EXPLANATION OF INDIVIDUAL AI-ASSISTED DECISION
**Issued Pursuant to Article 86 of Regulation (EU) 2024/1689 (EU AI Act) & GDPR Articles 15 & 22**

---
- **Issuing Institution (Deployer):** ${ctx.institutionName}
- **AI System Involved:** ${ctx.systemName} (\`${ctx.systemId}\`)
- **Sector & Regulatory Basis:** ${playbook.name} (${playbook.euAiActBasis})
- **Date of Notice:** ${dateStr}

## 1. Disclosure of AI System Role in the Decision Process (Article 86(1))
You are receiving this notice because a decision taken by **${ctx.institutionName}** was assisted by **${ctx.systemName}**, an AI system regulated under Annex III of the European Union Artificial Intelligence Act (Regulation (EU) 2024/1689).
- **Intended Purpose of the AI System:** ${ctx.intendedPurpose}
- **Role of the AI Output:** Decision-support recommendation reviewed by a qualified human officer pursuant to EU AI Act Article 14 and Article 26(2).

## 2. Main Elements & Parameters of the Decision Considered
1. **Primary Input Variables Evaluated:** Structured application/case attributes verified under Article 10 data governance controls.
2. **Key Contributing Factors (SHAP / Reason Codes):** [Factor 1: Primary risk/eligibility indicator] · [Factor 2: Secondary consistency check] · [Factor 3: Historical verification metric].
3. **Fairness & Non-Discrimination Assurance:** Verified under the EU AI Act Article 10 Four-Fifths Ratio (>= 0.80 across protected demographics).

## 3. Your Statutory Rights as an Affected Person in the European Union
- **Right to Human Intervention & Contestability (GDPR Art. 22(3) & EU AI Act Art. 86):** You have the right to request a fresh review by a human specialist, express your point of view, correct any inaccurate input data, and contest the decision.
- **Supervisory Complaint Right (EU AI Act Art. 85):** You have the right to lodge a complaint with the relevant Market Surveillance Authority (${playbook.competentAuthorities.join(", ")}).`,
      };

    case "art14_agentic_charter":
      return {
        title: "Article 14 & 15 Autonomous / Agentic AI Tool-Boundary & Kill-Switch Charter",
        filename: `eu-ai-act-art14-agentic-ai-charter-${ctx.systemId.slice(0, 8)}.md`,
        content: `# EUROPEAN AUTONOMOUS & AGENTIC AI GOVERNANCE CHARTER
**Pursuant to EU AI Act Articles 12, 14 & 15 and EN ISO/IEC 42001 — Agentic Tool-Use & Autonomy Boundaries**

---
- **Audited Institution:** ${ctx.institutionName}
- **AI System / Agent Name:** ${ctx.systemName} (\`${ctx.systemId}\`)
- **Assigned Agent Autonomy Tier:** ${ctx.autonomyTier || AGENTIC_AUTONOMY_TIERS[2].label}
- **Underlying Foundation Model & Sovereignty:** ${ctx.modelVendor} (${sov.tierLabel})
- **Charter Effective Date:** ${dateStr}

## 1. Whitelisted Tool & API Permission Manifest (Least-Privilege Boundary)
- **Permitted Read Scopes:** Scoped read-only retrieval against approved domain knowledge bases and structured case records.
- **Restricted / Gated Write Scopes:** Any external state mutation (e.g., credit/claim approval, wire execution, customer communication, medical order, or infrastructure actuation) requires **explicit cryptographic human confirmation (Art. 14(4)(d))**.
- **Prohibited Actions:** Autonomous privilege escalation, unlogged sub-agent spawning, or execution of raw shell/SQL commands.

## 2. Article 14 Human Approval Gate & Hardware/Software Kill-Switch
- **Human-in-the-Loop Gate:** High-impact tool invocations pause execution and route a structured diff to a qualified human operator.
- **Immediate Stop Button (Art. 14(4)(e)):** Operators can halt the agent session and roll back pending tool calls immediately to a safe state.

## 3. Article 15 Confused-Deputy & Indirect Prompt Injection Defenses
- Untrusted external content (emails, PDFs, web pages, third-party documents) is isolated from system instructions and cannot trigger privileged tool calls.
- Every tool invocation, input prompt, and output rationale is cryptographically hashed (SHA-256) and retained for >= 6 months per Article 12 & Article 19.`,
      };
  }
}


