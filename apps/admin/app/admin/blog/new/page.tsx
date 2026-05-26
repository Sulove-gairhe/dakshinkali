import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { BlogForm } from "@/components/admin/blog-form";
import { emptyBlogFormState } from "@/lib/admin/blog-types";
import { getExistingBlogCategories } from "@/lib/admin/actions/blog";
import { requireAdminUser } from "@/lib/admin/auth-server";

export default async function NewBlogPostPage() {
  let author = "Dakshinkali Electronics";
  let categories: string[] = [];

  try {
    const { profile } = await requireAdminUser();
    author = profile?.full_name?.trim() || author;
    categories = await getExistingBlogCategories();
  } catch {
    /* unauthenticated handled by middleware */
  }

  return (
    <AdminLayoutShell title="New blog post">
      <BlogForm initial={emptyBlogFormState(author)} categories={categories} />
    </AdminLayoutShell>
  );
}
