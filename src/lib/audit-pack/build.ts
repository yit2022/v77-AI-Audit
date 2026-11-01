import JSZip from "jszip";
import { COMPANY } from "@/lib/company";

export type AuditPackInput = {
  orgName: string;
  system: {
    id: string;
    name: string;
    riskTier: string | null;
    roleInValueChain: string;
    description: string;
  };
  pdfBytes?: Uint8Array | null;
  evidence: Array<{ id: string; filename: string; sha256: string; createdAt: string }>;
  findings: Array<{ title: string; severity: string; status: string }>;
  annexMarkdown?: string;
};

export async function buildAuditPackZip(input: AuditPackInput): Promise<Uint8Array> {
  const zip = new JSZip();
  const root = zip.folder("v77-audit-pack")!;
  root.file(
    "README.txt",
    [
      `${COMPANY.productName} audit pack`,
      `Organisation: ${input.orgName}`,
      `System: ${input.system.name} (${input.system.id})`,
      `Generated: ${new Date().toISOString()}`,
      `Operator: ${COMPANY.legalName}`,
      "",
      "Contents:",
      "- report.pdf (when available)",
      "- evidence-index.json",
      "- system-summary.json",
      "- annex-iv.md (when completed)",
      "",
      "Not a notified-body certificate or legal advice.",
    ].join("\n"),
  );
  root.file(
    "system-summary.json",
    JSON.stringify(
      {
        system: input.system,
        findings: input.findings,
        generatedAt: new Date().toISOString(),
        operator: COMPANY.legalName,
      },
      null,
      2,
    ),
  );
  root.file(
    "evidence-index.json",
    JSON.stringify(
      {
        count: input.evidence.length,
        items: input.evidence,
      },
      null,
      2,
    ),
  );
  if (input.pdfBytes && input.pdfBytes.byteLength > 0) {
    root.file("report.pdf", input.pdfBytes);
  }
  if (input.annexMarkdown) {
    root.file("annex-iv.md", input.annexMarkdown);
  }
  const out = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  return out;
}
