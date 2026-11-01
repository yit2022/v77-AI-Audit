import { describe, expect, it } from "vitest";
import {
  CONTROL_SEEDS,
  controlsForTier,
  findControlByCode,
  crosswalkByArea,
} from "../src/lib/crosswalk";

describe("control crosswalk", () => {
  it("seeds a non-empty control library", () => {
    expect(CONTROL_SEEDS.length).toBeGreaterThanOrEqual(12);
  });

  it("every control has EU, NIST and ISO references", () => {
    for (const c of CONTROL_SEEDS) {
      expect(c.euRef.trim().length).toBeGreaterThan(0);
      expect(c.nistRef.trim().length).toBeGreaterThan(0);
      expect(c.isoRef.trim().length).toBeGreaterThan(0);
      expect(c.code.startsWith("V77-")).toBe(true);
    }
  });

  it("filters controls by risk tier", () => {
    const high = controlsForTier("high_risk");
    const gpai = controlsForTier("gpai");
    expect(high.some((c) => c.code === "V77-RMS-01")).toBe(true);
    expect(gpai.some((c) => c.code === "V77-GPAI-01")).toBe(true);
    expect(controlsForTier("minimal").every((c) => c.appliesTo.includes("minimal"))).toBe(true);
  });

  it("finds controls by code and groups by area", () => {
    expect(findControlByCode("V77-DATA-01")?.area).toContain("Data");
    const areas = crosswalkByArea();
    expect(Object.keys(areas).length).toBeGreaterThan(5);
  });

  it("does not embed lengthy ISO normative text", () => {
    for (const c of CONTROL_SEEDS) {
      expect(c.description.length).toBeLessThan(400);
      expect(c.isoRef.toLowerCase()).not.toContain("shall ensure that");
    }
  });
});
