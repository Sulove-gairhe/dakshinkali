"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { parseProductPrice } from "@/lib/store-products";
import type { StoreProduct } from "@/lib/store-products";

interface SimilarProductsProps {
  products: StoreProduct[];
}

export function SimilarProducts({ products }: SimilarProductsProps) {
  const { addItem, getQuantity } = useCart();
  const { toggleItem, hasItem } = useWishlist();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const timer = setTimeout(updateScrollState, 80);
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState, { passive: true });
    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("article")?.offsetWidth ?? 240;
    el.scrollBy({
      left: direction === "left" ? -(cardWidth + 16) : cardWidth + 16,
      behavior: "smooth",
    });
  }

  if (products.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-foreground">Similar Products</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          You might also like these
        </p>
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="absolute -left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-md transition-colors hover:bg-muted sm:-left-4"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="absolute -right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-md transition-colors hover:bg-muted sm:-right-4"
          >
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
          style={{
            scrollSnapType: "x mandatory",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {products.map((product, index) => {
            const inCart = getQuantity(product.id) > 0;
            const wishlisted = hasItem(product.id);
            const badgeItems =
              product.badges ?? (product.badge ? [product.badge] : []);
            const isLast = index === products.length - 1;

            return (
              <article
                key={product.id}
                style={{
                  scrollSnapAlign: "start",
                  minWidth: "min(80vw, 240px)",
                  maxWidth: "240px",
                  marginRight: isLast ? "1rem" : undefined,
                }}
                className="group relative flex h-[430px] shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                {badgeItems.length > 0 && (
                  <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-3.5rem)] flex-wrap gap-1">
                    {badgeItems.map((badge) => (
                      <span
                        key={badge}
                        className="inline-block rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-primary ring-1 ring-accent/30"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    toggleItem({
                      id: product.id,
                      slug: product.slug,
                      name: product.name,
                      shortDescription: product.shortDescription,
                      image: product.image,
                      currentPrice: product.currentPrice,
                      oldPrice: product.oldPrice,
                      href: product.href,
                    });
                  }}
                  aria-label={
                    wishlisted
                      ? `Remove ${product.name} from wishlist`
                      : `Add ${product.name} to wishlist`
                  }
                  className={`absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-md ring-1 ring-border transition-colors hover:bg-white ${
                    wishlisted ? "text-red-600" : "text-primary"
                  }`}
                >
                  <Heart
                    className={`h-4 w-4 ${wishlisted ? "fill-current" : ""}`}
                  />
                </button>

                {inCart && (
                  <div className="absolute right-3 top-12 z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground shadow-lg ring-2 ring-white">
                    {getQuantity(product.id)}
                  </div>
                )}

                <Link
                  href={product.href}
                  className="relative block aspect-square w-full overflow-hidden bg-white p-3"
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="240px"
                    className="object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </Link>

                <div className="flex flex-1 flex-col p-3">
                  <Link
                    href={product.href}
                    className="line-clamp-2 text-sm font-bold text-foreground transition-colors hover:text-primary"
                  >
                    {product.name}
                  </Link>

                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {product.shortDescription}
                  </p>

                  <div className="mt-2 flex items-start gap-1 border-t border-border/70 pt-2 text-xs font-medium text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                    <span className="line-clamp-1">
                      <span className="font-semibold text-stone-700">
                        Warranty:
                      </span>{" "}
                      {product.warranty}
                    </span>
                  </div>

                  <div className="flex-1" />

                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-gray-950">
                      {product.currentPrice}
                    </span>
                    {product.oldPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        {product.oldPrice}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void addItem({
                        id: product.id,
                        slug: product.slug,
                        name: product.name,
                        shortDescription: product.shortDescription,
                        image: product.image,
                        currentPrice: product.currentPrice,
                        oldPrice: product.oldPrice,
                        href: product.href,
                        price: parseProductPrice(product.currentPrice),
                      });
                    }}
                    className="mt-3 flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-accent/45 bg-white px-3 py-2.5 text-xs font-semibold text-primary shadow-sm transition-colors hover:border-accent hover:bg-accent/10"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    {inCart ? "Add Another" : "Add to Cart"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
