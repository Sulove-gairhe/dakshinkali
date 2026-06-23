import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const LOW_STOCK_THRESHOLD = 5;

export type ProductStatus = "active" | "inactive" | "out_of_stock" | "low_stock";
export type PublishingStatus = "draft" | "live";
export type InventoryFilter = {
  search?: string;
  status?: string;
  stockView?: "all" | "low" | "out";
  page?: number;
  pageSize?: number;
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

export type InventoryProductsPage = {
  products: InventoryProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const INVENTORY_PRODUCT_SELECT =
  "id,name,model_name,sku,stock_quantity,status,publishing_status,deleted_at";

function clampPage(value?: number) {
  if (!value || Number.isNaN(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

function clampPageSize(value?: number) {
  if (!value || Number.isNaN(value)) {
    return 25;
  }

  return Math.min(Math.max(Math.floor(value), 10), 50);
}

function escapeSearchTerm(value: string) {
  return value.replace(/[%_,]/g, (match) => `\\${match}`);
}

export async function getInventoryProducts(
  filters: InventoryFilter = {},
): Promise<InventoryProductsPage> {
  const supabase = await createServerClient();
  const page = clampPage(filters.page);
  const pageSize = clampPageSize(filters.pageSize);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const search = filters.search?.trim();
  let query = supabase
    .from("products")
    .select(INVENTORY_PRODUCT_SELECT, { count: "exact" })
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (search) {
    const term = `%${escapeSearchTerm(search)}%`;
    query = query.or(`name.ilike.${term},model_name.ilike.${term},sku.ilike.${term}`);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.stockView === "low") {
    query = query.gt("stock_quantity", 0).lte("stock_quantity", LOW_STOCK_THRESHOLD);
  }

  if (filters.stockView === "out") {
    query = query.or("stock_quantity.lte.0,status.eq.out_of_stock");
  }

  const { data, error, count } = await query.range(from, to).returns<ProductRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const productIds = rows.map((product) => product.id);
  const lastMovementByProduct = new Map<string, string>();

  if (productIds.length > 0) {
    try {
      const movementClient = createServiceClient();
      const { data: movementRows, error: movementError } = await movementClient
        .from("stock_movements")
        .select("product_id,created_at")
        .in("product_id", productIds)
        .order("created_at", { ascending: false })
        .limit(Math.max(productIds.length * 5, 100))
        .returns<StockMovementDateRow[]>();

      if (!movementError) {
        for (const movement of movementRows ?? []) {
          if (!lastMovementByProduct.has(movement.product_id)) {
            lastMovementByProduct.set(movement.product_id, movement.created_at);
          }
        }
      }
    } catch {
      // Product visibility should not depend on the optional ledger summary.
    }
  }

  const products = rows.map(({ deleted_at: _deletedAt, ...product }) => ({
    ...product,
    last_stock_movement_at: lastMovementByProduct.get(product.id) ?? null,
  }));
  const total = count ?? 0;

  return {
    products,
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

export async function getInventoryProductOptions() {
  const supabase = await createServerClient();
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
