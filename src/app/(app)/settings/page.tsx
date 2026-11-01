export const dynamic = "force-dynamic";

import { desc, eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui";
import { SettingsClient } from "@/components/settings-client";
import { listOpenInvites, listOrgMembers } from "@/lib/invites";
import { inviteAcceptUrl } from "@/lib/site";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();
  const orgs = await db
    .select({
      id: schema.organisations.id,
      name: schema.organisations.name,
      slug: schema.organisations.slug,
      role: schema.memberships.role,
    })
    .from(schema.memberships)
    .innerJoin(schema.organisations, eq(schema.memberships.orgId, schema.organisations.id))
    .where(eq(schema.memberships.userId, session.userId));
  const keys =
    session.role === "admin"
      ? await db
          .select({
            id: schema.apiKeys.id,
            name: schema.apiKeys.name,
            keyPrefix: schema.apiKeys.keyPrefix,
            role: schema.apiKeys.role,
            createdAt: schema.apiKeys.createdAt,
            lastUsedAt: schema.apiKeys.lastUsedAt,
            revokedAt: schema.apiKeys.revokedAt,
          })
          .from(schema.apiKeys)
          .where(eq(schema.apiKeys.orgId, session.orgId))
          .orderBy(desc(schema.apiKeys.createdAt))
      : [];

  const members = await listOrgMembers(session.orgId);
  const invites =
    session.role === "admin"
      ? (await listOpenInvites(session.orgId)).map((i) => ({
          id: i.id,
          email: i.email,
          role: i.role,
          expiresAt: i.expiresAt,
          acceptUrl: inviteAcceptUrl(i.token),
        }))
      : [];

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Team invites, multi-tenant organisations, RBAC roles, and API keys."
      />
      <SettingsClient
        keys={keys}
        orgs={orgs}
        members={members}
        invites={invites}
        currentOrgId={session.orgId}
        isAdmin={session.role === "admin"}
      />
    </div>
  );
}
