export const dynamic = "force-dynamic";

import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db, ensureDb, schema } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { IncidentsClient } from "@/components/incidents-client";

export default async function IncidentsPage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();
  const systems = await db
    .select({ id: schema.aiSystems.id, name: schema.aiSystems.name })
    .from(schema.aiSystems)
    .where(eq(schema.aiSystems.orgId, session.orgId));
  const incidents = await db
    .select()
    .from(schema.incidents)
    .where(eq(schema.incidents.orgId, session.orgId))
    .orderBy(desc(schema.incidents.createdAt));
  return (
    <div>
      <PageHeader
        title="Incident register"
        subtitle="EU AI Act serious-incident reporting fields (Art. 73). Records stay in-app — V77 does not notify authorities for you."
      />
      <IncidentsClient
        systems={systems}
        incidents={incidents.map((i) => ({
          id: i.id,
          title: i.title,
          severity: i.severity,
          status: i.status,
          seriousIncident: i.seriousIncident,
          euArticleRef: i.euArticleRef,
          discoveredAt: i.discoveredAt,
          authorityNotified: i.authorityNotified,
          createdAt: i.createdAt ? new Date(i.createdAt).toISOString() : "",
        }))}
      />
    </div>
  );
}
