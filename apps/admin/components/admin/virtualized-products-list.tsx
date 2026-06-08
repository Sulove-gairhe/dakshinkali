"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { LayoutGrid, Loader2, PackageSearch } from "lucide-react";
import { toast } from "sonner";

import { ConfirmModal } from "./confirm-modal";
import { ProductCard } from "./products/product-card";
import { ProductCardSkeleton } from "./products/product-card-skeleton";
import {
  deactivateProduct,
  softDeleteProduct,
} from "@/lib/admin/actions/products";
import {
  fetchAdminProductsPage,
  type AdminProductsPage,
} from "@/lib/admin/actions/products-page";
import type { AdminProductRecord, CategoryRecord } from "@/lib/admin/types";

const PAGE_SIZE = 16;
const COLUMNS = { base: 1, sm: 2, xl: 3, "2xl": 4 };
const ROW_HEIGHT = 220; // estimated card height in px
const ROW_GAP = 16;
const OVERSCAN = 3;

/** Determine the number of grid columns from the container width */
function getColumnCount(width: number): number {
  if (width >= 1536) return COLUMNS["2xl"];
  if (width >= 1280) return COLUMNS.xl;
  if (width >= 640) return COLUMNS.sm;
  return COLUMNS.base;
}

export function VirtualizedProductsList({
  categories,
}: {
  categories: CategoryRecord[];
}) {
  const queryClient = useQueryClient();

  // ── Filter state ──
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [publishingStatus, setPublishingStatus] = useState("");

  // ── Confirm modal ──
  const [confirm, setConfirm] = useState<{
    type: "deactivate" | "delete";
    product: AdminProductRecord;
  } | null>(null);

  // ── Responsive column count ──
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(4);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCols(getColumnCount(entry.contentRect.width));
      }
    });
    observer.observe(el);
    setCols(getColumnCount(el.clientWidth));
    return () => observer.disconnect();
  }, []);

  // ── Debounced search ──
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Query key for cache identity ──
  const queryKey = useMemo(
    () => [
      "admin-products",
      debouncedSearch,
      categoryId,
      status,
      publishingStatus,
    ],
    [debouncedSearch, categoryId, status, publishingStatus],
  );

  // ── Infinite query ──
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery<AdminProductsPage>({
    queryKey,
    queryFn: ({ pageParam }) =>
      fetchAdminProductsPage({
        cursor: pageParam as number,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        categoryId: categoryId || undefined,
        status: (status as AdminProductRecord["status"]) || undefined,
        publishingStatus:
          (publishingStatus as "draft" | "live") || undefined,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  // ── Flatten all pages ──
  const allProducts = useMemo(
    () => data?.pages.flatMap((p) => p.products) ?? [],
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;

  // ── Chunk into rows ──
  const rows = useMemo(() => {
    const result: AdminProductRecord[][] = [];
    for (let i = 0; i < allProducts.length; i += cols) {
      result.push(allProducts.slice(i, i + cols));
    }
    return result;
  }, [allProducts, cols]);

  // ── Virtualizer ──
  const virtualizer = useVirtualizer({
    count: rows.length + (hasNextPage ? 1 : 0), // +1 for sentinel row
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT + ROW_GAP,
    overscan: OVERSCAN,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // ── Auto-fetch next page when sentinel comes into view ──
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;
    if (
      lastItem.index >= rows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage();
    }
  }, [virtualItems, rows.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── Confirm action handler ──
  const handleConfirm = useCallback(async () => {
    if (!confirm) return;
    try {
      if (confirm.type === "deactivate") {
        await deactivateProduct(confirm.product.id);
        toast.success("Product deactivated");
      } else {
        await softDeleteProduct(confirm.product.id);
        toast.success("Product deleted");
      }
      setConfirm(null);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong",
      );
    }
  }, [confirm, queryClient]);

  const hasActiveFilters = !!(
    debouncedSearch ||
    categoryId ||
    status ||
    publishingStatus
  );

  // ── Loading skeleton grid ──
  if (isLoading) {
    return (
      <div className="flex flex-1 min-h-0 flex-col">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          status={status}
          onStatusChange={setStatus}
          publishingStatus={publishingStatus}
          onPublishingStatusChange={setPublishingStatus}
          categories={categories}
        />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-white px-6 py-16 text-center">
        <p className="text-sm font-semibold text-red-700">
          Couldn't load your products
        </p>
        <p className="mt-1 text-xs text-red-400">
          {error instanceof Error ? error.message : "Something went wrong"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* ── Filter bar ── */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
        status={status}
        onStatusChange={setStatus}
        publishingStatus={publishingStatus}
        onPublishingStatusChange={setPublishingStatus}
        categories={categories}
      />

      {/* ── Product count ── */}
      {allProducts.length > 0 && (
        <div className="mt-3 mb-3 flex items-center gap-1.5 text-xs text-gray-500">
          <LayoutGrid className="h-3.5 w-3.5" />
          <span>
            Showing {allProducts.length} of {total} product
            {total === 1 ? "" : "s"}
            {hasActiveFilters ? " matching filters" : ""}
          </span>
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && allProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <PackageSearch className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm font-semibold text-gray-700">
            {hasActiveFilters
              ? "No products match your current filters"
              : "No products yet"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {hasActiveFilters
              ? "Try adjusting your search or filter criteria."
              : "Click 'Create Product' to add your first product."}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategoryId("");
                setStatus("");
                setPublishingStatus("");
              }}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Reset filters
            </button>
          ) : (
            <Link
              href="/admin/products/new"
              className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Create Product
            </Link>
          )}
        </div>
      )}

      {/* ── Virtualized scrollable grid ── */}
      {allProducts.length > 0 && (
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto scrollbar-thin"
        >
          <div
            className="relative w-full"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualItems.map((virtualRow) => {
              const isLoaderRow = virtualRow.index >= rows.length;
              const rowProducts = rows[virtualRow.index];

              return (
                <div
                  key={virtualRow.key}
                  className="absolute left-0 top-0 w-full"
                  style={{
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {isLoaderRow ? (
                    <div className="flex items-center justify-center py-8">
                      {isFetchingNextPage ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : (
                        <span className="text-xs text-gray-400">
                          End of results
                        </span>
                      )}
                    </div>
                  ) : (
                    <div
                      className="grid gap-4"
                      style={{
                        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                      }}
                    >
                      {rowProducts?.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onDeactivate={(p) =>
                            setConfirm({ type: "deactivate", product: p })
                          }
                          onDelete={(p) =>
                            setConfirm({ type: "delete", product: p })
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Confirm modal ── */}
      <ConfirmModal
        open={!!confirm}
        title={
          confirm?.type === "delete"
            ? "Delete product?"
            : "Deactivate product?"
        }
        description={
          confirm?.type === "delete"
            ? "This will remove the product from your store. You can always add it back later."
            : "The product status will be set to inactive and hidden from the storefront."
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() => void handleConfirm()}
      />
    </div>
  );
}

// ─── Filter Bar (extracted for readability) ──────────────────────────────────

function FilterBar({
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  status,
  onStatusChange,
  publishingStatus,
  onPublishingStatusChange,
  categories,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  categoryId: string;
  onCategoryChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  publishingStatus: string;
  onPublishingStatusChange: (v: string) => void;
  categories: CategoryRecord[];
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-1 flex-wrap gap-2">
        <input
          type="search"
          placeholder="Search products…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="min-w-[180px] flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 md:max-w-xs"
        />
        <select
          value={categoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="low_stock">Low stock</option>
          <option value="out_of_stock">Out of stock</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={publishingStatus}
          onChange={(e) => onPublishingStatusChange(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All publishing</option>
          <option value="draft">Draft</option>
          <option value="live">Live</option>
        </select>
      </div>
      <Link
        href="/admin/products/new"
        className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        Create Product
      </Link>
    </div>
  );
}
