import { describe, expect, it } from "vitest";
import { detectControlDrift, detectFairnessDrift, summariseFindings } from "../src/lib/monitoring/drift";

describe("monitoring drift", () => {
  it("flags control regressions", () => {
    const findings = detectControlDrift(
      [
        { code: "A", status: "implemented" },
        { code: "B", status: "in_progress" },
      ],
      [
        { code: "A", status: "gap" },
        { code: "B", status: "in_progress" },
      ],
    );
    expect(findings.some((f) => f.message.includes("Control A"))).toBe(true);
    expect(summariseFindings(findings)).toBe("alert");
  });

  it("flags fairness metric drift above threshold", () => {
    const findings = detectFairnessDrift(
      { demographic_parity: 0.02, equal_opportunity: 0.01 },
      { demographic_parity: 0.12, equal_opportunity: 0.01 },
      0.05,
    );
    expect(findings).toHaveLength(1);
    expect(findings[0].kind).toBe("fairness_drift");
  });

  it("returns ok when nothing drifted", () => {
    expect(summariseFindings([])).toBe("ok");
    expect(
      detectFairnessDrift({ a: 0.1 }, { a: 0.11 }, 0.05),
    ).toHaveLength(0);
  });
});
