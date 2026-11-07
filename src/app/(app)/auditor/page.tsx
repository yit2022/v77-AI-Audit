export const dynamic = "force-dynamic";

import { eq, desc } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui";
import { AuditorClient } from "@/components/auditor-client";
import { parseInstitutionAndVendor } from "@/lib/eu-ai-act/industries";

export default async function AuditorPage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();
  const rows = await db
    .select({
      id: schema.assessments.id,
      name: schema.assessments.name,
      status: schema.assessments.status,
      systemName: schema.aiSystems.name,
      vendorName: schema.aiSystems.vendorName,
    })
    .from(schema.assessments)
    .innerJoin(schema.aiSystems, eq(schema.assessments.systemId, schema.aiSystems.id))
    .where(eq(schema.assessments.orgId, session.orgId))
    .orderBy(desc(schema.assessments.createdAt));

  const assessments = rows.map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    systemName: r.systemName,
    institutionName: parseInstitutionAndVendor(r.vendorName, session.orgName).institution,
  }));

  return (
    <div>
      <PageHeader
        title="European AI Auditor Engagement Workbench"
        subtitle={`Workspace: ${session.orgName} · 5-Phase statutory audit workbench across all 11 European sectors: verify Audited Institution scope, inspect 24 controls & SHA-256 evidence, review Annex IV/FRIA/DPIA dossiers, and record formal statutory sign-off.`}
      />
      <AuditorClient
        assessments={assessments}
        canSign={session.role === "auditor" || session.role === "admin"}
      />
    </div>
  );
}
