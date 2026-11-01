import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";
import { getAppOrigin } from "@/lib/site";

export function hashUnsubToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function ensureUnsubscribeToken(email: string): Promise<string> {
  await ensureDb();
  const normalized = email.trim().toLowerCase();
  const existing = await db.select().from(schema.emailUnsubscribes).where(eq(schema.emailUnsubscribes.email, normalized)).limit(1);
  // Always issue a fresh opaque token stored as hash; if row exists without knowing plaintext, rotate
  const token = randomBytes(24).toString("base64url");
  const tokenHash = hashUnsubToken(token);
  if (existing[0]) {
    await db.update(schema.emailUnsubscribes).set({ tokenHash }).where(eq(schema.emailUnsubscribes.id, existing[0].id));
  } else {
    await db.insert(schema.emailUnsubscribes).values({ id: id(), email: normalized, tokenHash });
  }
  return token;
}

export function unsubscribeUrl(email: string, token: string, req?: Request) {
  const origin = getAppOrigin(req);
  return `${origin}/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
}

export async function isMarketingOptedOut(email: string): Promise<boolean> {
  await ensureDb();
  const normalized = email.trim().toLowerCase();
  const users = await db.select().from(schema.users).where(eq(schema.users.email, normalized)).limit(1);
  if (users[0]?.marketingOptOut) return true;
  // Presence in unsubscribes table alone does not mean opted out until they click — we store tokens there.
  // Opt-out flag lives on users; for non-users we use a sentinel kind via lifecycle or separate — check users only.
  return false;
}

export async function applyUnsubscribe(email: string, token: string): Promise<boolean> {
  await ensureDb();
  const normalized = email.trim().toLowerCase();
  const tokenHash = hashUnsubToken(token);
  const rows = await db
    .select()
    .from(schema.emailUnsubscribes)
    .where(eq(schema.emailUnsubscribes.email, normalized))
    .limit(1);
  if (!rows[0] || rows[0].tokenHash !== tokenHash) return false;
  const users = await db.select().from(schema.users).where(eq(schema.users.email, normalized)).limit(1);
  if (users[0]) {
    await db.update(schema.users).set({ marketingOptOut: true }).where(eq(schema.users.id, users[0].id));
  }
  return true;
}
