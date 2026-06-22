import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

export const LOW_STOCK_THRESHOLD = 5;

export type ProductStatus = "active" | "inactive" | "out_of_stock" | "low_stock";
export type PublishingStatus = "draft" | "live";
export type InventoryFilter = {
  search?: string;
  status?: string;
  stockView?: "all" | "low" | "out";
};

export type InventoryProduct = {
  id: string;
  name: string;
  model_name: string | null;
  sku: string | null;
  stock_quantity: number;
  status: ProductStatus;
  publishing_status: PublishingStatus;
  last_stock_movement_at: string | null;
};

type ProductRow = Omit<InventoryProduct, "last_stock_movement_at"> & {
  deleted_at: string | null;
};

type StockMovementDateRow = {
  product_id: string;
  created_at: string;
};

export const INVENTORY_PRODUCT_SELECT =
  "id,name,model_name,sku,stock_quantity,status,publishing_status,deleted_at";

function normalizeSearch(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function matchesSearch(product: ProductRow, search: string) {
  if (!search) {
    return true;
  }

  return [product.name, product.model_name, product.sku].some((value) =>
    value?.toLowerCase().includes(search),
  );
}

function matchesStockView(product: ProductRow, stockView: InventoryFilter["stockView"]) {
  if (stockView === "low") {
    return product.stock_quantity > 0 && product.stock_quantity <= LOW_STOCK_THRESHOLD;
  }

  if (stockView === "out") {
    return product.stock_quantity <= 0 || product.status === "out_of_stock";
  }

  return true;
}

export function filterInventoryRows(
  rows: ProductRow[],
  filters: InventoryFilter,
) {
  const search = normalizeSearch(filters.search);
  const status = filters.status?.trim();

  return rows.filter((product) => {
    if (product.deleted_at) {
      return false;
    }

    if (status && status !== "all" && product.status !== status) {
      return false;
    }

    return matchesSearch(product, search) && matchesStockView(product, filters.stockView);
  });
}

export async function getInventoryProducts(
  filters: InventoryFilter = {},
): Promise<InventoryProduct[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("products")
    .select(INVENTORY_PRODUCT_SELECT)
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .limit(1000)
    .returns<ProductRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const filtered = filterInventoryRows(data ?? [], filters);
  const productIds = filtered.map((product) => product.id);
  const lastMovementByProduct = new Map<string, string>();

  if (productIds.length > 0) {
    const { data: movementRows, error: movementError } = await supabase
      .from("stock_movements")
      .select("product_id,created_at")
      .in("product_id", productIds)
      .order("created_at", { ascending: false })
      .limit(Math.max(productIds.length * 5, 100))
      .returns<StockMovementDateRow[]>();

    if (movementError) {
      throw new Error(movementError.message);
    }

    for (const movement of movementRows ?? []) {
      if (!lastMovementByProduct.has(movement.product_id)) {
        lastMovementByProduct.set(movement.product_id, movement.created_at);
      }
    }
  }

  return filtered.map(({ deleted_at: _deletedAt, ...product }) => ({
    ...product,
    last_stock_movement_at: lastMovementByProduct.get(product.id) ?? null,
  }));
}

export async function getInventoryProductOptions() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("products")
    .select("id,name,model_name,sku,status,stock_quantity,deleted_at")
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .limit(1000)
    .returns<
      Array<{
        id: string;
        name: string;
        model_name: string | null;
        sku: string | null;
        status: ProductStatus;
        stock_quantity: number;
        deleted_at: string | null;
      }>
    >();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
