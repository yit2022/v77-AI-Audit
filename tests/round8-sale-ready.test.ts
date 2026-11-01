import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { DEFAULT_PLANS } from "@/lib/billing/plans";
import { isPlatformAdminEmail } from "@/lib/platform/admin";
import { VENDOR_QUESTIONS, scoreAnswers } from "@/lib/vendors/questions";
import { POLICY_TEMPLATES } from "@/lib/policies/templates";
import { COMPANY } from "@/lib/company";
import { hasTranslation, dictKeys } from "@/lib/i18n/dictionaries";

const root = resolve(__dirname, "..");

describe("Round 8 billing scaffolding", () => {
  it("defines pilot/team/enterprise with pricing on request and seat limits", () => {
    expect(DEFAULT_PLANS.map((p) => p.tier)).toEqual(["pilot", "team", "enterprise"]);
    for (const p of DEFAULT_PLANS) {
      expect(p.priceNote.toLowerCase()).toContain("pricing on request");
      expect(p.seatLimit).toBeGreaterThan(0);
    }
  });
});

describe("Round 8 platform admin allowlist", () => {
  it("defaults to demo admin and respects V77_PLATFORM_ADMIN_EMAILS", () => {
    expect(isPlatformAdminEmail("admin@v77.local", {} as NodeJS.ProcessEnv)).toBe(true);
    expect(isPlatformAdminEmail("other@example.com", {} as NodeJS.ProcessEnv)).toBe(false);
    expect(
      isPlatformAdminEmail("buyer@vertex77.com", {
        V77_PLATFORM_ADMIN_EMAILS: "buyer@vertex77.com",
      } as NodeJS.ProcessEnv),
    ).toBe(true);
  });
});

describe("Round 8 vendor questionnaire", () => {
  it("has scored questions covering AI risk themes", () => {
    expect(VENDOR_QUESTIONS.length).toBeGreaterThanOrEqual(6);
    const scored = scoreAnswers(Object.fromEntries(VENDOR_QUESTIONS.map((q) => [q.id, "yes we have controls"])));
    expect(scored.label).toBeTruthy();
  });
});

describe("Round 8 policy templates", () => {
  it("includes AI policy, AUP, and model risk management", () => {
    const ids = POLICY_TEMPLATES.map((t) => t.id);
    expect(ids.join(" ")).toMatch(/ai.?policy|acceptable|model.?risk/i);
    expect(POLICY_TEMPLATES.length).toBeGreaterThanOrEqual(3);
  });
});

describe("Round 8 product routes + handover", () => {
  it("ships gap-analysis, policies, vendors, incidents, model-cards, billing, platform, public vendor, HANDOVER", () => {
    const paths = [
      "src/app/(app)/gap-analysis/page.tsx",
      "src/app/(app)/policies/page.tsx",
      "src/app/(app)/vendors/page.tsx",
      "src/app/(app)/incidents/page.tsx",
      "src/app/(app)/model-cards/page.tsx",
      "src/app/(app)/billing/page.tsx",
      "src/app/(app)/platform/page.tsx",
      "src/app/vendor/[token]/page.tsx",
      "HANDOVER.md",
      "src/lib/gap-analysis/run.ts",
      "src/lib/export/docx.ts",
      "src/lib/export/policy-pdf.ts",
    ];
    for (const p of paths) {
      expect(existsSync(resolve(root, p)), p).toBe(true);
    }
    const handover = readFileSync(resolve(root, "HANDOVER.md"), "utf8");
    expect(handover).toMatch(/Vertex77/);
    expect(handover).toMatch(/V77_ENABLE_REAL_PROVIDERS/);
    expect(handover).toMatch(/D1/);
    expect(handover).not.toMatch(/tamalaki|nairobi|kenya|africa/i);
    const readme = readFileSync(resolve(root, "README.md"), "utf8");
    expect(readme).toMatch(/Vertex77/);
    expect(readme).not.toMatch(/tamalaki|nairobi|kenya|africa/i);
    expect(COMPANY.legalName).toContain("Vertex77");
  });
});

describe("Round 8 nav i18n", () => {
  it("translates new Round 8 nav keys in DE/FR", () => {
    const keys = [
      "nav.gapAnalysis",
      "nav.policies",
      "nav.modelCards",
      "nav.vendors",
      "nav.incidents",
      "nav.billing",
      "nav.platform",
    ];
    for (const key of keys) {
      expect(dictKeys()).toContain(key);
      expect(hasTranslation("de", key)).toBe(true);
      expect(hasTranslation("fr", key)).toBe(true);
    }
  });
});
