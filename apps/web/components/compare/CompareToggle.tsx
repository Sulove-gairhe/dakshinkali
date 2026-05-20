"use client";

import { GitCompareArrows } from "lucide-react";
import { useCompare } from "./CompareProvider";
import type { StoreProduct } from "@/lib/store-products";
import { cn } from "@/lib/utils";

interface CompareToggleProps {
  product: StoreProduct;
}

export function CompareToggle({ product }: CompareToggleProps) {
  const { toggleProduct, isSelected, canSelect } = useCompare();
  const selected = isSelected(product.id);
  const { allowed, reason } = canSelect(product);
  const disabled = !allowed && !selected;

  return (
    <button
      type="button"
      disabled={disabled}
      title={disabled ? reason : selected ? "Remove from comparison" : "Add to comparison"}
      aria-label={disabled ? reason : selected ? `Remove ${product.name} from comparison` : `Add ${product.name} to comparison`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) toggleProduct(product);
      }}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200",
        selected
          ? "bg-primary text-primary-foreground shadow-sm"
          : disabled
            ? "cursor-not-allowed opacity-40 bg-muted text-muted-foreground"
            : "bg-muted/80 text-foreground hover:bg-primary/20 hover:text-primary",
      )}
    >
      <GitCompareArrows className="h-3.5 w-3.5" />
      {selected ? "Comparing" : "Compare"}
    </button>
  );
}
