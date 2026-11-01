import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("round 5 public surface", () => {
  it("ships polished public pages and SEO assets", () => {
    for (const rel of [
      "src/app/how-it-works/page.tsx",
      "src/app/frameworks/page.tsx",
      "src/app/security/page.tsx",
      "src/app/privacy/page.tsx",
      "src/app/terms/page.tsx",
      "src/app/sitemap.ts",
      "src/app/robots.ts",
      "public/og-image.png",
      "src/app/(app)/leads/page.tsx",
      "src/app/api/systems/import/route.ts",
    ]) {
      expect(existsSync(resolve(__dirname, "..", rel)), rel).toBe(true);
    }
    const layout = readFileSync(resolve(__dirname, "../src/app/layout.tsx"), "utf8");
    expect(layout).toContain("og-image.png");
    expect(layout).toContain("openGraph");
    const frameworks = readFileSync(resolve(__dirname, "../src/app/frameworks/page.tsx"), "utf8");
    expect(frameworks).toMatch(/EU AI Act/);
    expect(frameworks).toMatch(/NIST AI RMF/);
    expect(frameworks).toMatch(/ISO\/IEC 42001/);
    expect(frameworks).not.toMatch(/african/i);
  });

  it("admin leads inbox supports status and notes", () => {
    const lib = readFileSync(resolve(__dirname, "../src/lib/leads/index.ts"), "utf8");
    const route = readFileSync(resolve(__dirname, "../src/app/api/leads/route.ts"), "utf8");
    expect(lib).toContain("updatePilotLead");
    expect(route).toContain("PATCH");
    expect(route).toContain('session.role !== "admin"');
  });
});
