import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runPublicRiskCheck, PUBLIC_RISK_QUESTIONS } from "@/lib/risk-checker/public";
import { BLOG_ARTICLES } from "@/lib/blog/articles";
import { SECURITY_HEADERS } from "@/lib/security/headers";
import { COMPANY } from "@/lib/company";
import { hasTranslation, dictKeys } from "@/lib/i18n/dictionaries";

const root = resolve(__dirname, "..");

describe("Round 9 risk checker", () => {
  it("returns minimal for all-no answers and high-risk for employment yes", () => {
    const empty = Object.fromEntries(PUBLIC_RISK_QUESTIONS.map((q) => [q.id, "no" as const]));
    expect(runPublicRiskCheck(empty).tier).toBe("minimal");
    const hr = { ...empty, hr_annex_iii_employment: "yes" as const };
    expect(runPublicRiskCheck(hr).tier).toBe("high_risk");
    expect(runPublicRiskCheck(hr).label).toMatch(/high/i);
  });
});

describe("Round 9 resources", () => {
  it("ships 3 accurate EU AI Act articles without fabricated % stats or geo brand", () => {
    expect(BLOG_ARTICLES.length).toBe(3);
    for (const a of BLOG_ARTICLES) {
      expect(a.body).toMatch(/2024\/1689|Article|Annex/);
      expect(a.body).not.toMatch(/\d{2,3}% of (companies|organisations|enterprises)/i);
      expect(a.body).not.toMatch(/tamalaki|nairobi|kenya|africa/i);
      expect(existsSync(resolve(root, `src/app/resources/[slug]/page.tsx`))).toBe(true);
    }
  });
});

describe("Round 9 hardening artefacts", () => {
  it("tightens CSP (no unsafe-eval), health route, backup + audit scripts, demo assets", () => {
    expect(SECURITY_HEADERS["Content-Security-Policy"]).toMatch(/default-src 'self'/);
    expect(SECURITY_HEADERS["Content-Security-Policy"]).not.toMatch(/unsafe-eval/);
    expect(SECURITY_HEADERS["Content-Security-Policy"]).toMatch(/object-src 'none'/);
    expect(existsSync(resolve(root, "src/app/api/health/route.ts"))).toBe(true);
    expect(existsSync(resolve(root, "scripts/d1-backup.sh"))).toBe(true);
    expect(existsSync(resolve(root, "scripts/dep-audit.sh"))).toBe(true);
    expect(existsSync(resolve(root, "public/demo/01-dashboard.svg"))).toBe(true);
    expect(existsSync(resolve(root, "e2e/public-conversion.spec.ts"))).toBe(true);
    expect(COMPANY.legalName).toContain("Vertex77");
  });
});

describe("Round 9 i18n", () => {
  it("translates demo/resources/notifications/onboarding nav keys", () => {
    for (const key of ["mkt.nav.demo", "mkt.nav.resources", "nav.notifications", "nav.onboarding"]) {
      expect(dictKeys()).toContain(key);
      for (const loc of ["de", "fr", "pl", "nl", "es", "it", "sv"] as const) {
        expect(hasTranslation(loc, key)).toBe(true);
      }
    }
  });
});
