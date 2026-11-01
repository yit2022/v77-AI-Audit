export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth/session";
import { ensurePlanCatalog, getOrgPlan, DEFAULT_PLANS } from "@/lib/billing/plans";
import { PageHeader } from "@/components/ui";
import { COMPANY } from "@/lib/company";

export default async function BillingPage() {
  const session = await getSession();
  if (!session) return null;
  await ensurePlanCatalog();
  const plan = await getOrgPlan(session.orgId);
  return (
    <div>
      <PageHeader
        title="Plan & seats"
        subtitle="Billing-ready scaffolding only — no payment provider. All tiers are pricing on request."
      />
      <div className="card mb-6 p-5">
        <h2 className="font-semibold text-[#0F2A4A]">Current organisation</h2>
        <p className="mt-2 text-sm text-slate-600">
          Plan: <strong>{plan?.name}</strong> ({plan?.tier}) · Seats {plan?.seatsUsed}/{plan?.seatLimit} ·{" "}
          {plan?.priceNote}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Contact{" "}
          <a className="font-semibold text-sky-700 hover:underline" href={`mailto:${COMPANY.salesEmail}`}>
            {COMPANY.salesEmail}
          </a>{" "}
          to change plan. No checkout is available in-product.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {DEFAULT_PLANS.map((p) => (
          <div key={p.tier} className={`card p-5 ${plan?.tier === p.tier ? "ring-1 ring-sky-300" : ""}`}>
            <h3 className="text-lg font-semibold text-[#0F2A4A]">{p.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{p.priceNote}</p>
            <p className="mt-2 text-xs text-slate-500">Up to {p.seatLimit} seats</p>
            <ul className="mt-3 space-y-1 text-sm text-slate-700">
              {p.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
