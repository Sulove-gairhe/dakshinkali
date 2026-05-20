"use client";

import { useCompare } from "./CompareProvider";
import { getCategoryDisplayName } from "@/lib/compare-utils";
import { X, GitCompareArrows, Trash2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function CompareDrawer() {
  const { selectedProducts, lockedCategory, openModal, removeProduct, clearAll } = useCompare();

  const categoryLabel = lockedCategory ? getCategoryDisplayName(lockedCategory) : "";

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[60] transform transition-all duration-300 ease-out",
        selectedProducts.length > 0
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0",
      )}
    >
      <div className="mx-auto max-w-5xl px-4 pb-0">
        <div className="rounded-t-2xl border border-b-0 border-border bg-card/95 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5 sm:px-6">
            <div className="flex items-center gap-2">
              <GitCompareArrows className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">
                Comparing {categoryLabel}
              </span>
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                {selectedProducts.length}
              </span>
            </div>
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
              aria-label="Clear all selected products"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear all</span>
            </button>
          </div>

          {/* Products + CTA */}
          <div className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
            {/* Selected products */}
            <div className="flex flex-1 items-center gap-2 overflow-x-auto sm:gap-3">
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-muted/50 px-2 py-1.5"
                >
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-white sm:h-10 sm:w-10">
                    <Image src={product.image} alt={product.name} fill className="object-cover" />
                  </div>
                  <span className="max-w-[100px] truncate text-xs font-medium text-foreground sm:max-w-[150px]">
                    {product.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeProduct(product.id)}
                    aria-label={`Remove ${product.name} from comparison`}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={openModal}
              disabled={selectedProducts.length < 2}
              className={cn(
                "shrink-0 rounded-lg px-4 py-2.5 text-sm font-bold transition-all duration-200 sm:px-5",
                selectedProducts.length >= 2
                  ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                  : "cursor-not-allowed bg-muted text-muted-foreground",
              )}
            >
              Compare Now ({selectedProducts.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
