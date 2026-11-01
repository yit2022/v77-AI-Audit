import { describe, expect, it, beforeAll, beforeEach } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Must set before any @/lib/db import (static imports are hoisted — keep this file free of db-bound static imports).
const dataDir = mkdtempSync(join(tmpdir(), "v77-pwreset-"));
process.env.V77_DATA_DIR = dataDir;
process.env.DISABLE_DEMO_PASSWORDS = "false";
delete process.env.V77_ADMIN_PASSWORD;
delete process.env.RESEND_API_KEY;

describe("password reset", () => {
  beforeAll(async () => {
    const { resetRateLimits } = await import("@/lib/security/rate-limit");
    resetRateLimits();
    const { seedIfEmpty } = await import("@/lib/db/seed");
    await seedIfEmpty({ force: true });
  });

  beforeEach(async () => {
    const { resetRateLimits } = await import("@/lib/security/rate-limit");
    resetRateLimits();
  });

  it("localises reset email templates across 8 languages", async () => {
    const { passwordResetEmail } = await import("@/lib/email/templates");
    const locales = ["en", "de", "fr", "pl", "nl", "es", "it", "sv"] as const;
    for (const locale of locales) {
      const tpl = passwordResetEmail({
        name: "Ada",
        resetUrl: "https://v77trust.com/reset-password?token=abc",
        locale,
      });
      expect(tpl.subject.length).toBeGreaterThan(5);
      expect(tpl.text).toContain("https://v77trust.com/reset-password?token=abc");
      expect(tpl.html).toContain("https://v77trust.com/reset-password?token=abc");
      expect(tpl.html).toContain("<a href=");
      expect(tpl.html).not.toContain("<pre");
      expect(tpl.tags).toContain("password_reset");
    }
  });

  it("returns the same message whether or not the email exists", async () => {
    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const mk = (email: string) =>
      new Request("http://localhost/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.10" },
        body: JSON.stringify({ email }),
      });
    const a = await POST(mk("admin@v77.local"));
    const b = await POST(mk("nobody-exists-xyz@example.com"));
    const ja = await a.json();
    const jb = await b.json();
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(ja.message).toBe(jb.message);
    expect(ja.ok).toBe(true);
  });

  it("issues a hashed single-use token, resets password, and invalidates sessions", async () => {
    const { db, schema, ensureDb } = await import("@/lib/db");
    const { eq } = await import("drizzle-orm");
    const {
      generateResetToken,
      hashResetToken: hash,
      resetPasswordWithToken,
      findOpenResetByHash,
    } = await import("@/lib/auth/password-reset");
    const { id } = await import("@/lib/ids");
    const bcrypt = (await import("bcryptjs")).default;
    await ensureDb();

    const users = await db.select().from(schema.users).where(eq(schema.users.email, "admin@v77.local")).limit(1);
    const user = users[0];
    expect(user).toBeTruthy();
    const orgs = await db.select().from(schema.memberships).where(eq(schema.memberships.userId, user.id)).limit(1);
    await db.insert(schema.sessions).values({
      id: id(),
      userId: user.id,
      orgId: orgs[0].orgId,
      expiresAt: new Date(Date.now() + 86400000),
    });

    const token = generateResetToken();
    const tokenHash = hash(token);
    await db.insert(schema.passwordResetTokens).values({
      id: id(),
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    expect(await findOpenResetByHash(tokenHash)).toBeTruthy();

    const first = await resetPasswordWithToken({ token, newPassword: "NewSecurePass1!" });
    expect(first.ok).toBe(true);
    const sessions = await db.select().from(schema.sessions).where(eq(schema.sessions.userId, user.id));
    expect(sessions).toHaveLength(0);

    const updated = await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
    expect(await bcrypt.compare("NewSecurePass1!", updated[0].passwordHash)).toBe(true);

    const reuse = await resetPasswordWithToken({ token, newPassword: "AnotherPass12!" });
    expect(reuse.ok).toBe(false);

    await db
      .update(schema.users)
      .set({ passwordHash: await bcrypt.hash("demo1234", 10) })
      .where(eq(schema.users.id, user.id));
  });

  it("hashes tokens with sha256 (not storing raw)", async () => {
    const { hashResetToken } = await import("@/lib/auth/password-reset");
    const token = "example-reset-token-value-0123456789";
    const h = hashResetToken(token);
    expect(h).toHaveLength(64);
    expect(h).not.toEqual(token);
  });
});
