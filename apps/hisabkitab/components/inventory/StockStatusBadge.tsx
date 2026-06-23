import { cn } from "@/lib/utils/cn";
import type { ProductStatus } from "@/lib/inventory/inventory.queries";

const statusLabels: Record<ProductStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  out_of_stock: "Out of stock",
  low_stock: "Low stock",
};

const statusClasses: Record<ProductStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  inactive: "bg-slate-100 text-slate-600 ring-slate-200",
  out_of_stock: "bg-red-50 text-red-700 ring-red-100",
  low_stock: "bg-amber-50 text-amber-700 ring-amber-100",
};

export function StockStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1",
        statusClasses[status] ?? statusClasses.inactive,
      )}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}
