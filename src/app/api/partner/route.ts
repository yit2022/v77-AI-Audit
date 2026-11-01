import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isReadOnly } from "@/lib/auth/rbac";
import {
  attachClientOrg,
  createPartnerForUser,
  getPartnerForUser,
  linkExistingOrgToPartner,
  listLinkableOrgs,
  partnerDashboardStats,
  updatePartnerBranding,
} from "@/lib/partner/service";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const partner = await getPartnerForUser(session.userId);
  if (!partner) return NextResponse.json({ partner: null, stats: null, linkable: [] });
  const stats = await partnerDashboardStats(partner.id);
  const linkable = await listLinkableOrgs(session.userId, partner.id);
  return NextResponse.json({ partner, stats, linkable });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isReadOnly(session.role)) return NextResponse.json({ error: "Auditors are read-only" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    name?: string;
    logoUrl?: string;
    primaryColor?: string;
    accentColor?: string;
    customDomain?: string;
    orgName?: string;
    orgId?: string;
  };
  const action = body.action || "create";

  if (action === "create") {
    if (!body.name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
    const partner = await createPartnerForUser({
      userId: session.userId,
      name: body.name,
      logoUrl: body.logoUrl,
      primaryColor: body.primaryColor,
      accentColor: body.accentColor,
    });
    return NextResponse.json({ partner });
  }

  const partner = await getPartnerForUser(session.userId);
  if (!partner) return NextResponse.json({ error: "Create a partner first" }, { status: 400 });

  if (action === "branding") {
    const updated = await updatePartnerBranding(partner.id, session.userId, {
      name: body.name,
      logoUrl: body.logoUrl,
      primaryColor: body.primaryColor,
      accentColor: body.accentColor,
      customDomain: body.customDomain,
    });
    return NextResponse.json({ partner: updated });
  }

  if (action === "create_client") {
    if (!body.orgName?.trim()) return NextResponse.json({ error: "orgName required" }, { status: 400 });
    const created = await attachClientOrg({
      partnerId: partner.id,
      userId: session.userId,
      orgName: body.orgName,
    });
    return NextResponse.json({ ok: true, ...created });
  }

  if (action === "link_client") {
    if (!body.orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });
    const ok = await linkExistingOrgToPartner({
      partnerId: partner.id,
      userId: session.userId,
      orgId: body.orgId,
    });
    if (!ok) return NextResponse.json({ error: "Cannot link org" }, { status: 403 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
