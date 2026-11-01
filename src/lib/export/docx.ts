import JSZip from "jszip";

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Minimal OOXML .docx from plain text / markdown-ish lines. */
export async function markdownToDocx(title: string, markdown: string): Promise<Uint8Array> {
  const paragraphs = markdown.split(/\n/).map((line) => {
    const text = escapeXml(line || " ");
    const bold = line.startsWith("#");
    const content = bold ? line.replace(/^#+\s*/, "") : line;
    const esc = escapeXml(content || " ");
    if (bold) {
      return `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${esc}</w:t></w:r></w:p>`;
    }
    return `<w:p><w:r><w:t xml:space="preserve">${text === "" ? " " : text}</w:t></w:r></w:p>`;
  });

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>${escapeXml(title)}</w:t></w:r></w:p>
    ${paragraphs.join("\n")}
    <w:sectPr/>
  </w:body>
</w:document>`;

  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  );
  zip.folder("_rels")!.file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  );
  zip.folder("word")!.file("document.xml", documentXml);
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
