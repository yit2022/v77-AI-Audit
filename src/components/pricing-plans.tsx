"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BILLABLE_PLANS,
  DISPLAY_CURRENCIES,
  displayPriceForCurrency,
  type BillingInterval,
  type DisplayCurrency,
} from "@/lib/billing/currency";
import { COMPANY } from "@/lib/company";
import { PLAN_LIMITS } from "@/lib/billing/limits-config";

export function PricingPlans({
  showCheckoutHint = true,
}: {
  showCheckoutHint?: boolean;
}) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [currency, setCurrency] = useState<DisplayCurrency>("EUR");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-sm">
            <button
              type="button"
              className={`rounded-full px-4 py-1.5 ${interval === "monthly" ? "bg-[#0F2A4A] text-white" : "text-slate-600"}`}
              onClick={() => setInterval("monthly")}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-1.5 ${interval === "annual" ? "bg-[#0F2A4A] text-white" : "text-slate-600"}`}
              onClick={() => setInterval("annual")}
            >
              Annual <span className="ml-1 text-xs opacity-80">2 months free</span>
            </button>
          </div>
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-xs">
            {DISPLAY_CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                className={`rounded-full px-2.5 py-1 font-medium ${
                  currency === c.code ? "bg-sky-700 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
                onClick={() => setCurrency(c.code)}
                title={c.regionHint}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Global pricing (ex VAT / GST / sales tax) · Multi-currency cards, SEPA Direct Debit &amp; PO invoicing
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {BILLABLE_PLANS.map((p) => {
          const limits = PLAN_LIMITS[p.tier] || PLAN_LIMITS.pilot;
          return (
            <div key={p.tier} className="card flex flex-col p-5">
              <h3 className="text-lg font-semibold text-[#0F2A4A]">{p.name}</h3>
              <p className="mt-1 text-sm font-medium text-slate-800">{displayPriceForCurrency(p, currency, interval)}</p>
              <p className="mt-2 text-xs text-slate-500">
                Up to {limits.systems} systems · {limits.users} users · {limits.frameworks} frameworks
              </p>
              <ul className="mt-3 flex-1 space-y-1 text-sm text-slate-700">
                {p.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              {p.tier === "team" ? (
                <Link href="/signup" className="btn btn-primary mt-4 text-sm">
                  Start 14-day trial
                </Link>
              ) : p.tier === "pilot" ? (
                <Link href="/signup" className="btn btn-secondary mt-4 text-sm">
                  Try Pilot free
                </Link>
              ) : (
                <a className="btn btn-secondary mt-4 text-sm" href={`mailto:${COMPANY.salesEmail}`}>
                  Contact sales
                </a>
              )}
            </div>
          );
        })}
      </div>

      {showCheckoutHint ? (
        <p className="mt-4 text-xs text-slate-500">
          After signup, upgrade from Billing with Stripe EUR checkout (3DS2 Cards &amp; SEPA Direct Debit). Invoiced by{" "}
          {COMPANY.legalName} ({COMPANY.addressLine}, VAT-UE: {COMPANY.vatEu}).
        </p>
      ) : null}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-semibold text-[#0F2A4A]">FAQ</h3>
          <dl className="mt-3 space-y-3 text-sm text-slate-700">
            <div>
              <dt className="font-medium">Is there a trial?</dt>
              <dd className="text-slate-600">Yes — 14 days on signup. When it ends the workspace becomes read-only until you upgrade.</dd>
            </div>
            <div>
              <dt className="font-medium">How are payments processed?</dt>
              <dd className="text-slate-600">
                Self-serve Team plans are billed natively in EUR via Stripe, supporting European corporate cards (PSD2 SCA / 3DS2) and SEPA Direct Debit.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Can I pay annually?</dt>
              <dd className="text-slate-600">
                Yes — annual plans are 10× the monthly EUR list (two months free): €4,990 / year for Team and €18,900 / year (~$20,400) for Enterprise.
              </dd>
            </div>
            <div>
              <dt className="font-medium">EU VAT &amp; VIES Reverse Charge</dt>
              <dd className="text-slate-600">
                Displayed prices exclude VAT. Enter your EU VAT ID at checkout for automatic VIES validation and 0% intra-Community reverse charge (Art. 196 VAT Directive). Polish entities are billed with standard 23% PL VAT.
              </dd>
            </div>
          </dl>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-[#0F2A4A]">Notes</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>• Native EUR billing via Stripe (Corporate Cards &amp; SEPA Direct Debit).</li>
            <li>• Enterprise, custom MSA, and procurement PO / SEPA wire: email {COMPANY.salesEmail}.</li>
            <li>• Cancel anytime at period end from the billing portal.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
