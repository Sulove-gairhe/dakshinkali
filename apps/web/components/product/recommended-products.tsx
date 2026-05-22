"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { parseProductPrice } from "@/lib/store-products";
import type { RecommendedProduct } from "@/lib/store-products";

interface RecommendedProductsProps {
  products: RecommendedProduct[];
}

export function RecommendedProducts({ products }: RecommendedProductsProps) {
  const { addItem, getQuantity } = useCart();
  const { toggleItem, hasItem } = useWishlist();

  if (products.length === 0) return null;

  return (
    <aside className="flex flex-col gap-4">
      {/* Section header */}
      <div>
        <h2 className="text-base font-bold text-foreground">
          Recommended for You
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Based on brand, category &amp; price range
        </p>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {products.map((product) => {
          const inCart = getQuantity(product.id) > 0;
          const wishlisted = hasItem(product.id);

          return (
            <article
              key={product.id}
              className="group relative flex gap-3 overflow-hidden rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Product image */}
              <Link
                href={product.href}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted"
                aria-label={product.name}
              >
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                  sizes="80px"
                />
              </Link>

              {/* Info */}
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
                {/* Name + wishlist */}
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={product.href}
                    className="line-clamp-2 text-xs font-semibold leading-snug text-foreground hover:underline"
                  >
                    {product.name}
                  </Link>
                  <button
                    onClick={() =>
                      toggleItem({
                        id: product.id,
                        slug: product.slug,
                        name: product.name,
                        shortDescription: product.shortDescription,
                        image: product.image,
                        currentPrice: product.currentPrice,
                        oldPrice: product.oldPrice,
                        href: product.href,
                      })
                    }
                    aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    className={`shrink-0 rounded-full p-1 transition-colors ${
                      wishlisted
                        ? "text-red-500 hover:text-red-600"
                        : "text-muted-foreground hover:text-red-500"
                    }`}
                  >
                    <Heart
                      className="h-3.5 w-3.5"
                      fill={wishlisted ? "currentColor" : "none"}
                    />
                  </button>
                </div>

                {/* Brand */}
                {product.brand && (
                  <p className="text-[11px] text-muted-foreground">
                    {product.brand}
                  </p>
                )}

                {/* Price + reason badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-bold text-foreground">
                    {product.currentPrice}
                  </span>
                  {product.reasons.map((reason) => (
                    <span
                      key={reason}
                      className="rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-800"
                    >
                      {reason}
                    </span>
                  ))}
                </div>

                {/* Add to cart */}
                <button
                  onClick={() =>
                    addItem({
                      id: product.id,
                      slug: product.slug,
                      name: product.name,
                      shortDescription: product.shortDescription,
                      image: product.image,
                      currentPrice: product.currentPrice,
                      oldPrice: product.oldPrice,
                      href: product.href,
                      // Pass numeric price so cart calculates totals correctly
                      price: parseProductPrice(product.currentPrice),
                    })
                  }
                  className={`mt-1 flex w-full items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-semibold transition-colors ${
                    inCart
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : "bg-black text-white hover:bg-black/85"
                  }`}
                >
                  <ShoppingCart className="h-3 w-3" />
                  {inCart ? "In Cart" : "Add to Cart"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
