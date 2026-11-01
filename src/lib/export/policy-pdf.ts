import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { COMPANY } from "@/lib/company";

export async function markdownToPdf(title: string, markdown: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595, 842]);
  let y = 800;
  const draw = (text: string, size = 11, useBold = false) => {
    const f = useBold ? bold : font;
    const words = text.split(/\s+/);
    let line = "";
    for (const w of words) {
      const trial = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(trial, size) > 500) {
        if (y < 60) {
          page = doc.addPage([595, 842]);
          y = 800;
        }
        page.drawText(line, { x: 48, y, size, font: f, color: rgb(0.1, 0.16, 0.29) });
        y -= size + 4;
        line = w;
      } else line = trial;
    }
    if (line) {
      if (y < 60) {
        page = doc.addPage([595, 842]);
        y = 800;
      }
      page.drawText(line, { x: 48, y, size, font: f, color: rgb(0.1, 0.16, 0.29) });
      y -= size + 6;
    }
  };
  draw(title, 16, true);
  draw(`${COMPANY.productName} · ${COMPANY.legalName}`, 9);
  y -= 8;
  for (const raw of markdown.split("\n")) {
    if (raw.startsWith("# ")) draw(raw.slice(2), 14, true);
    else if (raw.startsWith("## ")) draw(raw.slice(3), 12, true);
    else if (raw.startsWith("- ")) draw(`• ${raw.slice(2)}`, 11);
    else draw(raw || " ", 11);
  }
  return doc.save();
}
