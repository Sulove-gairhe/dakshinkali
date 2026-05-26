import { Suspense } from "react";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { BlogPostsList } from "@/components/admin/blog-posts-list";
import { getExistingBlogCategories } from "@/lib/admin/actions/blog";

export default async function AdminBlogPage() {
  let categories: string[] = [];
  try {
    categories = await getExistingBlogCategories();
  } catch {
    categories = [];
  }

  return (
    <AdminLayoutShell title="Blog">
      <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
        <BlogPostsList categories={categories} />
      </Suspense>
    </AdminLayoutShell>
  );
}
