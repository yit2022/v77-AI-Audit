import { readFileSync } from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readinessByFramework, overallReadiness, type FrameworkKey } from "@/lib/compliance/dashboard";

export type ReportControlRow = {
  code: string;
  title: string;
  status: string;
  euRef: string;
  nistRef: string;
  isoRef: string;
  gdprRef?: string;
};

export type ReportFindingRow = {
  title: string;
  severity: string;
  status: string;
  frameworkRef: string;
};

export type AuditReportInput = {
  orgName: string;
  systemName: string;
  systemDescription: string;
  riskTier: string | null;
  intendedPurpose: string;
  roleInValueChain: string;
  gpai: boolean;
  classificationNotes: string;
  assessmentName: string | null;
  assessmentStatus: string | null;
  controls: ReportControlRow[];
  findings?: ReportFindingRow[];
  frameworkScores?: Partial<Record<FrameworkKey, number>>;
  executiveSummary?: string;
  fairnessRunCount: number;
  redteamSummary: string;
  evidence: Array<{ title: string; filename: string; sha256: string }>;
  auditorOpinion: string | null;
  auditorSummary: string | null;
  generatedAt: Date;
};

/** StandardFonts.Helvetica is WinAnsi; strip/replace unsupported glyphs. */
export function sanitizePdfText(input: string): string {
  return input
    .replace(/\u2014|\u2013/g, "-")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2022|\u00b7|\u2026/g, (ch) => (ch === "\u2026" ? "..." : "-"))
    .replace(/\u2192|\u2190|\u21d2/g, "->")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?");
}

function wrap(text: string, max: number): string[] {
  const words = sanitizePdfText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > max) {
      if (cur) lines.push(cur);
      cur = w.length > max ? w.slice(0, max) : w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

export function buildExecutiveSummary(input: AuditReportInput, overall: number): string {
  if (input.executiveSummary?.trim()) return input.executiveSummary.trim();
  const openFindings = (input.findings || []).filter((f) => f.status === "open" || f.status === "in_progress").length;
  const risk = (input.riskTier ?? "unclassified").replaceAll("_", " ");
  return (
    `${input.systemName} is classified as ${risk} for ${input.orgName}. ` +
    `Overall control readiness is ${overall}%. ` +
    `There are ${openFindings} open finding(s). ` +
    (input.auditorOpinion
      ? `Auditor opinion: ${input.auditorOpinion.replaceAll("_", " ")}.`
      : "Auditor sign-off is pending.")
  );
}

export async function buildAuditReportPdf(input: AuditReportInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const margin = 50;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const brand = rgb(0.435, 0.804, 0.961); // #6FCDF5
  const ink = rgb(0.059, 0.165, 0.290); // #0F2A4A
  const muted = rgb(0.4, 0.45, 0.5);

  const scores =
    input.frameworkScores && Object.keys(input.frameworkScores).length
      ? {
          eu_ai_act: input.frameworkScores.eu_ai_act ?? 0,
          nist: input.frameworkScores.nist ?? 0,
          iso42001: input.frameworkScores.iso42001 ?? 0,
          gdpr: input.frameworkScores.gdpr ?? 0,
        }
      : readinessByFramework(
          input.controls.map((c) => ({
            status: c.status,
            euRef: c.euRef,
            nistRef: c.nistRef,
            isoRef: c.isoRef,
            gdprRef: c.gdprRef || "",
          })),
        );
  const overall = overallReadiness(scores);
  const findings = input.findings || [];

  // Cover
  {
    const page = doc.addPage([pageWidth, pageHeight]);
    page.drawRectangle({ x: 0, y: pageHeight - 160, width: pageWidth, height: 160, color: brand });
    try {
      const markPath = path.join(process.cwd(), "public", "brand", "v77-shield-mark.png");
      const markBytes = readFileSync(markPath);
      const mark = await doc.embedPng(markBytes);
      const markW = 48;
      const markH = (mark.height / mark.width) * markW;
      page.drawImage(mark, { x: margin, y: pageHeight - 70 - markH + 20, width: markW, height: markH });
      page.drawText("V77 Trust", { x: margin + markW + 12, y: pageHeight - 70, size: 26, font: fontBold, color: ink });
      page.drawText("AI Auditor", { x: margin + markW + 12, y: pageHeight - 98, size: 14, font, color: ink });
    } catch {
      page.drawText("V77 Trust", { x: margin, y: pageHeight - 70, size: 28, font: fontBold, color: ink });
      page.drawText("AI Auditor", { x: margin, y: pageHeight - 100, size: 18, font, color: ink });
    }
    page.drawText(sanitizePdfText("Audit Report"), {
      x: margin,
      y: pageHeight - 220,
      size: 22,
      font: fontBold,
      color: ink,
    });
    page.drawText(sanitizePdfText(input.systemName), {
      x: margin,
      y: pageHeight - 255,
      size: 16,
      font: fontBold,
      color: brand,
    });
    page.drawText(sanitizePdfText(input.orgName), { x: margin, y: pageHeight - 280, size: 12, font, color: muted });
    page.drawText(sanitizePdfText(`Generated ${input.generatedAt.toISOString()}`), {
      x: margin,
      y: pageHeight - 310,
      size: 10,
      font,
      color: muted,
    });
    page.drawText(sanitizePdfText(`Overall readiness: ${overall}%`), {
      x: margin,
      y: pageHeight - 350,
      size: 14,
      font: fontBold,
      color: ink,
    });
    page.drawText(
      sanitizePdfText("V77 Trust - Confidential - Not a notified-body certificate."),
      { x: margin, y: 60, size: 8, font, color: muted },
    );
  }

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const ensure = (need: number) => {
    if (y - need < margin) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  const draw = (text: string, opts: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb> } = {}) => {
    const size = opts.size ?? 10;
    const f = opts.bold ? fontBold : font;
    const color = opts.color ?? ink;
    const safe = sanitizePdfText(text);
    ensure(size + 4);
    page.drawText(safe, { x: margin, y: y - size, size, font: f, color, maxWidth: pageWidth - margin * 2 });
    y -= size + 4;
  };

  const section = (title: string) => {
    y -= 8;
    draw(title, { bold: true, size: 13, color: brand });
    y -= 2;
  };

  section("1. Executive summary");
  for (const line of wrap(buildExecutiveSummary(input, overall), 95)) draw(line);

  section("2. Framework scores");
  const labels: Array<[FrameworkKey, string]> = [
    ["eu_ai_act", "EU AI Act"],
    ["nist", "NIST AI RMF"],
    ["iso42001", "ISO/IEC 42001"],
    ["gdpr", "GDPR"],
  ];
  for (const [k, label] of labels) {
    draw(`${label}: ${scores[k]}%`, { bold: true, size: 11 });
  }

  section("3. System profile");
  draw(`Organisation: ${input.orgName}`);
  draw(`System: ${input.systemName}`, { bold: true, size: 12 });
  for (const line of wrap(input.systemDescription || "-", 95)) draw(line, { size: 10 });
  draw(`Risk tier: ${(input.riskTier ?? "unclassified").replaceAll("_", " ")}`);
  draw(`Value-chain role: ${input.roleInValueChain}`);
  draw(`Intended purpose: ${input.intendedPurpose || "-"}`);
  draw(`GPAI: ${input.gpai ? "Yes" : "No"}`);
  if (input.classificationNotes) {
    for (const line of wrap(`Notes: ${input.classificationNotes}`, 95)) draw(line);
  }

  section("4. Control assessment");
  draw(
    input.assessmentName
      ? `${input.assessmentName} - ${(input.assessmentStatus ?? "").replaceAll("_", " ")}`
      : "No assessment linked.",
  );
  for (const c of input.controls) {
    ensure(36);
    draw(`${c.code} - ${c.title}`, { bold: true, size: 10 });
    draw(`Status: ${c.status.replaceAll("_", " ")} | EU ${c.euRef}; NIST ${c.nistRef}; ISO ${c.isoRef}`, {
      size: 9,
      color: muted,
    });
  }
  if (input.controls.length === 0) draw("No controls recorded.");

  section("5. Findings");
  if (findings.length === 0) {
    draw("No findings recorded for this system.");
  } else {
    draw("Title | Severity | Status | Framework", { bold: true, size: 9, color: muted });
    for (const f of findings) {
      draw(
        `${f.title} | ${f.severity} | ${f.status.replaceAll("_", " ")} | ${f.frameworkRef || "-"}`,
        { size: 9 },
      );
    }
  }

  section("6. Technical tests");
  draw(`Fairness runs: ${input.fairnessRunCount}`);
  draw(`Red-team: ${input.redteamSummary}`);

  section("7. Evidence index");
  if (input.evidence.length === 0) {
    draw("No evidence linked to this system.");
  } else {
    for (const e of input.evidence) {
      draw(`${e.title} - ${e.filename} (sha256:${e.sha256.slice(0, 12)}...)`, { size: 9 });
    }
  }

  section("8. Auditor opinion");
  if (input.auditorOpinion) {
    draw(input.auditorOpinion.replaceAll("_", " "), { bold: true });
    for (const line of wrap(input.auditorSummary || "", 95)) draw(line);
  } else {
    draw("Not signed off.");
  }

  y -= 12;
  draw(
    "Generated by V77 Trust - Not a notified-body certificate.",
    { size: 8, color: muted },
  );

  return doc.save();
}
