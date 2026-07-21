"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin/auth-server";
import {
  cleanBrandDisplayName,
  getPriorityBrandSort,
  getRejectedBrandReason,
  listActiveBrands,
  normalizeBrandName,
  resolveBrand,
  sortBrands,
  type BrandRecord,
  type ResolvedBrand,
} from "@/lib/admin/brand-resolver";

export async function listBrandOptions(): Promise<BrandRecord[]> {
  const { supabase } = await requireAdminUser();
  return listActiveBrands(supabase);
}

export async function resolveProductBrand(
  input: string | null | undefined,
): Promise<ResolvedBrand | null> {
  const { supabase } = await requireAdminUser();
  return resolveBrand(supabase, input);
}

const brandNameSchema = z.string().transform(cleanBrandDisplayName).refine(
  (value) => !getRejectedBrandReason(value),
  (value) => ({ message: getRejectedBrandReason(value) ?? "Invalid brand" }),
);

export async function listBrandManagementRecords(): Promise<BrandRecord[]> {
  const { supabase } = await requireAdminUser();
  const [{ data: brands, error: brandError }, { data: products, error: productError }] =
    await Promise.all([
      supabase
        .from("brands")
        .select("id, name, normalized_name, sort_priority, is_active")
        .order("sort_priority", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true }),
      supabase.from("products").select("brand_id").is("deleted_at", null),
    ]);

  if (brandError) throw new Error(brandError.message);
  if (productError) throw new Error(productError.message);

  const counts = new Map<string, number>();
  for (const product of products ?? []) {
    if (product.brand_id) counts.set(product.brand_id, (counts.get(product.brand_id) ?? 0) + 1);
  }

  return sortBrands(
    (brands ?? []).map((brand) => ({
      ...(brand as BrandRecord),
      product_count: counts.get(brand.id as string) ?? 0,
    })),
  );
}

export async function createManagedBrand(input: string): Promise<BrandRecord> {
  const { supabase } = await requireAdminUser();
  const name = brandNameSchema.parse(input);
  const normalizedName = normalizeBrandName(name);

  const { data: existing, error: existingError } = await supabase
    .from("brands")
    .select("id, name, normalized_name, sort_priority, is_active")
    .eq("normalized_name", normalizedName)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing) return existing as BrandRecord;

  const { data, error } = await supabase
    .from("brands")
    .insert({ name, normalized_name: normalizedName, sort_priority: getPriorityBrandSort(normalizedName), is_active: true })
    .select("id, name, normalized_name, sort_priority, is_active")
    .single();
  if (error) {
    if (error.code === "23505") {
      const { data: concurrent } = await supabase
        .from("brands")
        .select("id, name, normalized_name, sort_priority, is_active")
        .eq("normalized_name", normalizedName)
        .single();
      if (concurrent) return concurrent as BrandRecord;
    }
    throw new Error(error.message);
  }
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/brands");
  return data as BrandRecord;
}

export async function renameManagedBrand(id: string, input: string): Promise<BrandRecord> {
  const { supabase } = await requireAdminUser();
  const name = brandNameSchema.parse(input);
  const { data: renamed, error } = await supabase.rpc("rename_brand", { p_brand_id: id, p_name: name });
  if (error) throw new Error(error.message);
  const renamedRecord = (Array.isArray(renamed) ? renamed[0] : renamed) as { id?: string } | null;
  const resultId = renamedRecord?.id ?? id;
  const { data, error: fetchError } = await supabase
    .from("brands")
    .select("id, name, normalized_name, sort_priority, is_active")
    .eq("id", resultId)
    .single();
  if (fetchError || !data) throw new Error(fetchError?.message ?? "Brand not found");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/brands");
  revalidatePath("/products");
  return data as BrandRecord;
}

export async function setManagedBrandActive(id: string, isActive: boolean): Promise<BrandRecord> {
  const { supabase } = await requireAdminUser();
  const { data, error } = await supabase
    .from("brands")
    .update({ is_active: isActive })
    .eq("id", id)
    .select("id, name, normalized_name, sort_priority, is_active")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Brand not found");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/brands");
  revalidatePath("/products");
  return data as BrandRecord;
}

export async function deleteUnusedManagedBrand(id: string): Promise<void> {
  const { supabase } = await requireAdminUser();
  const { error } = await supabase.rpc("delete_brand_if_unused", { p_brand_id: id });
  if (error) {
    if (error.message.includes("brand_referenced")) {
      throw new Error("This brand has linked products. Deactivate it or reassign those products before deleting.");
    }
    throw new Error(error.message);
  }
  revalidatePath("/admin/products/brands");
  revalidatePath("/admin/products");
}
