export const dynamic = "force-dynamic";

import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db, ensureDb, schema } from "@/lib/db";
import { getAppOrigin } from "@/lib/site";
import { PageHeader } from "@/components/ui";
import { VendorsClient } from "@/components/vendors-client";

export default async function VendorsPage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();
  const rows = await db
    .select()
    .from(schema.vendorQuestionnaires)
    .where(eq(schema.vendorQuestionnaires.orgId, session.orgId))
    .orderBy(desc(schema.vendorQuestionnaires.createdAt));
  const origin = getAppOrigin();
  return (
    <div>
      <PageHeader
        title="Vendor AI risk questionnaires"
        subtitle="Create a tokenised link for third-party vendors to complete. V77 never emails the link for you."
      />
      <VendorsClient
        rows={rows.map((r) => ({
          id: r.id,
          vendorName: r.vendorName,
          status: r.status,
          riskScore: r.riskScore,
          shareUrl: `${origin}/vendor/${r.token}`,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
