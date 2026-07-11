import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

interface CourseResultRow {
  courseName: string;
  universityName: string;
  universityState: string;
  cutoffMark: number;
}

export async function generateSearchResultsPdf(
  results: CourseResultRow[],
  searchLabel: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;
  const amber = rgb(0.75, 0.42, 0.1);
  const gray = rgb(0.4, 0.37, 0.34);
  const black = rgb(0.14, 0.12, 0.1);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function newPageIfNeeded(spaceNeeded: number) {
    if (y - spaceNeeded < margin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  }

  // Header
  page.drawText("VarsityLine", { x: margin, y, size: 20, font: fontBold, color: amber });
  y -= 26;
  page.drawText(`Search results: ${searchLabel}`, { x: margin, y, size: 12, font, color: gray });
  y -= 16;
  page.drawText(`Generated ${new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}`, {
    x: margin,
    y,
    size: 9,
    font,
    color: gray,
  });
  y -= 30;

  // Table header
  const col = { course: margin, university: margin + 180, state: margin + 340, cutoff: margin + 430 };
  page.drawText("Course", { x: col.course, y, size: 9, font: fontBold, color: black });
  page.drawText("University", { x: col.university, y, size: 9, font: fontBold, color: black });
  page.drawText("State", { x: col.state, y, size: 9, font: fontBold, color: black });
  page.drawText("Cut-off", { x: col.cutoff, y, size: 9, font: fontBold, color: black });
  y -= 8;
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 0.5,
    color: gray,
  });
  y -= 16;

  // Rows
  for (const row of results) {
    newPageIfNeeded(20);

    const courseText = row.courseName.length > 28 ? row.courseName.slice(0, 26) + "…" : row.courseName;
    const uniText = row.universityName.length > 24 ? row.universityName.slice(0, 22) + "…" : row.universityName;

    page.drawText(courseText, { x: col.course, y, size: 9, font, color: black });
    page.drawText(uniText, { x: col.university, y, size: 9, font, color: black });
    page.drawText(row.universityState, { x: col.state, y, size: 9, font, color: black });
    page.drawText(String(row.cutoffMark), { x: col.cutoff, y, size: 9, font: fontBold, color: amber });

    y -= 20;
  }

  // Footer note
  newPageIfNeeded(40);
  y -= 10;
  page.drawText(
    "Meeting the cut-off does not guarantee admission. Verify details on varsityline before applying.",
    { x: margin, y, size: 8, font, color: gray }
  );

  return pdfDoc.save();
}