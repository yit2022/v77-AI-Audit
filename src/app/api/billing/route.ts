import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ensurePlanCatalog, getOrgPlan, DEFAULT_PLANS } from "@/lib/billing/plans";
import { BILLABLE_PLANS, displayPriceEur, paystackCurrency, eurToUsdRate } from "@/lib/billing/currency";
import { billingEnabled, billingProvider } from "@/lib/billing/flags";
import { getOrgSubscription, listInvoices } from "@/lib/billing/service";
import { CHECKOUT_DISPLAY_NAME, PAYSTACK_CHANNELS } from "@/lib/billing/paystack";
import { STRIPE_PAYMENT_METHODS } from "@/lib/billing/stripe";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensurePlanCatalog();
  const plan = await getOrgPlan(session.orgId);
  const sub = await getOrgSubscription(session.orgId);
  const invoices = await listInvoices(session.orgId);
  const provider = billingProvider();
  const currency = provider === "stripe" ? "EUR" : paystackCurrency();
  return NextResponse.json({
    provider,
    plan,
    subscription: sub,
    catalog: DEFAULT_PLANS,
    billable: BILLABLE_PLANS.map((p) => ({
      ...p,
      displayPrice: displayPriceEur(p),
    })),
    billingEnabled: billingEnabled(),
    checkoutDisplayName: CHECKOUT_DISPLAY_NAME,
    channels: provider === "stripe" ? STRIPE_PAYMENT_METHODS : PAYSTACK_CHANNELS,
    chargeCurrency: currency,
    eurToUsdRate: currency === "USD" ? eurToUsdRate() : null,
    invoices: invoices.slice(0, 20).map((i) => ({
      id: i.id,
      planTier: i.planTier,
      status: i.status,
      amountEurCents: i.amountEurCents,
      chargeCurrency: i.chargeCurrency,
      chargeAmountMinor: i.chargeAmountMinor,
      description: i.description,
      paidAt: i.paidAt,
      createdAt: i.createdAt,
    })),
    note: billingEnabled()
      ? provider === "stripe"
        ? "Native EUR checkout via Stripe (Cards & SEPA Direct Debit, EU VAT / VIES reverse charge supported)."
        : "Card checkout via Paystack (EUR prices shown). Mobile money channels are disabled."
      : "Billing is staged behind V77_BILLING_ENABLED. Contact sales@v77trust.com for quotes.",
  });
}
