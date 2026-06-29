import "server-only";

import { createServiceClient } from "@/lib/supabase/service-server";

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
 * Fetches stock impact preview for a single product.
 * 
 * Queries orders JOIN order_items WHERE status IN ('confirmed', 'processing', 'shipped')
 * to show pending stock impact (manual deduction pending).
 * 
 * Uses existing indexes:
 * - idx_orders_status: for filtering order status
 * - idx_order_items_order_id: for JOIN performance
 * 
 * @param productId - UUID of the product to fetch stock impact for
 * @returns Array of StockImpactItem showing pending deductions
 */
export async function getStockImpactPreview(
    productId: string,
): Promise<StockImpactItem[]> {
    const supabase = createServiceClient();

    // Query uses existing indexes: idx_orders_status, idx_order_items_order_id
    // No deleted_at filters (columns don't exist in orders/order_items schema)
    const { data, error } = await supabase
        .from("order_items")
        .select(
            `
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
        .eq("product_id", productId)
        .in("orders.status", ["confirmed", "processing", "shipped"])
        .order("orders.created_at", { ascending: false });

    if (error) {
        throw new Error(`Failed to fetch stock impact preview: ${error.message}`);
    }

    if (!data) {
        return [];
    }

    // Transform nested structure to flat StockImpactItem array
    // Note: TypeScript infers orders as array, but !inner join returns single object
    return data.map((item) => {
        const order = Array.isArray(item.orders) ? item.orders[0] : item.orders;
        return {
            orderId: order.id,
            orderNumber: order.order_number,
            customerName: order.customer_name,
            quantity: item.quantity,
            status: order.status as "confirmed" | "processing" | "shipped",
        };
    });
}
