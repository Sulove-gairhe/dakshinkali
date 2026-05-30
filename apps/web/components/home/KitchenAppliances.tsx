"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { CompareToggle } from "@/components/compare/CompareToggle";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { type StoreProduct } from "@/lib/store-products";
import { cn } from "@/lib/utils";

type KitchenAppliancesProps = {
  products: StoreProduct[];
};

function getItemsPerSlide(width: number) {
  if (width >= 1024) return 6;
  if (width >= 768) return 4;
  return 2;
}

function chunkProducts<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export function KitchenAppliances({ products }: KitchenAppliancesProps) {
  const { addItem, getQuantity } = useCart();
  const { hasItem, toggleItem } = useWishlist();
  const [itemsPerSlide, setItemsPerSlide] = useState(6);
  const [activeSlide, setActiveSlide] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);

  useEffect(() => {
    const updateItemsPerSlide = () => {
      setItemsPerSlide(getItemsPerSlide(window.innerWidth));
    };

    updateItemsPerSlide();
    window.addEventListener("resize", updateItemsPerSlide);

    return () => window.removeEventListener("resize", updateItemsPerSlide);
  }, []);

  const slides = useMemo(
    () => chunkProducts(products, itemsPerSlide),
    [products, itemsPerSlide],
  );
  const lastSlide = Math.max(slides.length - 1, 0);
  const currentSlide = Math.min(activeSlide, lastSlide);
  const isAtStart = currentSlide === 0;
  const isAtEnd = currentSlide === lastSlide;
  const hasMultipleSlides = slides.length > 1;

  const goToSlide = (slideIndex: number) => {
    setActiveSlide(Math.min(Math.max(slideIndex, 0), lastSlide));
  };

  const handlePointerEnd = (clientX: number) => {
    if (dragStart === null) return;

    const delta = dragStart - clientX;
    setDragStart(null);

    if (Math.abs(delta) < 40) return;
    goToSlide(currentSlide + (delta > 0 ? 1 : -1));
  };

  const renderProductCard = (product: StoreProduct) => (
    <ProductCard
      key={product.id}
      {...product}
      quantityInCart={getQuantity(product.id)}
      isWishlisted={hasItem(product.id)}
      onAddToCart={() => addItem(product)}
      onToggleWishlist={() => toggleItem(product)}
      renderCompare={<CompareToggle product={product} />}
    />
  );

  return (
    <section
      id="kitchen-appliances"
      className="overflow-hidden bg-background py-12 text-foreground sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-primary">
              For modern homes
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-wide text-foreground sm:text-3xl">
              Kitchen Appliances
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Smart everyday appliances for faster cooking, cleaner homes, and
              easier family routines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/search?category=kitchen-appliances"
              className="view-all-btn inline-flex items-center h-10 gap-0 px-3 hover:px-6 rounded-full border border-foreground text-sm font-bold text-foreground hover:gap-2 hover:text-black group-hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group"
            >
              View all
              <span
                className="transform -translate-x-1 opacity-0 transition-all duration-200 ease-in-out group-hover:translate-x-0 group-hover:opacity-100 group-hover:delay-100"
                aria-hidden
              >
                →
              </span>
            </Link>

            {hasMultipleSlides && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Show previous kitchen appliances"
                  disabled={isAtStart}
                  onClick={() => goToSlide(currentSlide - 1)}
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isAtStart &&
                      "cursor-not-allowed opacity-40 hover:border-border hover:bg-card",
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-12 text-center text-xs font-semibold text-muted-foreground">
                  {currentSlide + 1}/{slides.length}
                </span>
                <button
                  type="button"
                  aria-label="Show next kitchen appliances"
                  disabled={isAtEnd}
                  onClick={() => goToSlide(currentSlide + 1)}
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isAtEnd &&
                      "cursor-not-allowed opacity-40 hover:border-border hover:bg-card",
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {products.length > 0 ? (
          <div>
            <div
              className="overflow-hidden"
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
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {slides.map((slide, slideIndex) => (
                  <div
                    key={`kitchen-appliance-slide-${slideIndex}`}
                    className="grid min-w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                  >
                    {slide.map(renderProductCard)}
                  </div>
                ))}
              </div>
            </div>

            {hasMultipleSlides && (
              <div className="mt-6 flex items-center justify-center gap-2">
                {slides.map((_, slideIndex) => (
                  <button
                    key={`kitchen-appliance-dot-${slideIndex}`}
                    type="button"
                    aria-label={`Show kitchen appliances slide ${slideIndex + 1}`}
                    aria-current={currentSlide === slideIndex}
                    onClick={() => goToSlide(slideIndex)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      currentSlide === slideIndex
                        ? "w-7 bg-primary"
                        : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60",
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card px-5 py-10 text-center text-sm font-semibold text-muted-foreground">
            Kitchen appliance products will be available soon.
          </div>
        )}
      </div>
    </section>
  );
}
