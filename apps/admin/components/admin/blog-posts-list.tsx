"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ImageIcon, Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminDrawer } from "./admin-drawer";
import { ConfirmModal } from "./confirm-modal";
import { ListTableSkeleton } from "./list-table-skeleton";
import {
  listAdminBlogPosts,
  softDeleteBlogPost,
  toggleBlogFeatured,
} from "@/lib/admin/actions/blog";
import type { AdminBlogPost } from "@/lib/admin/blog-types";
import { actionErrorMessage } from "@/lib/admin/order-types";
import { blogStatusBadgeClass } from "@/lib/admin/utils";

export function BlogPostsList({
  categories,
}: {
  categories: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<AdminBlogPost | null>(
    null,
  );
  const [quickView, setQuickView] = useState<AdminBlogPost | null>(null);
  const pageSize = 20;

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [search, status, category, page]);

  async function load() {
    setLoading(true);
    try {
      const result = await listAdminBlogPosts({
        search: search || undefined,
        status: (status as AdminBlogPost["status"]) || undefined,
        category: category || undefined,
        page,
        pageSize,
      });
      setPosts(result.posts);
      setTotal(result.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFeatured(post: AdminBlogPost) {
    const result = await toggleBlogFeatured(post.id);
    if (result.success) {
      toast.success(result.data.featured ? "Marked featured" : "Unfeatured");
      await load();
      return;
    }
    toast.error(actionErrorMessage(result) ?? "Action failed");
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const result = await softDeleteBlogPost(confirmDelete.id);
    if (result.success) {
      toast.success("Post deleted");
      setConfirmDelete(null);
      await load();
      return;
    }
    toast.error(actionErrorMessage(result) ?? "Delete failed");
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap gap-2">
          <input
            type="search"
            placeholder="Search by title…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="min-w-[200px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm md:max-w-xs"
          />
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <select
            value={category}
            onChange={(e) => {
              setPage(1);
              setCategory(e.target.value);
            }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <Link
          href="/admin/blog/new"
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-amber-400"
        >
          Create post
        </Link>
      </div>

      {loading ? (
        <ListTableSkeleton rows={6} />
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-600">
            No blog posts yet — create your first post
          </p>
          <Link
            href="/admin/blog/new"
            className="mt-4 inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900"
          >
            Create post
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Post</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="cursor-pointer border-t border-gray-100 hover:bg-gray-50/80"
                  onClick={() => setQuickView(post)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-100">
                        {post.coverImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.coverImageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{post.title}</p>
                        {post.featured ? (
                          <span className="mt-0.5 inline-flex rounded bg-amber-50 px-1.5 text-[10px] font-semibold text-amber-800">
                            Featured
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{post.category}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${blogStatusBadgeClass(post.status)}`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/admin/blog/${post.id}/edit`)
                        }
                        className="text-amber-700 hover:text-amber-900"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleFeatured(post)}
                        className={
                          post.featured
                            ? "text-amber-600"
                            : "text-gray-400 hover:text-amber-600"
                        }
                        title="Toggle featured"
                      >
                        <Star className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(post)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-600">
            <span>
              {total} post{total === 1 ? "" : "s"}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border border-gray-200 px-2 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-gray-200 px-2 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminDrawer
        open={!!quickView}
        onClose={() => setQuickView(null)}
        title="Blog post"
        width="md"
      >
        {quickView ? (
          <div className="space-y-4">
            {quickView.coverImageUrl ? (
              <div className="aspect-video overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={quickView.coverImageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
            <div>
              <h3 className="font-heading text-lg font-semibold">
                {quickView.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">{quickView.excerpt}</p>
            </div>
            <p className="text-sm">
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${blogStatusBadgeClass(quickView.status)}`}
              >
                {quickView.status}
              </span>
            </p>
            <p className="text-sm text-gray-500">
              Published:{" "}
              {quickView.publishedAt
                ? new Date(quickView.publishedAt).toLocaleString()
                : "—"}
            </p>
            <Link
              href={`/admin/blog/${quickView.id}/edit`}
              className="inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900"
              onClick={() => setQuickView(null)}
            >
              Edit post
            </Link>
          </div>
        ) : null}
      </AdminDrawer>

      <ConfirmModal
        open={!!confirmDelete}
        title="Delete blog post?"
        description="This soft-deletes the post. It will no longer appear in admin or on the storefront."
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
