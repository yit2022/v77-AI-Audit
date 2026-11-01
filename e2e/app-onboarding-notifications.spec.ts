import { test, expect } from "@playwright/test";

test("login → onboarding checklist + notifications APIs", async ({ page, request }) => {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("admin@v77.local");
  await page.locator('input[type="password"]').fill("demo1234");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 30_000 });

  const cookies = await page.context().cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

  const checklist = await request.fetch("/api/onboarding-checklist", { headers: { cookie: cookieHeader } });
  expect(checklist.status()).toBe(200);
  const cBody = await checklist.json();
  expect(cBody.items?.length).toBeGreaterThan(0);

  const patch = await request.fetch("/api/onboarding-checklist", {
    method: "PATCH",
    headers: { cookie: cookieHeader, "content-type": "application/json" },
    data: { stepId: cBody.items[0].id, done: true },
  });
  expect(patch.status()).toBe(200);

  await request.fetch("/api/notifications", {
    method: "POST",
    headers: { cookie: cookieHeader, "content-type": "application/json" },
    data: { title: "E2E welcome", body: "Round 9 notification", href: "/onboarding" },
  });
  const notes = await request.fetch("/api/notifications", { headers: { cookie: cookieHeader } });
  expect(notes.status()).toBe(200);
  const nBody = await notes.json();
  expect(nBody.notifications.some((n: { title: string }) => n.title === "E2E welcome")).toBe(true);

  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: /Onboarding checklist/i })).toBeVisible();
  await page.goto("/notifications");
  await expect(page.getByRole("heading", { name: /Notification centre/i })).toBeVisible();
});
