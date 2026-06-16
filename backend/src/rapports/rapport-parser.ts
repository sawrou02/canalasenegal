import { BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

/**
 * Classification of a report row by the value of its "Type" column.
 * Drives how Nombre/Montant are bucketed downstream.
 */
export type RowType = 'recrutement' | 'reabonnement' | 'migration' | 'autre';

export interface ParsedRow {
  /** day key in yyyy-mm-dd form (start-of-day, local) */
  jour: string;
  type: RowType;
  nombre: number;
  montant: number;
}

export interface ParsedFile {
  fichier: string;
  rows: ParsedRow[];
}

/** Required logical columns and the header aliases we accept for each. */
const HEADER_ALIASES: Record<string, string[]> = {
  date: ['date'],
  pdv: ['pdv', 'pdv code', 'pdvcode', 'code pdv'],
  formule: ['formule'],
  type: ['type', 'type operation', 'type operation', 'type d operation'],
  nombre: ['nombre', 'nb', 'quantite'],
  montant: ['montant', 'montant total'],
};

const REQUIRED = ['date', 'pdv', 'formule', 'type', 'nombre', 'montant'];

/** Normalise a header cell: lowercase, strip accents, collapse non-alnum to single spaces. */
function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function classifyType(raw: unknown): RowType {
  // Strip accents first so "Réabonnement" matches /reab/i.
  const v = String(raw ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
  if (/recru|creat/i.test(v)) return 'recrutement';
  if (/reab/i.test(v)) return 'reabonnement';
  if (/migr/i.test(v)) return 'migration';
  return 'autre';
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  // ExcelJS may return a result object for formula cells.
  if (typeof value === 'object') {
    const r = (value as { result?: unknown }).result;
    if (r !== undefined) return toNumber(r);
    return 0;
  }
  const cleaned = String(value).replace(/\s/g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** Build a yyyy-mm-dd local day key from a Date. */
function dayKeyFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Parse a date cell into a yyyy-mm-dd day key.
 * Accepts: Excel Date objects, dd/mm/yyyy, yyyy-mm-dd. Returns null if unparseable.
 */
function parseDayKey(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date && !isNaN(value.getTime())) {
    return dayKeyFromDate(value);
  }
  if (typeof value === 'object') {
    const r = (value as { result?: unknown; text?: unknown }).result;
    if (r !== undefined) return parseDayKey(r);
    const t = (value as { text?: unknown }).text;
    if (t !== undefined) return parseDayKey(t);
    return null;
  }
  const s = String(value).trim();
  // yyyy-mm-dd (optionally with time)
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }
  // dd/mm/yyyy or dd-mm-yyyy
  m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
  if (m) {
    return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return dayKeyFromDate(d);
  return null;
}

/** Convert a yyyy-mm-dd day key to a start-of-day local Date. */
export function dayKeyToDate(key: string): Date {
  const [y, mo, d] = key.split('-').map((x) => parseInt(x, 10));
  return new Date(y, mo - 1, d);
}

/**
 * Parse an uploaded .xlsx buffer into normalised rows.
 * Throws BadRequestException if the file is unreadable or required headers are missing.
 */
export async function parseRapportFile(
  buffer: Buffer,
  originalname: string,
): Promise<ParsedFile> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as any);
  } catch {
    throw new BadRequestException(
      'Fichier illisible: un classeur Excel (.xlsx) valide est attendu.',
    );
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new BadRequestException('Le classeur ne contient aucune feuille.');
  }

  const headerRow = worksheet.getRow(1);
  const colIndex: Record<string, number> = {};
  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    const norm = normalizeHeader(cell.value);
    for (const [logical, aliases] of Object.entries(HEADER_ALIASES)) {
      if (colIndex[logical] !== undefined) continue;
      if (aliases.includes(norm)) {
        colIndex[logical] = col;
      }
    }
  });

  const missing = REQUIRED.filter((k) => colIndex[k] === undefined);
  if (missing.length > 0) {
    throw new BadRequestException(
      `Colonnes manquantes: ${missing.join(', ')}. ` +
        'Colonnes attendues: Date, PDV, Formule, Type, Nombre, Montant.',
    );
  }

  const rows: ParsedRow[] = [];
  for (let r = 2; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    const dateCell = row.getCell(colIndex.date).value;
    const typeCell = row.getCell(colIndex.type).value;
    const nombreCell = row.getCell(colIndex.nombre).value;
    const montantCell = row.getCell(colIndex.montant).value;

    const jour = parseDayKey(dateCell);
    const hasContent =
      dateCell != null || typeCell != null || montantCell != null;
    // Skip fully-empty rows; skip rows with no usable date.
    if (!hasContent || !jour) continue;

    rows.push({
      jour,
      type: classifyType(typeCell),
      nombre: toNumber(nombreCell),
      montant: toNumber(montantCell),
    });
  }

  return { fichier: originalname, rows };
}
