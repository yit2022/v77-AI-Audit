import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CONTROL_SEEDS, crosswalkByArea } from "@/lib/crosswalk";
import { readinessByFramework } from "@/lib/compliance/dashboard";
import { isExpired, isOverdue, summarizeExpiry } from "@/lib/evidence-requests/service";
import { buildBoardReportPdf } from "@/lib/reports/board-pdf";
import { dictKeys, hasTranslation, LOCALES } from "@/lib/i18n/dictionaries";
import { COMPANY } from "@/lib/company";

const root = resolve(__dirname, "..");

describe("Round 10 framework expansion", () => {
  it("adds GDPR AI, DORA and ISO 27001 controls with confident citations only", () => {
    expect(CONTROL_SEEDS.some((c) => c.code === "V77-GDPR-03")).toBe(true);
    expect(CONTROL_SEEDS.some((c) => c.code === "V77-DORA-01")).toBe(true);
    expect(CONTROL_SEEDS.some((c) => c.code === "V77-ISO27-01")).toBe(true);
    const dora = CONTROL_SEEDS.filter((c) => c.doraRef.trim());
    expect(dora.length).toBeGreaterThanOrEqual(5);
    expect(dora.every((c) => /Art\.|Arts\./.test(c.doraRef))).toBe(true);
    const iso27 = CONTROL_SEEDS.filter((c) => c.iso27001Ref.trim());
    expect(iso27.length).toBeGreaterThanOrEqual(5);
    expect(iso27.every((c) => /A\.\d/.test(c.iso27001Ref))).toBe(true);
    const areas = Object.keys(crosswalkByArea());
    expect(areas.join(" ")).toMatch(/DORA|ISO 27001|GDPR|Data governance/i);
  });

  it("scores DORA and ISO 27001 readiness buckets", () => {
    const scores = readinessByFramework([
      { status: "implemented", euRef: "Art.9", nistRef: "", isoRef: "", gdprRef: "", doraRef: "Art. 6", iso27001Ref: "A.5.1" },
      { status: "not_started", euRef: "", nistRef: "", isoRef: "", gdprRef: "Art. 32", doraRef: "Art. 28", iso27001Ref: "" },
    ]);
    expect(scores.dora).toBe(50);
    expect(scores.iso27001).toBe(100);
    expect(scores.gdpr).toBe(0);
  });
});

describe("Round 10 evidence request expiry helpers", () => {
  it("detects overdue and expired requests", () => {
    const now = new Date("2026-11-01T12:00:00Z");
    expect(isOverdue(new Date("2026-10-01T00:00:00Z"), "open", now)).toBe(true);
    expect(isOverdue(new Date("2026-12-01T00:00:00Z"), "open", now)).toBe(false);
    expect(isExpired(new Date("2026-10-15T00:00:00Z"), now)).toBe(true);
    const summary = summarizeExpiry(
      [
        { status: "open", nextDueAt: new Date("2026-10-01T00:00:00Z"), expiresAt: new Date("2026-11-05T00:00:00Z") },
        { status: "open", nextDueAt: new Date("2026-12-01T00:00:00Z"), expiresAt: null },
        { status: "cancelled", nextDueAt: new Date("2026-10-01T00:00:00Z"), expiresAt: new Date("2026-10-02T00:00:00Z") },
      ],
      now,
    );
    expect(summary.overdue).toBe(1);
    expect(summary.expiringSoon).toBe(1);
    expect(summary.total).toBe(2);
  });
});

describe("Round 10 partner + board surfaces", () => {
  it("ships partner portal, evidence requests, board report and schema tables", () => {
    const paths = [
      "src/app/(app)/partner/page.tsx",
      "src/app/(app)/evidence-requests/page.tsx",
      "src/app/(app)/board-report/page.tsx",
      "src/app/api/partner/route.ts",
      "src/app/api/evidence-requests/route.ts",
      "src/app/api/reports/board/route.ts",
      "src/lib/partner/service.ts",
      "src/lib/evidence-requests/service.ts",
      "src/lib/reports/board-pdf.ts",
      "src/lib/db/sync-controls.ts",
    ];
    for (const p of paths) expect(existsSync(resolve(root, p)), p).toBe(true);
    const schema = readFileSync(resolve(root, "src/lib/db/schema.ts"), "utf8");
    expect(schema).toMatch(/partners/);
    expect(schema).toMatch(/evidenceRequests|evidence_requests/);
    expect(schema).toMatch(/doraRef|dora_ref/);
    expect(schema).toMatch(/iso27001Ref|iso27001_ref/);
    const sidebar = readFileSync(resolve(root, "src/components/sidebar.tsx"), "utf8");
    expect(sidebar).toMatch(/nav\.partner/);
    expect(sidebar).toMatch(/nav\.evidenceRequests/);
    expect(sidebar).toMatch(/nav\.boardReport/);
    expect(COMPANY.legalName).toContain("Vertex77");
    const frameworks = readFileSync(resolve(root, "src/app/frameworks/page.tsx"), "utf8");
    expect(frameworks).toMatch(/DORA/);
    expect(frameworks).toMatch(/ISO\/IEC 27001/);
    expect(frameworks).not.toMatch(/tamalaki|nairobi|kenya|africa/i);
  });

  it("builds a landscape board PDF", async () => {
    const bytes = await buildBoardReportPdf({
      orgName: "Vertex77 Demo",
      generatedAt: new Date("2026-11-01T00:00:00Z"),
      overallReadiness: 62,
      frameworkScores: { eu_ai_act: 70, nist: 60, iso42001: 55, gdpr: 50, dora: 40, iso27001: 65 },
      openFindings: 3,
      criticalFindings: 1,
      systemsCount: 2,
      evidenceCount: 4,
      overdueEvidenceRequests: 1,
      topRisks: [{ title: "Missing logging evidence", severity: "high" }],
      partnerName: "Northbridge Advisory",
      primaryColor: "#0F2A4A",
    });
    expect(bytes.byteLength).toBeGreaterThan(1000);
    expect(Buffer.from(bytes).subarray(0, 4).toString()).toBe("%PDF");
  });
});

describe("Round 10 i18n for new pages", () => {
  it("translates partner, evidence requests, board and controls keys in all 8 locales", () => {
    const keys = [
      "nav.partner",
      "nav.evidenceRequests",
      "nav.boardReport",
      "partner.title",
      "evidenceReq.title",
      "board.title",
      "controls.title",
    ];
    expect(dictKeys().length).toBeGreaterThanOrEqual(100);
    for (const locale of LOCALES.map((l) => l.code)) {
      for (const key of keys) {
        expect(hasTranslation(locale, key), `${locale}:${key}`).toBe(true);
      }
    }
  });
});
