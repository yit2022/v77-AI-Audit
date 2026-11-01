export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, ensureDb, schema } from "@/lib/db";
import { VENDOR_QUESTIONS } from "@/lib/vendors/questions";
import { MarketingChrome } from "@/components/marketing-chrome";
import { VendorPublicForm } from "@/components/vendor-public-form";

type Props = { params: Promise<{ token: string }> };

export default async function VendorPublicPage({ params }: Props) {
  const { token } = await params;
  await ensureDb();
  const rows = await db.select().from(schema.vendorQuestionnaires).where(eq(schema.vendorQuestionnaires.token, token)).limit(1);
  const q = rows[0];
  if (!q) notFound();
  return (
    <MarketingChrome>
      <section className="mx-auto max-w-3xl px-4 pb-14 sm:px-6">
        <VendorPublicForm
          token={token}
          vendorName={q.vendorName}
          locked={q.status === "submitted"}
          questions={VENDOR_QUESTIONS.map(({ id, section, prompt }) => ({ id, section, prompt }))}
        />
      </section>
    </MarketingChrome>
  );
}
