"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  PackageSearch,
  SlidersHorizontal,
  Tag,
  X,
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product-card";
import { SiteNavbar } from "@/components/site-navbar";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";
import type { StorefrontProductsPage } from "@/lib/db-products";
import type { StoreProduct } from "@/lib/store-products";

type FilterOption = {
  name: string;
  slug: string;
};

type ProductsClientProps = {
  initialPage: StorefrontProductsPage;
  brandOptions: FilterOption[];
  categoryOptions: FilterOption[];
};

const PAGE_SIZE = 12;

const sortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Price: High to Low", value: "price-high-low" },
  { label: "Price: Low to High", value: "price-low-high" },
] as const;

export function ProductsClient({
  initialPage,
  brandOptions,
  categoryOptions,
}: ProductsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { addItem, getQuantity } = useCart();
  const { hasItem, toggleItem } = useWishlist();
  const requestKey = searchParams.toString();
  const [products, setProducts] = useState(initialPage.products);
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);
  const [total, setTotal] = useState(initialPage.total);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeRequestRef = useRef(requestKey);

  useEffect(() => {
    activeRequestRef.current = requestKey;
    setProducts(initialPage.products);
    setNextCursor(initialPage.nextCursor);
    setTotal(initialPage.total);
    setError(null);
    setIsLoadingMore(false);
  }, [initialPage, requestKey]);

  const query = searchParams.get("q")?.trim() || "";
  const brand = searchParams.get("brand") || "";
  const category = searchParams.get("category") || "";
  const sort = sortOptions.some((option) => option.value === searchParams.get("sort"))
    ? searchParams.get("sort") || "newest"
    : "newest";
  const hasFilters = Boolean(query || brand || category);
  const endReached = nextCursor === null && products.length > 0;

  const resultLabel = useMemo(() => {
    if (total === 0) return "No products found";
    return `Showing ${products.length} of ${total} product${total === 1 ? "" : "s"}`;
  }, [products.length, total]);

  function setParam(name: "brand" | "category" | "sort", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && !(name === "sort" && value === "newest")) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("brand");
    params.delete("category");
    router.push(params.size ? `${pathname}?${params.toString()}` : pathname, {
      scroll: false,
    });
  }

  async function loadMore() {
    if (isLoadingMore || nextCursor === null) return;
    const keyAtStart = activeRequestRef.current;
    setIsLoadingMore(true);
    setError(null);

    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("cursor", String(nextCursor));
      params.set("pageSize", String(PAGE_SIZE));
      if (!params.get("sort")) params.set("sort", "newest");

      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) throw new Error("Products could not be loaded.");
      const page = (await response.json()) as StorefrontProductsPage;
      if (activeRequestRef.current !== keyAtStart) return;

      setProducts((current) => {
        const seen = new Set(current.map((product) => product.slug));
        const additions = page.products.filter((product) => !seen.has(product.slug));
        return [...current, ...additions];
      });
      setNextCursor(page.nextCursor);
      setTotal(page.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Products could not be loaded.");
    } finally {
      if (activeRequestRef.current === keyAtStart) {
        setIsLoadingMore(false);
      }
    }
  }

  function handleAddToCart(product: StoreProduct) {
    void addItem(product);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNavbar />

      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-10">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-wide text-primary">
              Browse catalog
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-wide text-foreground sm:text-3xl lg:text-4xl">
              Products
            </h1>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              {resultLabel}
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-[minmax(11rem,13rem)_minmax(12rem,14rem)_minmax(13rem,18rem)] lg:items-end">
            <FilterSelect
              label="Brand"
              value={brand}
              placeholder="All Brands"
              options={brandOptions}
              onChange={(value) => setParam("brand", value)}
            />
            <FilterSelect
              label="Category"
              value={category}
              placeholder="All Categories"
              options={categoryOptions}
              onChange={(value) => setParam("category", value)}
            />
            <label className="flex w-full flex-col gap-2 text-sm font-bold text-foreground sm:col-span-2 lg:col-span-1">
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                Sort By
              </span>
              <select
                value={sort}
                onChange={(event) => setParam("sort", event.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm font-semibold text-foreground shadow-sm outline-none transition-colors hover:border-primary/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {hasFilters && (
          <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 pb-6 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-white px-3 text-xs font-bold text-muted-foreground shadow-sm transition-colors hover:border-primary hover:text-foreground"
            >
              Clear Filters
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.slug}
                  {...product}
                  quantityInCart={getQuantity(product.id)}
                  isWishlisted={hasItem(product.id)}
                  onAddToCart={() => handleAddToCart(product)}
                  onToggleWishlist={() => toggleItem(product)}
                />
              ))}
            </div>
            <div className="mt-8 flex flex-col items-center gap-3">
              {nextCursor !== null ? (
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={isLoadingMore}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isLoadingMore ? "Loading..." : "Load more products"}
                </button>
              ) : endReached ? (
                <p className="text-sm font-semibold text-muted-foreground">
                  End of results
                </p>
              ) : null}
              {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-border bg-card px-5 py-10 text-center shadow-sm sm:px-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <PackageSearch className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-foreground">
              No products found
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Try clearing a filter or searching for another appliance.
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 rounded-full border border-border px-4 py-2 text-sm font-bold text-foreground transition-colors hover:border-primary hover:bg-primary/90"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}

function FilterSelect({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  const hasActiveOption = options.some((option) => option.slug === value);

  return (
    <label className="flex w-full flex-col gap-2 text-sm font-bold text-foreground">
      <span className="inline-flex items-center gap-2">
        <Tag className="h-4 w-4 text-primary" />
        {label}
      </span>
      <select
        value={hasActiveOption ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm font-semibold text-foreground shadow-sm outline-none transition-colors hover:border-primary/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.slug} value={option.slug}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}
