"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Headphones,
  PackageSearch,
  SlidersHorizontal,
  Tag,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { SiteNavbar } from "@/components/site-navbar";
import { ProductCard } from "@/components/product-card";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { CompareProvider } from "@/components/compare/CompareProvider";
import { CompareToggle } from "@/components/compare/CompareToggle";
import { CompareDrawer } from "@/components/compare/CompareDrawer";
import { CompareModal } from "@/components/compare/CompareModal";
import { Footer } from "@/components/layout/Footer";
import {
  normalizeSort,
  searchProducts,
  type SearchSort,
} from "@/lib/search-products";
import type { StoreProduct } from "@/lib/store-products";
import { useSearchData } from "@/components/search-data-provider";

const sortOptions: { label: string; value: SearchSort }[] = [
  { label: "Best match", value: "best-match" },
  { label: "Price: High to Low", value: "price-high-low" },
  { label: "Price: Low to High", value: "price-low-high" },
];

const emptyStateLinks = [
  { label: "Televisions", href: "/categories/televisions" },
  { label: "Refrigerators", href: "/categories/refrigerator" },
  { label: "Washing Machines", href: "/categories/washing-machine" },
  { label: "Kitchen Appliances", href: "/categories/kitchen-appliance" },
];

export function SearchResultsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { addItem, getQuantity } = useCart();
  const { hasItem, toggleItem } = useWishlist();

  // Read DB data from context (fetched once in root layout)
  const { dbProducts, dbCategories } = useSearchData();
  const [lazyDbProducts, setLazyDbProducts] = useState<StoreProduct[] | null>(null);
  const [lazyDbCategories, setLazyDbCategories] = useState<typeof dbCategories | null>(null);

  useEffect(() => {
    if (dbProducts.length > 0 || lazyDbProducts) return;
    let cancelled = false;
    fetch("/api/search-data")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { dbProducts?: StoreProduct[]; dbCategories?: typeof dbCategories } | null) => {
        if (cancelled || !data) return;
        setLazyDbProducts(data.dbProducts ?? []);
        setLazyDbCategories(data.dbCategories ?? dbCategories);
      })
      .catch(() => {
        if (!cancelled) {
          setLazyDbProducts([]);
          setLazyDbCategories(dbCategories);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dbProducts.length, lazyDbProducts, dbCategories]);

  const resolvedDbProducts = lazyDbProducts ?? dbProducts;
  const resolvedDbCategories = lazyDbCategories ?? dbCategories;

  const result = useMemo(
    () =>
      searchProducts({
        q: searchParams.get("q"),
        brand: searchParams.get("brand"),
        category: searchParams.get("category"),
        sort: searchParams.get("sort"),
        extraProducts: resolvedDbProducts,
        extraCategories: resolvedDbCategories,
      }),
    [searchParams, resolvedDbProducts, resolvedDbCategories],
  );

  function handleSortChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", normalizeSort(event.target.value));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function updateFilter(paramName: "brand" | "category", value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(paramName, value);
    } else {
      params.delete(paramName);
    }

    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function clearFilters(filters: Array<"brand" | "category" | "q">) {
    const params = new URLSearchParams(searchParams.toString());
    filters.forEach((filter) => params.delete(filter));
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleAddToCart(product: StoreProduct) {
    void addItem(product);
  }

  return (
    <CompareProvider>
      <main className="min-h-screen bg-background text-foreground">
        <SiteNavbar />

        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-10">
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-wide text-primary">
                {result.eyebrow}
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-wide text-foreground sm:text-3xl lg:text-4xl">
                {result.heading}
              </h1>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">
                {result.resultLabel}
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-[minmax(11rem,13rem)_minmax(12rem,14rem)_minmax(13rem,18rem)] lg:items-end">
              <FilterSelect
                label="Brand"
                icon={<Tag className="h-4 w-4 text-primary" />}
                value={result.activeBrandSlug || ""}
                placeholder="All Brands"
                options={result.brandOptions}
                onChange={(value) => updateFilter("brand", value)}
              />

              <FilterSelect
                label="Category"
                icon={<PackageSearch className="h-4 w-4 text-primary" />}
                value={result.activeCategorySlug || ""}
                placeholder="All Categories"
                options={result.categoryOptions}
                onChange={(value) => updateFilter("category", value)}
              />

              <label className="flex w-full flex-col gap-2 text-sm font-bold text-foreground sm:col-span-2 lg:col-span-1">
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  Sort By
                </span>
                <select
                  value={result.sort}
                  onChange={handleSortChange}
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

          {(result.activeBrandSlug || result.activeCategorySlug || result.query) && (
            <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 pb-6 sm:px-6 lg:px-8">
              {result.activeBrandSlug && (
                <button
                  type="button"
                  onClick={() => clearFilters(["brand"])}
                  className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-white px-3 text-xs font-bold text-muted-foreground shadow-sm transition-colors hover:border-primary hover:text-foreground"
                >
                  Clear Brand
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {result.activeCategorySlug && (
                <button
                  type="button"
                  onClick={() => clearFilters(["category"])}
                  className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-white px-3 text-xs font-bold text-muted-foreground shadow-sm transition-colors hover:border-primary hover:text-foreground"
                >
                  Clear Category
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {(result.activeBrandSlug || result.activeCategorySlug || result.query) && (
                <button
                  type="button"
                  onClick={() => clearFilters(["brand", "category", "q"])}
                  className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-white px-3 text-xs font-bold text-muted-foreground shadow-sm transition-colors hover:border-primary hover:text-foreground"
                >
                  Clear All Filters
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {result.products.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {result.products.map((product) => (
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
          ) : (
            <EmptySearchState
              hasBrand={Boolean(result.activeBrandSlug)}
              hasCategory={Boolean(result.activeCategorySlug)}
              onClearBrand={() => clearFilters(["brand"])}
              onClearCategory={() => clearFilters(["category"])}
              onClearAll={() => clearFilters(["brand", "category", "q"])}
            />
          )}
        </section>

        <CompareDrawer />
        <CompareModal />
        <Footer />
      </main>
    </CompareProvider>
  );
}

function FilterSelect({
  label,
  icon,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  placeholder: string;
  options: Array<{ name: string; slug: string; count: number }>;
  onChange: (value: string) => void;
}) {
  const hasActiveOption = options.some((option) => option.slug === value);

  return (
    <label className="flex w-full flex-col gap-2 text-sm font-bold text-foreground">
      <span className="inline-flex items-center gap-2">
        {icon}
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
            {option.name} ({option.count})
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptySearchState({
  hasBrand,
  hasCategory,
  onClearBrand,
  onClearCategory,
  onClearAll,
}: {
  hasBrand: boolean;
  hasCategory: boolean;
  onClearBrand: () => void;
  onClearCategory: () => void;
  onClearAll: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-border bg-card px-5 py-10 text-center shadow-sm sm:px-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <PackageSearch className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-foreground">
        No exact products found
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Try clearing a filter or browsing available categories.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {hasBrand && (
          <button
            type="button"
            onClick={onClearBrand}
            className="rounded-full border border-border px-4 py-2 text-sm font-bold text-foreground transition-colors hover:border-primary hover:bg-primary/90"
          >
            Clear Brand
          </button>
        )}
        {hasCategory && (
          <button
            type="button"
            onClick={onClearCategory}
            className="rounded-full border border-border px-4 py-2 text-sm font-bold text-foreground transition-colors hover:border-primary hover:bg-primary/90"
          >
            Clear Category
          </button>
        )}
        {(hasBrand || hasCategory) && (
          <button
            type="button"
            onClick={onClearAll}
            className="rounded-full border border-border px-4 py-2 text-sm font-bold text-foreground transition-colors hover:border-primary hover:bg-primary/90"
          >
            Clear All Filters
          </button>
        )}
        {emptyStateLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-border px-4 py-2 text-sm font-bold text-foreground transition-colors hover:border-primary hover:bg-primary/90"
          >
            {link.label}
          </Link>
        ))}
        <a
          href="https://wa.me/9779846514318"
          className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-bold text-secondary-foreground transition-colors hover:bg-secondary/90"
        >
          <Headphones className="h-4 w-4" />
          WhatsApp Support
        </a>
      </div>
    </div>
  );
}
