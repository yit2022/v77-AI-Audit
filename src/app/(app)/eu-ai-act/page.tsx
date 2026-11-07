export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui";
import { EuAiActClient } from "@/components/eu-ai-act-client";

export default async function EuAiActPage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();
  const systems = await db
    .select({
      id: schema.aiSystems.id,
      name: schema.aiSystems.name,
      domain: schema.aiSystems.domain,
      intendedPurpose: schema.aiSystems.intendedPurpose,
      vendorName: schema.aiSystems.vendorName,
      gpai: schema.aiSystems.gpai,
      riskTier: schema.aiSystems.riskTier,
      roleInValueChain: schema.aiSystems.roleInValueChain,
    })
    .from(schema.aiSystems)
    .where(eq(schema.aiSystems.orgId, session.orgId));

  return (
    <div>
      <PageHeader
        title="EU AI Act Statutory Hub, Policy Packs & CE Conformity Suite"
        subtitle="Manage EU Statutory Policy Packs (DORA, MDR/IVDR, NIS2, HR Works Council, GPAI & Agentic AI), 1-click Annex IV Technical Documentation, Art. 47 DoC, Art. 48 Digital CE Marking, Art. 49 EU Database JSON, Art. 6(4) Derogation, Art. 26(7) Works Council Notice, and Art. 86 Right-to-Explanation."
      />
      <EuAiActClient systems={systems} orgName={session.orgName} />
    </div>
  );
}
