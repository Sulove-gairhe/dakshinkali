import type { StockImpactItem } from "@/lib/inventory/stockImpact.queries";

type StockImpactPreviewProps = {
  items: StockImpactItem[];
};

/**
 * HisabKitab Stock Impact Preview Component
 * 
 * Displays read-only preview of pending stock impact (manual deduction pending)
 * from confirmed/processing/shipped orders.
 * 
 * Requirements:
 * - Separate boxes for each order (no merging quantities)
 * - Format: -{quantity} · {customerName} · {orderNumber} · status: {status}
 * - Read-only (no stock mutation)
 * - Handles empty state gracefully
 * 
 * @param items - Array of stock impact items to display
 */
export function StockImpactPreview({ items }: StockImpactPreviewProps) {
  // Empty state - render nothing
  if (!items || items.length === 0) {
    return null;
  }

  // Render separate preview boxes for each order item
  return (
    <div className="mt-2 space-y-1.5">
      {items.map((item) => (
        <div
          key={`${item.orderId}-${item.orderNumber}`}
          className="rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs"
        >
          <p className="text-amber-900">
            <span className="font-semibold">-{item.quantity}</span>
            <span className="mx-1 text-amber-600">·</span>
            <span>{item.customerName}</span>
            <span className="mx-1 text-amber-600">·</span>
            <span className="font-medium">{item.orderNumber}</span>
            <span className="mx-1 text-amber-600">·</span>
            <span className="text-amber-700">status: {item.status}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
