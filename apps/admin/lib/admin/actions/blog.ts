"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin/auth-server";
import type {
  AdminBlogPost,
  BlogContentBlock,
  BlogFormState,
  BlogListFilters,
} from "@/lib/admin/blog-types";
import type { ActionResult } from "@/lib/admin/order-types";
import {
  calculateReadTime,
  slugifyBlogTitle,
} from "@/lib/admin/utils";

const blogContentBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text: z.string() }),
  z.object({ type: z.literal("heading"), text: z.string() }),
  z.object({
    type: z.literal("list"),
    items: z.array(z.string()),
  }),
  z.object({ type: z.literal("tip"), text: z.string() }),
]);

const blogFormSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  excerpt: z.string().min(1).max(300),
  category: z.string().min(1).max(120),
  readTime: z.string().max(50).optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  coverImageFilename: z.string().optional().nullable(),
  author: z.string().min(1).max(200),
  publishedAt: z.string().optional().nullable(),
  status: z.enum(["draft", "published"]),
  featured: z.boolean(),
  tags: z.array(z.string()),
  seoTitle: z.string().max(120).optional().nullable(),
  seoDescription: z.string().max(200).optional().nullable(),
  content: z.array(blogContentBlockSchema),
});

function mapRow(row: Record<string, unknown>): AdminBlogPost {
  const content = Array.isArray(row.content)
    ? (row.content as BlogContentBlock[])
    : typeof row.content === "string"
      ? JSON.parse(row.content)
      : [];

  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    excerpt: row.excerpt as string,
    category: row.category as string,
    readTime: (row.read_time as string) ?? null,
    coverImageUrl: (row.cover_image_url as string) ?? null,
    coverImageFilename: (row.cover_image_filename as string) ?? null,
    author: row.author as string,
    publishedAt: (row.published_at as string) ?? null,
    updatedAt: row.updated_at as string,
    status: row.status as AdminBlogPost["status"],
    featured: Boolean(row.featured),
    tags: (row.tags as string[]) ?? [],
    seoTitle: (row.seo_title as string) ?? null,
    seoDescription: (row.seo_description as string) ?? null,
    content,
    createdAt: row.created_at as string,
    deletedAt: (row.deleted_at as string) ?? null,
  };
}

function formToRow(
  parsed: z.infer<typeof blogFormSchema>,
  readTime: string | null,
) {
  return {
    slug: parsed.slug.trim(),
    title: parsed.title.trim(),
    excerpt: parsed.excerpt.trim(),
    category: parsed.category.trim(),
    read_time: readTime,
    cover_image_url: parsed.coverImageUrl ?? null,
    cover_image_filename: parsed.coverImageFilename ?? null,
    author: parsed.author.trim(),
    published_at: parsed.publishedAt ?? null,
    status: parsed.status,
    featured: parsed.featured,
    tags: parsed.tags,
    seo_title: parsed.seoTitle?.trim() || null,
    seo_description: parsed.seoDescription?.trim() || null,
    content: parsed.content,
    updated_at: new Date().toISOString(),
  };
}

function validatePublishRequirements(parsed: z.infer<typeof blogFormSchema>) {
  const errors: string[] = [];
  if (!parsed.title.trim()) errors.push("Title is required");
  if (!parsed.slug.trim()) errors.push("Slug is required");
  if (!parsed.excerpt.trim()) errors.push("Excerpt is required");
  if (!parsed.content.length) errors.push("At least one content block is required");
  if (!parsed.coverImageUrl) errors.push("Cover image is required to publish");
  return errors;
}

async function isSlugTaken(
  supabase: Awaited<ReturnType<typeof requireAdminUser>>["supabase"],
  slug: string,
  excludeId?: string,
) {
  let query = supabase
    .from("blog_posts")
    .select("id")
    .eq("slug", slug)
    .is("deleted_at", null);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query.limit(1);
  return (data?.length ?? 0) > 0;
}

export async function listAdminBlogPosts(filters: BlogListFilters = {}) {
  const { supabase } = await requireAdminUser();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("blog_posts")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (filters.search?.trim()) {
    query = query.ilike("title", `%${filters.search.trim()}%`);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.category?.trim()) {
    query = query.eq("category", filters.category.trim());
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(error.message);

  return {
    posts: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)),
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getAdminBlogPost(id: string) {
  const { supabase } = await requireAdminUser();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Blog post not found");
  return mapRow(data as Record<string, unknown>);
}

export async function getExistingBlogTags(): Promise<string[]> {
  const { supabase } = await requireAdminUser();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("tags")
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
  const set = new Set<string>();
  for (const row of data ?? []) {
    for (const tag of (row.tags as string[]) ?? []) {
      if (tag.trim()) set.add(tag.trim());
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export async function getExistingBlogCategories(): Promise<string[]> {
  const { supabase } = await requireAdminUser();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("category")
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
  const set = new Set<string>();
  for (const row of data ?? []) {
    const cat = (row.category as string)?.trim();
    if (cat) set.add(cat);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export async function createBlogPost(
  data: BlogFormState,
): Promise<ActionResult<AdminBlogPost>> {
  try {
    const { supabase } = await requireAdminUser();
    const slug = data.slug.trim() || slugifyBlogTitle(data.title);
    const readTime =
      data.readTimeManual && data.readTime
        ? data.readTime
        : calculateReadTime(data.content);

    const parsed = blogFormSchema.parse({
      ...data,
      slug,
      readTime,
      seoTitle: data.seoTitle || data.title,
      seoDescription: data.seoDescription || data.excerpt,
    });

    if (await isSlugTaken(supabase, parsed.slug)) {
      return { success: false, error: "Slug is already taken" };
    }

    const { data: row, error } = await supabase
      .from("blog_posts")
      .insert(formToRow(parsed, readTime))
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/blog");
    return { success: true, data: mapRow(row as Record<string, unknown>) };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create post",
    };
  }
}

export async function updateBlogPost(
  id: string,
  data: BlogFormState,
): Promise<ActionResult<AdminBlogPost>> {
  try {
    const { supabase } = await requireAdminUser();
    const slug = data.slug.trim() || slugifyBlogTitle(data.title);
    const readTime =
      data.readTimeManual && data.readTime
        ? data.readTime
        : calculateReadTime(data.content);

    const parsed = blogFormSchema.parse({
      ...data,
      id,
      slug,
      readTime,
      seoTitle: data.seoTitle || data.title,
      seoDescription: data.seoDescription || data.excerpt,
    });

    if (await isSlugTaken(supabase, parsed.slug, id)) {
      return { success: false, error: "Slug is already taken" };
    }

    const { data: row, error } = await supabase
      .from("blog_posts")
      .update(formToRow(parsed, readTime))
      .eq("id", id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/blog");
    revalidatePath(`/admin/blog/${id}/edit`);
    return { success: true, data: mapRow(row as Record<string, unknown>) };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update post",
    };
  }
}

export async function publishBlogPost(
  id: string,
  data: BlogFormState,
): Promise<ActionResult<AdminBlogPost>> {
  try {
    const slug = data.slug.trim() || slugifyBlogTitle(data.title);
    const readTime =
      data.readTimeManual && data.readTime
        ? data.readTime
        : calculateReadTime(data.content);

    const parsed = blogFormSchema.parse({
      ...data,
      id,
      slug,
      readTime,
      status: "published",
      seoTitle: data.seoTitle || data.title,
      seoDescription: data.seoDescription || data.excerpt,
      publishedAt:
        data.publishedAt ?? new Date().toISOString(),
    });

    const publishErrors = validatePublishRequirements(parsed);
    if (publishErrors.length) {
      return { success: false, error: publishErrors.join(". ") };
    }

    return updateBlogPost(id, {
      ...data,
      status: "published",
      publishedAt: parsed.publishedAt ?? data.publishedAt,
      slug,
      readTime,
      readTimeManual: data.readTimeManual,
    });
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to publish",
    };
  }
}

export async function unpublishBlogPost(
  id: string,
): Promise<ActionResult<AdminBlogPost>> {
  try {
    const { supabase } = await requireAdminUser();
    const { data: row, error } = await supabase
      .from("blog_posts")
      .update({ status: "draft", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/blog");
    revalidatePath(`/admin/blog/${id}/edit`);
    return { success: true, data: mapRow(row as Record<string, unknown>) };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to unpublish",
    };
  }
}

export async function toggleBlogFeatured(
  id: string,
): Promise<ActionResult<AdminBlogPost>> {
  try {
    const { supabase } = await requireAdminUser();
    const existing = await getAdminBlogPost(id);
    const { data: row, error } = await supabase
      .from("blog_posts")
      .update({
        featured: !existing.featured,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/blog");
    return { success: true, data: mapRow(row as Record<string, unknown>) };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to toggle featured",
    };
  }
}

export async function softDeleteBlogPost(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase } = await requireAdminUser();
    const { error } = await supabase
      .from("blog_posts")
      .update({
        deleted_at: new Date().toISOString(),
        status: "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/blog");
    return { success: true, data: { id } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete post",
    };
  }
}

export async function uploadBlogCoverImage(
  formData: FormData,
): Promise<ActionResult<{ url: string; filename: string }>> {
  try {
    const postId = z.string().uuid().parse(formData.get("postId"));
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { success: false, error: "No file provided" };
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      return { success: false, error: "Invalid type (JPEG, PNG, WebP only)" };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "Too large (max 5MB)" };
    }

    const { supabase } = await requireAdminUser();
    const ext = file.name.split(".").pop() || "jpg";
    const storagePath = `blog/${postId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("blog-images")
      .upload(storagePath, file, { cacheControl: "3600", upsert: false });

    if (error) return { success: false, error: error.message };

    const { data } = supabase.storage.from("blog-images").getPublicUrl(storagePath);

    return {
      success: true,
      data: { url: data.publicUrl, filename: file.name },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Upload failed",
    };
  }
}
