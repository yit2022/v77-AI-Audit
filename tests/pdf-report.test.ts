import { describe, expect, it } from "vitest";
import { buildAuditReportPdf } from "../src/lib/reports/pdf";

describe("buildAuditReportPdf", () => {
  it("produces a valid PDF with %PDF header", async () => {
    const bytes = await buildAuditReportPdf({
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
        },
      ],
      fairnessRunCount: 1,
      redteamSummary: "1 run; latest pass 14 / fail 2",
      evidence: [{ title: "Model card", filename: "model-card.pdf", sha256: "abc123def4567890" }],
      auditorOpinion: "qualified",
      auditorSummary: "Gaps remain in logging.",
      generatedAt: new Date("2026-11-01T07:00:00.000Z"),
    });
    expect(bytes.byteLength).toBeGreaterThan(500);
    const header = Buffer.from(bytes.slice(0, 5)).toString("utf8");
    expect(header).toBe("%PDF-");
  });
});
