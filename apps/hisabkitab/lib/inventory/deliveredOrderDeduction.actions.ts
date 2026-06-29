"use server";

import { revalidatePath } from "next/cache";
import { HISABKITAB_PERMISSIONS } from "@/lib/auth/permissions";
import { requireHisabKitabPermission } from "@/lib/auth/requireHisabKitabPermission";
import { createServiceClient } from "@/lib/supabase/service";
import { mapStockRpcError, type ActionResult } from "./stockActionHelpers";

type ProductStockRow = {
    id: string;
    name: string;
    status: string;
    deleted_at: string | null;
    stock_quantity: number;
};

const initialError = "Stock deduction could not be saved.";

/**
 * Execute delivered-order manual stock deduction
 * This uses the existing manual stock adjustment RPC (hisabkitab_adjust_stock)
 * and encodes the source order/customer context into the reason field.
 * 
 * CRITICAL: This does NOT create a new RPC or modify existing RPC signatures.
 * It calls the approved manual adjustment flow with source context in the reason.
 */
export async function executeDeliveredOrderDeduction(
    _previousState: ActionResult,
    formData: FormData,
): Promise<ActionResult> {
    const context = await requireHisabKitabPermission(
        HISABKITAB_PERMISSIONS.inventory.adjust,
    );

    // Extract prefill data from form
    const productId = formData.get("product_id")?.toString().trim();
    const quantityStr = formData.get("quantity")?.toString().trim();
    const sourceOrder = formData.get("source_order")?.toString().trim();
    const customer = formData.get("customer")?.toString().trim();

    // Validate required fields
    if (!productId || !quantityStr || !sourceOrder || !customer) {
        return {
            status: "error",
            message: "Missing required deduction information.",
        };
    }

    const quantity = Number(quantityStr);
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
        return {
            status: "error",
            message: "Deduction quantity must be a positive whole number.",
        };
    }

    // Fetch product to verify existence and status
    const supabase = createServiceClient();
    const { data: product, error: productError } = await supabase
        .from("products")
        .select("id,name,status,deleted_at,stock_quantity")
        .eq("id", productId)
        .maybeSingle<ProductStockRow>();

    if (productError) {
        return { status: "error", message: productError.message };
    }

    if (!product) {
        return { status: "error", message: "Product was not found." };
    }

    if (product.deleted_at) {
        return {
            status: "error",
            message: "This product has been deleted and cannot be adjusted.",
        };
    }

    // Build reason with source order and customer context
    // Format: "Order {order_number} - {customer_name}"
    const reason = `Order ${sourceOrder} - ${customer}`;

    // Call existing manual stock adjustment RPC
    // Use negative quantity delta for decrease
    const quantityDelta = -quantity;

    try {
        const { error } = await supabase.rpc("hisabkitab_adjust_stock", {
            p_product_id: productId,
            p_quantity_delta: quantityDelta,
            p_movement_type: "manual_adjustment",
            p_reason: reason,
            p_reference_type: null,
            p_reference_id: null,
            p_idempotency_key: `delivered-order:${sourceOrder}:${productId}`,
            p_created_by: context.userId,
            p_metadata: {
                source: "hisabkitab.inventory.delivered_order",
                order_number: sourceOrder,
                customer_name: customer,
                prefill_quantity: quantity,
            },
        });

        if (error) {
            return { status: "error", message: mapStockRpcError(error) };
        }
    } catch (error) {
        return { status: "error", message: mapStockRpcError(error) || initialError };
    }

    // Revalidate inventory and stock movements pages
    revalidatePath("/inventory");
    revalidatePath("/stock-movements");

    return {
        status: "success",
        message: `Stock deducted: -${quantity} for order ${sourceOrder}`,
    };
}
