import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";

interface CourseResultRow {
  courseName: string;
  universityName: string;
  universityState: string;
  cutoffMark: number;
}

/**
 * Truncates text to fit within maxWidth, measuring actual glyph widths
 * with the given font/size rather than guessing by character count.
 * PDF fonts aren't monospace, so a fixed character limit either cuts
 * text too early (wasting space) or too late (overflowing/overlapping
 * the next column) depending on which letters happen to be in the string.
 */
function truncateToWidth(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;

  const ellipsis = "…";
  const ellipsisWidth = font.widthOfTextAtSize(ellipsis, size);

  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const candidateWidth = font.widthOfTextAtSize(text.slice(0, mid), size) + ellipsisWidth;
    if (candidateWidth <= maxWidth) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return text.slice(0, low).trimEnd() + ellipsis;
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
  const rowFontSize = 9;

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

  // Table columns — widened University since it's the tightest column
  // (long official names + abbreviations in parentheses, e.g.
  // "University of Lagos (UNILAG)"). Course narrowed slightly to
  // compensate, State/Cutoff stay compact since their content is short.
  const col = { course: margin, university: margin + 165, state: margin + 375, cutoff: margin + 435 };
  const colWidth = {
    course: col.university - col.course - 10,
    university: col.state - col.university - 10,
    state: col.cutoff - col.state - 10,
  };

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

  // Sort alphabetically by university name before rendering
  const sortedResults = results
    .slice()
    .sort((a, b) => a.universityName.localeCompare(b.universityName));

  // Rows
  for (const row of sortedResults) {
    newPageIfNeeded(20);

    const courseText = truncateToWidth(row.courseName, font, rowFontSize, colWidth.course);
    const uniText = truncateToWidth(row.universityName, font, rowFontSize, colWidth.university);

    page.drawText(courseText, { x: col.course, y, size: rowFontSize, font, color: black });
    page.drawText(uniText, { x: col.university, y, size: rowFontSize, font, color: black });
    page.drawText(row.universityState, { x: col.state, y, size: rowFontSize, font, color: black });
    page.drawText(String(row.cutoffMark), { x: col.cutoff, y, size: rowFontSize, font: fontBold, color: amber });

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
