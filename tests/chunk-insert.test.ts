import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("D1-safe chunked inserts", () => {
  it("classification and assessments routes use insertInChunks", () => {
    const classification = readFileSync(resolve(__dirname, "../src/app/api/classification/route.ts"), "utf8");
    const assessments = readFileSync(resolve(__dirname, "../src/app/api/assessments/route.ts"), "utf8");
    expect(classification).toContain("insertInChunks");
    expect(assessments).toContain("insertInChunks");
  });

  it("ensureDb can force local sqlite for e2e", () => {
    const db = readFileSync(resolve(__dirname, "../src/lib/db/index.ts"), "utf8");
    expect(db).toContain("V77_FORCE_SQLITE");
    expect(db).toContain("V77_DATA_DIR");
  });
});
