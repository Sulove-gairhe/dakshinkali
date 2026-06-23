import { z } from "zod";
import {
  HISABKITAB_PERMISSIONS,
  hasPermission,
  type HisabKitabUserContext,
} from "../auth/permissions";

export type StockActionMode = "increase" | "decrease" | "set";
export type ActionResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export const stockActionSchema = z.object({
  productId: z.string().uuid("Select a valid product."),
  mode: z.enum(["increase", "decrease", "set"]),
  quantity: z.coerce
    .number({ invalid_type_error: "Quantity is required." })
    .int("Quantity must be a whole number.")
    .min(0, "Quantity cannot be negative."),
  reason: z.string().trim().optional(),
  correction: z.boolean().default(false),
});

export type StockActionInput = z.infer<typeof stockActionSchema>;

export function canViewInventory(context: HisabKitabUserContext) {
  return hasPermission(context, HISABKITAB_PERMISSIONS.inventory.view);
}

export function canAdjustInventory(context: HisabKitabUserContext) {
  return hasPermission(context, HISABKITAB_PERMISSIONS.inventory.adjust);
}

export function parseStockActionFormData(formData: FormData) {
  return stockActionSchema.safeParse({
    productId: formData.get("product_id"),
    mode: formData.get("mode"),
    quantity: formData.get("quantity"),
    reason: String(formData.get("reason") ?? ""),
    correction: formData.get("correction") === "on",
  });
}

export function mapStockRpcError(error: unknown) {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : String(error ?? "");
  const message = rawMessage.toLowerCase();

  if (message.includes("not authorized")) {
    return "You do not have permission to adjust inventory.";
  }

  if (message.includes("deleted product")) {
    return "This product has been deleted and cannot be adjusted.";
  }

  if (message.includes("inactive product stock decreases")) {
    return "Inactive product decreases must be marked as a correction and include a reason.";
  }

  if (message.includes("insufficient stock")) {
    return "That adjustment would make stock negative.";
  }

  if (message.includes("zero-delta") || message.includes("no stock change")) {
    return "No stock change was made. Enter a different quantity.";
  }

  if (message.includes("product not found")) {
    return "Product was not found.";
  }

  return rawMessage || "Stock adjustment failed.";
}

export function requiresReason(input: StockActionInput, currentQuantity: number) {
  if (input.mode === "decrease") {
    return input.quantity > 0;
  }

  return input.mode === "set" && input.quantity < currentQuantity;
}

export function getQuantityDelta(input: StockActionInput) {
  if (input.mode === "increase") {
    return input.quantity;
  }

  if (input.mode === "decrease") {
    return -input.quantity;
  }

  return null;
}
