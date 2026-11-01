import { createHash, randomBytes } from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, ensureDb, schema } from "@/lib/db";
import type { Role } from "@/lib/db/schema";
import { id } from "@/lib/ids";
import { inviteAcceptUrl } from "@/lib/site";
import { appendAuditLog } from "@/lib/audit/log";

const TTL_MS = 1000 * 60 * 60 * 24 * 7;

export function generateInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function createOrgInvite(opts: {
  orgId: string;
  email: string;
  role: Role;
  invitedBy: string;
  req?: Request;
}) {
  await ensureDb();
  const email = opts.email.trim().toLowerCase();
  if (!email.includes("@")) throw new Error("Invalid email");
  if (!["admin", "ai_owner", "reviewer", "auditor"].includes(opts.role)) throw new Error("Invalid role");

  // Revoke prior open invite for same email/org
  const existing = await db
    .select()
    .from(schema.orgInvites)
    .where(and(eq(schema.orgInvites.orgId, opts.orgId), eq(schema.orgInvites.email, email), isNull(schema.orgInvites.acceptedAt), isNull(schema.orgInvites.revokedAt)));
  for (const row of existing) {
    await db
      .update(schema.orgInvites)
      .set({ revokedAt: new Date() })
      .where(eq(schema.orgInvites.id, row.id));
  }

  const token = generateInviteToken();
  const inviteId = id();
  const expiresAt = new Date(Date.now() + TTL_MS);
  await db.insert(schema.orgInvites).values({
    id: inviteId,
    orgId: opts.orgId,
    email,
    role: opts.role,
    token,
    invitedBy: opts.invitedBy,
    expiresAt,
  });
  await appendAuditLog({
    orgId: opts.orgId,
    actorUserId: opts.invitedBy,
    action: "invite.create",
    entityType: "org_invite",
    entityId: inviteId,
    detail: { email, role: opts.role },
  });
  return {
    id: inviteId,
    email,
    role: opts.role,
    expiresAt,
    acceptUrl: inviteAcceptUrl(token, opts.req),
    token,
  };
}

export async function listOrgMembers(orgId: string) {
  await ensureDb();
  return db
    .select({
      membershipId: schema.memberships.id,
      userId: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      role: schema.memberships.role,
    })
    .from(schema.memberships)
    .innerJoin(schema.users, eq(schema.memberships.userId, schema.users.id))
    .where(eq(schema.memberships.orgId, orgId));
}

export async function listOpenInvites(orgId: string) {
  await ensureDb();
  return db
    .select()
    .from(schema.orgInvites)
    .where(and(eq(schema.orgInvites.orgId, orgId), isNull(schema.orgInvites.acceptedAt), isNull(schema.orgInvites.revokedAt)));
}

export async function revokeInvite(orgId: string, inviteId: string, actorUserId: string) {
  await ensureDb();
  const rows = await db
    .select()
    .from(schema.orgInvites)
    .where(and(eq(schema.orgInvites.id, inviteId), eq(schema.orgInvites.orgId, orgId)))
    .limit(1);
  const invite = rows[0];
  if (!invite) throw new Error("Invite not found");
  await db.update(schema.orgInvites).set({ revokedAt: new Date() }).where(eq(schema.orgInvites.id, inviteId));
  await appendAuditLog({
    orgId,
    actorUserId,
    action: "invite.revoke",
    entityType: "org_invite",
    entityId: inviteId,
    detail: { email: invite.email },
  });
}

export async function removeMember(orgId: string, membershipId: string, actorUserId: string) {
  await ensureDb();
  const rows = await db
    .select()
    .from(schema.memberships)
    .where(and(eq(schema.memberships.id, membershipId), eq(schema.memberships.orgId, orgId)))
    .limit(1);
  const m = rows[0];
  if (!m) throw new Error("Member not found");
  if (m.userId === actorUserId) throw new Error("Cannot remove yourself");
  const admins = await db
    .select()
    .from(schema.memberships)
    .where(and(eq(schema.memberships.orgId, orgId), eq(schema.memberships.role, "admin")));
  if (m.role === "admin" && admins.length <= 1) throw new Error("Cannot remove the last admin");
  await db.delete(schema.memberships).where(eq(schema.memberships.id, membershipId));
  await appendAuditLog({
    orgId,
    actorUserId,
    action: "member.remove",
    entityType: "membership",
    entityId: membershipId,
    detail: { userId: m.userId, role: m.role },
  });
}

export async function getInviteByToken(token: string) {
  await ensureDb();
  const rows = await db.select().from(schema.orgInvites).where(eq(schema.orgInvites.token, token)).limit(1);
  return rows[0] ?? null;
}

export async function acceptInvite(opts: {
  token: string;
  name: string;
  password: string;
}) {
  await ensureDb();
  const invite = await getInviteByToken(opts.token);
  if (!invite || invite.revokedAt) throw new Error("Invite is invalid or revoked");
  if (invite.acceptedAt) throw new Error("Invite already accepted");
  if (new Date(invite.expiresAt).getTime() < Date.now()) throw new Error("Invite expired");
  if (opts.password.length < 10) throw new Error("Password must be at least 10 characters");

  const email = invite.email;
  let users = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  let user = users[0];
  if (!user) {
    const userId = id();
    const passwordHash = await bcrypt.hash(opts.password, 10);
    await db.insert(schema.users).values({
      id: userId,
      email,
      name: opts.name.trim() || email.split("@")[0],
      passwordHash,
    });
    users = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    user = users[0];
  } else {
    // Existing user: verify password matches OR update hash if they set a new one on accept
    const ok = await bcrypt.compare(opts.password, user.passwordHash);
    if (!ok) {
      const passwordHash = await bcrypt.hash(opts.password, 10);
      await db.update(schema.users).set({ passwordHash, name: opts.name.trim() || user.name }).where(eq(schema.users.id, user.id));
    }
  }

  const existingMem = await db
    .select()
    .from(schema.memberships)
    .where(and(eq(schema.memberships.orgId, invite.orgId), eq(schema.memberships.userId, user.id)))
    .limit(1);
  if (!existingMem[0]) {
    await db.insert(schema.memberships).values({
      id: id(),
      orgId: invite.orgId,
      userId: user.id,
      role: invite.role,
    });
  } else {
    await db
      .update(schema.memberships)
      .set({ role: invite.role })
      .where(eq(schema.memberships.id, existingMem[0].id));
  }

  await db.update(schema.orgInvites).set({ acceptedAt: new Date() }).where(eq(schema.orgInvites.id, invite.id));
  await appendAuditLog({
    orgId: invite.orgId,
    actorUserId: user.id,
    action: "invite.accept",
    entityType: "org_invite",
    entityId: invite.id,
    detail: { email, role: invite.role },
  });
  return { userId: user.id, orgId: invite.orgId, role: invite.role as Role, email };
}

/** Test helper: hash fingerprint without exposing token. */
export function tokenFingerprint(token: string): string {
  return createHash("sha256").update(token).digest("hex").slice(0, 12);
}
