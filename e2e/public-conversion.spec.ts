import { test, expect } from "@playwright/test";

test.describe("Round 9 public conversion surfaces", () => {
  test("home risk checker → result → pilot lead CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /AI Act risk tier checker/i })).toBeVisible();
    // Answer all questions with No for a fast minimal path
    for (let i = 0; i < 20; i++) {
      const noBtn = page.getByRole("button", { name: /^no$/i }).first();
      if (!(await noBtn.isVisible().catch(() => false))) break;
      await noBtn.click();
      await page.waitForTimeout(50);
    }
    await expect(page.getByText(/minimal risk|limited risk|high-risk|prohibited|gpai/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("heading", { name: /Request a pilot with this result/i })).toBeVisible();
  });

  test("demo and resources pages load", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.getByRole("heading", { name: /See V77 Trust/i })).toBeVisible();
    await expect(page.locator('img[alt="Executive dashboard"]')).toBeVisible();
    await page.goto("/resources");
    await expect(page.getByRole("heading", { name: /EU AI Act notes/i })).toBeVisible();
    await page.goto("/resources/eu-ai-act-risk-tiers");
    await expect(page.getByText(/Regulation \(EU\) 2024\/1689/i).first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/tamalaki|nairobi|kenya|africa/i);
  });

  test("health endpoint is up", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe("v77-trust");
    expect(body.operator).toMatch(/Vertex77/);
  });
});
