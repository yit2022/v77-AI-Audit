export type FairnessRow = { yTrue: number; yPred: number; group: string };

export type GroupRates = {
  group: string;
  n: number;
  selectionRate: number;
  tpr: number;
  fpr: number;
  tnr: number;
  fnr: number;
};

export type FairnessReport = {
  groups: GroupRates[];
  demographicParityDifference: number;
  demographicParityRatio: number;
  equalizedOddsDifference: number;
  equalizedOddsTprGap: number;
  equalizedOddsFprGap: number;
  overallAccuracy: number;
  fourFifthsRulePassed: boolean;
  equalizedOddsPassed: boolean;
  verdict: "pass" | "review" | "fail";
  warnings: string[];
};

function ratesFor(rows: FairnessRow[]): Omit<GroupRates, "group"> {
  const n = rows.length;
  if (n === 0) return { n: 0, selectionRate: 0, tpr: 0, fpr: 0, tnr: 0, fnr: 0 };
  let selected = 0, tp = 0, fp = 0, tn = 0, fn = 0;
  for (const r of rows) {
    if (r.yPred === 1) selected++;
    if (r.yTrue === 1 && r.yPred === 1) tp++;
    if (r.yTrue === 0 && r.yPred === 1) fp++;
    if (r.yTrue === 0 && r.yPred === 0) tn++;
    if (r.yTrue === 1 && r.yPred === 0) fn++;
  }
  const positives = tp + fn;
  const negatives = tn + fp;
  return {
    n,
    selectionRate: selected / n,
    tpr: positives ? tp / positives : 0,
    fpr: negatives ? fp / negatives : 0,
    tnr: negatives ? tn / negatives : 0,
    fnr: positives ? fn / positives : 0,
  };
}

export function parsePredictionsCsv(csv: string, sensitiveColumn: string): FairnessRow[] {
  const lines = csv.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error("CSV must include a header and at least one row");
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const yTrueIdx = header.indexOf("y_true");
  const yPredIdx = header.indexOf("y_pred");
  const groupIdx = header.indexOf(sensitiveColumn.trim().toLowerCase());
  if (yTrueIdx < 0 || yPredIdx < 0) throw new Error("CSV must include y_true and y_pred columns");
  if (groupIdx < 0) throw new Error(`Sensitive column '${sensitiveColumn}' not found in CSV header`);
  const rows: FairnessRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const yTrue = Number(cols[yTrueIdx]);
    const yPred = Number(cols[yPredIdx]);
    if (![0, 1].includes(yTrue) || ![0, 1].includes(yPred)) {
      throw new Error(`Row ${i + 1}: y_true and y_pred must be 0 or 1`);
    }
    rows.push({ yTrue, yPred, group: cols[groupIdx] || "unknown" });
  }
  return rows;
}

export function computeFairness(rows: FairnessRow[]): FairnessReport {
  const warnings: string[] = [];
  if (rows.length < 10) warnings.push("Small sample size; metrics may be unstable.");
  const byGroup = new Map<string, FairnessRow[]>();
  for (const r of rows) {
    const list = byGroup.get(r.group) ?? [];
    list.push(r);
    byGroup.set(r.group, list);
  }
  if (byGroup.size < 2) warnings.push("Only one sensitive group present; parity gaps will be zero.");
  const groups: GroupRates[] = [...byGroup.entries()].map(([group, gRows]) => ({ group, ...ratesFor(gRows) }));
  const selectionRates = groups.map((g) => g.selectionRate);
  const maxSel = Math.max(...selectionRates, 0);
  const minSel = Math.min(...selectionRates, 0);
  const demographicParityDifference = maxSel - minSel;
  const demographicParityRatio = maxSel === 0 ? 1 : minSel / maxSel;
  const tprs = groups.map((g) => g.tpr);
  const fprs = groups.map((g) => g.fpr);
  const equalizedOddsTprGap = Math.max(...tprs, 0) - Math.min(...tprs, 0);
  const equalizedOddsFprGap = Math.max(...fprs, 0) - Math.min(...fprs, 0);
  const equalizedOddsDifference = Math.max(equalizedOddsTprGap, equalizedOddsFprGap);
  let correct = 0;
  for (const r of rows) if (r.yTrue === r.yPred) correct++;
  const fourFifthsRulePassed = demographicParityRatio >= 0.8;
  const equalizedOddsPassed = equalizedOddsDifference <= 0.1;
  if (!fourFifthsRulePassed) {
    warnings.push(
      `Disparate impact alert: Four-Fifths Ratio (${demographicParityRatio.toFixed(3)}) is below the 0.80 threshold (EU AI Act Art. 10(2)(f) bias examination trigger).`,
    );
  }
  if (!equalizedOddsPassed) {
    warnings.push(
      `Error-rate disparity alert: Equalized Odds Δ (${equalizedOddsDifference.toFixed(3)}) exceeds 0.10 across protected groups.`,
    );
  }
  const verdict: "pass" | "review" | "fail" =
    fourFifthsRulePassed && equalizedOddsPassed
      ? "pass"
      : demographicParityRatio < 0.65 || equalizedOddsDifference > 0.25
        ? "fail"
        : "review";

  return {
    groups,
    demographicParityDifference,
    demographicParityRatio,
    equalizedOddsDifference,
    equalizedOddsTprGap,
    equalizedOddsFprGap,
    overallAccuracy: rows.length ? correct / rows.length : 0,
    fourFifthsRulePassed,
    equalizedOddsPassed,
    verdict,
    warnings,
  };
}
