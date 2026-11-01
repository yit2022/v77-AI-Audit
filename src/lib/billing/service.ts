import { and, desc, eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";
import { appendAuditLog } from "@/lib/audit/log";
import { BILLABLE_PLANS } from "./currency";
import {
  initializeTransaction,
  verifyTransaction,
  listTransactions,
  isV77PaystackEvent,
  CHECKOUT_DISPLAY_NAME,
  resolveCheckoutSplit,
} from "./paystack";
import { chargeAmountMinor } from "./currency";
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
  const priced = chargeAmountMinor(plan.priceEurMonthly);
  const split = resolveCheckoutSplit({
    orgSplitCode: org.paystackSplitCode,
    orgSubaccount: org.paystackSubaccount,
    amountMinor: priced.amountMinor,
  });
  const init = await initializeTransaction({
    email: opts.email,
    priceEurMonthly: plan.priceEurMonthly,
    reference,
    callbackUrl: opts.callbackUrl,
    metadata: {
      app: "v77",
      source: "v77",
      org_id: opts.orgId,
      user_id: opts.userId,
      plan_tier: plan.tier,
      invoice_id: invoiceId,
      product: CHECKOUT_DISPLAY_NAME,
      split_code: split.splitCode || undefined,
      subaccount: split.subaccount || undefined,
      platform_percent: split.subaccount ? split.platformPercent : undefined,
    },
    subaccount: split.subaccount,
    splitCode: split.splitCode,
    transactionCharge: split.transactionCharge,
    bearer: split.bearer,
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

/** Server-side verify + activate — used by callback, webhook, and reconciliation. */
export async function confirmPaidReference(
  reference: string,
  opts: { source: "callback" | "webhook" | "reconcile"; event?: string } = { source: "callback" },
) {
  await ensureDb();
  const invoices = await db
    .select()
    .from(schema.billingInvoices)
    .where(eq(schema.billingInvoices.paystackReference, reference))
    .limit(1);
  const invoice = invoices[0];
  if (!invoice) return { ok: false as const, reason: "invoice_not_found" as const };

  if (invoice.status === "paid") {
    return { ok: true as const, orgId: invoice.orgId, tier: invoice.planTier, alreadyPaid: true as const };
  }

  const verified = await verifyTransaction(reference);
  if (!verified.ok) {
    if (opts.event === "charge.failed" || verified.status === "failed" || verified.status === "abandoned") {
      await db
        .update(schema.billingInvoices)
        .set({ status: "failed", updatedAt: new Date() })
        .where(and(eq(schema.billingInvoices.id, invoice.id), eq(schema.billingInvoices.status, "pending")));
      return { ok: true as const, orgId: invoice.orgId, tier: invoice.planTier, failed: true as const };
    }
    return { ok: false as const, reason: "verify_failed" as const, paystackStatus: verified.status };
  }

  // Prefer V77-tagged metadata when present
  const metaApp = String((verified.metadata as { app?: string; source?: string })?.app || (verified.metadata as { source?: string })?.source || "");
  if (metaApp && metaApp !== "v77" && !reference.startsWith("v77_")) {
    return { ok: false as const, reason: "not_v77" as const };
  }

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
    detail: { tier: invoice.planTier, reference, via: opts.source },
  });
  return { ok: true as const, orgId: invoice.orgId, tier: invoice.planTier };
}

export async function activatePlanFromWebhook(opts: {
  reference: string;
  event: string;
  rawPayload: unknown;
}) {
  const payload = opts.rawPayload as {
    data?: { reference?: string; metadata?: Record<string, unknown> | null };
  };
  if (!isV77PaystackEvent({ data: { reference: opts.reference, metadata: payload.data?.metadata } })) {
    return { ok: true as const, ignored: true as const, reason: "not_v77" as const };
  }
  if (opts.event === "charge.failed") {
    return confirmPaidReference(opts.reference, { source: "webhook", event: opts.event });
  }
  if (opts.event === "charge.success" || opts.event === "transaction.success") {
    return confirmPaidReference(opts.reference, { source: "webhook", event: opts.event });
  }
  return { ok: true as const, ignored: true as const };
}

/** Poll Paystack for V77-tagged successes and activate any matching pending invoices. */
export async function reconcileV77Payments() {
  await ensureDb();
  const pending = await db
    .select()
    .from(schema.billingInvoices)
    .where(eq(schema.billingInvoices.status, "pending"));

  const results: Array<{ reference: string; result: string }> = [];

  for (const inv of pending) {
    if (!inv.paystackReference) continue;
    const r = await confirmPaidReference(inv.paystackReference, { source: "reconcile" });
    results.push({
      reference: inv.paystackReference,
      result: r.ok ? ("alreadyPaid" in r && r.alreadyPaid ? "already_paid" : "failed" in r && r.failed ? "failed" : "activated") : r.reason,
    });
  }

  // Also scan recent successful transactions tagged for V77 (in case invoice row exists)
  try {
    const txs = await listTransactions({ perPage: 50, status: "success" });
    for (const tx of txs) {
      const meta = tx.metadata || {};
      const app = String((meta as { app?: string }).app || (meta as { source?: string }).source || "");
      if (!(app === "v77" || tx.reference.startsWith("v77_"))) continue;
      const r = await confirmPaidReference(tx.reference, { source: "reconcile" });
      if (!results.some((x) => x.reference === tx.reference)) {
        results.push({
          reference: tx.reference,
          result: r.ok ? "activated_or_paid" : r.reason,
        });
      }
    }
  } catch (e) {
    console.error("[billing:reconcile:list]", e instanceof Error ? e.message : e);
  }

  return { ok: true as const, checked: results.length, results };
}
