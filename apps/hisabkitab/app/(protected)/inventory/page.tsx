import { PackageSearch } from "lucide-react";
import { StockAdjustmentForm } from "@/components/inventory/StockAdjustmentForm";
import { StockStatusBadge } from "@/components/inventory/StockStatusBadge";
import { StockImpactPreview } from "@/components/inventory/StockImpactPreview";
import { ManualDeductionCard } from "@/components/inventory/ManualDeductionCard";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  HISABKITAB_PERMISSIONS,
  hasPermission,
} from "@/lib/auth/permissions";
import { requireHisabKitabPermission } from "@/lib/auth/requireHisabKitabPermission";
import {
  LOW_STOCK_THRESHOLD,
  getInventoryProducts,
  type InventoryFilter,
  type InventoryProduct,
  type InventoryProductsPage,
  type ProductStatus,
} from "@/lib/inventory/inventory.queries";
import { getBatchStockImpactPreview } from "@/lib/inventory/stockImpact.queries";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type InventoryDeductionPrefill = {
  productId: string;
  deductQty: number;
  sourceOrder: string;
  customer: string;
  searchQuery: string | undefined;
};

const productStatuses: Array<[ProductStatus | "all", string]> = [
  ["all", "All statuses"],
  ["active", "Active"],
  ["low_stock", "Low stock"],
  ["out_of_stock", "Out of stock"],
  ["inactive", "Inactive"],
];

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function getNumberParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = Number(getParam(params, key));
  return Number.isFinite(value) ? value : undefined;
}

function createInventoryHref(
  params: Record<string, string | string[] | undefined>,
  updates: Record<string, string | number | null | undefined>,
) {
  const next = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(params)) {
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (value) {
      next.set(key, value);
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === "") {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
  }

  const query = next.toString();
  return query ? `/inventory?${query}` : "/inventory";
}

/**
 * Parse and validate URL prefill parameters from delivered-order notification links
 * URL format: /inventory?q={product_name}&status=all&stock_view=all&product_id={uuid}&deduct_qty={number}&source_order={order_number}&customer={customer_name}
 * Returns null if any required param is invalid
 */
function parsePrefillParams(
  params: Record<string, string | string[] | undefined>,
): InventoryDeductionPrefill | null {
  const productId = getParam(params, "product_id");
  const deductQtyStr = getParam(params, "deduct_qty");
  const sourceOrder = getParam(params, "source_order");
  const customer = getParam(params, "customer");
  const searchQuery = getParam(params, "q");

  // Validate required params
  if (!productId || typeof productId !== "string" || productId.trim() === "") {
    return null;
  }

  if (!deductQtyStr || typeof deductQtyStr !== "string") {
    return null;
  }

  const deductQty = Number(deductQtyStr);
  if (isNaN(deductQty) || deductQty <= 0) {
    return null;
  }

  if (!sourceOrder || typeof sourceOrder !== "string" || sourceOrder.trim() === "") {
    return null;
  }

  if (!customer || typeof customer !== "string" || customer.trim() === "") {
    return null;
  }

  return {
    productId: productId.trim(),
    deductQty,
    sourceOrder: sourceOrder.trim(),
    customer: customer.trim(),
    searchQuery,
  };

}

function formatDate(value: string | null) {
  if (!value) {
    return "No movement";
  }

  return new Intl.DateTimeFormat("en-NP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const context = await requireHisabKitabPermission(
    HISABKITAB_PERMISSIONS.inventory.view,
  );
  const params = (await searchParams) ?? {};
  const filters: InventoryFilter = {
    search: getParam(params, "q"),
    status: getParam(params, "status"),
    stockView: getParam(params, "stock_view") as InventoryFilter["stockView"],
    page: getNumberParam(params, "page"),
    pageSize: getNumberParam(params, "page_size"),
  };
  const adjustProductId = getParam(params, "adjust");
  const canAdjust = hasPermission(
    context,
    HISABKITAB_PERMISSIONS.inventory.adjust,
  );

  // Parse prefill parameters from delivered-order notification links
  let prefillData: InventoryDeductionPrefill | null = null;
  try {
    prefillData = parsePrefillParams(params);
    if (prefillData) {
      console.log("[INVENTORY_PREFILL_PARSED]", {
        productId: prefillData.productId,
        deductQty: prefillData.deductQty,
        sourceOrder: prefillData.sourceOrder,
        customer: prefillData.customer,
      });
    }
  } catch (error) {
    // Log error but don't fail the page - invalid prefill params are not critical
    console.error("[INVENTORY_PREFILL_PARSE_ERROR]", error);
  }

  let products: InventoryProduct[];
  let pageData: InventoryProductsPage;
  let errorMessage: string | null = null;

  try {
    pageData = await getInventoryProducts(filters);
    products = pageData.products;
  } catch (error) {
    products = [];
    pageData = {
      products: [],
      total: 0,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 25,
      totalPages: 1,
    };
    errorMessage =
      error instanceof Error ? error.message : "Unable to load inventory.";
  }

  // Batch-fetch stock impact preview for all visible products
  const productIds = products.map((p) => p.id);
  let stockImpactMap = new Map<string, Array<{ orderId: string; orderNumber: string; customerName: string; quantity: number; status: "confirmed" | "processing" | "shipped" }>>();
  
  if (productIds.length > 0) {
    try {
      stockImpactMap = await getBatchStockImpactPreview(productIds);
    } catch (error) {
      // Log error but don't fail the page render
      console.error("[STOCK_IMPACT_PREVIEW_ERROR]", error);
    }
  }

  // Resolve product information for prefill if present
  let prefillProduct: {
    name: string | null;
    currentStock: number | null;
    notVisible: boolean;
  } | null = null;

  if (prefillData) {
    const matchingProduct = products.find((p) => p.id === prefillData.productId);
    if (matchingProduct) {
      prefillProduct = {
        name: matchingProduct.name,
        currentStock: matchingProduct.stock_quantity,
        notVisible: false,
      };
    } else {
      // Product not in current filtered results
      prefillProduct = {
        name: null,
        currentStock: null,
        notVisible: true,
      };
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Phase 2C"
        title="Inventory"
        description="Current product stock snapshots with manual stock adjustments through the approved stock RPCs."
      />

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
        <form className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_180px_180px_120px_auto]">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Search</span>
            <input
              name="q"
              defaultValue={filters.search ?? ""}
              placeholder="Name, model, or SKU"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select
              name="status"
              defaultValue={filters.status ?? "all"}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              {productStatuses.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Stock</span>
            <select
              name="stock_view"
              defaultValue={filters.stockView ?? "all"}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              <option value="all">All stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Page size</span>
            <select
              name="page_size"
              defaultValue={String(pageData.pageSize)}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </label>

          <input type="hidden" name="page" value="1" />

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Filter
            </button>
            <a
              href="/inventory"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </a>
          </div>
        </form>
      </section>

      {errorMessage ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </section>
      ) : null}

      {/* Manual Deduction Card - replaces Task 14 debug placeholder */}
      {prefillData && prefillProduct ? (
        <ManualDeductionCard
          productId={prefillData.productId}
          productName={prefillProduct.name}
          currentStock={prefillProduct.currentStock}
          deductQty={prefillData.deductQty}
          sourceOrder={prefillData.sourceOrder}
          customer={prefillData.customer}
          canAdjust={canAdjust}
          productNotVisible={prefillProduct.notVisible}
        />
      ) : null}

      {!errorMessage && products.length === 0 ? (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-panel">
          <PackageSearch className="mx-auto size-8 text-slate-400" />
          <h2 className="mt-3 text-base font-semibold text-slate-950">
            No products found
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Try a different search or stock filter.
          </p>
        </section>
      ) : null}

      {products.length > 0 ? (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span>
              Showing {(pageData.page - 1) * pageData.pageSize + 1}-
              {Math.min(pageData.page * pageData.pageSize, pageData.total)} of{" "}
              {pageData.total}
            </span>
            <div className="flex items-center gap-2">
              <a
                href={createInventoryHref(params, {
                  page: Math.max(pageData.page - 1, 1),
                  adjust: null,
                })}
                aria-disabled={pageData.page <= 1}
                className={`inline-flex h-9 items-center rounded-lg border border-slate-300 px-3 text-sm font-semibold ${
                  pageData.page <= 1
                    ? "pointer-events-none opacity-50"
                    : "hover:bg-white"
                }`}
              >
                Previous
              </a>
              <span className="text-xs font-semibold uppercase text-slate-500">
                Page {pageData.page} of {pageData.totalPages}
              </span>
              <a
                href={createInventoryHref(params, {
                  page: Math.min(pageData.page + 1, pageData.totalPages),
                  adjust: null,
                })}
                aria-disabled={pageData.page >= pageData.totalPages}
                className={`inline-flex h-9 items-center rounded-lg border border-slate-300 px-3 text-sm font-semibold ${
                  pageData.page >= pageData.totalPages
                    ? "pointer-events-none opacity-50"
                    : "hover:bg-white"
                }`}
              >
                Next
              </a>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Model / SKU</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Publishing</th>
                  <th className="px-4 py-3">Last movement</th>
                  <th className="px-4 py-3">Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-950">{product.name}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      <p>{product.model_name ?? "No model"}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {product.sku ?? "No SKU"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-lg font-semibold text-slate-950">
                        {product.stock_quantity}
                      </p>
                      {product.stock_quantity > 0 &&
                      product.stock_quantity <= LOW_STOCK_THRESHOLD ? (
                        <p className="text-xs font-medium text-amber-600">
                          Low stock
                        </p>
                      ) : null}
                      {/* Stock impact preview - pending deductions from active orders */}
                      <StockImpactPreview items={stockImpactMap.get(product.id) ?? []} />
                    </td>
                    <td className="px-4 py-4">
                      <StockStatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-600">
                        {product.publishing_status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(product.last_stock_movement_at)}
                    </td>
                    <td className="min-w-[260px] px-4 py-4">
                      {adjustProductId === product.id ? (
                        <div>
                          <a
                            href={createInventoryHref(params, { adjust: null })}
                            className="mb-3 inline-flex text-sm font-semibold text-slate-500 hover:text-slate-800"
                          >
                            Close adjustment
                          </a>
                          <StockAdjustmentForm
                            productId={product.id}
                            productName={product.name}
                            currentQuantity={product.stock_quantity}
                            status={product.status}
                            canAdjust={canAdjust}
                          />
                        </div>
                      ) : (
                        <a
                          href={createInventoryHref(params, {
                            adjust: product.id,
                          })}
                          className="inline-flex h-9 items-center rounded-lg border border-primary/30 px-3 text-sm font-semibold text-primary transition hover:bg-primary/5"
                        >
                          Adjust stock
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
