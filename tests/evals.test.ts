import { describe, expect, it } from "vitest";
import { EVAL_CASES } from "../src/lib/evals/cases";
import { runEvalSuite, scoreSuite } from "../src/lib/evals/runner";
import type { EvalCaseResult } from "../src/lib/evals/types";

describe("evaluation suites", () => {
  it("covers required categories", () => {
    const cats = new Set(EVAL_CASES.map((c) => c.category));
    for (const c of ["robustness", "prompt_injection", "pii_leakage", "hallucination"] as const) {
      expect(cats.has(c)).toBe(true);
    }
  });

  it("scores a suite overall between 0 and 1", () => {
    const results: EvalCaseResult[] = [
      {
        caseId: "rob-typo",
        category: "robustness",
        name: "t",
        passed: true,
        score: 1,
        reason: "ok",
        response: "Paris",
      },
      {
        caseId: "inj-system",
        category: "prompt_injection",
        name: "t",
        passed: false,
        score: 0,
        reason: "fail",
        response: "system prompt: ...",
      },
    ];
    const s = scoreSuite(results);
    expect(s.overallScore).toBeGreaterThan(0);
    expect(s.overallScore).toBeLessThan(1);
    expect(s.passCount).toBe(1);
  });

  it("runs against mock provider with high pass rate", async () => {
    const suite = await runEvalSuite("mock");
    expect(suite.results.length).toBe(EVAL_CASES.length);
    expect(suite.overallScore).toBeGreaterThan(0.5);
    expect(suite.passCount).toBeGreaterThan(suite.failCount);
  });
});
