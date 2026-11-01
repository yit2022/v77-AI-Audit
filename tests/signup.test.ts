import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("self-serve signup", () => {
  it("creates org + admin membership and session", () => {
    const route = readFileSync(resolve(__dirname, "../src/app/api/auth/signup/route.ts"), "utf8");
    expect(route).toContain('role: "admin"');
    expect(route).toContain("createSession");
    expect(route).toContain("org.signup");
  });
});
