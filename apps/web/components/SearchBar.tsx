"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  getSearchOptionKey,
  SearchDropdown,
  type SearchOption,
  type SearchResults,
} from "@/components/SearchDropdown";
import type { StoreProduct } from "@/lib/store-products";
import {
  getAvailableBrands,
  getAvailableCategories,
  getCategoryDisplayName,
  getSearchTerms,
  indexedProducts,
  scoreValues,
} from "@/lib/search-products";
import { cn } from "@/lib/utils";

type SearchBarProps = {
  placeholder?: string;
  className?: string;
};

const SEARCH_DELAY_MS = 250;
const SIMULATED_FETCH_MS = 130;
const MIN_QUERY_LENGTH = 2;

const emptyResults: SearchResults = {
  brands: [],
  categories: [],
  products: [],
};

export function SearchBar({
  placeholder = "Search for TVs, refrigerators, appliances...",
  className,
}: SearchBarProps) {
  const router = useRouter();
  const dropdownId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<SearchResults>(emptyResults);
  const [resolvedQuery, setResolvedQuery] = useState("");
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DELAY_MS);
  const meaningfulQuery = query.trim().length >= MIN_QUERY_LENGTH;
  const shouldShowDropdown = isFocused && meaningfulQuery;

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsFocused(false);
        setHighlightedKey(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim();

    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setResults(searchCatalog(trimmedQuery));
      setResolvedQuery(trimmedQuery);
      setHighlightedKey(null);
    }, SIMULATED_FETCH_MS);

    return () => window.clearTimeout(timeout);
  }, [debouncedQuery]);

  const selectableItems = useMemo(
    () =>
      meaningfulQuery
        ? [...results.brands, ...results.categories, ...results.products]
        : [],
    [meaningfulQuery, results],
  );

  const activeDescendant = highlightedKey
    ? `search-option-${highlightedKey}`
    : undefined;

  const isWaitingForDebounce =
    meaningfulQuery && query.trim() !== debouncedQuery.trim();
  const isResolving =
    meaningfulQuery &&
    debouncedQuery.trim().length >= MIN_QUERY_LENGTH &&
    resolvedQuery !== debouncedQuery.trim();
  const isLoading = shouldShowDropdown && (isWaitingForDebounce || isResolving);
  const visibleResults = meaningfulQuery ? results : emptyResults;

  function navigateTo(href: string) {
    setIsFocused(false);
    setHighlightedKey(null);
    inputRef.current?.blur();
    router.push(href);
  }

  function submitGlobalSearch() {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }

    navigateTo(`/search?q=${encodeURIComponent(trimmedQuery)}`);
  }

  function selectItem(item: SearchOption) {
    navigateTo(item.href);
  }

  function moveHighlight(direction: 1 | -1) {
    if (selectableItems.length === 0) {
      setHighlightedKey(null);
      return;
    }

    setHighlightedKey((currentKey) => {
      const currentIndex = currentKey
        ? selectableItems.findIndex(
            (item) => getSearchOptionKey(item) === currentKey,
          )
        : -1;
      const nextIndex =
        (currentIndex + direction + selectableItems.length) %
        selectableItems.length;

      return getSearchOptionKey(selectableItems[nextIndex]);
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      if (!shouldShowDropdown) {
        return;
      }
      event.preventDefault();
      moveHighlight(1);
      return;
    }

    if (event.key === "ArrowUp") {
      if (!shouldShowDropdown) {
        return;
      }
      event.preventDefault();
      moveHighlight(-1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const highlightedItem = highlightedKey
        ? selectableItems.find(
            (item) => getSearchOptionKey(item) === highlightedKey,
          )
        : null;

      if (shouldShowDropdown && highlightedItem) {
        selectItem(highlightedItem);
        return;
      }

      submitGlobalSearch();
      return;
    }

    if (event.key === "Escape") {
      setIsFocused(false);
      setHighlightedKey(null);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <div className="relative flex w-full items-center">
        <Search className="pointer-events-none absolute left-3 h-5 w-5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={shouldShowDropdown}
          aria-controls={dropdownId}
          aria-activedescendant={activeDescendant}
          value={query}
          onFocus={() => setIsFocused(true)}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-11 w-full rounded-l-xl border border-r-0 border-input bg-white pl-10 pr-3 text-sm font-medium text-foreground shadow-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/35"
        />

        <button
          type="button"
          aria-label="Search"
          onMouseDown={(event) => event.preventDefault()}
          onClick={submitGlobalSearch}
          className="flex h-11 shrink-0 items-center justify-center rounded-r-xl bg-primary px-4 text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] sm:px-5"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>

      {shouldShowDropdown && (
        <SearchDropdown
          id={dropdownId}
          query={query}
          results={visibleResults}
          isLoading={isLoading}
          highlightedKey={highlightedKey}
          onHighlight={setHighlightedKey}
          onSelect={selectItem}
        />
      )}
    </div>
  );
}

function useDebouncedValue(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}

function searchCatalog(query: string): SearchResults {
  const terms = getSearchTerms(query);
  const brandResults = getAvailableBrands()
    .map((brand) => ({
      item: toBrandOption(brand),
      score: scoreValues(terms, [brand.name, brand.slug, ...brand.synonyms]),
    }))
    .filter((result) => result.score > 0)
    .sort(sortByScore)
    .slice(0, 5)
    .map((result) => result.item);

  const categoryResults = getAvailableCategories()
    .map((category) => ({
      item: toCategoryOption(category),
      score: scoreValues(terms, [category.name, category.slug, ...category.synonyms]),
    }))
    .filter((result) => result.score > 0)
    .sort(sortByScore)
    .slice(0, 6)
    .map((result) => result.item);

  const productResults = indexedProducts
    .map((indexedProduct) => ({
      item: toProductOption(indexedProduct.product),
      score: scoreValues(terms, [
        indexedProduct.title,
        indexedProduct.description ?? "",
        indexedProduct.slug,
        indexedProduct.brand ?? "",
        indexedProduct.category ?? "",
        indexedProduct.normalizedCategory ?? "",
        ...(indexedProduct.tags || []),
      ]),
    }))
    .filter((result) => result.score > 0)
    .sort(sortByScore)
    .slice(0, 8)
    .map((result) => result.item);

  return {
    brands: brandResults,
    categories: categoryResults,
    products: productResults,
  };
}

function sortByScore<T extends { score: number }>(a: T, b: T) {
  return b.score - a.score;
}

function toBrandOption(brand: {
  name: string;
  slug: string;
  synonyms: string[];
}): SearchOption {
  return {
    type: "brand",
    id: brand.slug,
    label: brand.name,
    slug: brand.slug,
    href: `/search?brand=${brand.slug}`,
  };
}

function toCategoryOption(category: {
  name: string;
  slug: string;
  synonyms: string[];
}): SearchOption {
  return {
    type: "category",
    id: category.slug,
    label: getCategoryDisplayName(category.slug),
    slug: category.slug,
    href: `/search?category=${category.slug}`,
  };
}

function toProductOption(product: StoreProduct): SearchOption {
  return {
    type: "product",
    id: product.id,
    label: product.name,
    slug: product.slug,
    href: product.href || `/products/${product.slug}`,
    thumbnailUrl: product.image,
    price: product.oldPrice,
    salePrice: product.currentPrice,
    status: product.status,
    eyebrow: `${product.brand} · ${getCategoryDisplayName(product.category)}`,
  };
}
