"use server";

import { getStockImpactPreview } from "@/lib/admin/stock-impact";

/**
 * Server action wrapper for getStockImpactPreview.
 * 
 * This action safely exposes the server-only stock-impact service to client components.
 * Required because stock-impact.ts imports "server-only" and uses service-role Supabase client.
 * 
 * @param productId - UUID of the product to fetch stock impact for
 * @returns Array of StockImpactItem showing pending deductions
 * 
 * @example
 * ```tsx
 * // Client component usage:
 * import { getStockImpactPreviewAction } from "@/lib/admin/actions/stock-preview";
 * 
 * const items = await getStockImpactPreviewAction(productId);
 * ```
 */
export async function getStockImpactPreviewAction(productId: string) {
    return getStockImpactPreview(productId);
}
