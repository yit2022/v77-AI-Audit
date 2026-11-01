export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db, ensureDb, schema } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { EvidenceRequestsClient } from "@/components/evidence-requests-client";
import { listEvidenceRequests, summarizeExpiry } from "@/lib/evidence-requests/service";
import { getRequestLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/dictionaries";
import { syncControlCatalogue } from "@/lib/db/sync-controls";

export default async function EvidenceRequestsPage() {
  const session = await getSession();
  if (!session) return null;
  const locale = await getRequestLocale();
  await syncControlCatalogue();
  const rows = await listEvidenceRequests(session.orgId);
  const summary = summarizeExpiry(rows);
  await ensureDb();
  const memberships = await db.select().from(schema.memberships).where(eq(schema.memberships.orgId, session.orgId));
  const userIds = memberships.map((m) => m.userId);
  const users = userIds.length
    ? await db.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email }).from(schema.users)
    : [];
  const members = users.filter((u) => userIds.includes(u.id));
  const systems = await db
    .select({ id: schema.aiSystems.id, name: schema.aiSystems.name })
    .from(schema.aiSystems)
    .where(eq(schema.aiSystems.orgId, session.orgId));
  const controls = await db
    .select({ id: schema.controls.id, code: schema.controls.code, title: schema.controls.title })
    .from(schema.controls);

  return (
    <div className="space-y-6">
      <PageHeader title={t(locale, "evidenceReq.title")} subtitle={t(locale, "evidenceReq.subtitle")} />
      <EvidenceRequestsClient
        rows={rows.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          status: r.status,
          cadenceDays: r.cadenceDays,
          nextDueAt: r.nextDueAt.toISOString(),
          expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
          assigneeUserId: r.assigneeUserId,
          systemId: r.systemId,
          controlId: r.controlId,
        }))}
        summary={summary}
        members={members}
        systems={systems}
        controls={controls}
        labels={{
          total: t(locale, "evidenceReq.total"),
          overdue: t(locale, "evidenceReq.overdue"),
          expiringSoon: t(locale, "evidenceReq.expiringSoon"),
          expired: t(locale, "evidenceReq.expired"),
          schedule: t(locale, "evidenceReq.schedule"),
          title: t(locale, "evidenceReq.fieldTitle"),
          titlePlaceholder: t(locale, "evidenceReq.titlePlaceholder"),
          description: t(locale, "evidenceReq.description"),
          nextDue: t(locale, "evidenceReq.nextDue"),
          expires: t(locale, "evidenceReq.expires"),
          cadence: t(locale, "evidenceReq.cadence"),
          assignee: t(locale, "evidenceReq.assignee"),
          unassigned: t(locale, "evidenceReq.unassigned"),
          system: t(locale, "evidenceReq.system"),
          control: t(locale, "evidenceReq.control"),
          any: t(locale, "evidenceReq.any"),
          create: t(locale, "evidenceReq.create"),
          complete: t(locale, "evidenceReq.complete"),
          cancel: t(locale, "evidenceReq.cancel"),
          empty: t(locale, "evidenceReq.empty"),
          noDescription: t(locale, "evidenceReq.noDescription"),
        }}
      />
    </div>
  );
}
