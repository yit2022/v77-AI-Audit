import { describe, expect, it } from "vitest";
import {
  DPIA_TEMPLATE,
  FRIA_TEMPLATE,
  getImpactTemplate,
  validateImpactAnswers,
} from "../src/lib/impact/templates";

describe("impact templates", () => {
  it("maps FRIA questions to Art. 27", () => {
    expect(FRIA_TEMPLATE.legalBasis).toContain("Art. 27");
    expect(FRIA_TEMPLATE.questions.length).toBeGreaterThanOrEqual(6);
    expect(FRIA_TEMPLATE.questions.every((q) => q.euRef.length > 0)).toBe(true);
  });

  it("keeps DPIA complementary to FRIA", () => {
    expect(DPIA_TEMPLATE.description.toLowerCase()).toContain("complement");
    expect(DPIA_TEMPLATE.legalBasis).toMatch(/GDPR/);
  });

  it("validates required FRIA answers", () => {
    const missing = validateImpactAnswers("fria", {});
    expect(missing.ok).toBe(false);
    expect(missing.missing).toContain("fria_processes");

    const filled: Record<string, string> = {};
    for (const q of FRIA_TEMPLATE.questions) {
      if (q.required) filled[q.id] = "Documented response.";
    }
    expect(validateImpactAnswers("fria", filled).ok).toBe(true);
  });

  it("returns templates by id", () => {
    expect(getImpactTemplate("dpia")?.id).toBe("dpia");
    expect(getImpactTemplate("unknown")).toBeUndefined();
  });
});
