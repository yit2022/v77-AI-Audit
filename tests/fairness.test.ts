import { describe, expect, it } from "vitest";
import { computeFairness, parsePredictionsCsv } from "../src/lib/fairness";

const csv = `y_true,y_pred,group
1,1,A
1,0,A
0,0,A
0,1,A
1,1,B
1,1,B
0,0,B
0,0,B
`;

describe("fairness metrics", () => {
  it("parses csv and computes parity gaps", () => {
    const rows = parsePredictionsCsv(csv, "group");
    expect(rows).toHaveLength(8);
    const report = computeFairness(rows);
    expect(report.groups).toHaveLength(2);
    expect(report.demographicParityDifference).toBeGreaterThanOrEqual(0);
    expect(report.equalizedOddsDifference).toBeGreaterThanOrEqual(0);
    expect(report.overallAccuracy).toBeGreaterThan(0);
  });

  it("rejects missing columns", () => {
    expect(() => parsePredictionsCsv("a,b\n1,2", "group")).toThrow(/y_true/);
  });
});
