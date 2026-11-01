import { describe, expect, it } from "vitest";
import { buildAuditReportPdf, buildExecutiveSummary, sanitizePdfText } from "../src/lib/reports/pdf";

const base = {
  orgName: "Acme Corp",
  systemName: "HireSense Ranking",
  systemDescription: "Applicant ranking model.",
  riskTier: "high_risk",
  intendedPurpose: "Shortlist candidates",
  roleInValueChain: "provider",
  gpai: false,
  classificationNotes: "Annex III employment",
  assessmentName: "Q4 readiness",
  assessmentStatus: "in_review",
  controls: [
    {
      code: "CTRL-01",
      title: "Risk management",
      status: "implemented",
      euRef: "Art. 9",
      nistRef: "Govern",
      isoRef: "42001",
      gdprRef: "Art. 32",
    },
  ],
  findings: [
    { title: "Bias gap", severity: "high", status: "open", frameworkRef: "EU AI Act" },
  ],
  fairnessRunCount: 1,
  redteamSummary: "1 run; latest pass 14 / fail 2",
  evidence: [{ title: "Model card", filename: "model-card.pdf", sha256: "abc123def4567890" }],
  auditorOpinion: "qualified",
  auditorSummary: "Gaps remain in logging.",
  generatedAt: new Date("2026-11-01T07:00:00.000Z"),
} as const;

describe("buildAuditReportPdf", () => {
  it("produces a multi-page branded PDF with %PDF header", async () => {
    const bytes = await buildAuditReportPdf({ ...base });
    expect(bytes.byteLength).toBeGreaterThan(1500);
    expect(Buffer.from(bytes.slice(0, 5)).toString("utf8")).toBe("%PDF-");
  });

  it("builds an executive summary mentioning readiness and findings", () => {
    const summary = buildExecutiveSummary({ ...base }, 72);
    expect(summary).toMatch(/72%/);
    expect(summary.toLowerCase()).toMatch(/finding/);
  });

  it("sanitizes winansi-unsafe glyphs", async () => {
    expect(sanitizePdfText("HireSense — Q4")).toBe("HireSense - Q4");
    const bytes = await buildAuditReportPdf({
      ...base,
      systemName: "HireSense — Ranking",
      systemDescription: "Uses “smart” quotes and bullets • here",
      assessmentName: "Q4 — readiness",
      findings: [],
      auditorOpinion: null,
      auditorSummary: null,
    });
    expect(Buffer.from(bytes.slice(0, 5)).toString("utf8")).toBe("%PDF-");
  });
});
