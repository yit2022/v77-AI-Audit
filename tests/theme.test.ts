import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("sky blue + white theme", () => {
  const css = readFileSync(resolve(__dirname, "../src/app/globals.css"), "utf8");

  it("uses brand sky blue primary and white background", () => {
    expect(css).toMatch(/--background:\s*#ffffff/i);
    expect(css).toMatch(/--accent:\s*#6fcdf5/i);
    expect(css).toMatch(/--accent-ink:\s*#0f2a4a/i);
  });

  it("uses pill-shaped primary buttons with navy ink", () => {
    expect(css).toMatch(/\.btn\s*\{[^}]*border-radius:\s*999px/s);
    expect(css).toMatch(/\.btn-primary\s*\{[^}]*color:\s*var\(--accent-ink\)/s);
  });
});
