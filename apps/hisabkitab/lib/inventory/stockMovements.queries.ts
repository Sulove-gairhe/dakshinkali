import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

export type StockMovementFilter = {
  productId?: string;
  movementType?: string;
  referenceType?: string;
  from?: string;
  to?: string;
};

export type StockMovementRow = {
  id: string;
  product_id: string;
  product_name: string;
  movement_type: string;
  quantity_delta: number;
  quantity_before: number;
  quantity_after: number;
  reason: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_by: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
};

type MovementDbRow = Omit<StockMovementRow, "product_name">;
type ProductNameRow = {
  id: string;
  name: string;
};

export const STOCK_MOVEMENT_SELECT =
  "id,product_id,movement_type,quantity_delta,quantity_before,quantity_after,reason,reference_type,reference_id,created_by,created_at,metadata";

export async function getStockMovements(
  filters: StockMovementFilter = {},
): Promise<StockMovementRow[]> {
  const supabase = createServiceClient();
  let query = supabase
    .from("stock_movements")
    .select(STOCK_MOVEMENT_SELECT)
    .order("created_at", { ascending: false })
    .limit(500);

  if (filters.productId) {
    query = query.eq("product_id", filters.productId);
  }

  if (filters.movementType && filters.movementType !== "all") {
    query = query.eq("movement_type", filters.movementType);
  }

  if (filters.referenceType && filters.referenceType !== "all") {
    query = query.eq("reference_type", filters.referenceType);
  }

  if (filters.from) {
    query = query.gte("created_at", `${filters.from}T00:00:00.000Z`);
  }

  if (filters.to) {
    query = query.lte("created_at", `${filters.to}T23:59:59.999Z`);
  }

  const { data, error } = await query.returns<MovementDbRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const productIds = Array.from(new Set(rows.map((row) => row.product_id)));
  const productNames = new Map<string, string>();

  if (productIds.length > 0) {
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id,name")
      .in("id", productIds)
      .returns<ProductNameRow[]>();

    if (productsError) {
      throw new Error(productsError.message);
    }

    for (const product of products ?? []) {
      productNames.set(product.id, product.name);
    }
  }

  return rows.map((row) => ({
    ...row,
    product_name: productNames.get(row.product_id) ?? "Unknown product",
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? row.metadata
        : {},
  }));
}
