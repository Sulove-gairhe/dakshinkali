"use client";

import {
  ArrowUpRight,
  BadgeCheck,
  Boxes,
  Building2,
  Headphones,
  PackageSearch,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type SearchOptionType = "brand" | "category" | "product";

export type SearchOption = {
  type: SearchOptionType;
  id: string;
  label: string;
  slug: string;
  href: string;
  thumbnailUrl?: string;
  price?: string;
  salePrice?: string;
  status?: "In Stock" | "Low Stock" | "Out of Stock";
  eyebrow?: string;
};

export type SearchResults = {
  brands: SearchOption[];
  categories: SearchOption[];
  products: SearchOption[];
};

type SearchDropdownProps = {
  id: string;
  query: string;
  results: SearchResults;
  isLoading: boolean;
  highlightedKey: string | null;
  onHighlight: (key: string) => void;
  onSelect: (item: SearchOption) => void;
};

const emptyResults: SearchResults = {
  brands: [],
  categories: [],
  products: [],
};

export function getSearchOptionKey(item: Pick<SearchOption, "type" | "id">) {
  return `${item.type}-${item.id}`;
}

export function SearchDropdown({
  id,
  query,
  results = emptyResults,
  isLoading,
  highlightedKey,
  onHighlight,
  onSelect,
}: SearchDropdownProps) {
  const hasResults =
    results.brands.length > 0 ||
    results.categories.length > 0 ||
    results.products.length > 0;

  return (
    <div
      id={id}
      role="listbox"
      aria-label="Search suggestions"
      className="absolute left-1/2 top-[calc(100%+0.75rem)] z-[100] w-[min(calc(100vw-1.5rem),46rem)] -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl sm:left-0 sm:w-[min(46rem,calc(100vw-2rem))] sm:translate-x-0"
    >
      <div className="max-h-[min(72vh,34rem)] overflow-y-auto">
        {isLoading ? (
          <SearchSkeleton />
        ) : hasResults ? (
          <div className="grid gap-0 md:grid-cols-[minmax(13rem,0.85fr)_minmax(0,1.65fr)]">
            <aside className="border-b border-border bg-muted/35 p-3 md:border-b-0 md:border-r">
              <ResultSection
                title="Brands"
                icon={Building2}
                items={results.brands}
                highlightedKey={highlightedKey}
                onHighlight={onHighlight}
                onSelect={onSelect}
              />
              <ResultSection
                title="Categories"
                icon={Boxes}
                items={results.categories}
                highlightedKey={highlightedKey}
                onHighlight={onHighlight}
                onSelect={onSelect}
              />
            </aside>

            <section className="p-3">
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <PackageSearch className="h-4 w-4" />
                  Products
                </div>
                {results.products.length > 0 && (
                  <span className="rounded-full bg-primary/15 px-2 py-1 text-xs font-bold text-foreground">
                    {results.products.length}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {results.products.map((item) => (
                  <ProductResult
                    key={getSearchOptionKey(item)}
                    item={item}
                    isHighlighted={highlightedKey === getSearchOptionKey(item)}
                    onHighlight={onHighlight}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </section>
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-border bg-popover/95 px-4 py-3 text-xs text-muted-foreground backdrop-blur">
        <span className="line-clamp-1">
          Press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-semibold text-foreground">Enter</kbd>{" "}
          to view all results for{" "}
          <span className="font-semibold text-foreground">
            &quot;{query.trim()}&quot;
          </span>
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0" />
      </div>
    </div>
  );
}

function ResultSection({
  title,
  icon: Icon,
  items,
  highlightedKey,
  onHighlight,
  onSelect,
}: {
  title: string;
  icon: React.ElementType;
  items: SearchOption[];
  highlightedKey: string | null;
  onHighlight: (key: string) => void;
  onSelect: (item: SearchOption) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          const key = getSearchOptionKey(item);
          const isHighlighted = highlightedKey === key;

          return (
            <button
              key={key}
              id={`search-option-${key}`}
              role="option"
              aria-selected={isHighlighted}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => onHighlight(key)}
              onClick={() => onSelect(item)}
              className={cn(
                "group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all",
                isHighlighted
                  ? "bg-secondary text-secondary-foreground shadow-sm"
                  : "text-foreground hover:bg-background",
              )}
            >
              <span className="min-w-0 truncate">{item.label}</span>
              <ArrowUpRight
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
                  isHighlighted ? "text-secondary-foreground" : "text-muted-foreground",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProductResult({
  item,
  isHighlighted,
  onHighlight,
  onSelect,
}: {
  item: SearchOption;
  isHighlighted: boolean;
  onHighlight: (key: string) => void;
  onSelect: (item: SearchOption) => void;
}) {
  const key = getSearchOptionKey(item);

  return (
    <button
      id={`search-option-${key}`}
      role="option"
      aria-selected={isHighlighted}
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onMouseEnter={() => onHighlight(key)}
      onClick={() => onSelect(item)}
      className={cn(
        "grid w-full grid-cols-[4rem_minmax(0,1fr)] gap-3 rounded-xl p-2 text-left transition-all",
        isHighlighted
          ? "bg-secondary text-secondary-foreground shadow-sm"
          : "hover:bg-muted/70",
      )}
    >
      <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-border bg-white">
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt=""
            width={64}
            height={64}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
            <PackageSearch className="h-6 w-6" />
          </div>
        )}
      </div>

      <div className="min-w-0 py-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {item.eyebrow && (
              <p
                className={cn(
                  "mb-0.5 truncate text-xs font-semibold",
                  isHighlighted ? "text-secondary-foreground/75" : "text-muted-foreground",
                )}
              >
                {item.eyebrow}
              </p>
            )}
            <p className="line-clamp-2 text-sm font-bold leading-snug">
              {item.label}
            </p>
          </div>
          {item.status && <InventoryBadge status={item.status} />}
        </div>

        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-extrabold">
            {item.salePrice || item.price}
          </span>
          {item.salePrice && item.price && (
            <span
              className={cn(
                "text-xs line-through",
                isHighlighted ? "text-secondary-foreground/65" : "text-muted-foreground",
              )}
            >
              {item.price}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function InventoryBadge({
  status,
}: {
  status: NonNullable<SearchOption["status"]>;
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-1 text-[11px] font-bold",
        status === "In Stock" && "bg-cyan-100 text-cyan-800",
        status === "Low Stock" && "bg-amber-100 text-amber-800",
        status === "Out of Stock" && "bg-red-50 text-red-700",
      )}
    >
      {status}
    </span>
  );
}

function SearchSkeleton() {
  return (
    <div className="grid gap-0 md:grid-cols-[minmax(13rem,0.85fr)_minmax(0,1.65fr)]">
      <div className="border-b border-border bg-muted/35 p-3 md:border-b-0 md:border-r">
        <div className="mb-4 h-4 w-24 rounded-full bg-muted" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-10 rounded-xl bg-background" />
          ))}
        </div>
      </div>
      <div className="p-3">
        <div className="mb-3 h-4 w-28 rounded-full bg-muted" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 rounded-xl p-2"
            >
              <div className="h-16 w-16 rounded-xl bg-muted" />
              <div className="space-y-2 py-1">
                <div className="h-3 w-24 rounded-full bg-muted" />
                <div className="h-4 w-full rounded-full bg-muted" />
                <div className="h-4 w-2/3 rounded-full bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  const quickLinks = [
    { label: "Televisions", href: "/search?category=televisions" },
    { label: "Refrigerators", href: "/search?category=refrigerator" },
    { label: "Washing Machines", href: "/search?category=washing-machine" },
  ];

  return (
    <div className="p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <PackageSearch className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-bold text-foreground">
        No results found
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Try searching TV, fridge, washing machine, or kitchen appliances.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-border px-3 py-2 text-sm font-bold text-foreground transition-colors hover:border-primary hover:bg-primary/15"
          >
            {link.label}
          </Link>
        ))}
        <a
          href="https://wa.me/9779846514318"
          className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-2 text-sm font-bold text-secondary-foreground transition-colors hover:bg-secondary/90"
        >
          <Headphones className="h-4 w-4" />
          Contact on WhatsApp
        </a>
      </div>
      <div className="mx-auto mt-5 flex max-w-xs items-center justify-center gap-2 rounded-xl bg-primary/15 px-3 py-2 text-xs font-semibold text-foreground">
        <BadgeCheck className="h-4 w-4" />
        Local support for home appliances
      </div>
    </div>
  );
}
