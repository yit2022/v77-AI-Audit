import { describe, expect, it } from "vitest";
import { ONBOARDING_STEPS, ONBOARDING_STORAGE_KEY } from "../src/lib/onboarding/steps";

describe("onboarding tour", () => {
  it("covers the core product journey", () => {
    expect(ONBOARDING_STEPS.length).toBeGreaterThanOrEqual(5);
    expect(ONBOARDING_STEPS.map((s) => s.id)).toEqual(
      expect.arrayContaining(["inventory", "classify", "controls", "tests", "findings"]),
    );
    for (const s of ONBOARDING_STEPS) {
      expect(s.href.startsWith("/")).toBe(true);
      expect(s.title.length).toBeGreaterThan(3);
    }
  });

  it("uses a stable storage key", () => {
    expect(ONBOARDING_STORAGE_KEY).toMatch(/^v77_onboarding/);
  });
});
