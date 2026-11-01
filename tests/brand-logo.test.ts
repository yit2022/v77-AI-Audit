import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("V77 Trust brand mark", () => {
  it("ships official SVG lockup and shield in public/brand", () => {
    expect(existsSync(resolve(__dirname, "../public/brand/v77-lockup.svg"))).toBe(true);
    expect(existsSync(resolve(__dirname, "../public/brand/v77-shield-mark.svg"))).toBe(true);
    expect(existsSync(resolve(__dirname, "../public/favicon.svg"))).toBe(true);
    const lockup = readFileSync(resolve(__dirname, "../public/brand/v77-lockup.svg"), "utf8");
    expect(lockup).toContain("#6FCDF5");
    expect(lockup).toContain("#0F2A4A");
    expect(lockup).toContain("V77");
  });

  it("LogoMark references official assets", () => {
    const comp = readFileSync(resolve(__dirname, "../src/components/logo-mark.tsx"), "utf8");
    expect(comp).toContain("/brand/v77-lockup.svg");
    expect(comp).toContain("/brand/v77-shield-mark.svg");
  });
});
