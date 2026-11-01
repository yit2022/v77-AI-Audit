import { describe, expect, it } from "vitest";
import { hashAuditEntry, verifyAuditChain } from "../src/lib/audit/log";

describe("immutable audit log chain", () => {
  it("hashes deterministically", () => {
    const a = hashAuditEntry({
      prevSha256: "",
      orgId: "org",
      action: "finding.created",
      entityType: "finding",
      entityId: "f1",
      detailJson: "{}",
      createdAtIso: "2026-01-01T00:00:00.000Z",
    });
    const b = hashAuditEntry({
      prevSha256: "",
      orgId: "org",
      action: "finding.created",
      entityType: "finding",
      entityId: "f1",
      detailJson: "{}",
      createdAtIso: "2026-01-01T00:00:00.000Z",
    });
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("verifies an intact chain", () => {
    const e1 = { sha256: "aaa", prevSha256: "" };
    const e2 = { sha256: "bbb", prevSha256: "aaa" };
    const e3 = { sha256: "ccc", prevSha256: "bbb" };
    expect(verifyAuditChain([e1, e2, e3]).ok).toBe(true);
  });

  it("detects a broken chain", () => {
    const broken = verifyAuditChain([
      { sha256: "aaa", prevSha256: "" },
      { sha256: "bbb", prevSha256: "WRONG" },
    ]);
    expect(broken.ok).toBe(false);
    expect(broken.brokenAt).toBe(1);
  });
});
