import { and, desc, eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";
import { appendAuditLog } from "@/lib/audit/log";
import { BILLABLE_PLANS } from "./currency";
import { initializeTransaction, verifyTransaction, CHECKOUT_DISPLAY_NAME } from "./paystack";
import { billingEnabled } from "./flags";

export async function listInvoices(orgId: string) {
  await ensureDb();
  return db
    .select()
    .from(schema.billingInvoices)
    .where(eq(schema.billingInvoices.orgId, orgId))
    .orderBy(desc(schema.billingInvoices.createdAt));
}

export async function getOrgSubscription(orgId: string) {
  await ensureDb();
  const rows = await db.select().from(schema.organisations).where(eq(schema.organisations.id, orgId)).limit(1);
  const org = rows[0];
  if (!org) return null;
  return {
    planTier: org.planTier || "pilot",
    seatLimit: org.seatLimit ?? 5,
    billingStatus: org.billingStatus || "none",
    paystackCustomerCode: org.paystackCustomerCode || "",
  };
}

export async function startCheckout(opts: {
  orgId: string;
  userId: string;
  email: string;
  tier: string;
  callbackUrl: string;
  req?: Request;
}) {
  if (!billingEnabled()) throw new Error("Billing is not enabled yet");
  const plan = BILLABLE_PLANS.find((p) => p.tier === opts.tier);
  if (!plan || plan.priceEurMonthly == null) {
    throw new Error("This plan requires a sales quote — contact sales@vertex77.com");
  }
  await ensureDb();
  const org = (await db.select().from(schema.organisations).where(eq(schema.organisations.id, opts.orgId)).limit(1))[0];
  if (!org) throw new Error("Organisation not found");

  const reference = `v77_${opts.orgId.slice(0, 8)}_${id().slice(0, 12)}`;
  const invoiceId = id();
  const init = await initializeTransaction({
    email: opts.email,
    priceEurMonthly: plan.priceEurMonthly,
    reference,
    callbackUrl: opts.callbackUrl,
    metadata: {
      org_id: opts.orgId,
      user_id: opts.userId,
      plan_tier: plan.tier,
      invoice_id: invoiceId,
      product: CHECKOUT_DISPLAY_NAME,
    },
    subaccount: org.paystackSubaccount || null,
    splitCode: org.paystackSplitCode || null,
  });

  await db.insert(schema.billingInvoices).values({
    id: invoiceId,
    orgId: opts.orgId,
    planTier: plan.tier,
    amountEurCents: Math.round(plan.priceEurMonthly * 100),
    chargeCurrency: init.currency,
    chargeAmountMinor: init.amountMinor,
    status: "pending",
    paystackReference: init.reference,
    description: `${CHECKOUT_DISPLAY_NAME} — ${plan.name} (monthly)`,
  });

  await appendAuditLog({
    orgId: opts.orgId,
    actorUserId: opts.userId,
    action: "billing.checkout_started",
    entityType: "billing_invoice",
    entityId: invoiceId,
    detail: { tier: plan.tier, reference: init.reference, currency: init.currency },
  });

  return { ...init, invoiceId, planTier: plan.tier };
}

export async function activatePlanFromWebhook(opts: {
  reference: string;
  event: string;
  rawPayload: unknown;
}) {
  await ensureDb();
  const invoices = await db
    .select()
    .from(schema.billingInvoices)
    .where(eq(schema.billingInvoices.paystackReference, opts.reference))
    .limit(1);
  const invoice = invoices[0];
  if (!invoice) return { ok: false, reason: "invoice_not_found" as const };

  if (opts.event === "charge.success" || opts.event === "transaction.success") {
    const verified = await verifyTransaction(opts.reference);
    if (!verified.ok) return { ok: false, reason: "verify_failed" as const };

    const plan = BILLABLE_PLANS.find((p) => p.tier === invoice.planTier);
    await db
      .update(schema.billingInvoices)
      .set({
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.billingInvoices.id, invoice.id));

    await db
      .update(schema.organisations)
      .set({
        planTier: invoice.planTier,
        seatLimit: plan?.seatLimit ?? 25,
        billingStatus: "active",
      })
      .where(eq(schema.organisations.id, invoice.orgId));

    await appendAuditLog({
      orgId: invoice.orgId,
      actorUserId: null,
      action: "billing.plan_activated",
      entityType: "billing_invoice",
      entityId: invoice.id,
      detail: { tier: invoice.planTier, reference: opts.reference },
    });
    return { ok: true as const, orgId: invoice.orgId, tier: invoice.planTier };
  }

  if (opts.event === "charge.failed") {
    await db
      .update(schema.billingInvoices)
      .set({ status: "failed", updatedAt: new Date() })
      .where(and(eq(schema.billingInvoices.id, invoice.id), eq(schema.billingInvoices.status, "pending")));
    return { ok: true as const, orgId: invoice.orgId, tier: invoice.planTier };
  }

  return { ok: true as const, ignored: true as const };
}
