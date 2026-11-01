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

  it("landing CTA uses pricing on request copy", () => {
    const page = readFileSync(resolve(__dirname, "../src/app/page.tsx"), "utf8");
    expect(page).toMatch(/Pricing on request/i);
    expect(page).toContain("PilotRequestForm");
    expect(page).not.toMatch(/african/i);
  });
});
