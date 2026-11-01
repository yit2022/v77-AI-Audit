import { describe, expect, it, beforeAll } from "vitest";
import { computeOrgAccess, trialEndsAtFrom, TRIAL_DAYS } from "@/lib/billing/trial";
import { PLAN_LIMITS, limitsForTier } from "@/lib/billing/limits-config";
import { BILLABLE_PLANS, listPriceEur, displayPriceEur, chargeAmountMinor } from "@/lib/billing/currency";
import { day3TipsEmail, trialEndingEmail, paymentReceiptEmail, paymentFailedEmail } from "@/lib/email/lifecycle-templates";
import { resolveEmailRecipients, formatFromAddress } from "@/lib/email/send";
import { hashUnsubToken } from "@/lib/email/unsubscribe";
import { COMPANY } from "@/lib/company";

describe("sprint12 trial access", () => {
  it("computes active trial and days left", () => {
    const ends = trialEndsAtFrom(new Date("2026-11-01T00:00:00Z"), TRIAL_DAYS);
    const access = computeOrgAccess(
      { billingStatus: "trialing", planTier: "pilot", trialEndsAt: ends },
      new Date("2026-11-01T12:00:00Z"),
    );
    expect(access.trialActive).toBe(true);
    expect(access.readOnly).toBe(false);
    expect(access.daysLeft).toBe(TRIAL_DAYS);
  });

  it("expires to read-only", () => {
    const access = computeOrgAccess(
      {
        billingStatus: "trialing",
        trialEndsAt: new Date("2026-10-01T00:00:00Z"),
      },
      new Date("2026-11-01T00:00:00Z"),
    );
    expect(access.trialExpired).toBe(true);
    expect(access.readOnly).toBe(true);
  });

  it("paid orgs are writable", () => {
    const access = computeOrgAccess({ billingStatus: "active", planTier: "team", trialEndsAt: null });
    expect(access.readOnly).toBe(false);
    expect(access.trialActive).toBe(false);
  });
});

describe("sprint12 plan limits", () => {
  it("pilot limits are tight", () => {
    expect(limitsForTier("pilot").systems).toBe(3);
    expect(PLAN_LIMITS.team.users).toBe(25);
  });
});

describe("sprint12 pricing", () => {
  it("annual team is 10x monthly", () => {
    const team = BILLABLE_PLANS.find((p) => p.tier === "team")!;
    expect(listPriceEur(team, "monthly")).toBe(499);
    expect(listPriceEur(team, "annual")).toBe(4990);
    expect(displayPriceEur(team, "en-GB", "annual")).toContain("year");
  });

  it("charges USD by default", () => {
    const priced = chargeAmountMinor(499, { PAYSTACK_CURRENCY: "USD", PAYSTACK_EUR_USD_RATE: "1.08" });
    expect(priced.currency).toBe("USD");
    expect(priced.amountMinor).toBe(Math.round(499 * 1.08 * 100));
  });
});

describe("sprint12 lifecycle emails", () => {
  const locales = ["en", "de", "fr", "pl", "nl", "es", "it", "sv"] as const;
  it("localises day3 + trial ending + payment templates", () => {
    for (const locale of locales) {
      const d = day3TipsEmail({ name: "Ada", orgName: "Org", locale, unsubscribeUrl: "https://example/unsub" });
      expect(d.subject.length).toBeGreaterThan(5);
      expect(d.html).toContain("Unsubscribe");
      expect(d.tags).toContain("marketing");
      const t = trialEndingEmail({ name: "Ada", orgName: "Org", daysLeft: 3, locale, unsubscribeUrl: "https://example/unsub" });
      expect(t.subject.length).toBeGreaterThan(5);
      const r = paymentReceiptEmail({
        name: "Ada",
        planTier: "team",
        description: "Team monthly",
        amountEur: 499,
        chargeLabel: "538.92 USD",
        reference: "v77_test",
        locale,
      });
      expect(r.tags).toContain("payment_receipt");
      expect(r.tags).not.toContain("marketing");
      const f = paymentFailedEmail({ name: "Ada", planTier: "team", reference: "v77_test", locale });
      expect(f.tags).toContain("payment_failed");
    }
  });
});

describe("sprint12 email helpers", () => {
  it("test redirect rewrites recipients", () => {
    expect(resolveEmailRecipients("user@example.com", { V77_EMAIL_TEST_REDIRECT: "info@tamalakibn.com" })).toEqual([
      "info@tamalakibn.com",
    ]);
  });

  it("does not double-wrap From", () => {
    const from = formatFromAddress({ V77_EMAIL_FROM: "V77 Trust <noreply@mail.v77trust.com>" });
    expect(from).toBe("V77 Trust <noreply@mail.v77trust.com>");
  });

  it("hashes unsubscribe tokens", () => {
    expect(hashUnsubToken("abc")).toHaveLength(64);
  });

  it("sales email is v77trust", () => {
    expect(COMPANY.salesEmail).toBe("sales@v77trust.com");
  });
});
