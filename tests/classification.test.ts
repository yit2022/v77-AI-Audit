import { describe, expect, it } from "vitest";
import {
  classifyAiSystem,
  CLASSIFICATION_QUESTIONS,
  type Answer,
} from "../src/lib/classification";

function allNo(): Record<string, Answer> {
  const a: Record<string, Answer> = {};
  for (const q of CLASSIFICATION_QUESTIONS) a[q.id] = "no";
  return a;
}

describe("classifyAiSystem", () => {
  it("returns minimal when all answers are no", () => {
    const r = classifyAiSystem(allNo());
    expect(r.tier).toBe("minimal");
    expect(r.gpai).toBe(false);
  });

  it("flags prohibited over high-risk", () => {
    const a = allNo();
    a.proh_social_score = "yes";
    a.hr_annex_iii_employment = "yes";
    const r = classifyAiSystem(a);
    expect(r.tier).toBe("prohibited");
  });

  it("classifies Annex III employment as high_risk", () => {
    const a = allNo();
    a.hr_annex_iii_employment = "yes";
    const r = classifyAiSystem(a);
    expect(r.tier).toBe("high_risk");
    expect(r.reasons.some((x) => x.includes("hr_annex_iii_employment"))).toBe(true);
  });

  it("classifies interaction disclosure as limited", () => {
    const a = allNo();
    a.lim_interaction = "yes";
    expect(classifyAiSystem(a).tier).toBe("limited");
  });

  it("returns gpai tier when only GPAI is yes", () => {
    const a = allNo();
    a.gpai_model = "yes";
    const r = classifyAiSystem(a);
    expect(r.tier).toBe("gpai");
    expect(r.gpai).toBe(true);
  });

  it("keeps high_risk when GPAI coexists with Annex III", () => {
    const a = allNo();
    a.hr_annex_iii_credit = "yes";
    a.gpai_model = "yes";
    a.gpai_systemic = "yes";
    const r = classifyAiSystem(a);
    expect(r.tier).toBe("high_risk");
    expect(r.gpai).toBe(true);
    expect(r.systemicRiskFlag).toBe(true);
  });
});
