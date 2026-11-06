import { and, desc, eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";
import { appendAuditLog } from "@/lib/audit/log";
import { BILLABLE_PLANS, listPriceEur, type BillingInterval, chargeAmountMinor } from "./currency";
import {
  initializeTransaction,
  verifyTransaction,
  listTransactions,
  isV77PaystackEvent,
  CHECKOUT_DISPLAY_NAME,
  resolveCheckoutSplit,
  paystackPlatformPercent,
} from "./paystack";
import {
  createStripeCheckoutSession,
  verifyStripeSession,
  listStripeCheckoutSessions,
  isV77StripeEvent,
  type StripeWebhookEventPayload,
} from "./stripe";
import { billingEnabled, billingProvider } from "./flags";
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
  const provider = billingProvider();

  if (provider === "stripe") {
    const connectDest = (org.paystackSubaccount || org.paystackSplitCode || "").trim();
    const stripeInit = await createStripeCheckoutSession({
      email: opts.email,
      priceEur,
      interval,
      planName: plan.name,
      reference,
      callbackUrl: opts.callbackUrl,
      customerId: org.paystackCustomerCode || null,
      connectDestination: connectDest.startsWith("acct_") ? connectDest : null,
      platformFeePercent: connectDest.startsWith("acct_") ? paystackPlatformPercent() : null,
      metadata: {
        app: "v77",
        source: "v77",
        org_id: opts.orgId,
        user_id: opts.userId,
        plan_tier: plan.tier,
        billing_interval: interval,
        invoice_id: invoiceId,
        product: CHECKOUT_DISPLAY_NAME,
      },
    });

    await db.insert(schema.billingInvoices).values({
      id: invoiceId,
      orgId: opts.orgId,
      planTier: plan.tier,
      amountEurCents: Math.round(priceEur * 100),
      chargeCurrency: "EUR",
      chargeAmountMinor: stripeInit.amountMinor,
      status: "pending",
      paystackReference: `${stripeInit.reference}:${stripeInit.sessionId}`,
      description: `${CHECKOUT_DISPLAY_NAME} — ${plan.name} (${interval})`,
    });

    await appendAuditLog({
      orgId: opts.orgId,
      actorUserId: opts.userId,
      action: "billing.checkout_started",
      entityType: "billing_invoice",
      entityId: invoiceId,
      detail: {
        provider: "stripe",
        tier: plan.tier,
        interval,
        reference: stripeInit.reference,
        sessionId: stripeInit.sessionId,
        currency: "EUR",
      },
    });

    return {
      authorizationUrl: stripeInit.authorizationUrl,
      accessCode: stripeInit.sessionId,
      sessionId: stripeInit.sessionId,
      reference: stripeInit.reference,
      currency: "EUR" as const,
      amountMinor: stripeInit.amountMinor,
      eurAmount: stripeInit.eurAmount,
      invoiceId,
      planTier: plan.tier,
      interval,
      provider: "stripe" as const,
    };
  }

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
    detail: { provider: "paystack", tier: plan.tier, interval, reference: init.reference, currency: init.currency },
  });

  return { ...init, invoiceId, planTier: plan.tier, interval, provider: "paystack" as const };
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
  const cleanRef = invoice.paystackReference.split(":")[0] || invoice.paystackReference;
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
            reference: cleanRef,
            locale: u.locale,
          })
        : paymentFailedEmail({
            name: u.name,
            planTier: invoice.planTier,
            reference: cleanRef,
            locale: u.locale,
          });
    await sendEmail({ to: u.email, subject: tpl.subject, html: tpl.html, text: tpl.text, tags: tpl.tags });
  }
}

/** Server-side verify + activate — used by callback, webhook, and reconciliation (supports Stripe & Paystack). */
export async function confirmPaidReference(
  referenceInput: string,
  opts: { source: "callback" | "webhook" | "reconcile"; event?: string; sessionId?: string } = { source: "callback" },
) {
  await ensureDb();
  const baseRef = referenceInput.split(":")[0] || referenceInput;
  const allInvoices = await db.select().from(schema.billingInvoices);
  const invoice = allInvoices.find(
    (inv) =>
      inv.paystackReference === referenceInput ||
      inv.paystackReference.split(":")[0] === baseRef ||
      (opts.sessionId && inv.paystackReference.endsWith(`:${opts.sessionId}`)),
  );
  if (!invoice) return { ok: false as const, reason: "invoice_not_found" as const };

  if (invoice.status === "paid") {
    return { ok: true as const, orgId: invoice.orgId, tier: invoice.planTier, alreadyPaid: true as const };
  }

  const storedParts = invoice.paystackReference.split(":");
  const storedSessionId = opts.sessionId || (storedParts[1]?.startsWith("cs_") ? storedParts[1] : "");

  if (storedSessionId || billingProvider() === "stripe") {
    if (!storedSessionId) {
      return { ok: false as const, reason: "verify_failed" as const, stripeStatus: "missing_session_id" };
    }
    const verified = await verifyStripeSession(storedSessionId);
    if (!verified.ok) {
      if (
        opts.event === "checkout.session.async_payment_failed" ||
        opts.event === "checkout.session.expired" ||
        opts.event === "invoice.payment_failed" ||
        verified.status === "expired"
      ) {
        await db
          .update(schema.billingInvoices)
          .set({ status: "failed", updatedAt: new Date() })
          .where(and(eq(schema.billingInvoices.id, invoice.id), eq(schema.billingInvoices.status, "pending")));
        await notifyBillingEmail(invoice.orgId, "failed", invoice).catch((e) =>
          console.error("[billing:email:failed]", e instanceof Error ? e.message : e),
        );
        return { ok: true as const, orgId: invoice.orgId, tier: invoice.planTier, failed: true as const };
      }
      return { ok: false as const, reason: "verify_failed" as const, stripeStatus: verified.paymentStatus || verified.status };
    }

    const meta = (verified.metadata || {}) as { app?: string; source?: string; billing_interval?: string };
    const metaApp = String(meta.app || meta.source || "");
    if (metaApp && metaApp !== "v77" && !baseRef.startsWith("v77_")) {
      return { ok: false as const, reason: "not_v77" as const };
    }

    const interval: BillingInterval = meta.billing_interval === "annual" ? "annual" : "monthly";
    const plan = BILLABLE_PLANS.find((p) => p.tier === invoice.planTier);
    const now = new Date();
    await db
      .update(schema.billingInvoices)
      .set({
        status: "paid",
        chargeCurrency: verified.currency || "EUR",
        chargeAmountMinor: verified.amountMinor || invoice.chargeAmountMinor,
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
        ...(verified.customerId ? { paystackCustomerCode: verified.customerId } : {}),
      })
      .where(eq(schema.organisations.id, invoice.orgId));

    await appendAuditLog({
      orgId: invoice.orgId,
      actorUserId: null,
      action: "billing.plan_activated",
      entityType: "billing_invoice",
      entityId: invoice.id,
      detail: {
        provider: "stripe",
        tier: invoice.planTier,
        interval,
        reference: baseRef,
        sessionId: storedSessionId,
        customerId: verified.customerId || undefined,
        customerVatId: verified.customerVatId || undefined,
        via: opts.source,
      },
    });

    await notifyBillingEmail(invoice.orgId, "receipt", invoice).catch((e) =>
      console.error("[billing:email:receipt]", e instanceof Error ? e.message : e),
    );

    return { ok: true as const, orgId: invoice.orgId, tier: invoice.planTier };
  }

  const verified = await verifyTransaction(baseRef);
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
  if (metaApp && metaApp !== "v77" && !baseRef.startsWith("v77_")) {
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
    detail: { provider: "paystack", tier: invoice.planTier, interval, reference: baseRef, via: opts.source },
  });

  await notifyBillingEmail(invoice.orgId, "receipt", invoice).catch((e) =>
    console.error("[billing:email:receipt]", e instanceof Error ? e.message : e),
  );

  return { ok: true as const, orgId: invoice.orgId, tier: invoice.planTier };
}

export async function activatePlanFromStripeWebhook(payload: StripeWebhookEventPayload) {
  if (!isV77StripeEvent(payload)) {
    return { ok: true as const, ignored: true as const, reason: "not_v77" as const };
  }
  const event = payload.type || "";
  const obj = payload.data?.object;
  const sessionId = obj?.object === "checkout.session" ? obj.id || "" : "";
  const reference = obj?.client_reference_id || String(obj?.metadata?.reference || "");
  if (!reference && !sessionId) {
    return { ok: true as const, ignored: true as const, reason: "missing_reference" as const };
  }
  if (
    event === "checkout.session.completed" ||
    event === "checkout.session.async_payment_succeeded" ||
    event === "checkout.session.async_payment_failed" ||
    event === "checkout.session.expired"
  ) {
    return confirmPaidReference(reference || sessionId, { source: "webhook", event, sessionId: sessionId || undefined });
  }
  return { ok: true as const, ignored: true as const };
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
    if (billingProvider() === "stripe") {
      const sessions = await listStripeCheckoutSessions({ limit: 50 });
      for (const s of sessions) {
        if (s.paymentStatus !== "paid" && s.status !== "complete") continue;
        const meta = s.metadata || {};
        const app = String((meta as { app?: string }).app || (meta as { source?: string }).source || "");
        if (!(app === "v77" || s.reference.startsWith("v77_"))) continue;
        const r = await confirmPaidReference(s.reference || s.sessionId, {
          source: "reconcile",
          sessionId: s.sessionId,
        });
        if (!results.some((x) => x.reference.startsWith(s.reference))) {
          results.push({
            reference: s.reference || s.sessionId,
            result: r.ok ? "activated_or_paid" : r.reason,
          });
        }
      }
    } else {
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
    }
  } catch (e) {
    console.error("[billing:reconcile:list]", e instanceof Error ? e.message : e);
  }

  const period = await applyPeriodEndCancellations();
  return { ok: true as const, checked: results.length, results, period };
}
