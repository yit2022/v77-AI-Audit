import { and, desc, eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";
import { appendAuditLog } from "@/lib/audit/log";
import { BILLABLE_PLANS, listPriceEur, type BillingInterval } from "./currency";
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
import { sendEmail } from "@/lib/email/send";
import { paymentFailedEmail, paymentReceiptEmail } from "@/lib/email/templates";

export async function listInvoices(orgId: string) {
  await ensureDb();
  return db
    .select()
    .from(schema.billingInvoices)
    .where(eq(schema.billingInvoices.orgId, orgId))
    .orderBy(desc(schema.billingInvoices.createdAt));
}

export async function getInvoice(orgId: string, invoiceId: string) {
  await ensureDb();
  const rows = await db
    .select()
    .from(schema.billingInvoices)
    .where(and(eq(schema.billingInvoices.id, invoiceId), eq(schema.billingInvoices.orgId, orgId)))
    .limit(1);
  return rows[0] ?? null;
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
    billingInterval: (org.billingInterval || "monthly") as BillingInterval,
    cancelAtPeriodEnd: !!org.cancelAtPeriodEnd,
    currentPeriodEnd: org.currentPeriodEnd ?? null,
    trialEndsAt: org.trialEndsAt ?? null,
  };
}

function periodEndFrom(interval: BillingInterval, from = new Date()): Date {
  const d = new Date(from);
  if (interval === "annual") {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
}

export async function startCheckout(opts: {
  orgId: string;
  userId: string;
  email: string;
  tier: string;
  interval?: BillingInterval;
  callbackUrl: string;
  req?: Request;
}) {
  if (!billingEnabled()) throw new Error("Billing is not enabled yet");
  const interval: BillingInterval = opts.interval === "annual" ? "annual" : "monthly";
  const plan = BILLABLE_PLANS.find((p) => p.tier === opts.tier);
  const priceEur = plan ? listPriceEur(plan, interval) : null;
  if (!plan || priceEur == null) {
    throw new Error("This plan requires a sales quote — contact sales@v77trust.com");
  }
  await ensureDb();
  const org = (await db.select().from(schema.organisations).where(eq(schema.organisations.id, opts.orgId)).limit(1))[0];
  if (!org) throw new Error("Organisation not found");

  // Direct sales: 100% to main account — only apply org-level split/subaccount overrides (no defaults).
  const reference = `v77_${opts.orgId.slice(0, 8)}_${id().slice(0, 12)}`;
  const invoiceId = id();
  const priced = chargeAmountMinor(priceEur);
  const split = resolveCheckoutSplit({
    orgSplitCode: org.paystackSplitCode,
    orgSubaccount: org.paystackSubaccount,
    amountMinor: priced.amountMinor,
  });
  const init = await initializeTransaction({
    email: opts.email,
    priceEurMonthly: priceEur,
    reference,
    callbackUrl: opts.callbackUrl,
    metadata: {
      app: "v77",
      source: "v77",
      org_id: opts.orgId,
      user_id: opts.userId,
      plan_tier: plan.tier,
      billing_interval: interval,
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
    amountEurCents: Math.round(priceEur * 100),
    chargeCurrency: init.currency,
    chargeAmountMinor: init.amountMinor,
    status: "pending",
    paystackReference: init.reference,
    description: `${CHECKOUT_DISPLAY_NAME} — ${plan.name} (${interval})`,
  });

  await appendAuditLog({
    orgId: opts.orgId,
    actorUserId: opts.userId,
    action: "billing.checkout_started",
    entityType: "billing_invoice",
    entityId: invoiceId,
    detail: { tier: plan.tier, interval, reference: init.reference, currency: init.currency },
  });

  return { ...init, invoiceId, planTier: plan.tier, interval };
}

async function notifyBillingEmail(orgId: string, kind: "receipt" | "failed", invoice: {
  id: string;
  planTier: string;
  amountEurCents: number;
  chargeCurrency: string;
  chargeAmountMinor: number;
  description: string;
  paystackReference: string;
}) {
  await ensureDb();
  const members = await db
    .select({
      email: schema.users.email,
      name: schema.users.name,
      locale: schema.users.locale,
      role: schema.memberships.role,
    })
    .from(schema.memberships)
    .innerJoin(schema.users, eq(schema.users.id, schema.memberships.userId))
    .where(eq(schema.memberships.orgId, orgId));
  const admins = members.filter((m) => m.role === "admin");
  const targets = admins.length ? admins : members.slice(0, 1);
  for (const u of targets) {
    const tpl =
      kind === "receipt"
        ? paymentReceiptEmail({
            name: u.name,
            planTier: invoice.planTier,
            description: invoice.description,
            amountEur: invoice.amountEurCents / 100,
            chargeLabel: `${(invoice.chargeAmountMinor / 100).toFixed(2)} ${invoice.chargeCurrency}`,
            reference: invoice.paystackReference,
            locale: u.locale,
          })
        : paymentFailedEmail({
            name: u.name,
            planTier: invoice.planTier,
            reference: invoice.paystackReference,
            locale: u.locale,
          });
    await sendEmail({ to: u.email, subject: tpl.subject, html: tpl.html, text: tpl.text, tags: tpl.tags });
  }
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
      await notifyBillingEmail(invoice.orgId, "failed", invoice).catch((e) =>
        console.error("[billing:email:failed]", e instanceof Error ? e.message : e),
      );
      return { ok: true as const, orgId: invoice.orgId, tier: invoice.planTier, failed: true as const };
    }
    return { ok: false as const, reason: "verify_failed" as const, paystackStatus: verified.status };
  }

  const meta = (verified.metadata || {}) as { app?: string; source?: string; billing_interval?: string };
  const metaApp = String(meta.app || meta.source || "");
  if (metaApp && metaApp !== "v77" && !reference.startsWith("v77_")) {
    return { ok: false as const, reason: "not_v77" as const };
  }

  const interval: BillingInterval = meta.billing_interval === "annual" ? "annual" : "monthly";
  const plan = BILLABLE_PLANS.find((p) => p.tier === invoice.planTier);
  const now = new Date();
  await db
    .update(schema.billingInvoices)
    .set({
      status: "paid",
      paidAt: now,
      updatedAt: now,
    })
    .where(eq(schema.billingInvoices.id, invoice.id));

  await db
    .update(schema.organisations)
    .set({
      planTier: invoice.planTier,
      seatLimit: plan?.seatLimit ?? 25,
      billingStatus: "active",
      billingInterval: interval,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: periodEndFrom(interval, now),
      trialEndsAt: null,
    })
    .where(eq(schema.organisations.id, invoice.orgId));

  await appendAuditLog({
    orgId: invoice.orgId,
    actorUserId: null,
    action: "billing.plan_activated",
    entityType: "billing_invoice",
    entityId: invoice.id,
    detail: { tier: invoice.planTier, interval, reference, via: opts.source },
  });

  await notifyBillingEmail(invoice.orgId, "receipt", invoice).catch((e) =>
    console.error("[billing:email:receipt]", e instanceof Error ? e.message : e),
  );

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

export async function cancelAtPeriodEnd(opts: { orgId: string; userId: string; cancel: boolean }) {
  await ensureDb();
  const org = (await db.select().from(schema.organisations).where(eq(schema.organisations.id, opts.orgId)).limit(1))[0];
  if (!org) throw new Error("Organisation not found");
  if (org.billingStatus !== "active" && org.billingStatus !== "past_due") {
    throw new Error("No active subscription to cancel");
  }
  let periodEnd = org.currentPeriodEnd;
  if (opts.cancel && !periodEnd) {
    periodEnd = periodEndFrom((org.billingInterval as BillingInterval) || "monthly");
  }
  await db
    .update(schema.organisations)
    .set({
      cancelAtPeriodEnd: opts.cancel,
      currentPeriodEnd: periodEnd,
    })
    .where(eq(schema.organisations.id, opts.orgId));
  await appendAuditLog({
    orgId: opts.orgId,
    actorUserId: opts.userId,
    action: opts.cancel ? "billing.cancel_at_period_end" : "billing.resume_subscription",
    entityType: "organisation",
    entityId: opts.orgId,
    detail: { currentPeriodEnd: periodEnd?.toISOString() },
  });
  return { cancelAtPeriodEnd: opts.cancel, currentPeriodEnd: periodEnd };
}

/** Apply period-end cancellations (cron). */
export async function applyPeriodEndCancellations(now = new Date()) {
  await ensureDb();
  const orgs = await db.select().from(schema.organisations);
  let canceled = 0;
  for (const org of orgs) {
    if (!org.cancelAtPeriodEnd || !org.currentPeriodEnd) continue;
    if (org.currentPeriodEnd.getTime() > now.getTime()) continue;
    if (org.billingStatus === "canceled") continue;
    await db
      .update(schema.organisations)
      .set({ billingStatus: "canceled", cancelAtPeriodEnd: false })
      .where(eq(schema.organisations.id, org.id));
    canceled += 1;
  }
  return { canceled };
}

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
      result: r.ok
        ? "alreadyPaid" in r && r.alreadyPaid
          ? "already_paid"
          : "failed" in r && r.failed
            ? "failed"
            : "activated"
        : r.reason,
    });
  }

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

  const period = await applyPeriodEndCancellations();
  return { ok: true as const, checked: results.length, results, period };
}
