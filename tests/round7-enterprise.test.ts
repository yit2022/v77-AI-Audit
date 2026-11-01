import { describe, expect, it } from "vitest";
import { ensureLocale, dictKeys, hasTranslation, t } from "@/lib/i18n/dictionaries";
import { canApprove, canWrite, isReadOnly, roleAtLeast } from "@/lib/auth/rbac";
import { getPublicSsoStatus, isSamlEnabled, isSsoFlagEnabled } from "@/lib/auth/sso";
import { buildSpMetadataXml, extractEmailFromSamlResponse, loadSamlConfig } from "@/lib/auth/saml";
import { COMPANY } from "@/lib/company";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Round 7+ EU i18n", () => {
  it("has matching keys for en/de/fr/pl/nl/es/it/sv on public + nav + cookie strings", async () => {
    const keys = dictKeys().filter((k) => k.startsWith("nav.") || k.startsWith("mkt.") || k.startsWith("cookie."));
    expect(keys.length).toBeGreaterThan(20);
    const locales = ["de", "fr", "pl", "nl", "es", "it", "sv"] as const;
    for (const loc of locales) await ensureLocale(loc);
    for (const key of keys) {
      for (const loc of locales) {
        expect(hasTranslation(loc, key)).toBe(true);
        expect(t(loc, key)).not.toBe(key);
      }
    }
  });
});

describe("Round 7 RBAC", () => {
  it("auditor is read-only; reviewer can approve; owner can write", () => {
    expect(isReadOnly("auditor")).toBe(true);
    expect(canWrite("auditor")).toBe(false);
    expect(canApprove("auditor")).toBe(false);
    expect(canApprove("reviewer")).toBe(true);
    expect(canWrite("reviewer")).toBe(false);
    expect(canWrite("ai_owner")).toBe(true);
    expect(roleAtLeast("admin", "reviewer")).toBe(true);
  });
});

describe("Round 7 SSO scaffolding", () => {
  it("respects V77_SSO_ENABLED flag and exposes SAML metadata scaffolding", () => {
    expect(isSsoFlagEnabled({ V77_SSO_ENABLED: "false" })).toBe(false);
    expect(isSamlEnabled({ V77_SSO_ENABLED: "true", V77_SAML_ENABLED: "true" })).toBe(true);
    const status = getPublicSsoStatus({ V77_SSO_ENABLED: "false" });
    expect(status.enabled).toBe(false);
    const cfg = loadSamlConfig({ V77_APP_ORIGIN: "https://v77trust.com" });
    expect(cfg?.acsUrl).toContain("/api/auth/saml/acs");
    const xml = buildSpMetadataXml(cfg!);
    expect(xml).toContain("EntityDescriptor");
    expect(xml).toContain("Vertex77");
    const email = extractEmailFromSamlResponse('<NameID>user@example.com</NameID>');
    expect(email).toBe("user@example.com");
  });
});

describe("Round 7 public surfaces", () => {
  it("ships developers + trust routes and Vertex77-only branding", () => {
    expect(COMPANY.legalName).toContain("Vertex77");
    expect(COMPANY.salesEmail).toBe("sales@v77trust.com");
    const developers = readFileSync(resolve(__dirname, "../src/app/developers/page.tsx"), "utf8");
    expect(developers).toMatch(/\/api\/v1\/systems/);
    expect(developers).not.toMatch(/tamalaki|nairobi|kenya|africa/i);
    const trust = readFileSync(resolve(__dirname, "../src/app/trust/[slug]/page.tsx"), "utf8");
    expect(trust).toMatch(/Trust Center/);
    expect(trust).toContain("COMPANY");
  });
});
