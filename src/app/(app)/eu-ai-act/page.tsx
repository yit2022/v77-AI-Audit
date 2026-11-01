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
      riskTier: schema.aiSystems.riskTier,
      roleInValueChain: schema.aiSystems.roleInValueChain,
    })
    .from(schema.aiSystems)
    .where(eq(schema.aiSystems.orgId, session.orgId));

  return (
    <div>
      <PageHeader
        title="EU AI Act deep dive"
        subtitle="Risk tiers, provider/deployer obligations, Annex IV technical documentation and conformity assessment tracking. Link FRIA work to a GDPR DPIA when personal data is processed."
      />
      <EuAiActClient systems={systems} />
    </div>
  );
}
