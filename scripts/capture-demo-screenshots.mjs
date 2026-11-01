/**
 * Captures public live pages into public/demo/live-*.png when Playwright browsers are installed.
 * SVGs in public/demo remain the default tour assets (generated from product UI patterns).
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "demo");
const origin = process.env.V77_APP_ORIGIN || "https://v77trust.com";

const pages = [
  { path: "/", name: "live-home.png" },
  { path: "/how-it-works", name: "live-how.png" },
  { path: "/frameworks", name: "live-frameworks.png" },
  { path: "/developers", name: "live-developers.png" },
];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
for (const p of pages) {
  await page.goto(`${origin}${p.path}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.screenshot({ path: path.join(outDir, p.name), fullPage: false });
  console.log("captured", p.name);
}
await browser.close();
