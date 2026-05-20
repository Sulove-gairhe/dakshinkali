"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { trendingProducts, type StoreProduct } from "@/lib/store-products";
import { ProductCard } from "./product-card";
import { CompareToggle } from "./compare/CompareToggle";

export function TrendingProducts() {
  const { addItem, getQuantity } = useCart();
  const { hasItem, toggleItem } = useWishlist();

  const handleAddToCart = (product: StoreProduct) => {
    addItem(product);
  };

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <h2 className="text-center text-2xl font-bold tracking-wide text-foreground sm:text-left sm:text-3xl">
            TRENDING PRODUCTS
          </h2>
          <Link
            href="/products"
            className="hidden text-sm font-semibold text-foreground transition-colors duration-300 hover:text-foreground/70 sm:block"
          >
            View all
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trendingProducts.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              quantityInCart={getQuantity(product.id)}
              isWishlisted={hasItem(product.id)}
              onAddToCart={() => handleAddToCart(product)}
              onToggleWishlist={() => toggleItem(product)}
              renderCompare={<CompareToggle product={product} />}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
