import { chromium } from "playwright";
import fs from "fs";
import os from "os";
import path from "path";

const BASE = process.env.V77_BASE || "https://v77trust.com";
const password = "QaAudit!2026x";
const stamp = Date.now().toString(16).slice(-8);
const email = `info+qa${stamp}@tamalakibn.com`;
const inviteEmail = `info+qa${stamp}b@tamalakibn.com`;
const findings = [];
const note = (cat, msg, ok = true) => findings.push({ cat, msg, ok });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const cspViolations = [];
  page.on("console", (m) => {
    const t = m.text();
    if (/Content Security Policy|csp/i.test(t)) cspViolations.push(t);
    if (m.type() === "error" && !t.includes("cloudflareinsights")) consoleErrors.push(t);
  });
  page.on("pageerror", (e) => consoleErrors.push(String(e)));

  try {
    await page.goto(`${BASE}/signup`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.locator('input[name="name"]').fill("QA Live");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="orgName"]').fill(`QA Live ${stamp}`);
    await page.getByRole("button", { name: /create|sign up|start/i }).first().click();
    await page.waitForURL(/dashboard|onboarding|systems/, { timeout: 90000 });
    note("auth", `signup ok ${email}`);
    const essential = page.getByRole("button", { name: /Essential only/i });
    if (await essential.count()) await essential.click();

    // Auth TTFB samples
    const cookies = await context.cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const authPerf = {};
    for (const pth of ["/dashboard", "/systems"]) {
      const samples = [];
      for (let i = 0; i < 5; i++) {
        const t0 = Date.now();
        const res = await context.request.get(`${BASE}${pth}`, { headers: { cookie: cookieHeader } });
        samples.push({ ms: Date.now() - t0, status: res.status() });
      }
      authPerf[pth] = samples;
    }
    note("perf-auth", JSON.stringify(authPerf));

    await page.goto(`${BASE}/systems/new`);
    await page.locator('input[name="name"]').fill(`Live Sys ${stamp}`);
    await page.locator('textarea[name="description"]').fill("desc");
    await page.locator('textarea[name="intendedPurpose"]').fill("purpose");
    await Promise.all([
      page.waitForURL(/classification|systems/, { timeout: 60000 }),
      page.getByRole("button", { name: /save & classify/i }).click(),
    ]);
    note("systems", "create ok");

    await page.goto(`${BASE}/evidence`);
    const tmp = path.join(os.tmpdir(), `v77-live-${stamp}.txt`);
    fs.writeFileSync(tmp, `live evidence ${stamp}`);
    await page.locator('input[name="title"]').fill(`Live Ev ${stamp}`);
    await page.locator('input[name="file"]').setInputFiles(tmp);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/evidence") && r.request().method() === "POST", { timeout: 60000 }),
      page.getByRole("button", { name: /upload evidence/i }).click(),
    ]);
    await page.reload();
    const dl = page.getByRole("link", { name: /^Download$/i });
    if (await dl.count()) {
      const [download] = await Promise.all([page.waitForEvent("download", { timeout: 30000 }), dl.first().click()]);
      note("evidence", `upload+download ok ${download.suggestedFilename()}`);
    } else note("evidence", "no Download link after upload", false);

    await page.goto(`${BASE}/policies`);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/policies") && r.request().method() === "POST", { timeout: 30000 }),
      page.getByRole("button", { name: /create draft/i }).first().click(),
    ]);
    await page.reload();
    const pdf = page.locator('a[href*="format=pdf"]').first();
    if (await pdf.count()) {
      const href = await pdf.getAttribute("href");
      const res = await context.request.get(new URL(href, BASE).toString(), { headers: { cookie: cookieHeader } });
      note("policies", `draft+pdf status ${res.status()} ctype=${res.headers()["content-type"]}`, res.status() === 200);
    } else note("policies", "no pdf link", false);

    await page.goto(`${BASE}/vendors`);
    await page.locator("#vendor-name").fill(`Vendor ${stamp}`);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/vendors") && r.request().method() === "POST", { timeout: 30000 }),
      page.getByRole("button", { name: /create shareable/i }).click(),
    ]);
    await page.reload();
    note("vendors", "create", (await page.getByText(`Vendor ${stamp}`).count()) > 0);

    await page.goto(`${BASE}/incidents`);
    await page.locator("#inc-title").fill(`Incident ${stamp}`);
    await page.locator("#inc-desc").fill("desc");
    await page.locator("#inc-impact").fill("impact");
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/incidents") && r.request().method() === "POST", { timeout: 30000 }),
      page.getByRole("button", { name: /save incident/i }).click(),
    ]);
    await page.reload();
    note("incidents", "create", (await page.getByText(`Incident ${stamp}`).count()) > 0);

    await page.goto(`${BASE}/model-cards`);
    if (await page.locator("#version").count()) {
      await page.locator("#version").fill("1.0-live");
      await page.locator("#intendedUse").fill("live use");
      await Promise.all([
        page.waitForResponse((r) => r.url().includes("/api/model-cards") && r.request().method() === "PUT", { timeout: 30000 }),
        page.getByRole("button", { name: /save model card/i }).click(),
      ]);
      note("model-cards", "save", (await page.getByText(/saved/i).count()) > 0);
    } else note("model-cards", "no systems", false);

    await page.goto(`${BASE}/tests/fairness`);
    const run = page.getByRole("button", { name: /run fairness/i });
    if (await run.count()) {
      await Promise.all([
        page.waitForResponse((r) => r.url().includes("/api/tests/fairness") && r.request().method() === "POST", { timeout: 60000 }).catch(() => null),
        run.click(),
      ]);
      note("tests", "fairness run");
    } else note("tests", "fairness button missing", false);

    await page.goto(`${BASE}/settings`);
    if (await page.locator("#trust-public").count()) {
      await page.locator("#trust-public").check();
      await page.locator("#trust-summary").fill("Live public summary");
      await Promise.all([
        page.waitForResponse((r) => r.url().includes("/api/trust") && r.request().method() === "PUT", { timeout: 30000 }),
        page.getByRole("button", { name: /save trust center/i }).click(),
      ]);
      note("trust", "publish saved");
      // public page
      const slugMatch = (await page.content()).match(/\/trust\/([a-z0-9-]+)/i);
      if (slugMatch) {
        const pub = await context.request.get(`${BASE}/trust/${slugMatch[1]}`);
        note("trust", `public page ${pub.status()}`, pub.status() === 200);
      }
    }

    await page.locator("#invite-email").fill(inviteEmail);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/invites") && r.request().method() === "POST", { timeout: 30000 }),
      page.getByRole("button", { name: /create invite/i }).click(),
    ]);
    const inviteCode = page.locator("code").filter({ hasText: /\/invite\// }).first();
    await inviteCode.waitFor({ timeout: 15000 });
    const inviteUrl = (await inviteCode.innerText()).trim();
    const ip = await context.newPage();
    await ip.goto(inviteUrl.startsWith("http") ? inviteUrl : `${BASE}${inviteUrl}`);
    await ip.getByPlaceholder(/your name/i).fill("QA Invitee");
    await ip.locator('input[type="password"]').fill(password);
    await ip.getByRole("button", { name: /join organisation/i }).click();
    await ip.waitForURL(/dashboard/, { timeout: 60000 });
    note("invite", "accept ok");
    await ip.close();

    const board = await context.request.get(`${BASE}/api/reports/board`, { headers: { cookie: cookieHeader } });
    note("reports", `board ${board.status()}`, board.status() < 500);
    // audit pack needs systemId — fetch systems
    const systems = await context.request.get(`${BASE}/api/systems`, { headers: { cookie: cookieHeader } });
    const sysJson = await systems.json().catch(() => ({}));
    const sid = sysJson?.systems?.[0]?.id || sysJson?.[0]?.id;
    if (sid) {
      const pack = await context.request.get(`${BASE}/api/audit-pack?systemId=${sid}`, { headers: { cookie: cookieHeader } });
      note("reports", `audit-pack ${pack.status()} bytes=${(await pack.body()).length}`, pack.status() < 500);
    } else note("reports", "no system for audit-pack", false);

    await page.goto(`${BASE}/billing`);
    const pay = page.getByRole("button", { name: /pay by card|upgrade|checkout/i }).first();
    if (await pay.count()) {
      await pay.click();
      await page.waitForTimeout(5000);
      note("billing", `after checkout click url=${page.url().slice(0, 100)}`);
      await page.goto(`${BASE}/billing`);
      note("billing", "abandoned back to billing");
    } else note("billing", "no checkout button", false);

    for (const pth of ["/platform", "/partner"]) {
      const res = await page.goto(`${BASE}${pth}`);
      note("portals", `${pth} ${res?.status()}`, (res?.status() || 500) < 500);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/dashboard`);
    const menu = page.getByRole("button", { name: /^Menu$/i });
    await expectVisible(menu);
    await menu.click();
    await page.locator('nav[aria-label="App"] a[href="/systems"]').first().click();
    await page.waitForURL(/systems/, { timeout: 30000 });
    note("mobile", "hamburger at 390px ok");

    note("csp", `csp console msgs: ${cspViolations.length}`, cspViolations.length === 0);
    if (cspViolations.length) note("csp", cspViolations.slice(0, 3).join(" | "), false);
    note("console", `errors: ${consoleErrors.length}`, consoleErrors.length === 0);
    if (consoleErrors.length) note("console", consoleErrors.slice(0, 5).join(" | "), false);
  } catch (e) {
    note("fatal", String(e), false);
  }

  const out = { email, inviteEmail, stamp, findings, failed: findings.filter((f) => !f.ok) };
  fs.writeFileSync("/tmp/v77-live-crud.json", JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
}

async function expectVisible(loc) {
  if (!(await loc.count())) throw new Error("not visible");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
