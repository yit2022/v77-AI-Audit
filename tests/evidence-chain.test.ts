import { describe, expect, it } from "vitest";
import { hashEvidenceContent, linkEvidenceChain, verifyEvidenceChain } from "../src/lib/evidence/chain";
import { CONTROL_SEEDS } from "../src/lib/crosswalk";

describe("evidence chain", () => {
  it("hashes content stably", () => {
    expect(hashEvidenceContent("abc")).toBe(hashEvidenceContent(Buffer.from("abc")));
    expect(hashEvidenceContent("abc")).not.toBe(hashEvidenceContent("abd"));
  });

  it("links and verifies a hash chain", () => {
    const a = hashEvidenceContent("file-a");
    const b = hashEvidenceContent("file-b");
    const items = [
      { sha256: a, prevSha256: "" },
      { sha256: b, prevSha256: a },
    ];
    expect(verifyEvidenceChain(items).ok).toBe(true);
    expect(verifyEvidenceChain([{ sha256: b, prevSha256: "nope" }]).ok).toBe(false);
    expect(linkEvidenceChain(b, a)).toHaveLength(64);
  });
});

describe("GDPR crosswalk", () => {
  it("includes GDPR-mapped controls", () => {
    const withGdpr = CONTROL_SEEDS.filter((c) => c.gdprRef.trim().length > 0);
    expect(withGdpr.length).toBeGreaterThanOrEqual(6);
    expect(CONTROL_SEEDS.some((c) => c.code === "V77-GDPR-01")).toBe(true);
    expect(CONTROL_SEEDS.some((c) => c.code === "V77-GDPR-02")).toBe(true);
  });
});
