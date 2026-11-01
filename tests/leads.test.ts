import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("pilot leads", () => {
  it("persists leads via API route without sending email", () => {
    const route = readFileSync(resolve(__dirname, "../src/app/api/leads/route.ts"), "utf8");
    const lib = readFileSync(resolve(__dirname, "../src/lib/leads/index.ts"), "utf8");
    expect(route).toContain("createPilotLead");
    expect(route).not.toMatch(/nodemailer|resend|sendgrid|smtp/i);
    expect(lib).toContain("pilotLeads");
  });

  it("landing CTA uses trial + EUR pricing copy", () => {
    const page = readFileSync(resolve(__dirname, "../src/app/page.tsx"), "utf8");
    expect(page).toMatch(/14-day self-serve trial/i);
    expect(page).toMatch(/charged in USD at checkout/i);
    expect(page).toContain("PilotRequestForm");
    expect(page).toContain("PricingPlans");
    expect(page).not.toMatch(/african/i);
  });

  it("footer uses brand lockup and company copyright without placeholder copy", () => {
    const page = readFileSync(resolve(__dirname, "../src/app/page.tsx"), "utf8");
    const form = readFileSync(resolve(__dirname, "../src/components/pilot-request-form.tsx"), "utf8");
    expect(page).toContain("COMPANY.footerCopyright");
    expect(page).toContain("COMPANY.salesEmail");
    expect(page).not.toMatch(/tamalaki|kenya|nairobi|africa/i);
    expect(page).not.toMatch(/artwork pending|placeholder mark/i);
    expect(form).toMatch(/within 2 business days/i);
    expect(form).not.toMatch(/auto-send|automated email/i);
  });
});
