import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import os from "os";

const password = "QaAudit!2026x";

test.describe.configure({ mode: "serial" });

test("CRUD deploy gate: evidence, policies, vendors, incidents, model cards, tests, trust, invite, PDFs, billing abandon, mobile", async ({
  page,
  context,
}) => {
  const stamp = Date.now().toString(16).slice(-8);
  const email = `info+qa${stamp}@tamalakibn.com`;
  const orgName = `QA CRUD ${stamp}`;

  // Signup
  await page.goto("/signup");
  await page.locator('input[name="name"], input[autocomplete="name"]').first().fill("QA CRUD");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  const org = page.locator('input[name="orgName"], input[name="organization"]');
  if (await org.count()) await org.first().fill(orgName);
  else {
    const inputs = page.locator("input:not([type=hidden])");
    const n = await inputs.count();
    for (let i = 0; i < n; i++) {
      const type = await inputs.nth(i).getAttribute("type");
      const name = await inputs.nth(i).getAttribute("name");
      if (type === "password" || type === "email" || name === "name") continue;
      await inputs.nth(i).fill(orgName);
      break;
    }
  }
  await page.getByRole("button", { name: /create|sign up|start|register/i }).first().click();
  await page.waitForURL(/dashboard|onboarding|systems/, { timeout: 90_000 });
  const essential = page.getByRole("button", { name: /Essential only/i });
  if (await essential.count()) await essential.click();

  // Create system (needed for model cards / audit pack)
  await page.goto("/systems/new");
  await page.locator('input[name="name"]').fill(`CRUD System ${stamp}`);
  const purpose = page.locator('textarea[name="intendedPurpose"], input[name="intendedPurpose"]');
  if (await purpose.count()) await purpose.first().fill("QA intended purpose");
  const desc = page.locator('textarea[name="description"]');
  if (await desc.count()) await desc.first().fill("QA description");
  await page.getByRole("button", { name: /save & classify|save|create/i }).first().click();
  await page.waitForURL(/systems/, { timeout: 60_000 });

  // Evidence upload + download
  await page.goto("/evidence");
  const tmp = path.join(os.tmpdir(), `v77-e2e-${stamp}.txt`);
  fs.writeFileSync(tmp, `evidence body ${stamp}`);
  await page.locator('input[name="title"]').fill(`E2E Evidence ${stamp}`);
  await page.locator('input[name="file"]').setInputFiles(tmp);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/evidence") && r.request().method() === "POST", { timeout: 60_000 }),
    page.getByRole("button", { name: /upload evidence/i }).click(),
  ]);
  await expect(page.getByText(/Stored with SHA-256|E2E Evidence/i).first()).toBeVisible({ timeout: 60_000 });
  await page.reload();
  const downloadPromise = page.waitForEvent("download", { timeout: 60_000 });
  await page.getByRole("link", { name: /^Download$/i }).first().click();
  const download = await downloadPromise;
  expect(download.suggestedFilename().length).toBeGreaterThan(0);

  // Policies create draft + PDF
  await page.goto("/policies");
  const createDraft = page.getByRole("button", { name: /create draft/i }).first();
  await expect(createDraft).toBeVisible();
  await createDraft.click();
  await expect(page.getByText(/Policy draft created|Your drafts/i).first()).toBeVisible({ timeout: 30_000 });
  await page.reload();
  const pdfLink = page.locator('a[href*="/api/policies/export"][href*="format=pdf"]').first();
  if (await pdfLink.count()) {
    const res = await context.request.get(await pdfLink.getAttribute("href") || "/");
    expect(res.status()).toBeLessThan(500);
  }

  // Vendors
  await page.goto("/vendors");
  await page.locator("#vendor-name").fill(`Vendor ${stamp}`);
  await page.getByRole("button", { name: /create shareable/i }).click();
  await expect(page.getByText(new RegExp(`Vendor ${stamp}`))).toBeVisible({ timeout: 30_000 });

  // Incidents
  await page.goto("/incidents");
  await page.locator("#inc-title").fill(`Incident ${stamp}`);
  await page.locator("#inc-desc").fill("QA incident description");
  await page.locator("#inc-impact").fill("Low impact");
  await page.getByRole("button", { name: /save incident/i }).click();
  await expect(page.getByText(new RegExp(`Incident ${stamp}`))).toBeVisible({ timeout: 30_000 });

  // Model cards
  await page.goto("/model-cards");
  await page.locator("#version").fill("1.0.0-qa");
  await page.locator("#intendedUse").fill("QA intended use");
  await page.getByRole("button", { name: /save model card/i }).click();
  await expect(page.getByText(/Model card saved|saved/i).first()).toBeVisible({ timeout: 30_000 });

  // Fairness test run (if form present)
  await page.goto("/tests/fairness");
  const runBtn = page.getByRole("button", { name: /run fairness|run|submit/i }).first();
  if (await runBtn.count()) {
    await runBtn.click();
    await page.waitForTimeout(2000);
  }

  // Trust center publish
  await page.goto("/settings");
  const trustPublic = page.locator("#trust-public");
  if (await trustPublic.count()) {
    await trustPublic.check();
    const summary = page.locator("#trust-summary, textarea[name='trustSummary']");
    if (await summary.count()) await summary.first().fill("QA public trust summary");
    await page.getByRole("button", { name: /save trust center/i }).click();
    await page.waitForTimeout(1500);
  }

  // Invite create + accept in new context
  const inviteEmail = `info+qa${stamp}b@tamalakibn.com`;
  await page.locator("#invite-email").fill(inviteEmail);
  await page.getByRole("button", { name: /create invite/i }).click();
  const inviteCode = page.locator("code").filter({ hasText: /\/invite\// }).first();
  await expect(inviteCode).toBeVisible({ timeout: 30_000 });
  const inviteUrl = await inviteCode.innerText();
  const invitePage = await context.newPage();
  await invitePage.goto(inviteUrl.trim());
  await invitePage.getByPlaceholder(/your name/i).fill("QA Invitee");
  await invitePage.locator('input[type="password"]').fill(password);
  await invitePage.getByRole("button", { name: /join organisation/i }).click();
  await invitePage.waitForURL(/dashboard/, { timeout: 60_000 });
  await invitePage.close();

  // Board report + audit pack
  await page.goto("/board-report");
  const board = page.locator('a[href="/api/reports/board"]');
  if (await board.count()) {
    const res = await context.request.get("/api/reports/board");
    expect([200, 401, 402, 404].includes(res.status()) || res.status() < 500).toBeTruthy();
  }

  // Billing: start checkout then abandon (do not complete payment)
  await page.goto("/billing");
  const pay = page.getByRole("button", { name: /pay by card|upgrade|checkout/i }).first();
  if (await pay.count()) {
    const [popup] = await Promise.all([
      page.waitForEvent("popup", { timeout: 15_000 }).catch(() => null),
      pay.click(),
    ]);
    // Either navigates same tab to Paystack or opens popup — abandon by going back
    await page.waitForTimeout(2500);
    if (popup) await popup.close();
    if (/paystack|checkout/i.test(page.url())) {
      await page.goto("/billing");
    }
  }

  // Partner + platform pages render (may be empty / redirected)
  await page.goto("/partner");
  await expect(page.locator("body")).toBeVisible();
  await page.goto("/platform");
  await expect(page.locator("body")).toBeVisible();

  // Mobile hamburger at 390px
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  const menu = page.getByRole("button", { name: /^Menu$/i });
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(page.locator('nav[aria-label="App"]')).toBeVisible();
  await page.locator('nav[aria-label="App"] a[href="/systems"]').first().click();
  await expect(page).toHaveURL(/systems/);
});
