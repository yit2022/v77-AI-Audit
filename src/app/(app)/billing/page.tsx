export const dynamic = "force-dynamic";

import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { ensurePlanCatalog, getOrgPlan, DEFAULT_PLANS } from "@/lib/billing/plans";
import { BILLABLE_PLANS, displayPriceEur, paystackCurrency, eurToUsdRate, type BillingInterval } from "@/lib/billing/currency";
import { billingEnabled, billingProvider } from "@/lib/billing/flags";
import { PageHeader } from "@/components/ui";
import { COMPANY } from "@/lib/company";
import { BillingCheckoutButton } from "@/components/billing-checkout";
import { BillingReturn } from "@/components/billing-return";
import { BillingCancelButton } from "@/components/billing-portal-actions";
import { Suspense } from "react";
import { CHECKOUT_DISPLAY_NAME } from "@/lib/billing/paystack";
import { getOrgSubscription } from "@/lib/billing/service";
import { getOrgUsage } from "@/lib/billing/limits";
import { PLAN_LIMITS } from "@/lib/billing/limits-config";
import { getOrgAccess } from "@/lib/billing/trial";
import { BillingIntervalToggle } from "@/components/billing-interval-toggle";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ interval?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  await ensurePlanCatalog();
  const sp = await searchParams;
  const interval: BillingInterval = sp.interval === "annual" ? "annual" : "monthly";
  const plan = await getOrgPlan(session.orgId);
  const sub = await getOrgSubscription(session.orgId);
  const usage = await getOrgUsage(session.orgId);
  const access = await getOrgAccess(session.orgId);
  const enabled = billingEnabled();
  const provider = billingProvider();
  const currency = provider === "stripe" ? "EUR" : paystackCurrency();
  const rate = eurToUsdRate();

  return (
    <div>
      <Suspense fallback={null}>
        <BillingReturn />
      </Suspense>
      <PageHeader
        title="Plan & billing"
        subtitle={
          provider === "stripe"
            ? `${CHECKOUT_DISPLAY_NAME} · Native EUR checkout via Stripe · Card & SEPA Direct Debit · EU VAT / VIES supported`
            : `${CHECKOUT_DISPLAY_NAME} · EUR list prices · card only · charged in ${currency}`
        }
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
          {sub?.billingInterval ? ` · ${sub.billingInterval}` : ""}
        </p>
        {access?.trialActive ? (
          <p className="mt-2 text-sm text-sky-800">
            Trial active — {access.daysLeft} day{access.daysLeft === 1 ? "" : "s"} left
            {access.trialEndsAt ? ` (ends ${access.trialEndsAt.toISOString().slice(0, 10)})` : ""}.
          </p>
        ) : null}
        {access?.readOnly ? (
          <p className="mt-2 text-sm text-rose-800">Read-only mode — upgrade to edit systems, evidence and invites.</p>
        ) : null}
        {usage ? (
          <p className="mt-2 text-sm text-slate-600">
            Usage: {usage.systems}/{usage.limits.systems} systems · {usage.users}/{usage.limits.users} users ·{" "}
            {usage.frameworks}/{usage.limits.frameworks} frameworks ·{" "}
            {Math.round(usage.storageBytes / (1024 * 1024))}MB / {Math.round(usage.limits.storageBytes / (1024 * 1024))}MB
            storage
          </p>
        ) : null}
        <p className="mt-2 text-sm text-slate-600">
          Billing provider: <strong>{provider === "stripe" ? "Stripe (EUR — Cards & SEPA Direct Debit)" : `Paystack (${currency})`}</strong>
          {provider !== "stripe" && currency === "USD" ? ` · EUR→USD rate ${rate}` : ""} · Seller:{" "}
          <strong>{COMPANY.legalName}</strong> (VAT-UE: {COMPANY.vatEu})
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Displayed prices exclude VAT. Enter your EU VAT number at Stripe Checkout for automatic VIES validation and 0% intra-EU reverse-charge invoicing (Art. 196 VAT Directive), or standard 23% PL VAT for Polish entities.
        </p>
        {!enabled ? (
          <p className="mt-2 text-sm text-amber-800">
            Live checkout is behind <code className="text-xs">V77_BILLING_ENABLED</code>. Contact{" "}
            <a className="font-semibold text-sky-700 hover:underline" href={`mailto:${COMPANY.salesEmail}`}>
              {COMPANY.salesEmail}
            </a>
            .
          </p>
        ) : null}
        {sub?.billingStatus === "active" || sub?.billingStatus === "past_due" ? (
          <BillingCancelButton
            cancelAtPeriodEnd={!!sub.cancelAtPeriodEnd}
            periodEndLabel={sub.currentPeriodEnd ? sub.currentPeriodEnd.toISOString().slice(0, 10) : null}
            stripeCustomerId={sub.paystackCustomerCode || null}
          />
        ) : null}
      </div>

      <div className="mb-4">
        <BillingIntervalToggle interval={interval} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {BILLABLE_PLANS.map((p) => {
          const catalog = DEFAULT_PLANS.find((d) => d.tier === p.tier);
          const limits = PLAN_LIMITS[p.tier] || PLAN_LIMITS.pilot;
          return (
            <div key={p.tier} className={`card p-5 ${plan?.tier === p.tier ? "ring-1 ring-sky-300" : ""}`}>
              <h3 className="text-lg font-semibold text-[#0F2A4A]">{p.name}</h3>
              <p className="mt-1 text-sm font-medium text-slate-700">{displayPriceEur(p, "en-GB", interval)}</p>
              <p className="mt-2 text-xs text-slate-500">
                Up to {limits.systems} systems · {limits.users} users · {limits.frameworks} frameworks
              </p>
              <ul className="mt-3 space-y-1 text-sm text-slate-700">
                {(catalog?.features || p.features).map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              {p.tier === "team" ? (
                <BillingCheckoutButton
                  tier="team"
                  interval={interval}
                  enabled={enabled}
                  label={
                    provider === "stripe"
                      ? interval === "annual"
                        ? "Upgrade annual in EUR (Stripe)"
                        : "Upgrade monthly in EUR (Stripe)"
                      : interval === "annual"
                        ? "Upgrade annual (Paystack)"
                        : "Upgrade monthly (Paystack)"
                  }
                />
              ) : (
                <p className="mt-3 text-xs text-slate-500">Contact {COMPANY.salesEmail} — pricing on request.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
