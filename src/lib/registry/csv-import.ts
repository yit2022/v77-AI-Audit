export type InventoryCsvRow = {
  name: string;
  description?: string;
  intendedPurpose?: string;
  roleInValueChain?: "provider" | "deployer" | "importer" | "distributor";
  domain?: string;
  lifecycleStatus?: "discovered" | "pilot" | "production" | "retired";
  versionLabel?: string;
  vendorName?: string;
  euDatabaseId?: string;
  riskTier?: string;
  gpai?: boolean;
};

const ROLE = new Set(["provider", "deployer", "importer", "distributor"]);
const LIFE = new Set(["discovered", "pilot", "production", "retired"]);

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell.trim());
      cell = "";
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  row.push(cell.trim());
  if (row.some((c) => c.length > 0)) rows.push(row);
  return rows;
}

function normHeader(h: string) {
  return h.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

const ALIASES: Record<string, keyof InventoryCsvRow | "skip"> = {
  name: "name",
  system_name: "name",
  ai_system: "name",
  description: "description",
  intended_purpose: "intendedPurpose",
  purpose: "intendedPurpose",
  role: "roleInValueChain",
  role_in_value_chain: "roleInValueChain",
  domain: "domain",
  lifecycle: "lifecycleStatus",
  lifecycle_status: "lifecycleStatus",
  version: "versionLabel",
  version_label: "versionLabel",
  vendor: "vendorName",
  vendor_name: "vendorName",
  eu_database_id: "euDatabaseId",
  risk: "riskTier",
  risk_tier: "riskTier",
  gpai: "gpai",
};

export function parseInventoryCsv(text: string): { rows: InventoryCsvRow[]; errors: string[] } {
  const table = parseCsv(text.replace(/^\uFEFF/, ""));
  const errors: string[] = [];
  if (table.length < 2) {
    return { rows: [], errors: ["CSV needs a header row and at least one data row"] };
  }
  const headers = table[0].map(normHeader);
  const mapped = headers.map((h) => ALIASES[h] || null);
  if (!mapped.includes("name")) {
    return { rows: [], errors: ["CSV must include a name column"] };
  }
  const rows: InventoryCsvRow[] = [];
  table.slice(1).forEach((cells, idx) => {
    const line = idx + 2;
    const obj: InventoryCsvRow = { name: "" };
    mapped.forEach((key, i) => {
      if (!key || key === "skip") return;
      const raw = (cells[i] ?? "").trim();
      if (!raw) return;
      if (key === "roleInValueChain") {
        const v = raw.toLowerCase();
        if (!ROLE.has(v)) {
          errors.push(`Line ${line}: invalid role "${raw}"`);
          return;
        }
        obj.roleInValueChain = v as InventoryCsvRow["roleInValueChain"];
        return;
      }
      if (key === "lifecycleStatus") {
        const v = raw.toLowerCase();
        if (!LIFE.has(v)) {
          errors.push(`Line ${line}: invalid lifecycle "${raw}"`);
          return;
        }
        obj.lifecycleStatus = v as InventoryCsvRow["lifecycleStatus"];
        return;
      }
      if (key === "gpai") {
        obj.gpai = ["1", "true", "yes", "y"].includes(raw.toLowerCase());
        return;
      }
      if (key === "riskTier") {
        obj.riskTier = raw.toLowerCase().replace(/\s+/g, "_");
        return;
      }
      if (key === "name") obj.name = raw;
      else if (key === "description") obj.description = raw;
      else if (key === "intendedPurpose") obj.intendedPurpose = raw;
      else if (key === "domain") obj.domain = raw;
      else if (key === "versionLabel") obj.versionLabel = raw;
      else if (key === "vendorName") obj.vendorName = raw;
      else if (key === "euDatabaseId") obj.euDatabaseId = raw;
    });
    if (!obj.name) {
      errors.push(`Line ${line}: missing name`);
      return;
    }
    rows.push(obj);
  });
  return { rows, errors };
}
