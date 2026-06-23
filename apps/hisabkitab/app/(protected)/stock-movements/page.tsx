import { History } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { HISABKITAB_PERMISSIONS } from "@/lib/auth/permissions";
import { requireHisabKitabPermission } from "@/lib/auth/requireHisabKitabPermission";
import { getInventoryProductOptions } from "@/lib/inventory/inventory.queries";
import {
  getStockMovements,
  type StockMovementFilter,
  type StockMovementRow,
} from "@/lib/inventory/stockMovements.queries";
import { cn } from "@/lib/utils/cn";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const movementTypes = [
  ["all", "All types"],
  ["manual_adjustment", "Manual adjustment"],
  ["correction", "Correction"],
  ["order_commit", "Order commit"],
  ["order_release", "Order release"],
] as const;

const referenceTypes = [
  ["all", "All references"],
  ["order", "Order"],
] as const;

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMetadata(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata);
  if (entries.length === 0) {
    return "None";
  }

  return entries
    .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
    .join(", ");
}

export default async function StockMovementsPage({ searchParams }: PageProps) {
  await requireHisabKitabPermission(HISABKITAB_PERMISSIONS.inventory.view);

  const params = (await searchParams) ?? {};
  const filters: StockMovementFilter = {
    productId: getParam(params, "product_id") || undefined,
    movementType: getParam(params, "movement_type") || undefined,
    referenceType: getParam(params, "reference_type") || undefined,
    from: getParam(params, "from") || undefined,
    to: getParam(params, "to") || undefined,
  };

  let movements: StockMovementRow[];
  let products: Awaited<ReturnType<typeof getInventoryProductOptions>>;
  let errorMessage: string | null = null;

  try {
    [movements, products] = await Promise.all([
      getStockMovements(filters),
      getInventoryProductOptions(),
    ]);
  } catch (error) {
    movements = [];
    products = [];
    errorMessage =
      error instanceof Error ? error.message : "Unable to load stock movements.";
  }

  return (
    <div>
      <PageHeader
        eyebrow="Phase 2C"
        title="Stock Movements"
        description="Append-only stock ledger entries created by HisabKitab stock RPCs."
      />

      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
        <form className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_180px_170px_150px_150px_auto]">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Product</span>
            <select
              name="product_id"
              defaultValue={filters.productId ?? ""}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              <option value="">All products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                  {product.sku ? ` (${product.sku})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Type</span>
            <select
              name="movement_type"
              defaultValue={filters.movementType ?? "all"}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              {movementTypes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Reference</span>
            <select
              name="reference_type"
              defaultValue={filters.referenceType ?? "all"}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              {referenceTypes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">From</span>
            <input
              name="from"
              type="date"
              defaultValue={filters.from ?? ""}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">To</span>
            <input
              name="to"
              type="date"
              defaultValue={filters.to ?? ""}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Filter
            </button>
            <a
              href="/stock-movements"
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

      {!errorMessage && movements.length === 0 ? (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-panel">
          <History className="mx-auto size-8 text-slate-400" />
          <h2 className="mt-3 text-base font-semibold text-slate-950">
            No stock movements found
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Adjust stock from the inventory page to create ledger entries.
          </p>
        </section>
      ) : null}

      {movements.length > 0 ? (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Delta</th>
                  <th className="px-4 py-3">Before / After</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Created by</th>
                  <th className="px-4 py-3">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((movement) => (
                  <tr key={movement.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      {formatDate(movement.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-950">
                        {movement.product_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {movement.product_id}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                        {movement.movement_type}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "font-semibold",
                          movement.quantity_delta > 0
                            ? "text-emerald-700"
                            : "text-red-700",
                        )}
                      >
                        {movement.quantity_delta > 0 ? "+" : ""}
                        {movement.quantity_delta}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {movement.quantity_before} to {movement.quantity_after}
                    </td>
                    <td className="max-w-xs px-4 py-4 text-slate-600">
                      {movement.reason ?? "No reason"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      <p>{movement.reference_type ?? "None"}</p>
                      {movement.reference_id ? (
                        <p className="mt-1 text-xs text-slate-400">
                          {movement.reference_id}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {movement.created_by ?? "System"}
                    </td>
                    <td className="max-w-xs px-4 py-4 text-xs text-slate-500">
                      {formatMetadata(movement.metadata)}
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
