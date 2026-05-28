import { notFound } from "next/navigation";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";
import { BlogForm } from "@/components/admin/blog-form";
import { blogToFormState } from "@/lib/admin/blog-types";
import {
  getAdminBlogPost,
  getExistingBlogCategories,
} from "@/lib/admin/actions/blog";

type Props = { params: Promise<{ id: string }> };

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params;

  try {
    const [post, categories] = await Promise.all([
      getAdminBlogPost(id),
      getExistingBlogCategories(),
    ]);

    return (
      <AdminLayoutShell title="Edit blog post">
        <BlogForm initial={blogToFormState(post)} categories={categories} />
      </AdminLayoutShell>
    );
  } catch {
    notFound();
  }
}
