// Shared helpers for building Umbrella ERP manuals
const {
  Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel,
  AlignmentType, BorderStyle, WidthType, ShadingType, PageBreak,
  LevelFormat, TableOfContents, Bookmark, InternalHyperlink,
  TabStopType, TabStopPosition,
} = require('docx');

const BLUE = "1F4E79";
const LIGHT_BLUE = "D9E2F3";
const LIGHT_GRAY = "F2F2F2";
const DARK_GRAY = "595959";
const BORDER_COLOR = "BFBFBF";

function heading(text, level = HeadingLevel.HEADING_1, pageBreakBefore = false) {
  return new Paragraph({
    heading: level,
    pageBreakBefore,
    children: [new TextRun(text)],
  });
}

function p(text, opts = {}) {
  const runs = Array.isArray(text) ? text : [{ text }];
  return new Paragraph({
    alignment: opts.align,
    spacing: { after: 120 },
    children: runs.map(r => new TextRun({
      text: r.text,
      bold: r.bold,
      italics: r.italics,
      color: r.color,
      size: r.size,
      font: r.font,
    })),
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { after: 60 },
    children: [new TextRun(text)],
  });
}

function bulletRich(runs, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { after: 60 },
    children: runs.map(r => new TextRun({ text: r.text, bold: r.bold, italics: r.italics, color: r.color })),
  });
}

function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbers", level },
    spacing: { after: 80 },
    children: [new TextRun(text)],
  });
}

function codeBlock(text) {
  const lines = text.split('\n');
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: fullBorder("999999"),
            width: { size: 9360, type: WidthType.DXA },
            shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: lines.map(line => new Paragraph({
              spacing: { after: 0, line: 240 },
              children: [new TextRun({ text: line || " ", font: "Consolas", size: 18, color: "1A1A1A" })],
            })),
          }),
        ],
      }),
    ],
  });
}

function screenshotPlaceholder(caption, description) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: fullBorder(BLUE, 12),
            width: { size: 9360, type: WidthType.DXA },
            shading: { fill: "EAF1FB", type: ShadingType.CLEAR },
            margins: { top: 300, bottom: 300, left: 300, right: 300 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 120 },
                children: [new TextRun({ text: "[ CAPTURA DE PANTALLA ]", bold: true, size: 22, color: BLUE })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
                children: [new TextRun({ text: caption, bold: true, size: 20 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: [new TextRun({ text: description, italics: true, size: 18, color: DARK_GRAY })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function callout(kind, title, text) {
  const colors = {
    info:    { fill: "E7F1FB", border: "2E75B6", icon: "ℹ" },
    warning: { fill: "FFF4CE", border: "BF8F00", icon: "⚠" },
    danger:  { fill: "FDECEC", border: "C00000", icon: "✖" },
    tip:     { fill: "E8F5E9", border: "548235", icon: "✓" },
  };
  const c = colors[kind] || colors.info;
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: fullBorder(c.border, 8),
            width: { size: 9360, type: WidthType.DXA },
            shading: { fill: c.fill, type: ShadingType.CLEAR },
            margins: { top: 140, bottom: 140, left: 180, right: 180 },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [new TextRun({ text: `${c.icon} ${title}`, bold: true, size: 20, color: c.border })],
              }),
              new Paragraph({
                spacing: { after: 0 },
                children: [new TextRun({ text, size: 20 })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function fullBorder(color = BORDER_COLOR, size = 4) {
  const b = { style: BorderStyle.SINGLE, size, color };
  return { top: b, bottom: b, left: b, right: b };
}

function simpleTable(headers, rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      borders: fullBorder(BORDER_COLOR),
      width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: BLUE, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({
        children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20 })],
      })],
    })),
  });
  const dataRows = rows.map((row, rIdx) => new TableRow({
    children: row.map((cell, i) => new TableCell({
      borders: fullBorder(BORDER_COLOR),
      width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: rIdx % 2 === 0 ? "FFFFFF" : LIGHT_GRAY, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({
        children: [new TextRun({ text: String(cell), size: 19 })],
      })],
    })),
  }));
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    rows: [headerRow, ...dataRows],
  });
}

function spacer() {
  return new Paragraph({ children: [new TextRun("")], spacing: { after: 80 } });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

const styles = {
  default: {
    document: { run: { font: "Calibri", size: 22 } },
  },
  paragraphStyles: [
    { id: "Title", name: "Title", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 56, bold: true, color: BLUE, font: "Calibri" },
      paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 240, after: 480 } } },
    { id: "Subtitle", name: "Subtitle", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 32, color: DARK_GRAY, font: "Calibri", italics: true },
      paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 240 } } },
    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 40, bold: true, color: BLUE, font: "Calibri" },
      paragraph: { spacing: { before: 480, after: 240 }, outlineLevel: 0 } },
    { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 30, bold: true, color: BLUE, font: "Calibri" },
      paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 1 } },
    { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 26, bold: true, color: "2E75B6", font: "Calibri" },
      paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 } },
    { id: "Heading4", name: "Heading 4", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 22, bold: true, color: DARK_GRAY, font: "Calibri" },
      paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 3 } },
  ],
};

const numbering = {
  config: [
    { reference: "bullets",
      levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        { level: 2, format: LevelFormat.BULLET, text: "▪", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 2160, hanging: 360 } } } },
      ] },
    { reference: "numbers",
      levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.LOWER_LETTER, text: "%2)", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
      ] },
  ],
};

module.exports = {
  heading, p, bullet, bulletRich, numbered, codeBlock, screenshotPlaceholder,
  callout, simpleTable, spacer, pageBreak, styles, numbering,
  BLUE, LIGHT_BLUE, LIGHT_GRAY, DARK_GRAY,
};
