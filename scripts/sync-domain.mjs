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
const www = String(cfg.wwwDomain || `www.${domain}`).trim();
const legacy = String(cfg.legacyDomain || "").trim();
const workerName = cfg.workerName || "v77-ai-auditor";

const wranglerPath = path.join(root, "wrangler.jsonc");
let raw = fs.readFileSync(wranglerPath, "utf8");
raw = raw.replace(/"name"\s*:\s*"[^"]+"/, `"name": "${workerName}"`);
raw = raw.replace(
  /"vars"\s*:\s*\{[^}]*\}/,
  `"vars": {\n    "V77_APP_ORIGIN": "https://${domain}",\n    "V77_CUSTOM_DOMAIN": "${domain}"\n  }`,
);
const patterns = [domain, www, legacy].filter(Boolean);
const routes = patterns
  .map((p) => `    {\n      "pattern": "${p}",\n      "custom_domain": true\n    }`)
  .join(",\n");
raw = raw.replace(/"routes"\s*:\s*\[[^\]]*\]/, `"routes": [\n${routes}\n  ]`);
fs.writeFileSync(wranglerPath, raw);

const example = path.join(root, ".env.example");
if (fs.existsSync(example)) {
  let env = fs.readFileSync(example, "utf8");
  if (!env.includes("V77_APP_ORIGIN")) {
    env += `\n# Public origin (no trailing slash). Used for invite links.\nV77_APP_ORIGIN=https://${domain}\n`;
  } else {
    env = env.replace(/V77_APP_ORIGIN=.*/g, `V77_APP_ORIGIN=https://${domain}`);
  }
  fs.writeFileSync(example, env);
}
console.log(`Synced domain -> ${domain} (www=${www}${legacy ? `, legacy=${legacy}` : ""})`);
