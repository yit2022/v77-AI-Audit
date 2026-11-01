import { describe, expect, it, beforeEach } from "vitest";
import { rateLimit, resetRateLimits } from "../src/lib/security/rate-limit";
import { createCsrfToken, csrfPairValid } from "../src/lib/security/csrf";
import { SECURITY_HEADERS } from "../src/lib/security/headers";
import { assertSessionIdShape, sessionCookieOptions } from "../src/lib/security/session-policy";

describe("security hardening", () => {
  beforeEach(() => resetRateLimits());

  it("rate-limits repeated login keys", () => {
    const key = "login:1.2.3.4:a@b.com";
    for (let i = 0; i < 10; i++) {
      expect(rateLimit({ key, limit: 10, windowMs: 60_000 }).ok).toBe(true);
    }
    expect(rateLimit({ key, limit: 10, windowMs: 60_000 }).ok).toBe(false);
  });

  it("validates CSRF cookie/header pairs", () => {
    const t = createCsrfToken();
    expect(csrfPairValid(t, t)).toBe(true);
    expect(csrfPairValid(t, "other")).toBe(false);
    expect(csrfPairValid(undefined, t)).toBe(false);
  });

  it("exports core security headers", () => {
    expect(SECURITY_HEADERS["X-Frame-Options"]).toBe("DENY");
    expect(SECURITY_HEADERS["X-Content-Type-Options"]).toBe("nosniff");
    expect(SECURITY_HEADERS["Content-Security-Policy"]).toMatch(/default-src 'self'/);
  });

  it("audits session cookie policy and id shape", () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    delete process.env.V77_COOKIE_SECURE;
    expect(sessionCookieOptions(new Date()).secure).toBe(true);
    process.env.NODE_ENV = "development";
    process.env.V77_COOKIE_SECURE = "false";
    expect(sessionCookieOptions(new Date()).secure).toBe(false);
    process.env.NODE_ENV = prev;
    delete process.env.V77_COOKIE_SECURE;
    expect(assertSessionIdShape("39ab3d72-d6df-47c3-ad67-e007d0a84dc7")).toBe(true);
    expect(assertSessionIdShape("not-a-uuid")).toBe(false);
  });
});
