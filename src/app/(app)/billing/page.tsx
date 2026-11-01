export const dynamic = "force-dynamic";

import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { ensurePlanCatalog, getOrgPlan, DEFAULT_PLANS } from "@/lib/billing/plans";
import { BILLABLE_PLANS, displayPriceEur, paystackCurrency, eurToUsdRate } from "@/lib/billing/currency";
import { billingEnabled } from "@/lib/billing/flags";
import { PageHeader } from "@/components/ui";
import { COMPANY } from "@/lib/company";
import { BillingCheckoutButton } from "@/components/billing-checkout";
import { CHECKOUT_DISPLAY_NAME } from "@/lib/billing/paystack";
import { getOrgSubscription } from "@/lib/billing/service";

export default async function BillingPage() {
  const session = await getSession();
  if (!session) return null;
  await ensurePlanCatalog();
  const plan = await getOrgPlan(session.orgId);
  const sub = await getOrgSubscription(session.orgId);
  const enabled = billingEnabled();
  const currency = paystackCurrency();
  const rate = eurToUsdRate();

  return (
    <div>
      <PageHeader
        title="Plan & billing"
        subtitle={`${CHECKOUT_DISPLAY_NAME} · prices shown in EUR · card payments only (no mobile money)`}
        actions={
          <Link href="/billing/invoices" className="btn btn-secondary text-sm">
            Invoices
          </Link>
        }
      />
      <div className="card mb-6 p-5">
        <h2 className="font-semibold text-[#0F2A4A]">Current organisation</h2>
        <p className="mt-2 text-sm text-slate-600">
          Plan: <strong>{plan?.name}</strong> ({plan?.tier}) · Seats {plan?.seatsUsed}/{plan?.seatLimit} · Billing
          status: <strong>{sub?.billingStatus || "none"}</strong>
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Charge currency: <strong>{currency}</strong>
          {currency === "USD" ? ` · EUR→USD rate ${rate} (config PAYSTACK_EUR_USD_RATE)` : " · charging EUR directly"}
          {" · "}
          Checkout name: <strong>{CHECKOUT_DISPLAY_NAME}</strong>
        </p>
        {!enabled ? (
          <p className="mt-2 text-sm text-amber-800">
            Live checkout is behind <code className="text-xs">V77_BILLING_ENABLED</code>. Contact{" "}
            <a className="font-semibold text-sky-700 hover:underline" href={`mailto:${COMPANY.salesEmail}`}>
              {COMPANY.salesEmail}
            </a>{" "}
            for a quote.
          </p>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {BILLABLE_PLANS.map((p) => {
          const catalog = DEFAULT_PLANS.find((d) => d.tier === p.tier);
          return (
            <div key={p.tier} className={`card p-5 ${plan?.tier === p.tier ? "ring-1 ring-sky-300" : ""}`}>
              <h3 className="text-lg font-semibold text-[#0F2A4A]">{p.name}</h3>
              <p className="mt-1 text-sm font-medium text-slate-700">{displayPriceEur(p)}</p>
              <p className="mt-2 text-xs text-slate-500">Up to {p.seatLimit} seats</p>
              <ul className="mt-3 space-y-1 text-sm text-slate-700">
                {(catalog?.features || p.features).map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              {p.tier === "team" ? (
                <BillingCheckoutButton tier="team" enabled={enabled} label="Pay by card (Paystack)" />
              ) : (
                <p className="mt-3 text-xs text-slate-500">
                  Contact {COMPANY.salesEmail} — pricing on request.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
