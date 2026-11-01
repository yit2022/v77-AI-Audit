import { describe, expect, it, beforeAll } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildBoardReportPdf } from "@/lib/reports/board-pdf";

const dataDir = mkdtempSync(join(tmpdir(), "v77-r11-"));
process.env.V77_DATA_DIR = dataDir;
process.env.DISABLE_DEMO_PASSWORDS = "false";
delete process.env.V77_ADMIN_PASSWORD;

describe("Sprint 11 white-label + demo", () => {
  beforeAll(async () => {
    const { ensureDb } = await import("@/lib/db");
    await ensureDb();
  });

  it("stores partner custom domain and resolves branding for client orgs", async () => {
    const { db, schema } = await import("@/lib/db");
    const { createPartnerForUser, updatePartnerBranding, getPartnerForOrg } = await import("@/lib/partner/service");
    const { id } = await import("@/lib/ids");
    const bcrypt = (await import("bcryptjs")).default;
    const userId = id();
    await db.insert(schema.users).values({
      id: userId,
      email: `partner-${userId.slice(0, 8)}@example.com`,
      name: "Partner Owner",
      passwordHash: await bcrypt.hash("x", 4),
    });
    const partner = await createPartnerForUser({ userId, name: "Northbridge Advisory" });
    const updated = await updatePartnerBranding(partner.id, userId, {
      customDomain: "Trust.Northbridge.Example",
      accentColor: "#112233",
    });
    expect(updated?.customDomain).toBe("trust.northbridge.example");

    const orgId = id();
    await db.insert(schema.organisations).values({
      id: orgId,
      name: "Client GmbH",
      slug: `client-${orgId.slice(0, 6)}`,
      partnerId: partner.id,
    });
    const brand = await getPartnerForOrg(orgId);
    expect(brand?.name).toBe("Northbridge Advisory");
    expect(brand?.customDomain).toBe("trust.northbridge.example");
  });

  it("seeds buyer demo org idempotently", async () => {
    const { db, schema } = await import("@/lib/db");
    const { ensureBuyerDemoOrg, DEMO_ORG_SLUG } = await import("@/lib/demo/sample-org");
    const { eq } = await import("drizzle-orm");
    const a = await ensureBuyerDemoOrg();
    const b = await ensureBuyerDemoOrg();
    expect(a.orgId).toBe(b.orgId);
    expect(b.created).toBe(false);
    const rows = await db.select().from(schema.organisations).where(eq(schema.organisations.slug, DEMO_ORG_SLUG));
    expect(rows).toHaveLength(1);
  });

  it("board PDF accepts partner accent colour", async () => {
    const bytes = await buildBoardReportPdf({
      orgName: "Client GmbH",
      generatedAt: new Date("2026-11-01T12:00:00Z"),
      overallReadiness: 72,
      frameworkScores: { eu_ai_act: 70, nist: 60, iso42001: 55, gdpr: 80, dora: 40, iso27001: 50 },
      openFindings: 2,
      criticalFindings: 0,
      systemsCount: 1,
      evidenceCount: 3,
      overdueEvidenceRequests: 1,
      topRisks: [{ title: "Logging gap", severity: "medium" }],
      partnerName: "Northbridge",
      primaryColor: "#0F2A4A",
      accentColor: "#ff00aa",
    });
    expect(bytes.byteLength).toBeGreaterThan(500);
  });
});
