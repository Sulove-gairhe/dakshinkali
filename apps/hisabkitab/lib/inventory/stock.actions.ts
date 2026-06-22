"use server";

import { revalidatePath } from "next/cache";
import { HISABKITAB_PERMISSIONS } from "@/lib/auth/permissions";
import { requireHisabKitabPermission } from "@/lib/auth/requireHisabKitabPermission";
import { createServiceClient } from "@/lib/supabase/service";
import {
  getQuantityDelta,
  mapStockRpcError,
  parseStockActionFormData,
  requiresReason,
  type ActionResult,
} from "./stockActionHelpers";

type ProductStockRow = {
  id: string;
  name: string;
  status: string;
  deleted_at: string | null;
  stock_quantity: number;
};

const initialError = "Stock adjustment could not be saved.";

export async function saveStockAdjustment(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const context = await requireHisabKitabPermission(
    HISABKITAB_PERMISSIONS.inventory.adjust,
  );

  const parsed = parseStockActionFormData(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message ?? "Invalid stock adjustment.",
    };
  }

  const input = parsed.data;
  if (input.mode !== "set" && input.quantity === 0) {
    return { status: "error", message: "Quantity change must be greater than zero." };
  }

  const supabase = createServiceClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id,name,status,deleted_at,stock_quantity")
    .eq("id", input.productId)
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

  const reason = input.reason?.trim() ?? "";
  if (requiresReason(input, product.stock_quantity) && !reason) {
    return {
      status: "error",
      message: "A reason is required for stock decreases.",
    };
  }

  if (input.mode === "set" && input.quantity === product.stock_quantity) {
    return {
      status: "error",
      message: "No stock change was made. Enter a different quantity.",
    };
  }

  if (product.status === "inactive" && input.mode === "decrease" && !input.correction) {
    return {
      status: "error",
      message:
        "Inactive product decreases must be marked as a correction and include a reason.",
    };
  }

  try {
    if (input.mode === "set") {
      const { error } = await supabase.rpc("hisabkitab_set_stock", {
        p_product_id: input.productId,
        p_quantity_after: input.quantity,
        p_reason: reason || null,
        p_idempotency_key: null,
        p_created_by: context.userId,
        p_metadata: {
          source: "hisabkitab.inventory",
          mode: input.mode,
        },
      });

      if (error) {
        return { status: "error", message: mapStockRpcError(error) };
      }
    } else {
      const quantityDelta = getQuantityDelta(input);
      if (quantityDelta === null || quantityDelta === 0) {
        return {
          status: "error",
          message: "Quantity change must be greater than zero.",
        };
      }

      const { error } = await supabase.rpc("hisabkitab_adjust_stock", {
        p_product_id: input.productId,
        p_quantity_delta: quantityDelta,
        p_movement_type: input.correction ? "correction" : "manual_adjustment",
        p_reason: reason || null,
        p_reference_type: null,
        p_reference_id: null,
        p_idempotency_key: null,
        p_created_by: context.userId,
        p_metadata: {
          source: "hisabkitab.inventory",
          mode: input.mode,
        },
      });

      if (error) {
        return { status: "error", message: mapStockRpcError(error) };
      }
    }
  } catch (error) {
    return { status: "error", message: mapStockRpcError(error) || initialError };
  }

  revalidatePath("/inventory");
  revalidatePath("/stock-movements");

  return {
    status: "success",
    message: "Stock adjustment saved.",
  };
}
