import { PackageSearch } from "lucide-react";
import { StockAdjustmentForm } from "@/components/inventory/StockAdjustmentForm";
import { StockStatusBadge } from "@/components/inventory/StockStatusBadge";
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
  type ProductStatus,
} from "@/lib/inventory/inventory.queries";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
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
  };
  const canAdjust = hasPermission(
    context,
    HISABKITAB_PERMISSIONS.inventory.adjust,
  );

  let products: InventoryProduct[];
  let errorMessage: string | null = null;

  try {
    products = await getInventoryProducts(filters);
  } catch (error) {
    products = [];
    errorMessage =
      error instanceof Error ? error.message : "Unable to load inventory.";
  }

  return (
    <div>
      <PageHeader
        eyebrow="Phase 2C"
        title="Inventory"
        description="Current product stock snapshots with manual stock adjustments through the approved stock RPCs."
      />

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
        <form className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_180px_auto]">
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
                    <td className="min-w-[320px] px-4 py-4">
                      <details>
                        <summary className="cursor-pointer text-sm font-semibold text-primary">
                          Adjust stock
                        </summary>
                        <div className="mt-3">
                          <StockAdjustmentForm
                            productId={product.id}
                            productName={product.name}
                            currentQuantity={product.stock_quantity}
                            status={product.status}
                            canAdjust={canAdjust}
                          />
                        </div>
                      </details>
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
