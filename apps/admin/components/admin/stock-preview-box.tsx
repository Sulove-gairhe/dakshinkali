"use client";

import type { StockImpactItem } from "@/lib/admin/stock-impact";

export type StockPreviewBoxProps = {
  items: StockImpactItem[];
  isLoading?: boolean;
  error?: string | null;
};

/**
 * Stock Preview Box Component
 * 
 * Displays read-only preview of pending stock impact (manual deduction pending)
 * from confirmed/processing/shipped orders.
 * 
 * Requirements:
 * - Separate boxes for each order (no merging quantities)
 * - Format: -{quantity} · {customerName} · {orderNumber} · status: {status}
 * - Read-only (no stock mutation)
 * - Handles loading, error, and empty states
 * 
 * @param items - Array of stock impact items to display
 * @param isLoading - Whether data is currently being fetched
 * @param error - Error message if fetch failed
 */
export function StockPreviewBox({
  items,
  isLoading = false,
  error = null,
}: StockPreviewBoxProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
          <span className="text-xs text-gray-500">Loading pending stock impact...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
        <p className="text-xs text-red-600">
          ⚠️ Could not load stock preview: {error}
        </p>
      </div>
    );
  }

  // Empty state - render nothing
  if (!items || items.length === 0) {
    return null;
  }

  // Render separate preview boxes for each order item
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-amber-700">
        Pending stock impact (manual deduction pending):
      </p>
      {items.map((item) => (
        <div
          key={`${item.orderId}-${item.orderNumber}`}
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
        >
          <p className="text-sm text-amber-900">
            <span className="font-semibold">-{item.quantity}</span>
            <span className="mx-1.5 text-amber-600">·</span>
            <span>{item.customerName}</span>
            <span className="mx-1.5 text-amber-600">·</span>
            <span className="font-medium">{item.orderNumber}</span>
            <span className="mx-1.5 text-amber-600">·</span>
            <span className="text-xs text-amber-700">status: {item.status}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
