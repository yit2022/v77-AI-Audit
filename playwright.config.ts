import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.V77_E2E_PORT || 3317);
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: `bash scripts/e2e-webserver.sh ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
