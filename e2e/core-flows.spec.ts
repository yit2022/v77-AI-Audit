import { test, expect } from "@playwright/test";

const QUESTIONS = [
  "proh_social_score",
  "proh_biometric_real_time",
  "proh_emotion_workplace",
  "proh_untargeted_scraping",
  "hr_annex_i_product",
  "hr_annex_iii_employment",
  "hr_annex_iii_credit",
  "hr_annex_iii_education",
  "hr_annex_iii_biometric",
  "hr_annex_iii_critical",
  "hr_annex_iii_law",
  "hr_annex_iii_migration",
  "hr_annex_iii_justice",
  "lim_interaction",
  "lim_synthetic",
  "lim_emotion_biometric_other",
  "gpai_model",
  "gpai_systemic",
] as const;

test.describe.configure({ mode: "serial" });

test("core audit flow: login → system → classify → eval → finding → sign-off → PDF", async ({ page, request }) => {
  // Browser login UI
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  await page.locator('input[type="email"]').fill("admin@v77.local");
  await page.locator('input[type="password"]').fill("demo1234");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 30_000 });

  // Carry browser cookies into API request context
  const cookies = await page.context().cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

  const api = async (path: string, init: { method?: string; data?: unknown } = {}) => {
    const res = await request.fetch(path, {
      method: init.method || "GET",
      headers: {
        "content-type": "application/json",
        cookie: cookieHeader,
      },
      data: init.data,
    });
    const text = await res.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return { status: res.status(), body };
  };

  const sys = await api("/api/systems", {
    method: "POST",
    data: {
      name: "E2E Ranker",
      description: "Playwright registered system",
      intendedPurpose: "Screen applicants",
      roleInValueChain: "provider",
      domain: "employment",
    },
  });
  expect(sys.status).toBe(201);
  const systemId = (sys.body as { system: { id: string } }).system.id;

  const answers: Record<string, "yes" | "no" | "na"> = Object.fromEntries(
    QUESTIONS.map((id) => [id, id === "hr_annex_iii_employment" ? "yes" : "no"]),
  ) as Record<string, "yes" | "no" | "na">;

  const classified = await api("/api/classification", {
    method: "POST",
    data: { systemId, answers, createAssessment: true },
  });
  expect(classified.status).toBe(200);
  const assessmentId = (classified.body as { assessmentId: string }).assessmentId;
  expect(assessmentId).toBeTruthy();

  const evalRun = await api("/api/tests/evals", {
    method: "POST",
    data: { systemId, provider: "mock", categories: ["fairness", "robustness"] },
  });
  expect(evalRun.status).toBe(201);
  expect((evalRun.body as { overallScore: number }).overallScore).toBeGreaterThan(0);

  const finding = await api("/api/findings", {
    method: "POST",
    data: {
      systemId,
      assessmentId,
      title: "E2E bias finding",
      description: "Created by Playwright",
      severity: "high",
      frameworkRef: "EU AI Act",
    },
  });
  expect(finding.status).toBe(201);

  const signoff = await api("/api/auditor", {
    method: "POST",
    data: {
      action: "signoff",
      assessmentId,
      opinion: "pass_with_findings",
      summary: "E2E sign-off",
    },
  });
  expect(signoff.status).toBe(200);

  const pdf = await request.fetch(`/api/assessments/${assessmentId}/report`, {
    headers: { cookie: cookieHeader },
  });
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toMatch(/pdf/);
  const buf = Buffer.from(await pdf.body());
  expect(buf.subarray(0, 4).toString("utf8")).toBe("%PDF");
  expect(buf.byteLength).toBeGreaterThan(1000);

  // Browser smoke: compliance page loads while authenticated
  await page.goto("/compliance");
  await expect(page.getByRole("heading", { name: /executive compliance/i })).toBeVisible();
});
