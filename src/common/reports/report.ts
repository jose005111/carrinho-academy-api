// eslint-disable-next-line @typescript-eslint/no-var-requires
import PDFDocument = require('pdfkit');
// eslint-disable-next-line @typescript-eslint/no-var-requires
import ExcelJS = require('exceljs');
import { Response } from 'express';

export interface ReportColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ReportOptions {
  title: string;
  subtitle?: string;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
}

const ACCENT = '#8a4c72';
const LIGHT_ACCENT = '#f7eef4';

export function setPdfHeaders(res: Response, filename: string): void {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${filename}"`,
  );
}

export function generatePdf(
  res: Response,
  { title, subtitle, columns, rows }: ReportOptions,
): void {
  const doc = new PDFDocument({
    size: 'A4',
    layout: columns.length > 6 ? 'landscape' : 'portrait',
    margin: 32,
    bufferPages: true,
  });

  doc.pipe(res);

  doc
    .rect(0, 0, doc.page.width, 84)
    .fill(ACCENT);
  doc
    .fill('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(18)
    .text(title, 32, 26);

  let y = 104;
  if (subtitle) {
    doc
      .fill('#555555')
      .font('Helvetica')
      .fontSize(10)
      .text(subtitle, 32, 60);
  }

  const pageWidth = doc.page.width - 64;
  const fallback = Math.max(60, pageWidth / columns.length);
  const widths = columns.map((c) => (c.width && c.width > 0 ? c.width : fallback));
  const explicit = widths.reduce((a, b) => a + b, 0);
  widths[widths.length - 1] = Math.max(pageWidth - (explicit - widths[widths.length - 1]), 50);
  const tableWidth = widths.reduce((a, b) => a + b, 0);
  let offsetX = 32;
  const headerHeight = 22;
  const rowHeight = 20;

  function drawHeader() {
    doc.rect(32, y, tableWidth, headerHeight).fill('#e9d5e3');
    doc.font('Helvetica-Bold').fontSize(8.5);
    columns.forEach((col, i) => {
      doc.fill('#3d2132').text(col.header, offsetX + 4, y + 7, {
        width: widths[i],
        ellipsis: true,
      });
      offsetX += widths[i];
    });
    offsetX = 32;
    y += headerHeight;
  }

  function drawRow(row: Record<string, unknown>, rowIndex: number) {
    if (y + rowHeight > doc.page.height - 40) {
      doc.addPage();
      y = 40;
      drawHeader();
    }
    if (rowIndex % 2 === 1) {
      doc.rect(32, y, tableWidth, rowHeight).fill('#fbf5f9');
    }
    doc.font('Helvetica').fontSize(8);
    columns.forEach((col, i) => {
      const value = row[col.key];
      const text = value === null || value === undefined ? '' : String(value);
      doc.fill('#333333').text(text, offsetX + 4, y + 6, {
        width: widths[i] - 8,
        ellipsis: true,
        lineBreak: false,
      });
      offsetX += widths[i];
    });
    offsetX = 32;
    y += rowHeight;
  }

  function drawFooter() {
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      doc
        .fill('#999999')
        .font('Helvetica')
        .fontSize(8)
        .text(
          `Página ${i + 1} de ${range.count} • Gerado em ${new Date().toLocaleString('pt-PT')}`,
          32,
          doc.page.height - 30,
          { width: doc.page.width - 64, align: 'right' },
        );
    }
  }

  drawHeader();
  if (rows.length === 0) {
    doc
      .fill('#999999')
      .font('Helvetica')
      .fontSize(10)
      .text('Sem registos para exibir.', 36, y + 10);
  } else {
    rows.forEach(drawRow);
  }
  drawFooter();
  doc.end();
}

export function setXlsxHeaders(res: Response, filename: string): void {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${filename}"`,
  );
}

export async function generateXlsx(
  res: Response,
  { title, subtitle, columns, rows }: ReportOptions,
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Carinho Academy';
  const sheet = workbook.addWorksheet('Relatorio');

  sheet.mergeCells(1, 1, 1, columns.length);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF3D2132' } };
  sheet.getRow(1).height = 24;

  if (subtitle) {
    sheet.mergeCells(2, 1, 2, columns.length);
    sheet.getCell(2, 1).value = subtitle;
    sheet.getCell(2, 1).font = { italic: true, size: 10, color: { argb: 'FF888888' } };
  }

  const headerRow = sheet.addRow(columns.map((c) => c.header));
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8A4C72' } };
    cell.alignment = { vertical: 'middle' };
  });
  headerRow.height = 20;

  rows.forEach((row) => {
    sheet.addRow(columns.map((c) => row[c.key] ?? ''));
  });

  columns.forEach((col, i) => {
    const headerWidth = col.width && col.width > 0 ? col.width : col.header.length + 12;
    let maxLen = headerWidth;
    rows.forEach((row) => {
      const v = row[col.key];
      if (v !== null && v !== undefined) {
        maxLen = Math.max(maxLen, String(v).length + 4);
      }
    });
    sheet.getColumn(i + 1).width = Math.min(maxLen, 60);
  });

  await workbook.xlsx.write(res);
  res.end();
}

export function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export interface ParsedImport {
  headers: string[];
  rows: Record<string, string>[];
}

export interface ImportIssue {
  linha: number;
  motivo: string;
}

export interface ImportReport {
  message: string;
  total: number;
  importados: number;
  repetidos: number;
  invalidos: number;
  erros: ImportIssue[];
}

export async function parseImportFile(
  file: Express.Multer.File | undefined,
): Promise<ParsedImport> {
  if (!file) {
    throw new Error('Nenhum ficheiro foi enviado.');
  }

  const mime = file.mimetype || '';
  const ext = file.originalname?.split('.').pop()?.toLowerCase() ?? '';

  const normalize = (s: string): string =>
    s
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

  if (mime.includes('spreadsheetml') || ext === 'xlsx') {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as unknown as ExcelJS.Buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error('O ficheiro Excel está vazio.');

    const headers: string[] = [];
    let headerRowNumber = 1;
    let foundHeader = false;
    sheet.eachRow((row, rowNumber) => {
      if (foundHeader) return;
      const raw: string[] = [];
      row.eachCell((cell, col) => {
        raw[col - 1] = String(cell.value ?? '');
      });
      const nonEmpty = raw.filter((v) => v.trim() !== '');
      if (nonEmpty.length === 0) return;
      const distinct = new Set(nonEmpty.map((v) => normalize(v)));
      if (nonEmpty.length >= 2 && distinct.size === 1) return;
      foundHeader = true;
      headerRowNumber = rowNumber;
    });
    sheet.getRow(headerRowNumber).eachCell((cell, col) => {
      headers[col - 1] = normalize(String(cell.value ?? ''));
    });
    if (headers.length === 0 || headers.every((h) => h === '')) {
      throw new Error('O ficheiro deve conter uma linha de cabeçalhos.');
    }

    const rows: Record<string, string>[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowNumber) return;
      const values = headers.map((h, i) => {
        const v = row.getCell(i + 1).value;
        return v === null || v === undefined ? '' : String(v);
      });
      if (values.every((v) => v.trim() === '')) return;
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = values[i];
      });
      rows.push(obj);
    });
    return { headers, rows };
  }

  if (mime.includes('csv') || ext === 'csv') {
    const text = file.buffer.toString('utf8');
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
    if (lines.length === 0) throw new Error('O ficheiro CSV está vazio.');
    const split = (line: string): string[] => {
      const cells: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (const ch of line) {
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          cells.push(cur);
          cur = '';
        } else {
          cur += ch;
        }
      }
      cells.push(cur);
      return cells.map((c) => c.replace(/^"|"$/g, ''));
    };
    const headers = split(lines[0]).map(normalize);
    const rows: Record<string, string>[] = [];
    for (const line of lines.slice(1)) {
      const values = split(line);
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] ?? '';
      });
      if (Object.values(obj).some((v) => v.trim() !== '')) {
        rows.push(obj);
      }
    }
    return { headers, rows };
  }

  throw new Error(
    'Formato de ficheiro não suportado. Envie um ficheiro .xlsx ou .csv.',
  );
}
