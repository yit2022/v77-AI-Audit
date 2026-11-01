import { describe, expect, it } from "vitest";
import {
  buildTrend,
  overdueRemediation,
  overallReadiness,
  activeFrameworks,
  readinessByFramework,
  topRisks,
} from "../src/lib/compliance/dashboard";

describe("executive compliance dashboard", () => {
  it("computes readiness % per framework", () => {
    const scores = readinessByFramework([
      { status: "implemented", euRef: "Art.9", nistRef: "MAP", isoRef: "6.1", gdprRef: "" },
      { status: "not_started", euRef: "Art.10", nistRef: "MEASURE", isoRef: "", gdprRef: "Art.35" },
      { status: "implemented", euRef: "", nistRef: "", isoRef: "8.2", gdprRef: "Art.32" },
    ]);
    expect(scores.eu_ai_act).toBe(50);
    expect(scores.nist).toBe(50);
    expect(scores.iso42001).toBe(100);
    expect(scores.gdpr).toBe(50);
    expect(overallReadiness(scores, activeFrameworks([
      { status: "implemented", euRef: "Art.9", nistRef: "MAP", isoRef: "6.1", gdprRef: "" },
      { status: "not_started", euRef: "Art.10", nistRef: "MEASURE", isoRef: "", gdprRef: "Art.35" },
      { status: "implemented", euRef: "", nistRef: "", isoRef: "8.2", gdprRef: "Art.32" },
    ]))).toBe(63);
  });

  it("ranks top open risks by severity", () => {
    const top = topRisks([
      { id: "1", title: "Low", severity: "low", status: "open", frameworkRef: "EU", systemId: "s" },
      { id: "2", title: "Crit", severity: "critical", status: "open", frameworkRef: "EU", systemId: "s" },
      { id: "3", title: "Closed", severity: "high", status: "closed", frameworkRef: "EU", systemId: "s" },
    ]);
    expect(top[0].title).toBe("Crit");
  });

  it("flags overdue remediation", () => {
    const overdue = overdueRemediation(
      [
        { id: "a", title: "Fix", status: "open", dueDate: "2020-01-01", findingId: "f" },
        { id: "b", title: "Later", status: "open", dueDate: "2099-01-01", findingId: "f" },
        { id: "c", title: "Done", status: "done", dueDate: "2020-01-01", findingId: "f" },
      ],
      new Date("2026-11-01"),
    );
    expect(overdue.map((x) => x.id)).toEqual(["a"]);
  });

  it("builds trend points", () => {
    const t = buildTrend({ openFindings: 2, overallReadiness: 70 });
    expect(t).toHaveLength(4);
    expect(t[3].readiness).toBe(70);
  });
});
