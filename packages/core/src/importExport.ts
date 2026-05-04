import type { ImportKind } from "./index";

export type ImportExportFormat = "csv" | "json" | "xlsx";

export interface ImportPreviewRow {
  rowNumber: number;
  valid: boolean;
  messages: string[];
  data: Record<string, unknown>;
}

export function previewRows(kind: ImportKind, rows: Array<Record<string, unknown>>): ImportPreviewRow[] {
  return rows.map((row, index) => {
    const messages: string[] = [];
    if (!readPath(row, "title.tr")) messages.push("Türkçe başlık eksik.");
    if (kind !== "categories" && !readPath(row, "description.tr")) messages.push("Türkçe açıklama eksik.");
    return {
      rowNumber: index + 1,
      valid: messages.length === 0,
      messages,
      data: row
    };
  });
}

export function readPath(row: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((value, key) => {
    if (value && typeof value === "object" && key in value) return (value as Record<string, unknown>)[key];
    return undefined;
  }, row);
}

export function writePath(row: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split(".");
  let cursor = row;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      cursor[key] = value;
      return;
    }

    if (!cursor[key] || typeof cursor[key] !== "object" || Array.isArray(cursor[key])) {
      cursor[key] = {};
    }

    cursor = cursor[key] as Record<string, unknown>;
  });

  return row;
}

export function parseJsonRows(input: string): Array<Record<string, unknown>> {
  const parsed = JSON.parse(input);
  if (!Array.isArray(parsed)) throw new Error("JSON import verisi dizi olmalı.");
  return parsed.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error("Her satır nesne olmalı.");
    return row as Record<string, unknown>;
  });
}

export function parseRowsByFormat(format: ImportExportFormat, input: string) {
  if (format === "json") return parseJsonRows(input);
  if (format === "csv") return parseCsvRows(input);
  throw new Error("XLSX import için workbook önce satır matrisine dönüştürülmeli.");
}

export function parseCsvRows(input: string): Array<Record<string, unknown>> {
  const lines = input.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce<Record<string, unknown>>((row, header, index) => {
      writePath(row, header, values[index] ?? "");
      return row;
    }, {});
  });
}

export function parseXlsxMatrixRows(matrix: unknown[][]): Array<Record<string, unknown>> {
  const [headersRow, ...dataRows] = matrix;
  if (!headersRow) return [];
  const headers = headersRow.map((header) => String(header ?? "").trim()).filter(Boolean);

  return dataRows
    .filter((row) => row.some((value) => value !== undefined && value !== null && String(value).trim() !== ""))
    .map((values) => headers.reduce<Record<string, unknown>>((record, header, index) => {
      writePath(record, header, values[index] ?? "");
      return record;
    }, {}));
}

export function exportRowsToCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return "";
  const flatRows = rows.map((row) => flattenRow(row));
  const headers = Array.from(new Set(flatRows.flatMap((row) => Object.keys(row))));
  const body = flatRows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(","));
  return [headers.join(","), ...body].join("\n");
}

export function exportRowsByFormat(format: Exclude<ImportExportFormat, "xlsx">, rows: Array<Record<string, unknown>>) {
  if (format === "json") return JSON.stringify(rows, null, 2);
  return exportRowsToCsv(rows);
}

export function flattenRow(row: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  return Object.entries(row).reduce<Record<string, unknown>>((flat, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(flat, flattenRow(value as Record<string, unknown>, path));
    } else {
      flat[path] = value;
    }
    return flat;
  }, {});
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function escapeCsvValue(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}
