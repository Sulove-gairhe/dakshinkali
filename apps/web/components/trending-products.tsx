"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { ProductCard } from "@/components/product-card";
import { CompareToggle } from "@/components/compare/CompareToggle";
import { type StoreProduct } from "@/lib/store-products";
import { cn } from "@/lib/utils";

function getItemsPerSlide(width: number) {
  if (width >= 1024) return 4;
  if (width >= 640) return 2;
  return 1;
}

function chunkProducts(products: StoreProduct[], chunkSize: number) {
  const chunks: StoreProduct[][] = [];

  for (let index = 0; index < products.length; index += chunkSize) {
    chunks.push(products.slice(index, index + chunkSize));
  }

  return chunks;
}

export function TrendingProducts() {
  const { addItem, getQuantity } = useCart();
  const { hasItem, toggleItem } = useWishlist();

  const [itemsPerSlide, setItemsPerSlide] = useState(4);
  const [activeSlide, setActiveSlide] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);

  const [products, setProducts] = useState<StoreProduct[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/storefront-products?key=trending&max=8");
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        const prods = Array.isArray(json.products) ? json.products : [];
        if (prods.length) setProducts(prods);
      } catch (err) {
        console.error("Failed to fetch trending section", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const updateItemsPerSlide = () => setItemsPerSlide(getItemsPerSlide(window.innerWidth));

    updateItemsPerSlide();
    window.addEventListener("resize", updateItemsPerSlide);

    return () => window.removeEventListener("resize", updateItemsPerSlide);
  }, []);

  const slides = useMemo(() => chunkProducts(products, itemsPerSlide), [itemsPerSlide, products]);
  const lastSlide = Math.max(slides.length - 1, 0);
  const isAtStart = activeSlide === 0;
  const isAtEnd = activeSlide === lastSlide;

  useEffect(() => {
    setActiveSlide((current) => Math.min(current, lastSlide));
  }, [lastSlide]);

  const goToSlide = (slideIndex: number) => setActiveSlide(Math.min(Math.max(slideIndex, 0), lastSlide));

  const handlePointerEnd = (clientX: number) => {
    if (dragStart === null) return;

    const delta = dragStart - clientX;
    setDragStart(null);

    if (Math.abs(delta) < 40) return;
    goToSlide(activeSlide + (delta > 0 ? 1 : -1));
  };

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-center text-2xl font-bold tracking-wide text-foreground sm:text-left sm:text-3xl">
              TRENDING PRODUCTS
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/products"
              className="inline-flex items-center h-10 gap-0 px-3 hover:px-6 rounded-full bg-primary text-sm font-bold text-primary-foreground transition-all duration-200 ease-in-out hover:gap-2 hover:scale-[1.03] hover:shadow-md hover:bg-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group"
            >
              View all
              <span className="transform -translate-x-1 opacity-0 transition-all duration-200 ease-in-out group-hover:translate-x-0 group-hover:opacity-100" aria-hidden>
                →
              </span>
            </Link>

            <button
              type="button"
              aria-label="Show previous trending products"
              disabled={isAtStart}
              onClick={() => goToSlide(activeSlide - 1)}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isAtStart && "cursor-not-allowed opacity-40 hover:border-border hover:bg-card",
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="min-w-12 text-center text-xs font-semibold text-muted-foreground">
              {activeSlide + 1}/{slides.length}
            </span>

            <button
              type="button"
              aria-label="Show next trending products"
              disabled={isAtEnd}
              onClick={() => goToSlide(activeSlide + 1)}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isAtEnd && "cursor-not-allowed opacity-40 hover:border-border hover:bg-card",
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div>
          <div
            className="overflow-hidden rounded-xl"
            onPointerDown={(event) => setDragStart(event.clientX)}
            onPointerUp={(event) => handlePointerEnd(event.clientX)}
            onPointerCancel={() => setDragStart(null)}
            onPointerLeave={(event) => {
              if (dragStart !== null) handlePointerEnd(event.clientX);
            }}
          >
            <div
              aria-live="polite"
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {slides.map((slide, slideIndex) => (
                <div
                  key={`trending-slide-${slideIndex}`}
                  className="grid min-w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
                >
                  {slide.map((product) => (
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
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            {slides.map((_, slideIndex) => (
              <button
                key={`trending-dot-${slideIndex}`}
                type="button"
                aria-label={`Show trending products slide ${slideIndex + 1}`}
                aria-current={activeSlide === slideIndex}
                onClick={() => goToSlide(slideIndex)}
                className={cn(
                  "h-2 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  activeSlide === slideIndex
                    ? "w-7 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
