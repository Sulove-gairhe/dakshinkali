import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

const STOCK_IMPACT_PRODUCT_BATCH_SIZE = 100;

/**
 * Represents a single stock impact item from an active order.
 * Shows pending stock impact (manual deduction pending) from confirmed/processing/shipped orders.
 */
export type StockImpactItem = {
    orderId: string;
    orderNumber: string;
    customerName: string;
    quantity: number;
    status: "confirmed" | "processing" | "shipped";
};

/**
 * Batch-fetches stock impact preview for multiple products efficiently.
 * 
 * Queries orders JOIN order_items WHERE status IN ('confirmed', 'processing', 'shipped')
 * for all provided product IDs in a single query.
 * 
 * Uses existing indexes:
 * - idx_orders_status: for filtering order status
 * - idx_order_items_order_id: for JOIN performance
 * 
 * @param productIds - Array of product UUIDs to fetch stock impact for
 * @returns Map of productId -> array of StockImpactItem showing pending deductions
 */
export async function getBatchStockImpactPreview(
    productIds: string[],
): Promise<Map<string, StockImpactItem[]>> {
    if (productIds.length === 0) {
        return new Map();
    }

    try {
        const supabase = createServiceClient();
        const productIdBatches: string[][] = [];

        for (
            let index = 0;
            index < productIds.length;
            index += STOCK_IMPACT_PRODUCT_BATCH_SIZE
        ) {
            productIdBatches.push(
                productIds.slice(index, index + STOCK_IMPACT_PRODUCT_BATCH_SIZE),
            );
        }

        // Batch query uses existing indexes: idx_orders_status, idx_order_items_order_id
        // No deleted_at filters (columns don't exist in orders/order_items schema)
        const dataBatches = await Promise.all(
            productIdBatches.map(async (productIdBatch) => {
                const { data, error } = await supabase
                    .from("order_items")
                    .select(
                        `
      product_id,
      quantity,
      order_id,
      orders!inner(
        id,
        order_number,
        customer_name,
        status
      )
    `,
                    )
                    .in("product_id", productIdBatch)
                    .in("orders.status", ["confirmed", "processing", "shipped"])
                    .order("created_at", {
                        ascending: false,
                        referencedTable: "orders",
                    });

                if (error) {
                    throw new Error(
                        `Failed to batch fetch stock impact preview: ${error.message}`,
                    );
                }

                return data ?? [];
            }),
        );

        // Group results by product_id
        const resultMap = new Map<string, StockImpactItem[]>();

        for (const data of dataBatches) {
            for (const item of data) {
                if (!item.product_id) {
                    continue; // Skip items with null product_id (deleted products)
                }

                // Note: TypeScript infers orders as array, but !inner join returns single object
                const order = Array.isArray(item.orders) ? item.orders[0] : item.orders;

                const stockImpactItem: StockImpactItem = {
                    orderId: order.id,
                    orderNumber: order.order_number,
                    customerName: order.customer_name,
                    quantity: item.quantity,
                    status: order.status as "confirmed" | "processing" | "shipped",
                };

                const existingItems = resultMap.get(item.product_id) ?? [];
                existingItems.push(stockImpactItem);
                resultMap.set(item.product_id, existingItems);
            }
        }

        return resultMap;
    } catch (error) {
        // Graceful degradation - return empty map if query fails
        // This allows inventory page to still render
        console.error("[BATCH_STOCK_IMPACT_PREVIEW_ERROR]", error);
        return new Map();
    }
}
