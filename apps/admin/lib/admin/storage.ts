"use client";

import { createClient } from "@/lib/supabase/client";

const PRODUCT_BUCKET = "product-images";
const BLOG_BUCKET = "blog-images";
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export function validateImageFile(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return "Invalid type (JPEG, PNG, WebP only)";
  if (file.size > MAX_SIZE) return "Too large (max 5MB)";
  return null;
}

export async function uploadProductImage(
  productId: string,
  file: File,
  order: number,
): Promise<{ id: string; url: string; filename: string; order: number; storagePath: string }> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const supabase = createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const id = crypto.randomUUID();
  const storagePath = `products/${productId}/${Date.now()}-${id}.${ext}`;

  const { error } = await supabase.storage
    .from(PRODUCT_BUCKET)
    .upload(storagePath, file, { cacheControl: "3600", upsert: false });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(storagePath);

  return {
    id,
    url: data.publicUrl,
    filename: file.name,
    order,
    storagePath,
  };
}

export async function deleteProductImage(storagePath: string) {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(PRODUCT_BUCKET)
    .remove([storagePath]);
  if (error) throw new Error(error.message);
}

export async function uploadBlogCoverImage(
  postId: string,
  file: File,
): Promise<{ url: string; filename: string; storagePath: string }> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const supabase = createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const id = crypto.randomUUID();
  const storagePath = `blog/${postId}/${Date.now()}-${id}.${ext}`;

  const { error } = await supabase.storage
    .from(BLOG_BUCKET)
    .upload(storagePath, file, { cacheControl: "3600", upsert: false });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BLOG_BUCKET).getPublicUrl(storagePath);

  return {
    url: data.publicUrl,
    filename: file.name,
    storagePath,
  };
}
