import { describe, expect, it } from "vitest";
import { generateApiKeySecret, hashApiKey, roleAtLeast } from "../src/lib/auth/api-key";

describe("API keys and RBAC helpers", () => {
  it("generates v77_ secrets with matching hash", () => {
    const s = generateApiKeySecret();
    expect(s.raw.startsWith("v77_")).toBe(true);
    expect(s.prefix).toBe(s.raw.slice(0, 12));
    expect(hashApiKey(s.raw)).toBe(s.hash);
    expect(hashApiKey(s.raw + "x")).not.toBe(s.hash);
  });

  it("ranks roles for write gates", () => {
    expect(roleAtLeast("admin", "ai_owner")).toBe(true);
    expect(roleAtLeast("ai_owner", "ai_owner")).toBe(true);
    expect(roleAtLeast("auditor", "ai_owner")).toBe(false);
    expect(roleAtLeast("auditor", "auditor")).toBe(true);
  });
});
