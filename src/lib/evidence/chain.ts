import { createHash } from "crypto";

export function hashEvidenceContent(content: Buffer | string): string {
  return createHash("sha256").update(content).digest("hex");
}

/** Hash-chain link: current content hash + previous evidence hash. */
export function linkEvidenceChain(contentSha256: string, previousSha256: string): string {
  return createHash("sha256")
    .update(`${previousSha256 || "GENESIS"}:${contentSha256}`)
    .digest("hex");
}

export function verifyEvidenceChain(
  items: Array<{ sha256: string; prevSha256: string }>,
): { ok: boolean; brokenAt?: number } {
  let expectedPrev = "";
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if ((item.prevSha256 || "") !== expectedPrev) {
      return { ok: false, brokenAt: i };
    }
    expectedPrev = item.sha256;
  }
  return { ok: true };
}
