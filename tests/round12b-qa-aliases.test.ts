import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("QA aliases", () => {
  it("next.config and middleware map inventory/register/app/account", () => {
    const cfg = readFileSync(resolve(__dirname, "../next.config.ts"), "utf8");
    const mw = readFileSync(resolve(__dirname, "../src/middleware.ts"), "utf8");
    for (const needle of ["/inventory", "/register", "/app", "/account", "/docs", "/status"]) {
      expect(cfg).toContain(needle);
      expect(mw).toContain(needle);
    }
    expect(cfg).toContain('destination: "/systems"');
    expect(cfg).toContain('destination: "/signup"');
  });

  it("homepage has request-pilot anchor", () => {
    const page = readFileSync(resolve(__dirname, "../src/app/page.tsx"), "utf8");
    expect(page).toContain('id="request-pilot"');
    expect(page).toContain('href="#request-pilot"');
  });
});
