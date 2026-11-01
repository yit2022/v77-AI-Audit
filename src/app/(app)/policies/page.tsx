export const dynamic = "force-dynamic";

import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db, ensureDb, schema } from "@/lib/db";
import { POLICY_TEMPLATES } from "@/lib/policies/templates";
import { PageHeader } from "@/components/ui";
import { PoliciesClient } from "@/components/policies-client";

export default async function PoliciesPage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();
  const docs = await db
    .select()
    .from(schema.policyDocuments)
    .where(eq(schema.policyDocuments.orgId, session.orgId))
    .orderBy(desc(schema.policyDocuments.updatedAt));
  return (
    <div>
      <PageHeader
        title="Policy templates"
        subtitle="AI policy, acceptable use and model risk management — export PDF or DOCX. Not legal advice."
      />
      <PoliciesClient
        templates={POLICY_TEMPLATES.map(({ id, title, category }) => ({ id, title, category }))}
        docs={docs.map((d) => ({ id: d.id, title: d.title, templateId: d.templateId, updatedAt: d.updatedAt }))}
      />
    </div>
  );
}
