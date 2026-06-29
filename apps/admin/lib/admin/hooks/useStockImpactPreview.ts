"use client";

import { useCallback, useEffect, useState } from "react";
import { getStockImpactPreviewAction } from "@/lib/admin/actions/stock-preview";
import type { StockImpactItem } from "@/lib/admin/stock-impact";

export type UseStockImpactPreviewReturn = {
    items: StockImpactItem[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
};

/**
 * Hook for fetching stock impact preview data from client components.
 * 
 * Safe cross-boundary pattern:
 * - Uses server action (getStockImpactPreviewAction) instead of direct import
 * - Does NOT import server-only modules
 * - Does NOT expose service-role Supabase credentials
 * 
 * @param productId - UUID of the product to fetch stock impact for
 * @returns { items, isLoading, error, refetch }
 * 
 * @example
 * ```tsx
 * function ProductForm({ productId }) {
 *   const { items, isLoading, error, refetch } = useStockImpactPreview(productId);
 *   
 *   return <StockPreviewBox items={items} isLoading={isLoading} error={error} />;
 * }
 * ```
 */
export function useStockImpactPreview(
    productId: string | null | undefined,
): UseStockImpactPreviewReturn {
    const [items, setItems] = useState<StockImpactItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        // Guard: Skip fetch if productId is null/undefined
        if (!productId) {
            setItems([]);
            setIsLoading(false);
            setError(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Call server action (safe cross-boundary pattern)
            const data = await getStockImpactPreviewAction(productId);
            setItems(data);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to load stock preview";
            setError(message);
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    }, [productId]);

    // Fetch on mount and when productId changes
    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    // Expose refetch for manual refresh
    const refetch = useCallback(() => {
        void fetchData();
    }, [fetchData]);

    return {
        items,
        isLoading,
        error,
        refetch,
    };
}
