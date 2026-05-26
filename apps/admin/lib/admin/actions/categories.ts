"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin/auth-server";
import { slugifyName } from "@/lib/admin/utils";
import type { CategoryRecord } from "@/lib/admin/types";

const categorySchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().optional(),
});

export async function listCategories(includeInactive = true) {
  const { supabase } = await requireAdminUser();
  let query = supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as CategoryRecord[];
}

export async function createCategory(input: {
  name: string;
  slug?: string;
  description?: string | null;
  sort_order?: number;
}) {
  const { supabase } = await requireAdminUser();
  const slug = input.slug?.trim() || slugifyName(input.name);
  const parsed = categorySchema.parse({
    ...input,
    slug,
    description: input.description ?? null,
    sort_order: input.sort_order ?? 0,
    is_active: true,
  });

  const { data, error } = await supabase
    .from("categories")
    .insert(parsed)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("A category with this slug already exists");
    }
    throw new Error(error.message);
  }

  revalidatePath("/admin/categories");
  return data as CategoryRecord;
}

export async function updateCategory(
  id: string,
  input: {
    name?: string;
    slug?: string;
    description?: string | null;
    sort_order?: number;
    is_active?: boolean;
  },
) {
  const { supabase } = await requireAdminUser();
  const payload: Record<string, unknown> = { ...input };
  if (input.name && !input.slug) {
    payload.slug = slugifyName(input.name);
  }

  const { data, error } = await supabase
    .from("categories")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("A category with this slug already exists");
    }
    throw new Error(error.message);
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  return data as CategoryRecord;
}

export async function toggleCategoryActive(id: string, isActive: boolean) {
  return updateCategory(id, { is_active: isActive });
}
