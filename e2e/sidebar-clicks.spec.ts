import { test, expect } from "@playwright/test";

const password = "QaAudit!2026x";

test.describe("Sidebar click-through (no blocking overlay)", () => {
  test("sidebar links navigate with zero app console errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      if (text.includes("cloudflareinsights")) return;
      consoleErrors.push(text);
    });
    page.on("pageerror", (err) => consoleErrors.push(String(err)));

    const email = `info+qa${Date.now().toString(16).slice(-8)}@tamalakibn.com`;
    await page.goto("/signup");
    await page.locator('input[name="name"], input[autocomplete="name"]').first().fill("E2E Click");
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').first().fill(password);
    const org = page.locator('input[name="orgName"], input[name="organization"]');
    if (await org.count()) await org.first().fill(`E2E Org ${Date.now().toString(16).slice(-4)}`);
    else {
      // fallback: third text-like input
      const inputs = page.locator("input:not([type=hidden])");
      const n = await inputs.count();
      for (let i = 0; i < n; i++) {
        const type = await inputs.nth(i).getAttribute("type");
        const name = await inputs.nth(i).getAttribute("name");
        if (type === "password" || type === "email" || name === "name") continue;
        await inputs.nth(i).fill(`E2E Org ${Date.now().toString(16).slice(-4)}`);
        break;
      }
    }
    await page.getByRole("button", { name: /create|sign up|start|register/i }).first().click();
    await page.waitForURL(/dashboard|onboarding|systems/, { timeout: 60_000 });

    // Tour must NOT be a full-screen blocker
    await expect(page.locator("div.fixed.inset-0.z-50")).toHaveCount(0);

    // Dismiss cookie if present
    const essential = page.getByRole("button", { name: /Essential only/i });
    if (await essential.count()) await essential.click();

    const hrefs = ["/systems", "/assessments", "/evidence", "/settings", "/billing", "/dashboard"];
    for (const href of hrefs) {
      await page.locator(`nav[aria-label="App"] a[href="${href}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(href.replace("/", "\\/")));
      await expect(page.locator("div.fixed.inset-0.z-50")).toHaveCount(0);
    }

    expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);
  });
});
