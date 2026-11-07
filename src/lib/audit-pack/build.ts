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
    intendedPurpose?: string;
    domain?: string;
    versionLabel?: string;
    euDatabaseId?: string;
    classificationNotes?: string | null;
  };
  pdfBytes?: Uint8Array | null;
  evidence: Array<{ id: string; filename: string; sha256: string; createdAt: string }>;
  findings: Array<{ title: string; severity: string; status: string }>;
  annexMarkdown?: string;
  modelCardMarkdown?: string;
  declarationOfConformityMarkdown?: string;
  euDatabaseRegistrationJson?: Record<string, unknown>;
  impactAssessments?: Array<Record<string, unknown>>;
  technicalTests?: Record<string, unknown>;
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
      "- annex-iv.md (EU AI Act Art. 11 / Annex IV technical documentation)",
      "- model-card.md (EU AI Act Art. 13 Instructions for Use & Art. 53 Model Card)",
      "- eu-declaration-of-conformity-art47.md (EU AI Act Art. 47 / Annex V declaration template)",
      "- eu-database-registration-art49.json (EU AI Act Art. 49 / Annex VIII registration payload)",
      "- evidence-index.json (SHA-256 hash-chained evidence manifest)",
      "- system-summary.json",
      "- impact-assessments.json (Art. 27 FRIA & GDPR Art. 35 DPIA records)",
      "- technical-tests-summary.json (Fairness, Red-Team & Scored Eval runs)",
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
  if (input.modelCardMarkdown) {
    root.file("model-card.md", input.modelCardMarkdown);
  }
  if (input.declarationOfConformityMarkdown) {
    root.file("eu-declaration-of-conformity-art47.md", input.declarationOfConformityMarkdown);
  }
  if (input.euDatabaseRegistrationJson) {
    root.file("eu-database-registration-art49.json", JSON.stringify(input.euDatabaseRegistrationJson, null, 2));
  }
  if (input.impactAssessments) {
    root.file("impact-assessments.json", JSON.stringify({ items: input.impactAssessments }, null, 2));
  }
  if (input.technicalTests) {
    root.file("technical-tests-summary.json", JSON.stringify(input.technicalTests, null, 2));
  }
  const out = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  return out;
}
