import { describe, expect, it } from "vitest";
import { obligationsFor, RISK_TIER_GUIDE } from "@/lib/eu-ai-act/obligations";
import { ANNEX_IV_SECTIONS } from "@/lib/eu-ai-act/annex-iv";
import { CONFORMITY_STEPS } from "@/lib/eu-ai-act/conformity";
import { COMPANY } from "@/lib/company";
import { DISPLAY_CURRENCY, formatMoney, PRICING_NOTE } from "@/lib/money";
import { LOCALES, isLocale, t } from "@/lib/i18n/dictionaries";

describe("company / Vertex77 operator", () => {
  it("exposes Warsaw operator and both emails", () => {
    expect(COMPANY.legalName).toContain("Vertex77");
    expect(COMPANY.addressLine).toMatch(/Warszawa|Warsaw/i);
    expect(COMPANY.email).toBe("contact@vertex77.com");
    expect(COMPANY.salesEmail).toBe("sales@vertex77.com");
    expect(COMPANY.footerCopyright).toContain("© 2026 V77 Trust");
    expect(COMPANY.footerCopyright).toContain("Vertex77");
  });
});

describe("EU AI Act libs", () => {
  it("covers risk tiers", () => {
    expect(RISK_TIER_GUIDE.length).toBeGreaterThanOrEqual(4);
    expect(RISK_TIER_GUIDE.some((r) => r.id === "high_risk")).toBe(true);
  });

  it("returns provider high-risk obligations", () => {
    const obs = obligationsFor("provider", "high_risk");
    expect(obs.length).toBeGreaterThan(0);
    expect(obs.some((o) => /annex|documentation|conformity|risk/i.test(`${o.title} ${o.detail}`))).toBe(true);
  });

  it("has Annex IV sections and conformity steps", () => {
    expect(ANNEX_IV_SECTIONS.length).toBeGreaterThanOrEqual(5);
    expect(CONFORMITY_STEPS.length).toBeGreaterThanOrEqual(4);
  });
});

describe("EUR pricing + i18n stubs", () => {
  it("formats EUR", () => {
    expect(DISPLAY_CURRENCY).toBe("EUR");
    expect(formatMoney(12000)).toMatch(/€|EUR|12/);
    expect(PRICING_NOTE).toMatch(/EUR/i);
  });

  it("supports en + de/fr stubs", () => {
    expect(LOCALES.map((l) => l.code)).toEqual(expect.arrayContaining(["en", "de", "fr"]));
    expect(isLocale("de")).toBe(true);
    expect(t("en", "nav.dashboard")).toBeTruthy();
    expect(t("de", "nav.dashboard")).toBeTruthy();
  });
});
