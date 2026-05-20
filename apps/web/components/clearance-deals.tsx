"use client";

import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { clearanceProducts } from "@/lib/store-products";
import { ProductCard } from "./product-card";
import { CompareToggle } from "./compare/CompareToggle";

export function ClearanceDeals() {
  const { addItem, getQuantity } = useCart();
  const { hasItem, toggleItem } = useWishlist();

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-primary">
              Limited Stock
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-wide text-foreground sm:text-3xl">
              CLEARANCE DEALS
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {clearanceProducts.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              quantityInCart={getQuantity(product.id)}
              isWishlisted={hasItem(product.id)}
              onAddToCart={() => addItem(product)}
              onToggleWishlist={() => toggleItem(product)}
              renderCompare={<CompareToggle product={product} />}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
