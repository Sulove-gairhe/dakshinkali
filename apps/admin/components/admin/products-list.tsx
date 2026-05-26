"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ImageIcon, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "./confirm-modal";
import { ListTableSkeleton } from "./list-table-skeleton";
import {
  deactivateProduct,
  listAdminProducts,
  softDeleteProduct,
} from "@/lib/admin/actions/products";
import {
  formatNprPrice,
  publishingBadgeClass,
  statusBadgeClass,
} from "@/lib/admin/utils";
import type { AdminProductRecord, CategoryRecord } from "@/lib/admin/types";

export function ProductsList({
  categories,
}: {
  categories: CategoryRecord[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<AdminProductRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [categoryId, setCategoryId] = useState(searchParams.get("category") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [publishingStatus, setPublishingStatus] = useState(
    searchParams.get("publishing") ?? "",
  );
  const [confirm, setConfirm] = useState<{
    type: "deactivate" | "delete";
    product: AdminProductRecord;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, categoryId, status, publishingStatus]);

  async function load() {
    setLoading(true);
    try {
      const result = await listAdminProducts({
        search: search || undefined,
        categoryId: categoryId || undefined,
        status: (status as AdminProductRecord["status"]) || undefined,
        publishingStatus:
          (publishingStatus as "draft" | "live") || undefined,
      });
      setProducts(result.products);
      setTotal(result.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load products");
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
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap gap-2">
          <input
            type="search"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[200px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm md:max-w-xs"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
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
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="low_stock">Low stock</option>
            <option value="out_of_stock">Out of stock</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={publishingStatus}
            onChange={(e) => setPublishingStatus(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">All publishing</option>
            <option value="draft">Draft</option>
            <option value="live">Live</option>
          </select>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-amber-400"
        >
          Create Product
        </Link>
      </div>

      {loading ? (
        <ListTableSkeleton rows={5} />
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-600">
            No products yet — click &apos;Create Product&apos; to get started
          </p>
          <Link
            href="/admin/products/new"
            className="mt-4 inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900"
          >
            Create Product
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Publishing</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const thumb = [...product.images]
                  .sort((a, b) => a.order - b.order)[0];
                const sf = product.storefront_data;
                return (
                  <tr key={product.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                          {thumb?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb.url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {product.name}
                          </p>
                          <p className="line-clamp-1 text-xs text-gray-500">
                            {sf?.shortDescription || product.description}
                          </p>
                          {sf?.brand ? (
                            <p className="text-xs text-gray-400">{sf.brand}</p>
                          ) : null}
                          <div className="mt-1 flex flex-wrap gap-1">
                            {sf?.isFeatured ? (
                              <span className="rounded bg-amber-50 px-1 text-[10px] text-amber-800">
                                Featured
                              </span>
                            ) : null}
                            {sf?.isBestSeller ? (
                              <span className="rounded bg-blue-50 px-1 text-[10px] text-blue-800">
                                Best seller
                              </span>
                            ) : null}
                            {sf?.isNewArrival ? (
                              <span className="rounded bg-green-50 px-1 text-[10px] text-green-800">
                                New
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{product.category}</td>
                    <td className="px-4 py-3">
                      {formatNprPrice(product.price)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(product.status)}`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${publishingBadgeClass(product.publishing_status)}`}
                      >
                        {product.publishing_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/admin/products/${product.id}/edit`)
                          }
                          className="text-amber-700 hover:text-amber-900"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirm({ type: "deactivate", product })
                          }
                          className="text-gray-500 hover:text-gray-800"
                          title="Deactivate"
                        >
                          Off
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirm({ type: "delete", product })
                          }
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
            {total} product{total === 1 ? "" : "s"}
          </p>
        </div>
      )}

      <ConfirmModal
        open={!!confirm}
        title={
          confirm?.type === "delete"
            ? "Delete product?"
            : "Deactivate product?"
        }
        description={
          confirm?.type === "delete"
            ? "This soft-deletes the product. It will no longer appear in admin lists."
            : "The product status will be set to inactive and hidden from the storefront."
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
}
