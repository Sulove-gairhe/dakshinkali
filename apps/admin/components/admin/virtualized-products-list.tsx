"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, Loader2, PackageSearch, Upload } from "lucide-react";
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
  const [publishingStatus, setPublishingStatus] = useState("");
  const [status, setStatus] = useState("");

  // ── Confirm modal ──
  const [confirm, setConfirm] = useState<{
    type: "deactivate" | "delete";
    product: AdminProductRecord;
  } | null>(null);

  const loadMoreRef = useRef<HTMLDivElement>(null);

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
      publishingStatus,
      status,
    ],
    [debouncedSearch, categoryId, publishingStatus, status],
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
        publishingStatus: (publishingStatus as "draft" | "live") || undefined,
        status: (status as AdminProductRecord["status"]) || undefined,
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

  // ── Auto-fetch next page when sentinel comes into view ──
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchNextPage();
        }
      },
      { rootMargin: "320px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, allProducts.length]);

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
    publishingStatus ||
    status
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
          publishingStatus={publishingStatus}
          onPublishingStatusChange={setPublishingStatus}
          status={status}
          onStatusChange={setStatus}
          categories={categories}
        />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
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
        publishingStatus={publishingStatus}
        onPublishingStatusChange={setPublishingStatus}
        status={status}
        onStatusChange={setStatus}
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
                setPublishingStatus("");
                setStatus("");
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

      {/* ── Product card grid ── */}
      {allProducts.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
            {allProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onDeactivate={(p) =>
                  setConfirm({ type: "deactivate", product: p })
                }
                onDelete={(p) => setConfirm({ type: "delete", product: p })}
              />
            ))}
          </div>

          <div
            ref={loadMoreRef}
            className="flex min-h-12 items-center justify-center py-6"
          >
            {isFetchingNextPage ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : hasNextPage ? (
              <span className="text-xs text-gray-400">Loading more products…</span>
            ) : (
              <span className="text-xs text-gray-400">End of results</span>
            )}
          </div>
        </>
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
  publishingStatus,
  onPublishingStatusChange,
  status,
  onStatusChange,
  categories,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  categoryId: string;
  onCategoryChange: (v: string) => void;
  publishingStatus: string;
  onPublishingStatusChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
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
          value={publishingStatus}
          onChange={(e) => onPublishingStatusChange(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Publishing States</option>
          <option value="live">Live</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Product Statuses</option>
          <option value="active">Active</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <Link
        href="/admin/products/import"
        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Upload className="h-4 w-4" />
        Import CSV
      </Link>
      <Link
        href="/admin/products/new"
        className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        Create Product
      </Link>
    </div>
  );
}
