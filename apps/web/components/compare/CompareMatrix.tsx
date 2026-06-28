"use client";

import Image from "next/image";
import { useCompare } from "./CompareProvider";
import { useCart } from "@/components/cart-provider";
import { getSpecsForCategory, getSpecValue, normalizeCategory } from "@/lib/compare-utils";
import { ShoppingCart, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function CompareMatrix() {
  const { selectedProducts, removeProduct } = useCompare();
  const { addItem, getQuantity } = useCart();

  if (selectedProducts.length === 0) return null;

  const normalizedCat = normalizeCategory(selectedProducts[0].category);
  const specs = getSpecsForCategory(normalizedCat);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse">
        {/* Sticky product header */}
        <thead className="sticky top-0 z-10 bg-card shadow-sm">
          <tr>
            <th className="w-[130px] min-w-[130px] border-b-2 border-border p-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:w-[170px] sm:p-4">
              Specification
            </th>
            {selectedProducts.map((product) => (
              <th key={product.id} className="min-w-[180px] border-b-2 border-border p-3 text-center sm:p-4">
                <div className="flex flex-col items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => removeProduct(product.id)}
                    aria-label={`Remove ${product.name} from comparison`}
                    className="self-end rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="relative h-28 w-28 overflow-hidden rounded-xl bg-muted sm:h-32 sm:w-32">
                    <Image src={product.image} alt={product.name} fill className="object-cover" />
                  </div>

                  <h3 className="line-clamp-2 max-w-[200px] text-sm font-bold text-foreground">
                    {product.name}
                  </h3>

                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-foreground">{product.currentPrice}</span>
                    {product.oldPrice && (
                      <span className="text-xs text-muted-foreground line-through">{product.oldPrice}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={async () => { await addItem(product); }}
                    className="flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-xs font-semibold text-secondary-foreground transition-all duration-200 hover:bg-secondary/90 hover:shadow-md active:scale-95"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    {getQuantity(product.id) > 0 ? "Add Another" : "Add to Cart"}
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {specs.map((spec, index) => (
            <tr
              key={spec.key}
              className={cn(
                "transition-colors hover:bg-primary/5",
                index % 2 === 0 ? "bg-muted/30" : "bg-card",
              )}
            >
              <td className="border-b border-border/40 p-3 text-sm font-semibold text-foreground sm:p-4">
                {spec.label}
              </td>
              {selectedProducts.map((product) => (
                <td
                  key={product.id}
                  className="border-b border-border/40 p-3 text-center text-sm text-muted-foreground sm:p-4"
                >
                  {getSpecValue(product, spec.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
