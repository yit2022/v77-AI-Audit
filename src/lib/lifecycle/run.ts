import { and, eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";
import { sendEmail } from "@/lib/email/send";
import { day3TipsEmail, trialEndingEmail } from "@/lib/email/templates";
import { ensureUnsubscribeToken, unsubscribeUrl } from "@/lib/email/unsubscribe";
import { TRIAL_DAYS } from "@/lib/billing/trial";

export type LifecycleKind = "day3_tips" | "trial_ending_11" | "trial_ending_13";

async function alreadySent(orgId: string, kind: string) {
  const rows = await db
    .select()
    .from(schema.lifecycleEmailLog)
    .where(and(eq(schema.lifecycleEmailLog.orgId, orgId), eq(schema.lifecycleEmailLog.kind, kind)))
    .limit(1);
  return rows.length > 0;
}

async function markSent(orgId: string, userId: string | null, kind: string) {
  await db.insert(schema.lifecycleEmailLog).values({
    id: id(),
    orgId,
    userId,
    kind,
    sentAt: new Date(),
  });
}

async function adminForOrg(orgId: string) {
  const rows = await db
    .select({
      userId: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      locale: schema.users.locale,
      marketingOptOut: schema.users.marketingOptOut,
      role: schema.memberships.role,
    })
    .from(schema.memberships)
    .innerJoin(schema.users, eq(schema.users.id, schema.memberships.userId))
    .where(eq(schema.memberships.orgId, orgId));
  const admins = rows.filter((r) => r.role === "admin");
  return (admins[0] || rows[0]) ?? null;
}

function daysSince(from: Date, now: Date) {
  return Math.floor((now.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

function daysUntil(to: Date, now: Date) {
  return Math.ceil((to.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

/** Send day-3 tips and trial-ending notices. Non-transactional → honour marketing opt-out + unsub link. */
export async function runLifecycleEmails(now = new Date()) {
  await ensureDb();
  const orgs = await db.select().from(schema.organisations);
  const summary = { scanned: orgs.length, sent: [] as string[], skipped: [] as string[] };

  for (const org of orgs) {
    const paid = org.billingStatus === "active" || org.billingStatus === "past_due";
    if (paid) {
      summary.skipped.push(`${org.id}:paid`);
      continue;
    }
    if (!org.trialEndsAt) {
      summary.skipped.push(`${org.id}:no_trial`);
      continue;
    }

    const admin = await adminForOrg(org.id);
    if (!admin || admin.marketingOptOut) {
      summary.skipped.push(`${org.id}:optout_or_no_admin`);
      continue;
    }

    const created = org.createdAt || now;
    const ageDays = daysSince(created, now);
    const left = daysUntil(org.trialEndsAt, now);
    const token = await ensureUnsubscribeToken(admin.email);
    const unsub = unsubscribeUrl(admin.email, token);

    // Day 3 tips (after ~3 days on platform, still in trial)
    if (ageDays >= 3 && left > 0 && !(await alreadySent(org.id, "day3_tips"))) {
      const tpl = day3TipsEmail({ name: admin.name, orgName: org.name, locale: admin.locale, unsubscribeUrl: unsub });
      const r = await sendEmail({
        to: admin.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        tags: [...tpl.tags, "marketing"],
      });
      if (r.ok) {
        await markSent(org.id, admin.userId, "day3_tips");
        summary.sent.push(`${org.id}:day3_tips`);
      }
    }

    // Trial ending day 11 (~3 days left on 14-day trial) and day 13 (~1 day left)
    for (const [kind, minLeft, maxLeft] of [
      ["trial_ending_11", 3, 4],
      ["trial_ending_13", 1, 2],
    ] as const) {
      if (left >= minLeft && left <= maxLeft && !(await alreadySent(org.id, kind))) {
        const tpl = trialEndingEmail({
          name: admin.name,
          orgName: org.name,
          daysLeft: left,
          trialDays: TRIAL_DAYS,
          locale: admin.locale,
          unsubscribeUrl: unsub,
        });
        const r = await sendEmail({
          to: admin.email,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
          tags: [...tpl.tags, "marketing"],
        });
        if (r.ok) {
          await markSent(org.id, admin.userId, kind);
          summary.sent.push(`${org.id}:${kind}`);
        }
      }
    }
  }

  return summary;
}
