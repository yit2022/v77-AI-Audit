import { describe, expect, it } from "vitest";
import { filterRegistry, summariseRegistry } from "../src/lib/registry/summary";
import { CLASSIFICATION_QUESTIONS, classifyAiSystem, type Answer } from "../src/lib/classification";

describe("AI registry summary", () => {
  const sample = [
    { id: "1", name: "A", riskTier: "high_risk", roleInValueChain: "provider", lifecycleStatus: "production", gpai: false },
    { id: "2", name: "B", riskTier: "limited", roleInValueChain: "deployer", lifecycleStatus: "pilot", gpai: true },
    { id: "3", name: "C", riskTier: null, roleInValueChain: "provider", lifecycleStatus: "discovered", gpai: false },
  ];

  it("aggregates risk, lifecycle and GPAI counts", () => {
    const s = summariseRegistry(sample);
    expect(s.total).toBe(3);
    expect(s.byRisk.high_risk).toBe(1);
    expect(s.byRisk.unclassified).toBe(1);
    expect(s.unclassified).toBe(1);
    expect(s.gpaiCount).toBe(1);
    expect(s.byLifecycle.production).toBe(1);
  });

  it("filters by risk tier", () => {
    expect(filterRegistry(sample, { riskTier: "high_risk" })).toHaveLength(1);
    expect(filterRegistry(sample, { role: "provider" })).toHaveLength(2);
  });
});

describe("guided classifier", () => {
  it("includes Annex I product AI question", () => {
    expect(CLASSIFICATION_QUESTIONS.some((q) => q.id === "hr_annex_i_product")).toBe(true);
  });

  it("classifies Annex I product AI as high_risk", () => {
    const a: Record<string, Answer> = Object.fromEntries(
      CLASSIFICATION_QUESTIONS.map((q) => [q.id, "no" as Answer]),
    );
    a.hr_annex_i_product = "yes";
    expect(classifyAiSystem(a).tier).toBe("high_risk");
  });
});
