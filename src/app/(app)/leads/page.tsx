export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listPilotLeads } from "@/lib/leads";
import { PageHeader } from "@/components/ui";
import { LeadsInboxClient } from "@/components/leads-inbox-client";

export default async function LeadsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");
  const leads = await listPilotLeads(200);

  return (
    <div>
      <PageHeader
        title="Pilot leads"
        subtitle="Inbox for landing and pilot requests. Update status and keep internal notes — no automated emails."
      />
      <LeadsInboxClient
        initialLeads={leads.map((l) => ({
          ...l,
          status: l.status || "new",
          notes: l.notes || "",
        }))}
      />
    </div>
  );
}
