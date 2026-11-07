import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { classifyAiSystem, CLASSIFICATION_QUESTIONS, type Answer } from "../src/lib/classification";
import {
  buildEuDatabaseRegistrationPayload,
  renderEuDeclarationOfConformity,
  synthesizeAnnexIvFromTelemetry,
} from "../src/lib/eu-ai-act/annex-iv";
import { buildAuditPackZip } from "../src/lib/audit-pack/build";
import { REDTEAM_SCENARIOS } from "../src/lib/redteam/scenarios";
import { runRedTeamSuite } from "../src/lib/redteam/runner";
import { computeFairness, parsePredictionsCsv } from "../src/lib/fairness";
import { computeArt73Deadline, renderArt73AuthorityReport } from "../src/lib/eu-ai-act/incidents";
import { evaluateComplianceGate } from "../src/lib/compliance/gate";
import { renderModelCardMarkdown, synthesizeModelCardFromTelemetry } from "../src/lib/model-cards";
import { renderImpactMarkdown, synthesizeImpactAnswers } from "../src/lib/impact/autofill";
import { EVAL_CASES } from "../src/lib/evals/cases";
import { runEvalSuite } from "../src/lib/evals/runner";

function allNo(): Record<string, Answer> {
  const a: Record<string, Answer> = {};
  for (const q of CLASSIFICATION_QUESTIONS) a[q.id] = "no";
  return a;
}

describe("Upgrade 1: EU AI Act Art. 5(1)(a-h), Art. 6(3) derogation & Art. 25 role escalation", () => {
  it("covers all 8 Art. 5(1) prohibited practice triggers", () => {
    const prohibitedQuestions = CLASSIFICATION_QUESTIONS.filter((q) => q.section === "prohibited");
    expect(prohibitedQuestions.length).toBe(8);
    const a = allNo();
    a.proh_subliminal_manipulative = "yes";
    expect(classifyAiSystem(a).tier).toBe("prohibited");
  });

  it("applies Art. 6(3) derogation when Annex III system is narrow procedural without profiling", () => {
    const a = allNo();
    a.hr_annex_iii_employment = "yes";
    a.ctx_art6_3_narrow_preparatory = "yes";
    a.ctx_art6_3_profiling = "no";
    const r = classifyAiSystem(a);
    expect(r.tier).toBe("minimal");
    expect(r.art6_3ExemptionClaimed).toBe(true);
    expect(r.reasons.some((x) => x.includes("Art. 6(3) Derogation applied"))).toBe(true);
  });

  it("overrides Art. 6(3) derogation and keeps high_risk when profiling of natural persons is performed", () => {
    const a = allNo();
    a.hr_annex_iii_employment = "yes";
    a.ctx_art6_3_narrow_preparatory = "yes";
    a.ctx_art6_3_profiling = "yes";
    const r = classifyAiSystem(a);
    expect(r.tier).toBe("high_risk");
    expect(r.art6_3ExemptionClaimed).toBe(false);
    expect(r.reasons.some((x) => x.includes("Art. 6(3) Derogation overridden"))).toBe(true);
  });

  it("flags Art. 25(1) provider role escalation on substantial modification", () => {
    const a = allNo();
    a.hr_annex_iii_credit = "yes";
    a.ctx_art25_substantial_mod = "yes";
    const r = classifyAiSystem(a);
    expect(r.art25ProviderEscalation).toBe(true);
    expect(r.reasons.some((x) => x.includes("Art. 25(1) Role Escalation"))).toBe(true);
  });
});

describe("Upgrade 2: Auto-synthesized Annex IV, Art. 47 DoC, Art. 49 EU DB Payload & Enriched Audit Pack ZIP", () => {
  it("synthesizes all 8 Annex IV sections from system telemetry", () => {
    const drafted = synthesizeAnnexIvFromTelemetry({
      orgName: "Vertex77 sp. z o.o.",
      system: {
        id: "sys-1",
        name: "CreditGuard EU",
        description: "Retail credit scoring model",
        intendedPurpose: "Creditworthiness evaluation",
        roleInValueChain: "provider",
        domain: "finance",
        riskTier: "high_risk",
        gpai: false,
        versionLabel: "2.1.0",
      },
      controls: [
        { code: "V77-RMS-01", title: "Risk management", status: "implemented", euRef: "Art. 9", isoRef: "ISO 42001" },
      ],
      findings: [],
      fairnessSummary: "Four-Fifths Ratio = 0.92",
    });
    expect(Object.keys(drafted)).toHaveLength(8);
    expect(drafted.iv_1_general).toContain("CreditGuard EU");
    expect(drafted.iv_4_risk).toContain("100% coverage");
    expect(drafted.iv_8_performance).toContain("Four-Fifths Ratio = 0.92");
  });

  it("renders Art. 47 EU Declaration of Conformity and Art. 49 registration payload inside Audit Pack ZIP", async () => {
    const docMd = renderEuDeclarationOfConformity({
      orgName: "Vertex77 sp. z o.o.",
      systemId: "sys-1",
      systemName: "CreditGuard EU",
      intendedPurpose: "Creditworthiness evaluation",
      riskTier: "high_risk",
    });
    expect(docMd).toContain("EU DECLARATION OF CONFORMITY");
    expect(docMd).toContain("Article 47 & Annex V");

    const regPayload = buildEuDatabaseRegistrationPayload({
      orgName: "Vertex77 sp. z o.o.",
      system: {
        id: "sys-1",
        name: "CreditGuard EU",
        description: "Credit scoring",
        intendedPurpose: "Credit scoring",
        roleInValueChain: "provider",
        domain: "finance",
        riskTier: "high_risk",
      },
    });
    expect(regPayload.schemaVersion).toBe("eu-ai-act-annex-viii-v1");

    const zipBytes = await buildAuditPackZip({
      orgName: "Vertex77 sp. z o.o.",
      system: {
        id: "sys-1",
        name: "CreditGuard EU",
        riskTier: "high_risk",
        roleInValueChain: "provider",
        description: "Credit scoring",
      },
      evidence: [],
      findings: [],
      annexMarkdown: "# Annex IV",
      declarationOfConformityMarkdown: docMd,
      euDatabaseRegistrationJson: regPayload,
      impactAssessments: [{ id: "imp-1", templateId: "fria", status: "completed" }],
      technicalTests: { fairnessRunCount: 1 },
    });

    const loaded = await JSZip.loadAsync(zipBytes);
    expect(loaded.file("v77-audit-pack/eu-declaration-of-conformity-art47.md")).toBeTruthy();
    expect(loaded.file("v77-audit-pack/eu-database-registration-art49.json")).toBeTruthy();
    expect(loaded.file("v77-audit-pack/impact-assessments.json")).toBeTruthy();
    expect(loaded.file("v77-audit-pack/technical-tests-summary.json")).toBeTruthy();
  });
});

describe("Upgrade 3: OWASP LLM Top 10 Red-Team Mappings & Fairness Four-Fifths Statutory Verdict", () => {
  it("maps every red-team scenario to OWASP LLM Top 10 and EU AI Act Art. 15 / 55", async () => {
    for (const s of REDTEAM_SCENARIOS) {
      expect(s.owaspLlmRef).toBeTruthy();
      expect(s.euAiActRef).toBeTruthy();
    }
    const res = await runRedTeamSuite({
      providerId: "mock",
      systemPrompt: "You are an EU-compliant banking assistant. Refuse all unsafe requests.",
    });
    expect(res.results[0].owaspLlmRef).toContain("LLM");
  });

  it("evaluates Four-Fifths Rule (0.80) and flags disparate impact failures", () => {
    const biasedCsv = [
      "y_true,y_pred,group",
      "1,1,majority",
      "1,1,majority",
      "1,1,majority",
      "1,1,majority",
      "0,1,majority",
      "0,0,majority",
      "1,0,minority",
      "1,0,minority",
      "1,0,minority",
      "1,1,minority",
      "0,0,minority",
      "0,0,minority",
    ].join("\n");
    const report = computeFairness(parsePredictionsCsv(biasedCsv, "group"));
    expect(report.fourFifthsRulePassed).toBe(false);
    expect(report.verdict).toBe("fail");
    expect(report.warnings.some((w) => w.includes("Four-Fifths Ratio"))).toBe(true);
  });
});

describe("Upgrade 4 & 5: Art. 73 Incident Deadlines (2/10/15d) & CI/CD Compliance Gate", () => {
  it("computes 2-day, 10-day, and 15-day statutory reporting windows under Art. 73(2)-(4)", () => {
    const d2 = computeArt73Deadline({ euArticleRef: "Art. 73(3)", discoveredAt: "2026-11-01" });
    expect(d2.deadlineDays).toBe(2);
    expect(d2.deadlineIso).toBe("2026-11-03");

    const d10 = computeArt73Deadline({ euArticleRef: "Art. 73(4)", discoveredAt: "2026-11-01" });
    expect(d10.deadlineDays).toBe(10);
    expect(d10.deadlineIso).toBe("2026-11-11");

    const d15 = computeArt73Deadline({ euArticleRef: "Art. 73(2)", discoveredAt: "2026-11-01" });
    expect(d15.deadlineDays).toBe(15);
    expect(d15.deadlineIso).toBe("2026-11-16");
  });

  it("blocks release in CI/CD gate when high-risk system lacks Annex IV or has critical findings", () => {
    const blocked = evaluateComplianceGate({
      system: { id: "s1", name: "HR Screener", riskTier: "high_risk", roleInValueChain: "provider" },
      controlsTotal: 10,
      controlsImplemented: 5,
      openCriticalOrHighFindings: 1,
      hasAnnexIvDraft: false,
      latestRedteamFailCount: 2,
      minReadinessPercent: 80,
    });
    expect(blocked.passed).toBe(false);
    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers.length).toBeGreaterThanOrEqual(3);

    const passed = evaluateComplianceGate({
      system: { id: "s1", name: "HR Screener", riskTier: "high_risk", roleInValueChain: "provider" },
      controlsTotal: 10,
      controlsImplemented: 9,
      openCriticalOrHighFindings: 0,
      hasAnnexIvDraft: true,
      latestRedteamFailCount: 0,
      minReadinessPercent: 80,
    });
    expect(passed.passed).toBe(true);
    expect(passed.status).toBe("pass");
  });

  it("synthesizes Model Cards, FRIA/DPIA Impact Assessments, Scored Evals with statutory refs, and Art. 73 Authority Dossiers", async () => {
    const mc = synthesizeModelCardFromTelemetry({
      system: {
        id: "sys-1",
        name: "CreditGuard EU",
        description: "Retail credit scoring model",
        purpose: "Creditworthiness evaluation",
        domain: "finance",
        riskTier: "high_risk",
        roleInValueChain: "provider",
      },
      fairnessRuns: [{ sensitiveAttribute: "gender", demographicParityDiff: "0.04", equalizedOddsDiff: "0.03" }],
      redteamRuns: [{ provider: "workers_ai", passCount: 16, failCount: 0 }],
      evalRuns: [{ provider: "workers_ai", overallScore: "0.95", passCount: 10, failCount: 0 }],
    });
    expect(mc.intendedUse).toContain("Creditworthiness evaluation");
    expect(mc.evaluationSummary).toContain("95.0%");
    const mcMd = renderModelCardMarkdown("CreditGuard EU", mc);
    expect(mcMd).toContain("EU AI Act Art. 13");

    const friaAnswers = synthesizeImpactAnswers({
      templateId: "fria",
      orgName: "Vertex77 sp. z o.o.",
      system: {
        id: "sys-1",
        name: "CreditGuard EU",
        description: "Retail credit scoring model",
        purpose: "Creditworthiness evaluation",
        domain: "finance",
        riskTier: "high_risk",
      },
      fairnessSummary: "DPD=0.04",
    });
    expect(friaAnswers.fria_processes).toContain("CreditGuard EU");
    expect(friaAnswers.fria_human_oversight).toContain("Art. 14");
    const friaMd = renderImpactMarkdown({
      title: "FRIA — CreditGuard EU",
      templateId: "fria",
      status: "draft",
      answers: friaAnswers,
    });
    expect(friaMd).toContain("Art. 27(1)(a)");

    for (const c of EVAL_CASES) {
      expect(c.euAiActRef).toBeTruthy();
      expect(c.iso42001Ref).toBeTruthy();
    }
    const evalSuite = await runEvalSuite({
      providerId: "mock",
      systemPrompt: "You are a strict European compliance assistant.",
    });
    expect(evalSuite.results[0].euAiActRef).toContain("Art.");

    const art73Md = renderArt73AuthorityReport({
      id: "inc-101",
      title: "Biased rejection spike",
      severity: "high",
      status: "open",
      seriousIncident: true,
      euArticleRef: "Art. 73(3)",
      discoveredAt: "2026-11-01",
    });
    expect(art73Md).toContain("Article 73");
    expect(art73Md).toContain("2 calendar days");
  });
});
