export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db, ensureDb, schema } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { ModelCardsClient } from "@/components/model-cards-client";

export default async function ModelCardsPage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();
  const systems = await db
    .select({ id: schema.aiSystems.id, name: schema.aiSystems.name })
    .from(schema.aiSystems)
    .where(eq(schema.aiSystems.orgId, session.orgId));
  return (
    <div>
      <PageHeader
        title="Model cards"
        subtitle="System documentation editor for intended use, data, evaluation, ethics and limitations."
      />
      <ModelCardsClient systems={systems} />
    </div>
  );
}
