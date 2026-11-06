import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { billingProvider, stripeAutomaticTaxEnabled } from "@/lib/billing/flags";
import {
  STRIPE_PAYMENT_METHODS,
  STRIPE_CHECKOUT_DISPLAY_NAME,
  encodeStripeForm,
  createStripeCheckoutSession,
  verifyStripeSession,
  createStripePortalSession,
  verifyStripeSignature,
  isV77StripeEvent,
} from "@/lib/billing/stripe";
import { COMPANY } from "@/lib/company";
import { SECURITY_HEADERS } from "@/lib/security/headers";

const root = resolve(__dirname, "..");

describe("Stripe EU billing & VIES VAT readiness", () => {
  it("defaults billingProvider to stripe for European native EUR checkout", () => {
    expect(billingProvider({})).toBe("stripe");
    expect(billingProvider({ STRIPE_SECRET_KEY: "sk_test_123" })).toBe("stripe");
    expect(billingProvider({ PAYSTACK_SECRET_KEY: "sk_test_ps" })).toBe("paystack");
    expect(billingProvider({ STRIPE_SECRET_KEY: "sk_test_123", PAYSTACK_SECRET_KEY: "sk_test_ps" })).toBe("stripe");
    expect(billingProvider({ V77_BILLING_PROVIDER: "paystack", STRIPE_SECRET_KEY: "sk_test_123" })).toBe("paystack");
    expect(stripeAutomaticTaxEnabled({})).toBe(true);
    expect(stripeAutomaticTaxEnabled({ STRIPE_AUTOMATIC_TAX: "false" })).toBe(false);
  });

  it("enables both Card (3DS2) and SEPA Direct Debit payment methods", () => {
    expect(STRIPE_PAYMENT_METHODS).toEqual(["card", "sepa_debit"]);
    expect(STRIPE_CHECKOUT_DISPLAY_NAME).toBe("V77 Trust");
  });

  it("creates a native EUR Stripe Checkout session with EU VAT ID collection and automatic tax", async () => {
    let capturedUrl = "";
    let capturedBody = "";
    const fakeFetch: typeof fetch = async (input, init) => {
      capturedUrl = String(input);
      capturedBody = String(init?.body || "");
      return new Response(
        JSON.stringify({
          id: "cs_test_eu_123",
          url: "https://checkout.stripe.com/c/pay/cs_test_eu_123",
          client_reference_id: "v77_org12345_ref1",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    const res = await createStripeCheckoutSession(
      {
        email: "ciso@acme.de",
        priceEur: 499,
        interval: "monthly",
        planName: "Team",
        reference: "v77_org12345_ref1",
        callbackUrl: "https://v77trust.com/billing?checkout=return",
        customerId: "cus_existing123",
        connectDestination: "acct_partner123",
        platformFeePercent: 1.5,
        metadata: { org_id: "org12345", plan_tier: "team" },
      },
      fakeFetch,
      {
        V77_BILLING_ENABLED: "true",
        STRIPE_SECRET_KEY: "sk_test_stripe_eu",
        STRIPE_AUTOMATIC_TAX: "true",
      },
    );

    expect(capturedUrl).toBe("https://api.stripe.com/v1/checkout/sessions");
    const params = new URLSearchParams(capturedBody);
    expect(params.get("mode")).toBe("subscription");
    expect(params.get("payment_method_types[0]")).toBe("card");
    expect(params.get("payment_method_types[1]")).toBe("sepa_debit");
    expect(params.get("tax_id_collection[enabled]")).toBe("true");
    expect(params.get("automatic_tax[enabled]")).toBe("true");
    expect(params.get("billing_address_collection")).toBe("required");
    expect(params.get("line_items[0][price_data][currency]")).toBe("eur");
    expect(params.get("line_items[0][price_data][unit_amount]")).toBe("49900");
    expect(params.get("line_items[0][price_data][tax_behavior]")).toBe("exclusive");
    expect(params.get("line_items[0][price_data][recurring][interval]")).toBe("month");
    expect(params.get("customer")).toBe("cus_existing123");
    expect(params.get("customer_update[name]")).toBe("auto");
    expect(params.get("customer_update[address]")).toBe("auto");
    expect(params.get("subscription_data[transfer_data][destination]")).toBe("acct_partner123");
    expect(params.get("subscription_data[application_fee_percent]")).toBe("1.5");

    expect(res.currency).toBe("EUR");
    expect(res.amountMinor).toBe(49900);
    expect(res.eurAmount).toBe(499);
    expect(res.sessionId).toBe("cs_test_eu_123");
    expect(res.authorizationUrl).toContain("checkout.stripe.com");
  });

  it("verifies paid Stripe Checkout sessions and extracts customer EU VAT ID", async () => {
    const fakeFetch: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          id: "cs_test_eu_123",
          status: "complete",
          payment_status: "paid",
          client_reference_id: "v77_org12345_ref1",
          customer: "cus_eu_999",
          subscription: "sub_eu_888",
          amount_total: 49900,
          total_details: { amount_tax: 0 },
          currency: "eur",
          customer_details: {
            tax_ids: [{ type: "eu_vat", value: "DE123456789" }],
          },
          metadata: { app: "v77", billing_interval: "annual" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );

    const verified = await verifyStripeSession("cs_test_eu_123", fakeFetch, {
      STRIPE_SECRET_KEY: "sk_test_stripe_eu",
    });

    expect(verified.ok).toBe(true);
    expect(verified.currency).toBe("EUR");
    expect(verified.amountMinor).toBe(49900);
    expect(verified.customerId).toBe("cus_eu_999");
    expect(verified.subscriptionId).toBe("sub_eu_888");
    expect(verified.customerVatId).toBe("DE123456789");
    expect(verified.reference).toBe("v77_org12345_ref1");
  });

  it("creates a Stripe Customer Portal session for EU VAT & mandate management", async () => {
    const fakeFetch: typeof fetch = async () =>
      new Response(
        JSON.stringify({ url: "https://billing.stripe.com/p/session/test_123" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );

    const portal = await createStripePortalSession(
      { customerId: "cus_eu_999", returnUrl: "https://v77trust.com/billing" },
      fakeFetch,
      { STRIPE_SECRET_KEY: "sk_test_stripe_eu" },
    );
    expect(portal.url).toBe("https://billing.stripe.com/p/session/test_123");
  });

  it("verifies Stripe webhook HMAC-SHA256 signatures and enforces replay tolerance", () => {
    const env = { STRIPE_WEBHOOK_SECRET: "whsec_test_secret" };
    const nowSec = 1762430000;
    const rawBody = JSON.stringify({
      id: "evt_1",
      type: "checkout.session.completed",
      data: { object: { id: "cs_1", client_reference_id: "v77_abc" } },
    });
    const validHmac = createHmac("sha256", "whsec_test_secret")
      .update(`${nowSec}.${rawBody}`, "utf8")
      .digest("hex");
    const sigHeader = `t=${nowSec},v1=${validHmac}`;

    expect(verifyStripeSignature(rawBody, sigHeader, env, 300, nowSec)).toBe(true);
    // Replay outside 300s window fails
    expect(verifyStripeSignature(rawBody, sigHeader, env, 300, nowSec + 600)).toBe(false);
    // Tampered body fails
    expect(verifyStripeSignature(rawBody + "x", sigHeader, env, 300, nowSec)).toBe(false);
  });

  it("filters Stripe webhook events to V77 only", () => {
    expect(
      isV77StripeEvent({
        type: "checkout.session.completed",
        data: { object: { id: "cs_1", client_reference_id: "v77_123", metadata: {} } },
      }),
    ).toBe(true);
    expect(
      isV77StripeEvent({
        type: "checkout.session.completed",
        data: { object: { id: "cs_2", client_reference_id: "other_123", metadata: { app: "other" } } },
      }),
    ).toBe(false);
    expect(encodeStripeForm({ a: { b: ["x", "y"] } }).toString()).toBe("a%5Bb%5D%5B0%5D=x&a%5Bb%5D%5B1%5D=y");
  });
});

describe("European statutory, GDPR, EU Data Act & security readiness", () => {
  it("includes full Polish KSH Art. 206 disclosures in COMPANY", () => {
    expect(COMPANY.krs).toBe("0001217415");
    expect(COMPANY.nip).toBe("5214148501");
    expect(COMPANY.vatEu).toBe("PL5214148501");
    expect(COMPANY.regon).toBe("543742675");
    expect(COMPANY.addressLine).toContain("02-662 Warszawa");
    expect(COMPANY.statutoryDisclosure).toContain("KRS 0001217415");
    expect(COMPANY.statutoryDisclosure).toContain("PL5214148501");
  });

  it("includes HSTS preload header and RFC 9116 security.txt", () => {
    expect(SECURITY_HEADERS["Strict-Transport-Security"]).toContain("max-age=63072000");
    expect(existsSync(resolve(root, "public/.well-known/security.txt"))).toBe(true);
  });

  it("updates privacy and terms pages with GDPR Art. 6, PUODO, Stripe Europe, and EU Data Act", () => {
    const privacy = readFileSync(resolve(root, "src/app/privacy/page.tsx"), "utf8");
    expect(privacy).toContain("GDPR Art. 6(1)(b)");
    expect(privacy).toContain("Stripe Payments Europe");
    expect(privacy).toContain("PUODO");
    expect(privacy).not.toMatch(/tamalaki|nairobi|kenya|africa/i);

    const terms = readFileSync(resolve(root, "src/app/terms/page.tsx"), "utf8");
    expect(terms).toContain("2023/2854");
    expect(terms).toContain("473 § 2");
    expect(terms).toContain("SEPA Direct Debit");
    expect(terms).not.toMatch(/tamalaki|nairobi|kenya|africa/i);
  });
});
