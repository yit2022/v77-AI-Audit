export const dynamic = "force-dynamic";

import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db, ensureDb, schema } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { GapAnalysisClient } from "@/components/gap-analysis-client";

export default async function GapAnalysisPage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();
  const systems = await db
    .select({ id: schema.aiSystems.id, name: schema.aiSystems.name })
    .from(schema.aiSystems)
    .where(eq(schema.aiSystems.orgId, session.orgId));
  const history = await db
    .select()
    .from(schema.gapAnalyses)
    .where(eq(schema.gapAnalyses.orgId, session.orgId))
    .orderBy(desc(schema.gapAnalyses.createdAt))
    .limit(10);

  return (
    <div>
      <PageHeader
        title="AI control mapping & gap analysis"
        subtitle="Map assessment control status to EU AI Act / NIST / ISO gaps. Workers AI when the real-providers flag is on; mock otherwise."
      />
      <GapAnalysisClient
        systems={systems}
        history={history.map((h) => ({
          id: h.id,
          summary: h.summary,
          provider: h.provider,
          createdAt: h.createdAt.toISOString(),
          gapsJson: h.gapsJson,
        }))}
      />
    </div>
  );
}
