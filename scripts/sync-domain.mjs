#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const cfg = JSON.parse(fs.readFileSync(path.join(root, "site.config.json"), "utf8"));
const domain = String(cfg.customDomain || "").trim();
if (!domain) {
  console.error("site.config.json missing customDomain");
  process.exit(1);
}
const wranglerPath = path.join(root, "wrangler.jsonc");
const raw = fs.readFileSync(wranglerPath, "utf8");
const updated = raw.replace(
  /"pattern"\s*:\s*"[^"]+"/,
  `"pattern": "${domain}"`,
).replace(
  /"name"\s*:\s*"[^"]+"/,
  `"name": "${cfg.workerName || "v77-ai-auditor"}"`,
);
fs.writeFileSync(wranglerPath, updated);
const example = path.join(root, ".env.example");
if (fs.existsSync(example)) {
  let env = fs.readFileSync(example, "utf8");
  if (!env.includes("V77_APP_ORIGIN")) {
    env += `\n# Public origin (no trailing slash). Used for invite links.\nV77_APP_ORIGIN=https://${domain}\n`;
    fs.writeFileSync(example, env);
  } else {
    env = env.replace(/V77_APP_ORIGIN=.*/g, `V77_APP_ORIGIN=https://${domain}`);
    fs.writeFileSync(example, env);
  }
}
console.log(`Synced domain -> ${domain}`);
