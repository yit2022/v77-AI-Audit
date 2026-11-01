import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import {
  BILLABLE_PLANS,
  chargeAmountMinor,
  displayPriceEur,
  paystackCurrency,
  eurToUsdRate,
} from "@/lib/billing/currency";
import { billingEnabled } from "@/lib/billing/flags";
import { PAYSTACK_CHANNELS, CHECKOUT_DISPLAY_NAME, verifyPaystackSignature, isV77PaystackEvent, FARMMATE_PLATFORM_PERCENT, resolveCheckoutSplit, defaultPaystackSplitCode } from "@/lib/billing/paystack";
import { sendEmail, emailConfigured, formatFromAddress } from "@/lib/email/send";
import { signupEmail, inviteEmail, evidenceRequestEmail, reminderEmail, leadNotificationEmail } from "@/lib/email/templates";
import { redactPii, withSafeProvider } from "@/lib/providers/safe";
import type { LlmProvider } from "@/lib/providers/types";
import { realProvidersEnabled } from "@/lib/providers/flags";

describe("Sprint 11 billing currency", () => {
  const keys = ["V77_BILLING_ENABLED", "PAYSTACK_CURRENCY", "PAYSTACK_EUR_USD_RATE", "PAYSTACK_SECRET_KEY"] as const;
  const prev: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const k of keys) prev[k] = process.env[k];
  });
  afterEach(() => {
    for (const k of keys) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
  });

  it("defaults billing off and charge currency USD", () => {
    delete process.env.V77_BILLING_ENABLED;
    delete process.env.PAYSTACK_CURRENCY;
    expect(billingEnabled()).toBe(false);
    expect(paystackCurrency()).toBe("USD");
  });

  it("shows EUR prices and converts to USD minor units by default", () => {
    process.env.PAYSTACK_CURRENCY = "USD";
    process.env.PAYSTACK_EUR_USD_RATE = "1.10";
    const team = BILLABLE_PLANS.find((p) => p.tier === "team")!;
    expect(team.priceEurMonthly).toBe(499);
    expect(displayPriceEur(team)).toMatch(/499/);
    const priced = chargeAmountMinor(499);
    expect(priced.currency).toBe("USD");
    expect(priced.usdAmount).toBeCloseTo(548.9, 1);
    expect(priced.amountMinor).toBe(Math.round(548.9 * 100));
    expect(eurToUsdRate()).toBe(1.1);
  });

  it("charges EUR directly when PAYSTACK_CURRENCY=EUR", () => {
    process.env.PAYSTACK_CURRENCY = "EUR";
    const priced = chargeAmountMinor(499);
    expect(priced.currency).toBe("EUR");
    expect(priced.amountMinor).toBe(49900);
  });

  it("restricts Paystack channels to card only and uses V77 Trust checkout name", () => {
    expect(PAYSTACK_CHANNELS).toEqual(["card"]);
    expect(CHECKOUT_DISPLAY_NAME).toBe("V77 Trust");
  });

  it("verifies Paystack webhook HMAC signatures", () => {
    process.env.PAYSTACK_SECRET_KEY = "sk_test_example";
    const body = JSON.stringify({ event: "charge.success", data: { reference: "ref_1" } });
    const sig = createHmac("sha512", "sk_test_example").update(body).digest("hex");
    expect(verifyPaystackSignature(body, sig)).toBe(true);
    expect(verifyPaystackSignature(body, "deadbeef")).toBe(false);
    expect(verifyPaystackSignature(body, null)).toBe(false);
  });
});

describe("Sprint 11 Resend email abstraction", () => {
  const prevKey = process.env.RESEND_API_KEY;
  afterEach(() => {
    if (prevKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = prevKey;
  });

  it("no-ops and logs when RESEND_API_KEY is absent", async () => {
    delete process.env.RESEND_API_KEY;
    expect(emailConfigured()).toBe(false);
    const result = await sendEmail({
      to: "buyer@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
      text: "Hi",
    });
    expect(result.ok).toBe(true);
    expect(result.mode).toBe("noop");
  });

  it("builds localised transactional templates", () => {
    expect(signupEmail({ name: "Ada", orgName: "Acme", locale: "de" }).subject).toMatch(/Willkommen/);
    expect(inviteEmail({ orgName: "Acme", role: "admin", acceptUrl: "https://x", locale: "fr" }).subject).toMatch(/Invitation/);
    expect(evidenceRequestEmail({ title: "Policy", dueAt: "2026-12-01", url: "https://x", locale: "pl" }).subject).toMatch(/dowód|V77/i);
    expect(reminderEmail({ title: "Due", dueAt: "2026-12-01", locale: "nl" }).subject).toMatch(/Herinnering|V77/);
    expect(leadNotificationEmail({ name: "Ada", company: "Acme" }).subject).toMatch(/lead/i);
  });

  it("partner-brands email shell when brand provided", () => {
    const tpl = inviteEmail({
      orgName: "Client",
      role: "admin",
      acceptUrl: "https://example.com/invite",
      brand: { name: "Northbridge", primaryColor: "#112233", accentColor: "#abcdef", logoUrl: "https://cdn.example/logo.png" },
    });
    expect(tpl.fromName).toBe("Northbridge");
    expect(tpl.html).toContain("Northbridge");
    expect(tpl.html).toContain("https://cdn.example/logo.png");
  });
});

describe("Sprint 11 provider hardening", () => {
  it("keeps real providers disabled by default", () => {
    expect(realProvidersEnabled()).toBe(false);
  });

  it("redacts PII from prompts", () => {
    const raw = "Contact ada@example.com or +48 22 123 4567 IBAN PL61109010140000071219812874";
    const red = redactPii(raw);
    expect(red).not.toContain("ada@example.com");
    expect(red).toContain("[REDACTED_EMAIL]");
    expect(red).toContain("[REDACTED_IBAN]");
  });

  it("enforces cost caps and retries via withSafeProvider", async () => {
    let calls = 0;
    const flaky: LlmProvider = {
      id: "mock",
      name: "Flaky",
      async complete() {
        calls += 1;
        if (calls < 2) throw new Error("transient");
        return "ok";
      },
    };
    const safe = withSafeProvider(flaky, { maxRetries: 2, timeoutMs: 5000, maxInputChars: 100, redact: false });
    await expect(safe.complete([{ role: "user", content: "hi" }])).resolves.toBe("ok");
    expect(calls).toBe(2);

    const capped = withSafeProvider(flaky, { maxInputChars: 5, redact: false });
    await expect(capped.complete([{ role: "user", content: "this is too long" }])).rejects.toThrow(/cost cap/);
  });
});


describe("Sprint 11 webhook V77 filter", () => {
  it("accepts v77 metadata/app or v77_ references only", () => {
    expect(isV77PaystackEvent({ data: { reference: "v77_abc", metadata: {} } })).toBe(true);
    expect(isV77PaystackEvent({ data: { reference: "hz_abc", metadata: { app: "v77" } } })).toBe(true);
    expect(isV77PaystackEvent({ data: { reference: "hz_abc", metadata: { source: "hazinova" } } })).toBe(false);
    expect(isV77PaystackEvent({ data: { reference: "other", metadata: null } })).toBe(false);
  });
});


describe("Sprint 11 FarmMate-aligned split defaults", () => {
  const keys = [
    "PAYSTACK_SPLIT_CODE",
    "PAYSTACK_DEFAULT_SPLIT_CODE",
    "PAYSTACK_DEFAULT_SUBACCOUNT",
    "PAYSTACK_PLATFORM_PERCENT",
    "PAYSTACK_SPLIT_BEARER",
  ] as const;
  const prev: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const k of keys) prev[k] = process.env[k];
    for (const k of keys) delete process.env[k];
  });
  afterEach(() => {
    for (const k of keys) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
  });

  it("defaults to FarmMate 1.5% platform charge when using a subaccount", () => {
    expect(FARMMATE_PLATFORM_PERCENT).toBe(1.5);
    const r = resolveCheckoutSplit({ orgSubaccount: "ACCT_test", amountMinor: 10000 });
    expect(r.splitCode).toBeNull();
    expect(r.subaccount).toBe("ACCT_test");
    expect(r.transactionCharge).toBe(150);
    expect(r.bearer).toBe("subaccount");
  });

  it("prefers named split_code over subaccount when set", () => {
    process.env.PAYSTACK_SPLIT_CODE = "SPL_example";
    const r = resolveCheckoutSplit({ orgSubaccount: "ACCT_test", amountMinor: 10000 });
    expect(r.splitCode).toBe("SPL_example");
    expect(r.subaccount).toBeNull();
    expect(defaultPaystackSplitCode()).toBe("SPL_example");
  });

  it("uses org split override over env default", () => {
    process.env.PAYSTACK_SPLIT_CODE = "SPL_env";
    const r = resolveCheckoutSplit({ orgSplitCode: "SPL_org", amountMinor: 5000 });
    expect(r.splitCode).toBe("SPL_org");
  });
});


describe("Sprint 11 email from address", () => {
  const keys = ["V77_EMAIL_FROM"] as const;
  const prev: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const k of keys) prev[k] = process.env[k];
  });
  afterEach(() => {
    for (const k of keys) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
  });

  it("does not double-wrap a display-name V77_EMAIL_FROM", () => {
    process.env.V77_EMAIL_FROM = "V77 Trust <noreply@v77trust.com>";
    expect(formatFromAddress(process.env, "V77 Trust")).toBe("V77 Trust <noreply@v77trust.com>");
  });

  it("wraps a bare address with the display name", () => {
    process.env.V77_EMAIL_FROM = "noreply@v77trust.com";
    expect(formatFromAddress(process.env, "V77 Trust")).toBe("V77 Trust <noreply@v77trust.com>");
  });
});
