"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutGrid, PackageSearch, Upload } from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "./confirm-modal";
import { ProductCard } from "./products/product-card";
import { ProductCardGridSkeleton } from "./products/product-card-skeleton";
import {
  deactivateProduct,
  listAdminProducts,
  softDeleteProduct,
} from "@/lib/admin/actions/products";
import type { AdminProductRecord, CategoryRecord } from "@/lib/admin/types";

export function ProductsList({
  categories,
}: {
  categories: CategoryRecord[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<AdminProductRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [publishingStatus, setPublishingStatus] = useState("");
  const [status, setStatus] = useState("");
  const [confirm, setConfirm] = useState<{
    type: "deactivate" | "delete";
    product: AdminProductRecord;
  } | null>(null);

  // Suppress unused router warning — kept for potential future navigation
  void router;

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryId, publishingStatus, status]);

  async function load() {
    setLoading(true);
    try {
      const result = await listAdminProducts({
        search: search || undefined,
        categoryId: categoryId || undefined,
        publishingStatus: (publishingStatus as "draft" | "live") || undefined,
        status: (status as AdminProductRecord["status"]) || undefined,
      });
      setProducts(result.products);
      setTotal(result.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't load your products");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
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
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const hasActiveFilters = !!(search || categoryId || publishingStatus || status);

  return (
    <>
      {/* ── Filter / search bar ── */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap gap-2">
          <input
            type="search"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[180px] flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 md:max-w-xs"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
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
            onChange={(e) => setPublishingStatus(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Publishing States</option>
            <option value="live">Live</option>
            <option value="draft">Draft</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
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

      {/* ── Product count ── */}
      {!loading && products.length > 0 && (
        <div className="mb-3 flex items-center gap-1.5 text-xs text-gray-500">
          <LayoutGrid className="h-3.5 w-3.5" />
          <span>
            {total} product{total === 1 ? "" : "s"}
            {hasActiveFilters ? " matching filters" : ""}
          </span>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && <ProductCardGridSkeleton count={8} />}

      {/* ── Empty state ── */}
      {!loading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <PackageSearch className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm font-semibold text-gray-700">
            {hasActiveFilters ? "No products match your current filters" : "No products yet"}
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
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onDeactivate={(p) => setConfirm({ type: "deactivate", product: p })}
              onDelete={(p) => setConfirm({ type: "delete", product: p })}
            />
          ))}
        </div>
      )}

      {/* ── Confirm modal (deactivate / delete) ── */}
      <ConfirmModal
        open={!!confirm}
        title={
          confirm?.type === "delete" ? "Delete product?" : "Deactivate product?"
        }
        description={
          confirm?.type === "delete"
            ? "This will remove the product from your store. You can always add it back later."
            : "The product status will be set to inactive and hidden from the storefront."
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
}
