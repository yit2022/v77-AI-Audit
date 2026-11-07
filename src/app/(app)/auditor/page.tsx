export const dynamic = "force-dynamic";

import { eq, desc } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui";
import { AuditorClient } from "@/components/auditor-client";

export default async function AuditorPage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();
  const assessments = await db
    .select({
      id: schema.assessments.id,
      name: schema.assessments.name,
      status: schema.assessments.status,
      systemName: schema.aiSystems.name,
    })
    .from(schema.assessments)
    .innerJoin(schema.aiSystems, eq(schema.assessments.systemId, schema.aiSystems.id))
    .where(eq(schema.assessments.orgId, session.orgId))
    .orderBy(desc(schema.assessments.createdAt));

  return (
    <div>
      <PageHeader
        title="EU AI Act & DORA Auditor Engagement Workbench"
        subtitle="5-Phase statutory audit workbench: inspect system classification & DORA scope, verify 24 controls & SHA-256 evidence, inspect technical & Annex IV/FRIA/DPIA dossiers, raise findings, and record formal statutory sign-off."
      />
      <AuditorClient
        assessments={assessments}
        canSign={session.role === "auditor" || session.role === "admin"}
      />
    </div>
  );
}
