import type { ParsedImportRow } from "./schema";
import { REQUIRED_HEADERS } from "./schema";

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const headerAliases = new Map(
  REQUIRED_HEADERS.map((header) => [normalizeHeader(header), header]),
);

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(text: string): string[][] {
  return text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map(parseCsvLine);
}

function parseMoney(value: string | undefined): number | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const normalized = raw.replace(/[^\d.-]/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function parseQuantity(value: string | undefined): number {
  const parsed = Number((value ?? "").trim());
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

function parseModelName(itemName: string): string | null {
  const model = itemName.split("(")[0]?.trim();
  return model || null;
}

function parseBrandGuess(itemName: string): string | null {
  const match = itemName.match(/\(([^)]+)\)/);
  const firstToken = match?.[1]?.trim().split(/\s+/)[0]?.trim();
  return firstToken || null;
}

function parseCategoryGuess(itemName: string): string | null {
  const match = itemName.match(/\(([^)]+)\)/);
  const tokens = match?.[1]?.trim().split(/\s+/).filter(Boolean) ?? [];
  const category = tokens.slice(1).join(" ").trim();
  return category || null;
}

export function parseProductImportCsv(text: string): {
  rows: ParsedImportRow[];
  errors: string[];
} {
  const records = parseCsv(text);
  if (records.length === 0) {
    return { rows: [], errors: ["CSV file is empty"] };
  }

  const headers = records[0].map((header) => headerAliases.get(normalizeHeader(header)) ?? header);
  const missing = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [`Missing required columns: ${missing.join(", ")}`],
    };
  }

  const headerIndex = new Map(headers.map((header, index) => [header, index]));
  const cell = (record: string[], header: string) => record[headerIndex.get(header) ?? -1] ?? "";

  const rows = records.slice(1).map((record, index): ParsedImportRow => {
    const rowNumber = index + 2;
    const itemName = cell(record, "Item Name").trim();
    const salesPrice = parseMoney(cell(record, "Sales Price"));
    const purchasePrice = parseMoney(cell(record, "Purchase Price"));
    const mrp = parseMoney(cell(record, "MRP"));
    const wholesalePrice = parseMoney(cell(record, "Wholesale Price"));
    const quantity = parseQuantity(cell(record, "Quantity"));
    const stockValue = parseMoney(cell(record, "Stock Value"));
    const computedStockValue =
      Number.isFinite(purchasePrice) && Number.isFinite(quantity)
        ? Number(((purchasePrice ?? 0) * quantity).toFixed(2))
        : null;

    return {
      rowNumber,
      itemName,
      modelName: parseModelName(itemName),
      brandGuess: parseBrandGuess(itemName),
      categoryGuess: parseCategoryGuess(itemName),
      salesPrice,
      purchasePrice,
      mrp,
      wholesalePrice,
      quantity,
      stockValue,
      computedStockValue,
      errors: [],
      warnings: [],
    };
  });

  return { rows, errors: [] };
}
