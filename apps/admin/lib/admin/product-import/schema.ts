export type ImportAction = "create live" | "update live" | "skipped" | "error";

export interface ParsedImportRow {
  rowNumber: number;
  itemName: string;
  modelName: string | null;
  brandGuess: string | null;
  categoryGuess: string | null;
  salesPrice: number | null;
  purchasePrice: number | null;
  mrp: number | null;
  wholesalePrice: number | null;
  quantity: number;
  stockValue: number | null;
  computedStockValue: number | null;
  errors: string[];
  warnings: string[];
}

export interface ProductImportPreviewRow extends ParsedImportRow {
  action: ImportAction;
  existingProductId: string | null;
  valid: boolean;
}

export interface ProductImportPreview {
  rows: ProductImportPreviewRow[];
  summary: {
    createdLive: number;
    updatedLive: number;
    skipped: number;
    errors: number;
    warnings: number;
  };
}

export interface ProductImportCommitSummary {
  createdLive: number;
  updatedLive: number;
  skipped: number;
  errors: number;
  warnings: number;
  errorRows: Array<{ rowNumber: number; itemName: string; messages: string[] }>;
}

export const REQUIRED_HEADERS = [
  "Item Name",
  "Sales Price",
  "Purchase Price",
  "MRP",
  "Wholesale Price",
  "Quantity",
  "Stock Value",
] as const;
