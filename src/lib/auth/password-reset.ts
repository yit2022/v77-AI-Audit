import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";
import { getAppOrigin } from "@/lib/site";
import { sendEmail } from "@/lib/email/send";
import { passwordResetEmail } from "@/lib/email/templates";
import { appendAuditLog } from "@/lib/audit/log";

const TTL_MS = 60 * 60 * 1000; // 60 minutes
export const PASSWORD_MIN_LEN = 10;

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateResetToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function invalidateUserSessions(userId: string) {
  await ensureDb();
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
}

/** Always succeeds from the caller's perspective; email only if the account exists. */
export async function requestPasswordReset(opts: {
  email: string;
  locale?: string;
  req?: Request;
}): Promise<{ ok: true }> {
  await ensureDb();
  const email = opts.email.trim().toLowerCase();
  const users = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  const user = users[0];
  if (!user) return { ok: true };

  // Invalidate prior unused tokens for this user
  const open = await db
    .select()
    .from(schema.passwordResetTokens)
    .where(and(eq(schema.passwordResetTokens.userId, user.id), isNull(schema.passwordResetTokens.usedAt)));
  for (const row of open) {
    await db
      .update(schema.passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(schema.passwordResetTokens.id, row.id));
  }

  const token = generateResetToken();
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + TTL_MS);
  await db.insert(schema.passwordResetTokens).values({
    id: id(),
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const resetUrl = `${getAppOrigin(opts.req)}/reset-password?token=${encodeURIComponent(token)}`;
  const tpl = passwordResetEmail({ name: user.name, resetUrl, locale: opts.locale });
  await sendEmail({
    to: email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    fromName: tpl.fromName,
    tags: tpl.tags,
  });
  return { ok: true };
}

export async function resetPasswordWithToken(opts: {
  token: string;
  newPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureDb();
  if (opts.newPassword.length < PASSWORD_MIN_LEN) {
    return { ok: false, error: `Password must be at least ${PASSWORD_MIN_LEN} characters` };
  }
  const tokenHash = hashResetToken(opts.token);
  const rows = await db
    .select()
    .from(schema.passwordResetTokens)
    .where(and(eq(schema.passwordResetTokens.tokenHash, tokenHash), isNull(schema.passwordResetTokens.usedAt)))
    .limit(1);
  const row = rows[0];
  if (!row) return { ok: false, error: "Invalid or expired reset link" };
  if (row.expiresAt.getTime() < Date.now()) {
    await db.update(schema.passwordResetTokens).set({ usedAt: new Date() }).where(eq(schema.passwordResetTokens.id, row.id));
    return { ok: false, error: "Invalid or expired reset link" };
  }

  const passwordHash = await bcrypt.hash(opts.newPassword, 10);
  await db.update(schema.users).set({ passwordHash }).where(eq(schema.users.id, row.userId));
  await db.update(schema.passwordResetTokens).set({ usedAt: new Date() }).where(eq(schema.passwordResetTokens.id, row.id));
  // Burn any other open tokens
  const others = await db
    .select()
    .from(schema.passwordResetTokens)
    .where(and(eq(schema.passwordResetTokens.userId, row.userId), isNull(schema.passwordResetTokens.usedAt)));
  for (const o of others) {
    await db.update(schema.passwordResetTokens).set({ usedAt: new Date() }).where(eq(schema.passwordResetTokens.id, o.id));
  }
  await invalidateUserSessions(row.userId);

  // Audit against first org membership if any
  const mem = await db.select().from(schema.memberships).where(eq(schema.memberships.userId, row.userId)).limit(1);
  if (mem[0]) {
    await appendAuditLog({
      orgId: mem[0].orgId,
      actorUserId: row.userId,
      action: "auth.password_reset",
      entityType: "user",
      entityId: row.userId,
      detail: {},
    });
  }
  return { ok: true };
}

export async function changePassword(opts: {
  userId: string;
  orgId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureDb();
  if (opts.newPassword.length < PASSWORD_MIN_LEN) {
    return { ok: false, error: `Password must be at least ${PASSWORD_MIN_LEN} characters` };
  }
  const users = await db.select().from(schema.users).where(eq(schema.users.id, opts.userId)).limit(1);
  const user = users[0];
  if (!user) return { ok: false, error: "User not found" };
  const ok = await bcrypt.compare(opts.currentPassword, user.passwordHash);
  if (!ok) return { ok: false, error: "Current password is incorrect" };
  const passwordHash = await bcrypt.hash(opts.newPassword, 10);
  await db.update(schema.users).set({ passwordHash }).where(eq(schema.users.id, user.id));
  await invalidateUserSessions(user.id);
  await appendAuditLog({
    orgId: opts.orgId,
    actorUserId: user.id,
    action: "auth.password_change",
    entityType: "user",
    entityId: user.id,
    detail: {},
  });
  return { ok: true };
}

/** Test helper: peek valid unused token row by hash. */
export async function findOpenResetByHash(tokenHash: string) {
  await ensureDb();
  const rows = await db
    .select()
    .from(schema.passwordResetTokens)
    .where(
      and(
        eq(schema.passwordResetTokens.tokenHash, tokenHash),
        isNull(schema.passwordResetTokens.usedAt),
        gt(schema.passwordResetTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}
