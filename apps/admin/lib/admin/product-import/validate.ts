import type { ParsedImportRow, ProductImportPreviewRow } from "./schema";

function isMissingOrNonNegative(value: number | null) {
  return value === null || (Number.isFinite(value) && value >= 0);
}

export function validateImportRows(
  rows: ParsedImportRow[],
  existingProducts: Array<{
    id: string;
    name: string;
    model_name: string | null;
  }>,
): ProductImportPreviewRow[] {
  const byModel = new Map<string, string>();
  const byName = new Map<string, string>();

  for (const product of existingProducts) {
    if (product.model_name?.trim()) {
      byModel.set(product.model_name.trim().toLowerCase(), product.id);
    }
    byName.set(product.name.trim().toLowerCase(), product.id);
  }

  const seenKeys = new Set<string>();

  return rows.map((row) => {
    const errors = [...row.errors];
    const warnings = [...row.warnings];

    if (!row.itemName) errors.push("Item Name is required");
    if (!isMissingOrNonNegative(row.salesPrice)) {
      errors.push("Sales Price must be a number greater than or equal to 0");
    }
    if (!isMissingOrNonNegative(row.purchasePrice)) {
      errors.push("Purchase Price must be a number greater than or equal to 0");
    }
    if (!isMissingOrNonNegative(row.mrp)) {
      errors.push("MRP must be a number greater than or equal to 0");
    }
    if (!isMissingOrNonNegative(row.wholesalePrice)) {
      errors.push("Wholesale Price must be a number greater than or equal to 0");
    }
    if (
      !Number.isInteger(row.quantity) &&
      !errors.some((error) => error.startsWith("Quantity "))
    ) {
      errors.push("Quantity must be a whole number");
    }
    if (!isMissingOrNonNegative(row.stockValue)) {
      errors.push("Stock Value must be a number greater than or equal to 0");
    }

    if (
      row.stockValue !== null &&
      row.computedStockValue !== null &&
      Math.abs(row.stockValue - row.computedStockValue) > 0.01
    ) {
      warnings.push(
        `Stock Value ${row.stockValue} does not match Purchase Price x Quantity (${row.computedStockValue})`,
      );
    }

    if (row.quantity <= 0 && Number.isInteger(row.quantity)) {
      warnings.push("Skipped: quantity is zero or negative");
      return {
        ...row,
        errors: [],
        warnings,
        action: "skipped",
        existingProductId: null,
        valid: false,
      };
    } else if (row.salesPrice === 0 || row.salesPrice === null) {
      warnings.push("Sales price is 0; using DB-safe storefront price 1");
    }
    if (row.mrp === 0) warnings.push("MRP is zero and will be treated as blank");
    if (row.wholesalePrice === 0) {
      warnings.push("Wholesale Price is zero and will be treated as blank");
    }

    const duplicateKey = row.modelName?.trim().toLowerCase() || row.itemName.trim().toLowerCase();
    if (duplicateKey) {
      if (seenKeys.has(duplicateKey)) {
        errors.push("Duplicate row in uploaded CSV");
      }
      seenKeys.add(duplicateKey);
    }

    const existingProductId =
      (row.modelName && byModel.get(row.modelName.trim().toLowerCase())) ||
      byName.get(row.itemName.trim().toLowerCase()) ||
      null;
    const action =
      errors.length > 0
        ? "error"
        : row.quantity <= 0
          ? "skipped"
          : existingProductId
            ? "update draft"
            : "create draft";

    return {
      ...row,
      errors,
      warnings,
      action,
      existingProductId,
      valid: errors.length === 0 && action !== "skipped",
    };
  });
}
