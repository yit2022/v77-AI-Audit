import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { sanitizePdfText } from "@/lib/reports/pdf";
import type { FrameworkKey } from "@/lib/compliance/dashboard";

export type BoardReportInput = {
  orgName: string;
  generatedAt: Date;
  overallReadiness: number;
  frameworkScores: Record<FrameworkKey, number>;
  openFindings: number;
  criticalFindings: number;
  systemsCount: number;
  evidenceCount: number;
  overdueEvidenceRequests: number;
  topRisks: Array<{ title: string; severity: string }>;
  partnerName?: string | null;
  primaryColor?: string;
};

function hexToRgb(hex: string) {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(n)) return rgb(0.059, 0.165, 0.29);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
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
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

/** Landscape, PPTX-style board pack as PDF (no email send). */
export async function buildBoardReportPdf(input: BoardReportInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const W = 842; // A4 landscape
  const H = 595;
  const brand = hexToRgb(input.primaryColor || "#0F2A4A");
  const accent = rgb(0.435, 0.804, 0.961);
  const ink = rgb(0.059, 0.165, 0.29);
  const muted = rgb(0.4, 0.45, 0.5);
  const white = rgb(1, 1, 1);

  function slide(title: string) {
    const page = doc.addPage([W, H]);
    page.drawRectangle({ x: 0, y: H - 64, width: W, height: 64, color: brand });
    page.drawText(sanitizePdfText(title), {
      x: 40,
      y: H - 42,
      size: 18,
      font: fontBold,
      color: white,
    });
    page.drawRectangle({ x: 0, y: 0, width: W, height: 28, color: brand });
    const foot = sanitizePdfText(
      `${input.partnerName ? input.partnerName + " · " : ""}V77 Trust · Vertex77 · ${input.generatedAt.toISOString().slice(0, 10)}`,
    );
    page.drawText(foot, { x: 40, y: 10, size: 9, font, color: white });
    return page;
  }

  // 1 Cover
  {
    const page = doc.addPage([W, H]);
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: brand });
    page.drawRectangle({ x: 0, y: H - 12, width: W, height: 12, color: accent });
    page.drawText(sanitizePdfText("Executive board pack"), {
      x: 60,
      y: H - 160,
      size: 28,
      font: fontBold,
      color: white,
    });
    page.drawText(sanitizePdfText(input.orgName), {
      x: 60,
      y: H - 210,
      size: 22,
      font: fontBold,
      color: accent,
    });
    page.drawText(sanitizePdfText("AI governance readiness · confidential"), {
      x: 60,
      y: H - 250,
      size: 12,
      font,
      color: white,
    });
    page.drawText(sanitizePdfText(`Generated ${input.generatedAt.toISOString().slice(0, 10)}`), {
      x: 60,
      y: 60,
      size: 11,
      font,
      color: white,
    });
  }

  // 2 Snapshot KPIs
  {
    const page = slide("1. Snapshot");
    const cards: Array<[string, string]> = [
      ["Overall readiness", `${input.overallReadiness}%`],
      ["AI systems", String(input.systemsCount)],
      ["Open findings", String(input.openFindings)],
      ["Critical findings", String(input.criticalFindings)],
      ["Evidence items", String(input.evidenceCount)],
      ["Overdue evidence tasks", String(input.overdueEvidenceRequests)],
    ];
    cards.forEach(([label, value], i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 40 + col * 260;
      const y = H - 180 - row * 140;
      page.drawRectangle({ x, y: y - 80, width: 240, height: 100, color: rgb(0.95, 0.97, 0.99), borderColor: accent, borderWidth: 1 });
      page.drawText(sanitizePdfText(label), { x: x + 16, y: y - 20, size: 11, font, color: muted });
      page.drawText(sanitizePdfText(value), { x: x + 16, y: y - 55, size: 28, font: fontBold, color: ink });
    });
  }

  // 3 Framework readiness
  {
    const page = slide("2. Framework readiness");
    const labels: Array<[FrameworkKey, string]> = [
      ["eu_ai_act", "EU AI Act"],
      ["nist", "NIST AI RMF"],
      ["iso42001", "ISO/IEC 42001"],
      ["gdpr", "GDPR (AI-related)"],
      ["dora", "DORA"],
      ["iso27001", "ISO/IEC 27001"],
    ];
    labels.forEach(([key, label], i) => {
      const y = H - 120 - i * 55;
      const score = input.frameworkScores[key] ?? 0;
      page.drawText(sanitizePdfText(label), { x: 50, y, size: 12, font: fontBold, color: ink });
      page.drawRectangle({ x: 220, y: y - 4, width: 480, height: 18, color: rgb(0.9, 0.92, 0.94) });
      page.drawRectangle({ x: 220, y: y - 4, width: Math.max(4, (480 * score) / 100), height: 18, color: accent });
      page.drawText(`${score}%`, { x: 710, y, size: 12, font: fontBold, color: ink });
    });
  }

  // 4 Top risks
  {
    const page = slide("3. Top open risks");
    if (!input.topRisks.length) {
      page.drawText("No open findings in the current snapshot.", { x: 50, y: H - 140, size: 13, font, color: muted });
    } else {
      input.topRisks.slice(0, 8).forEach((r, i) => {
        const y = H - 120 - i * 42;
        page.drawText(sanitizePdfText(`${i + 1}. [${r.severity}]`), {
          x: 50,
          y,
          size: 12,
          font: fontBold,
          color: ink,
        });
        const lines = wrap(r.title, 90);
        page.drawText(lines[0], { x: 160, y, size: 12, font, color: ink });
      });
    }
  }

  // 5 Ask / next steps
  {
    const page = slide("4. Board asks");
    const bullets = [
      "Confirm residual risk appetite for high-risk AI systems still below target readiness.",
      "Fund overdue evidence collection tasks and assign accountable owners this quarter.",
      "Prioritise remediation of critical/high findings before the next audit cycle.",
      "Review partner / vendor ICT third-party risk where DORA or ISO 27001 applies.",
    ];
    bullets.forEach((b, i) => {
      const y = H - 130 - i * 55;
      page.drawText(sanitizePdfText(`•  ${b}`), { x: 50, y, size: 13, font, color: ink, maxWidth: 740 });
    });
  }

  return doc.save();
}
