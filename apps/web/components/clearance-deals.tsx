"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { clearanceProducts } from "@/lib/store-products";
import { ProductCard } from "./product-card";
import { CompareToggle } from "./compare/CompareToggle";

export function ClearanceDeals() {
  const { addItem, getQuantity } = useCart();
  const { hasItem, toggleItem } = useWishlist();

  const [products, setProducts] = useState(() => clearanceProducts.slice(0, 8));

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/storefront-products?key=clearance_deals&max=8");
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        const prods = Array.isArray(json.products) ? json.products : [];
        if (prods.length) setProducts(prods);
      } catch (err) {
        console.error("Failed to fetch clearance deals section", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section
      id="clearance-deals"
      className="bg-background py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-primary">
              Limited Stock
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-wide text-foreground sm:text-3xl">
              CLEARANCE DEALS
            </h2>
          </div>

          <div>
            <Link
              href="/products"
              className="inline-flex items-center h-10 gap-0 px-3 hover:px-6 rounded-full bg-primary text-sm font-bold text-primary-foreground transition-all duration-200 ease-in-out hover:gap-2 hover:scale-[1.03] hover:shadow-md hover:bg-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group"
            >
              View all
              <span className="transform -translate-x-1 opacity-0 transition-all duration-200 ease-in-out group-hover:translate-x-0 group-hover:opacity-100" aria-hidden>
                →
              </span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
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
