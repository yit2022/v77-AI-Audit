export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui";
import { PartnerClient } from "@/components/partner-client";
import {
  getPartnerForUser,
  listLinkableOrgs,
  partnerDashboardStats,
} from "@/lib/partner/service";
import { getRequestLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/dictionaries";

export default async function PartnerPage() {
  const session = await getSession();
  if (!session) return null;
  const locale = await getRequestLocale();
  const partner = await getPartnerForUser(session.userId);
  const stats = partner ? await partnerDashboardStats(partner.id) : null;
  const linkable = partner ? await listLinkableOrgs(session.userId, partner.id) : [];

  return (
    <div className="space-y-6">
      <PageHeader title={t(locale, "partner.title")} subtitle={t(locale, "partner.subtitle")} />
      {stats ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t(locale, "partner.kpiClients")}</div>
            <div className="mt-1 text-2xl font-semibold text-[#0F2A4A]">{stats.clientCount}</div>
          </div>
          <div className="card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t(locale, "partner.kpiSystems")}</div>
            <div className="mt-1 text-2xl font-semibold text-[#0F2A4A]">{stats.systemCount}</div>
          </div>
          <div className="card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t(locale, "partner.kpiSeats")}</div>
            <div className="mt-1 text-2xl font-semibold text-[#0F2A4A]">{stats.seatCapacity}</div>
          </div>
        </div>
      ) : null}
      <PartnerClient
        partner={partner}
        clients={stats?.clients || []}
        linkable={linkable}
        labels={{
          createHint: t(locale, "partner.createHint"),
          partnerName: t(locale, "partner.name"),
          createPartner: t(locale, "partner.create"),
          logoUrl: t(locale, "partner.logoUrl"),
          primaryColor: t(locale, "partner.primaryColor"),
          accentColor: t(locale, "partner.accentColor"),
          customDomain: t(locale, "partner.customDomain"),
          saveBranding: t(locale, "partner.saveBranding"),
          clients: t(locale, "partner.clients"),
          clientsHint: t(locale, "partner.clientsHint"),
          newClient: t(locale, "partner.newClient"),
          addClient: t(locale, "partner.addClient"),
          linkExisting: t(locale, "partner.linkExisting"),
          linkClient: t(locale, "partner.linkClient"),
          noClients: t(locale, "partner.noClients"),
          saved: t(locale, "common.save"),
        }}
      />
    </div>
  );
}
