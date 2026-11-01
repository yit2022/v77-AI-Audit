import { createHash, randomBytes } from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";
import type { Role } from "@/lib/db/schema";

export type ApiAuth = {
  keyId: string;
  orgId: string;
  role: Role;
};

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateApiKeySecret(): { raw: string; prefix: string; hash: string } {
  const raw = `v77_${randomBytes(24).toString("base64url")}`;
  const prefix = raw.slice(0, 12);
  return { raw, prefix, hash: hashApiKey(raw) };
}

export async function createApiKey(opts: {
  orgId: string;
  name: string;
  role: Role;
  createdBy?: string | null;
}): Promise<{ id: string; raw: string; prefix: string }> {
  await ensureDb();
  const secret = generateApiKeySecret();
  const keyId = id();
  await db.insert(schema.apiKeys).values({
    id: keyId,
    orgId: opts.orgId,
    name: opts.name,
    keyPrefix: secret.prefix,
    keyHash: secret.hash,
    role: opts.role,
    createdBy: opts.createdBy ?? null,
  });
  return { id: keyId, raw: secret.raw, prefix: secret.prefix };
}

export async function authenticateApiKey(raw: string | null | undefined): Promise<ApiAuth | null> {
  if (!raw) return null;
  const token = raw.startsWith("Bearer ") ? raw.slice(7).trim() : raw.trim();
  if (!token.startsWith("v77_")) return null;
  await ensureDb();
  const hash = hashApiKey(token);
  const rows = await db
    .select()
    .from(schema.apiKeys)
    .where(and(eq(schema.apiKeys.keyHash, hash), isNull(schema.apiKeys.revokedAt)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  await db.update(schema.apiKeys).set({ lastUsedAt: new Date() }).where(eq(schema.apiKeys.id, row.id));
  return { keyId: row.id, orgId: row.orgId, role: row.role as Role };
}

export function roleAtLeast(role: Role, minimum: Role): boolean {
  // admin > ai_owner > auditor for write privileges; auditor can read
  const rank: Record<Role, number> = { auditor: 1, ai_owner: 2, admin: 3 };
  return rank[role] >= rank[minimum];
}
