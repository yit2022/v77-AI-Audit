import { and, eq, inArray } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";

export type PartnerBranding = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  customDomain: string;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || `partner-${id().slice(0, 8)}`;
}

export async function getPartnerForUser(userId: string): Promise<PartnerBranding | null> {
  await ensureDb();
  const rows = await db
    .select({
      id: schema.partners.id,
      name: schema.partners.name,
      slug: schema.partners.slug,
      logoUrl: schema.partners.logoUrl,
      primaryColor: schema.partners.primaryColor,
      accentColor: schema.partners.accentColor,
      customDomain: schema.partners.customDomain,
    })
    .from(schema.partnerMemberships)
    .innerJoin(schema.partners, eq(schema.partnerMemberships.partnerId, schema.partners.id))
    .where(eq(schema.partnerMemberships.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function createPartnerForUser(opts: {
  userId: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}): Promise<PartnerBranding> {
  await ensureDb();
  const existing = await getPartnerForUser(opts.userId);
  if (existing) return existing;
  const partnerId = id();
  let slug = slugify(opts.name);
  const clash = await db.select().from(schema.partners).where(eq(schema.partners.slug, slug)).limit(1);
  if (clash[0]) slug = `${slug}-${partnerId.slice(0, 6)}`;
  const branding: PartnerBranding = {
    id: partnerId,
    name: opts.name.trim(),
    slug,
    logoUrl: (opts.logoUrl || "").trim(),
    primaryColor: opts.primaryColor?.trim() || "#0F2A4A",
    accentColor: opts.accentColor?.trim() || "#6FCDF5",
    customDomain: "",
  };
  await db.insert(schema.partners).values({
    id: branding.id,
    name: branding.name,
    slug: branding.slug,
    logoUrl: branding.logoUrl,
    primaryColor: branding.primaryColor,
    accentColor: branding.accentColor,
    customDomain: branding.customDomain,
  });
  await db.insert(schema.partnerMemberships).values({
    id: id(),
    partnerId: branding.id,
    userId: opts.userId,
    role: "owner",
  });
  return branding;
}

export async function updatePartnerBranding(
  partnerId: string,
  userId: string,
  patch: Partial<Pick<PartnerBranding, "name" | "logoUrl" | "primaryColor" | "accentColor" | "customDomain">>,
): Promise<PartnerBranding | null> {
  await ensureDb();
  const membership = await db
    .select()
    .from(schema.partnerMemberships)
    .where(and(eq(schema.partnerMemberships.partnerId, partnerId), eq(schema.partnerMemberships.userId, userId)))
    .limit(1);
  if (!membership[0]) return null;
  await db
    .update(schema.partners)
    .set({
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.logoUrl !== undefined ? { logoUrl: patch.logoUrl.trim() } : {}),
      ...(patch.primaryColor !== undefined ? { primaryColor: patch.primaryColor.trim() } : {}),
      ...(patch.accentColor !== undefined ? { accentColor: patch.accentColor.trim() } : {}),
      ...(patch.customDomain !== undefined ? { customDomain: patch.customDomain.trim().toLowerCase() } : {}),
    })
    .where(eq(schema.partners.id, partnerId));
  const rows = await db.select().from(schema.partners).where(eq(schema.partners.id, partnerId)).limit(1);
  const p = rows[0];
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    logoUrl: p.logoUrl,
    primaryColor: p.primaryColor,
    accentColor: p.accentColor,
    customDomain: p.customDomain || "",
  };
}

export async function listPartnerClients(partnerId: string) {
  await ensureDb();
  const orgs = await db.select().from(schema.organisations).where(eq(schema.organisations.partnerId, partnerId));
  const out = [];
  for (const o of orgs) {
    const members = await db.select().from(schema.memberships).where(eq(schema.memberships.orgId, o.id));
    const systems = await db.select().from(schema.aiSystems).where(eq(schema.aiSystems.orgId, o.id));
    out.push({
      id: o.id,
      name: o.name,
      slug: o.slug,
      planTier: o.planTier,
      seatLimit: o.seatLimit,
      members: members.length,
      systems: systems.length,
    });
  }
  return out;
}

export async function attachClientOrg(opts: {
  partnerId: string;
  userId: string;
  orgName: string;
}): Promise<{ orgId: string; slug: string }> {
  await ensureDb();
  const membership = await db
    .select()
    .from(schema.partnerMemberships)
    .where(and(eq(schema.partnerMemberships.partnerId, opts.partnerId), eq(schema.partnerMemberships.userId, opts.userId)))
    .limit(1);
  if (!membership[0]) throw new Error("Not a partner member");
  const orgId = id();
  let slug = slugify(opts.orgName);
  const clash = await db.select().from(schema.organisations).where(eq(schema.organisations.slug, slug)).limit(1);
  if (clash[0]) slug = `${slug}-${orgId.slice(0, 6)}`;
  await db.insert(schema.organisations).values({
    id: orgId,
    name: opts.orgName.trim(),
    slug,
    partnerId: opts.partnerId,
  });
  // Partner owner becomes admin of the client org so they can switch into it.
  await db.insert(schema.memberships).values({
    id: id(),
    orgId,
    userId: opts.userId,
    role: "admin",
  });
  return { orgId, slug };
}

export async function linkExistingOrgToPartner(opts: {
  partnerId: string;
  userId: string;
  orgId: string;
}): Promise<boolean> {
  await ensureDb();
  const membership = await db
    .select()
    .from(schema.partnerMemberships)
    .where(and(eq(schema.partnerMemberships.partnerId, opts.partnerId), eq(schema.partnerMemberships.userId, opts.userId)))
    .limit(1);
  if (!membership[0]) return false;
  // Only allow linking orgs where the user is already an admin member.
  const orgMembership = await db
    .select()
    .from(schema.memberships)
    .where(
      and(
        eq(schema.memberships.orgId, opts.orgId),
        eq(schema.memberships.userId, opts.userId),
        eq(schema.memberships.role, "admin"),
      ),
    )
    .limit(1);
  if (!orgMembership[0]) return false;
  await db.update(schema.organisations).set({ partnerId: opts.partnerId }).where(eq(schema.organisations.id, opts.orgId));
  return true;
}

export async function partnerDashboardStats(partnerId: string) {
  const clients = await listPartnerClients(partnerId);
  return {
    clientCount: clients.length,
    systemCount: clients.reduce((a, c) => a + c.systems, 0),
    seatCapacity: clients.reduce((a, c) => a + (c.seatLimit || 0), 0),
    clients,
  };
}

/** Orgs the user can offer to link (admin memberships). */
export async function listLinkableOrgs(userId: string, partnerId: string) {
  await ensureDb();
  const memberships = await db
    .select()
    .from(schema.memberships)
    .where(and(eq(schema.memberships.userId, userId), eq(schema.memberships.role, "admin")));
  if (!memberships.length) return [];
  const orgIds = memberships.map((m) => m.orgId);
  const orgs = await db.select().from(schema.organisations).where(inArray(schema.organisations.id, orgIds));
  return orgs
    .filter((o) => o.partnerId !== partnerId)
    .map((o) => ({ id: o.id, name: o.name, slug: o.slug, partnerId: o.partnerId }));
}

export async function getPartnerForOrg(orgId: string): Promise<PartnerBranding | null> {
  await ensureDb();
  const orgs = await db.select().from(schema.organisations).where(eq(schema.organisations.id, orgId)).limit(1);
  const partnerId = orgs[0]?.partnerId;
  if (!partnerId) return null;
  const rows = await db.select().from(schema.partners).where(eq(schema.partners.id, partnerId)).limit(1);
  const p = rows[0];
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    logoUrl: p.logoUrl,
    primaryColor: p.primaryColor,
    accentColor: p.accentColor,
    customDomain: p.customDomain || "",
  };
}
