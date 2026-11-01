export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isPlatformAdminEmailAsync, listPlatformOrgs, listUsage } from "@/lib/platform/admin";
import { PageHeader } from "@/components/ui";
import { PlatformAdminClient } from "@/components/platform-admin-client";

export default async function PlatformPage() {
  const session = await getSession();
  if (!session) return null;
  if (!await isPlatformAdminEmailAsync(session.email)) redirect("/dashboard");
  const orgs = await listPlatformOrgs();
  const usage = await listUsage(20);
  return (
    <div className="space-y-8">
      <PageHeader
        title="Platform super-console"
        subtitle="Owner view of organisations, plan tiers and seat limits. No payment provider connected."
      />
      <PlatformAdminClient
        orgs={orgs.map((o) => ({
          id: o.id,
          name: o.name,
          slug: o.slug,
          planTier: o.planTier || "pilot",
          seatLimit: o.seatLimit || 5,
          members: o.members,
          systems: o.systems,
        }))}
      />
      <section>
        <h2 className="text-sm font-semibold text-[#0F2A4A]">Usage counters (scaffold)</h2>
        <p className="mt-1 text-xs text-slate-500">
          Daily usage rows appear when instrumented; empty until traffic is recorded.
        </p>
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          {usage.map((u) => (
            <li key={u.id}>
              {u.day} · org {u.orgId.slice(0, 8)}… · api {u.apiCalls} · ai {u.aiCalls} · evidence {u.evidenceUploads}
            </li>
          ))}
          {usage.length === 0 ? <li>No usage rows yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
