import { test, expect } from "@playwright/test";

const aliases: Array<[string, string | RegExp]> = [
  ["/inventory", /\/(systems|login)/],
  ["/register", /\/signup/],
  ["/app", /\/(dashboard|login)/],
  ["/account", /\/(settings|login)/],
  ["/home", /\/$/],
  ["/docs", /\/developers/],
  ["/plans", /\/pricing/],
  ["/status", /\/api\/health/],
  ["/health", /\/api\/health/],
  ["/sign-in", /\/login/],
  ["/get-started", /\/signup/],
];

test.describe("URL aliases", () => {
  for (const [from, to] of aliases) {
    test(`${from} redirects sensibly`, async ({ page }) => {
      const res = await page.goto(from, { waitUntil: "domcontentloaded" });
      expect(res).toBeTruthy();
      expect(res!.status()).toBeLessThan(400);
      await expect(page).toHaveURL(to);
    });
  }
});

test("pricing page loads", async ({ page }) => {
  const res = await page.goto("/pricing", { waitUntil: "domcontentloaded" });
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: /pricing|plans|simple plans/i })).toBeVisible();
});

test("public marketing pages return 200", async ({ page }) => {
  for (const path of ["/", "/how-it-works", "/demo", "/frameworks", "/security", "/developers", "/contact", "/privacy", "/terms", "/login", "/signup"]) {
    const res = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(res?.status(), path).toBe(200);
  }
});
