import { createClient } from "@/lib/supabase/server";

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface StockValidationItem {
  productId: string;
  quantity: number;
}

export interface StockValidationIssue {
  productId: string;
  productName: string;
  code: string;
  requestedQuantity: number;
  availableQuantity: number;
  message: string;
}

export interface StockValidationResult {
  valid: boolean;
  issues: StockValidationIssue[];
}

function issue(
  productId: string,
  productName: string,
  code: string,
  requestedQuantity: number,
  availableQuantity: number,
): StockValidationIssue {
  const messages: Record<string, string> = {
    invalid_quantity: "Quantity must be greater than zero.",
    invalid_product_id: "Invalid product ID format.",
    missing: "Product not found.",
    unpublished: "This product is not published.",
    deleted: "This product has been removed.",
    inactive: "This product is not available for purchase.",
    out_of_stock: "This product is out of stock.",
    insufficient_stock: `Only ${Math.max(0, availableQuantity)} unit${Math.max(0, availableQuantity) === 1 ? "" : "s"} available.`,
  };

  return {
    productId,
    productName: productName || "Unknown Product",
    code,
    requestedQuantity,
    availableQuantity,
    message: messages[code] || "This item cannot be added to the cart.",
  };
}

export async function validateCartStock(
  items: StockValidationItem[],
): Promise<StockValidationResult> {
  const issues: StockValidationIssue[] = [];

  if (!items || items.length === 0) {
    return { valid: true, issues: [] };
  }

  const aggregated = new Map<string, number>();
  for (const item of items) {
    if (!item.productId || !UUID_RE.test(item.productId)) {
      issues.push(
        issue(item.productId, "", "invalid_product_id", item.quantity, 0),
      );
      continue;
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      issues.push(
        issue(
          item.productId,
          "",
          "invalid_quantity",
          item.quantity,
          0,
        ),
      );
      continue;
    }

    const current = aggregated.get(item.productId) ?? 0;
    aggregated.set(item.productId, current + item.quantity);
  }

  if (aggregated.size === 0) {
    return { valid: issues.length === 0, issues };
  }

  const supabase = await createClient();
  const productIds = Array.from(aggregated.keys());

  const { data: products, error } = await supabase
    .from("products")
    .select(
      "id, name, status, publishing_status, deleted_at, stock_quantity",
    )
    .in("id", productIds);

  if (error) {
    throw new Error(`Failed to validate stock: ${error.message}`);
  }

  const productMap = new Map(
    (products ?? []).map((p) => [p.id, p]),
  );

  for (const [productId, requestedQuantity] of aggregated) {
    const product = productMap.get(productId);

    if (!product) {
      issues.push(
        issue(productId, "", "missing", requestedQuantity, 0),
      );
      continue;
    }

    const name = product.name ?? "";

    if (product.deleted_at) {
      issues.push(
        issue(productId, name, "deleted", requestedQuantity, 0),
      );
      continue;
    }

    if (product.publishing_status !== "live") {
      issues.push(
        issue(productId, name, "unpublished", requestedQuantity, 0),
      );
      continue;
    }

    if (product.status === "inactive") {
      issues.push(
        issue(productId, name, "inactive", requestedQuantity, 0),
      );
      continue;
    }

    if (product.status === "out_of_stock") {
      issues.push(
        issue(
          productId,
          name,
          "out_of_stock",
          requestedQuantity,
          0,
        ),
      );
      continue;
    }

    const available = product.stock_quantity ?? 0;

    if (requestedQuantity > available) {
      issues.push(
        issue(
          productId,
          name,
          "insufficient_stock",
          requestedQuantity,
          available,
        ),
      );
      continue;
    }
  }

  return { valid: issues.length === 0, issues };
}
