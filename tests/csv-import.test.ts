import { describe, expect, it } from "vitest";
import { parseInventoryCsv } from "@/lib/registry/csv-import";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("inventory CSV import", () => {
  it("parses the public template", () => {
    const csv = readFileSync(resolve(__dirname, "../public/templates/ai-inventory-import.csv"), "utf8");
    const { rows, errors } = parseInventoryCsv(csv);
    expect(errors).toEqual([]);
    expect(rows.length).toBe(3);
    expect(rows[0].name).toBe("HireSense Ranking");
    expect(rows[0].roleInValueChain).toBe("provider");
    expect(rows[1].gpai).toBe(true);
  });

  it("requires a name column", () => {
    const { rows, errors } = parseInventoryCsv("foo,bar\n1,2\n");
    expect(rows).toEqual([]);
    expect(errors[0]).toMatch(/name/i);
  });
});
