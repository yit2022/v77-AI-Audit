import { cookies } from "next/headers";
import { eq, and } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";
import type { Role } from "@/lib/db/schema";
import { assertSessionIdShape, sessionCookieOptions } from "@/lib/security/session-policy";

const COOKIE = "v77_session";
const TTL_MS = 1000 * 60 * 60 * 24 * 14;

export type SessionUser = {
  sessionId: string;
  userId: string;
  orgId: string;
  email: string;
  name: string;
  role: Role;
  orgName: string;
};

export async function createSession(userId: string, orgId: string) {
  await ensureDb();
  const sessionId = id();
  const expiresAt = new Date(Date.now() + TTL_MS);
  await db.insert(schema.sessions).values({ id: sessionId, userId, orgId, expiresAt });
  const jar = await cookies();
  jar.set(COOKIE, sessionId, sessionCookieOptions(expiresAt));
  return sessionId;
}

export async function destroySession() {
  await ensureDb();
  const jar = await cookies();
  const sid = jar.get(COOKIE)?.value;
  if (sid) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, sid));
    jar.delete(COOKIE);
  }
}

export async function getSession(): Promise<SessionUser | null> {
  await ensureDb();
  const jar = await cookies();
  const sid = jar.get(COOKIE)?.value;
  if (!assertSessionIdShape(sid)) return null;
  const rows = await db
    .select({
      sessionId: schema.sessions.id,
      userId: schema.users.id,
      orgId: schema.organisations.id,
      email: schema.users.email,
      name: schema.users.name,
      role: schema.memberships.role,
      orgName: schema.organisations.name,
      expiresAt: schema.sessions.expiresAt,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .innerJoin(schema.organisations, eq(schema.sessions.orgId, schema.organisations.id))
    .innerJoin(
      schema.memberships,
      and(eq(schema.memberships.userId, schema.users.id), eq(schema.memberships.orgId, schema.organisations.id)),
    )
    .where(eq(schema.sessions.id, sid))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (new Date(row.expiresAt).getTime() < Date.now()) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, sid));
    return null;
  }
  return {
    sessionId: row.sessionId,
    userId: row.userId,
    orgId: row.orgId,
    email: row.email,
    name: row.name,
    role: row.role as Role,
    orgName: row.orgName,
  };
}

export async function requireSession(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHORIZED");
  return s;
}
