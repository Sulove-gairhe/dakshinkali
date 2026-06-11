"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LowStockProduct } from "./bell-types";
import { getProductThumbnailUrl } from "./parse-product-images";

function mapProductRow(row: Record<string, unknown>): LowStockProduct {
  return {
    id: String(row.id),
    name: String(row.name ?? "Product"),
    imageUrl: getProductThumbnailUrl(row.images),
  };
}

export function useLowStockProducts() {
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    void (async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, images, status")
        .eq("status", "low_stock")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (cancelled) return;

      if (error) {
        console.warn("[LOW_STOCK_LOAD_ERROR]", error.message);
        setLoading(false);
        return;
      }

      setProducts(
        (data ?? []).map((row) => mapProductRow(row as Record<string, unknown>)),
      );
      setLoading(false);
    })();

    const channel = supabase
      .channel("admin-low-stock-products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          const row = (payload.new ?? payload.old) as Record<string, unknown> | null;
          if (!row?.id) return;

          const id = String(row.id);
          const status = String((payload.new as Record<string, unknown> | null)?.status ?? row.status ?? "");
          const deletedAt = (payload.new as Record<string, unknown> | null)?.deleted_at ?? row.deleted_at;

          if (payload.eventType === "DELETE" || deletedAt || status !== "low_stock") {
            setProducts((prev) => prev.filter((item) => item.id !== id));
            return;
          }

          if (status === "low_stock") {
            const mapped = mapProductRow(payload.new as Record<string, unknown>);
            setProducts((prev) => {
              const without = prev.filter((item) => item.id !== mapped.id);
              return [mapped, ...without];
            });
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  return { products, loading };
}
