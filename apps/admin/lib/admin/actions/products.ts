"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin/auth-server";
import {
  normalizeStorefrontData,
  slugifyProductName,
  validateStorefrontLiveData,
  updateStorefrontSection,
} from "@/lib/admin/utils";
import type {
  AdminProductRecord,
  DbProductStatus,
  ProductFormState,
  ProductImageRecord,
  ProductListFilters,
  PublishingStatus,
  StorefrontData,
} from "@/lib/admin/types";

const saveProductSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  price: z.number().positive(),
  categoryId: z.string().uuid(),
  status: z.enum(["active", "inactive", "out_of_stock", "low_stock"]),
  publishingStatus: z.enum(["draft", "live"]),
  images: z.array(
    z.object({
      id: z.string(),
      url: z.string().min(1),
      filename: z.string(),
      order: z.number().int().min(0),
      storagePath: z.string().optional(),
    }),
  ),
  storefrontData: z.record(z.unknown()),
});

function mapRow(row: Record<string, unknown>): AdminProductRecord {
  const images = Array.isArray(row.images)
    ? (row.images as ProductImageRecord[])
    : typeof row.images === "string"
      ? JSON.parse(row.images)
      : [];

  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? null,
    price: Number(row.price),
    category: row.category as string,
    category_id: (row.category_id as string) ?? null,
    status: row.status as DbProductStatus,
    publishing_status: row.publishing_status as PublishingStatus,
    images,
    storefront_data: (row.storefront_data as StorefrontData) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    deleted_at: (row.deleted_at as string) ?? null,
  };
}

export async function createDraftProduct(categoryId?: string) {
  const { supabase } = await requireAdminUser();

  let resolvedCategoryId = categoryId;
  if (!resolvedCategoryId) {
    const { data: firstCat } = await supabase
      .from("categories")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!firstCat) {
      throw new Error("Create at least one active category first");
    }
    resolvedCategoryId = firstCat.id;
  }

  const { data: category, error: catError } = await supabase
    .from("categories")
    .select("name")
    .eq("id", resolvedCategoryId)
    .single();

  if (catError || !category) {
    throw new Error("Category not found");
  }

  const draftName = `Untitled product ${Date.now()}`;

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: draftName,
      description: null,
      price: 1,
      category: category.name,
      category_id: resolvedCategoryId,
      status: "active",
      publishing_status: "draft",
      images: [],
      storefront_data: {
        slug: `draft-${Date.now()}`,
      },
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data as Record<string, unknown>);
}

export async function listAdminProducts(filters: ProductListFilters = {}) {
  const { supabase } = await requireAdminUser();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (filters.search?.trim()) {
    query = query.ilike("name", `%${filters.search.trim()}%`);
  }
  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.publishingStatus) {
    query = query.eq("publishing_status", filters.publishingStatus);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(error.message);

  return {
    products: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)),
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getAdminProduct(id: string) {
  const { supabase } = await requireAdminUser();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Product not found");
  return mapRow(data as Record<string, unknown>);
}

export async function checkSlugAvailable(slug: string, excludeProductId?: string) {
  const { supabase } = await requireAdminUser();
  if (!slug.trim()) return { available: false };

  let query = supabase
    .from("products")
    .select("id")
    .is("deleted_at", null)
    .filter("storefront_data->>slug", "eq", slug.trim());

  if (excludeProductId) {
    query = query.neq("id", excludeProductId);
  }

  const { data, error } = await query.limit(1);
  if (error) throw new Error(error.message);
  return { available: !data?.length };
}

export async function searchProductsForRelated(term: string, limit = 10) {
  const { supabase } = await requireAdminUser();
  const q = term.trim();
  if (!q) return [];

  const { data, error } = await supabase
    .from("products")
    .select("id, name, storefront_data")
    .is("deleted_at", null)
    .or(`name.ilike.%${q}%,storefront_data->>slug.ilike.%${q}%`)
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    slug: (row.storefront_data as StorefrontData | null)?.slug ?? "",
  }));
}

export async function saveProduct(
  payload: ProductFormState,
  options: { publishingStatus?: PublishingStatus; validateLive?: boolean } = {},
) {
  const { supabase } = await requireAdminUser();
  const publishingStatus =
    options.publishingStatus ?? payload.publishingStatus ?? "draft";

  let storefrontData = normalizeStorefrontData(payload.storefrontData);
  if (!storefrontData.slug?.trim()) {
    storefrontData = {
      ...storefrontData,
      slug: slugifyProductName(payload.name),
    };
  }

  const formState: ProductFormState = {
    ...payload,
    storefrontData,
    publishingStatus,
  };

  if (options.validateLive || publishingStatus === "live") {
    const validation = validateStorefrontLiveData(formState, storefrontData);
    if (!validation.valid) {
      return { ok: false as const, errors: validation.errors };
    }
  }

  const parsed = saveProductSchema.parse({
    id: payload.id,
    name: payload.name,
    description: payload.description || null,
    price: payload.price,
    categoryId: payload.categoryId,
    status: payload.status,
    publishingStatus,
    images: payload.images,
    storefrontData,
  });

  const { data: category, error: catError } = await supabase
    .from("categories")
    .select("name")
    .eq("id", parsed.categoryId)
    .single();

  if (catError || !category) {
    throw new Error("Selected category not found");
  }

  let mergedStorefrontData = storefrontData;
  // Keep previous storefront data for membership comparisons when updating
  let prevStorefrontData: StorefrontData | null = null;
  if (parsed.id) {
    const { data: existing, error: existingError } = await supabase
      .from("products")
      .select("storefront_data")
      .eq("id", parsed.id)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);
    prevStorefrontData = (existing?.storefront_data as StorefrontData | null) ?? {};
    mergedStorefrontData = { ...prevStorefrontData, ...storefrontData };
  }

  const row = {
    name: parsed.name,
    description: parsed.description,
    price: parsed.price,
    category: category.name,
    category_id: parsed.categoryId,
    status: parsed.status,
    publishing_status: parsed.publishingStatus,
    images: parsed.images,
    storefront_data: mergedStorefrontData,
  };

  if (parsed.id) {
    const { data, error } = await supabase
      .from("products")
      .update(row)
      .eq("id", parsed.id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { ok: false as const, errors: ["Product slug is already taken"] };
      }
      throw new Error(error.message);
    }
    // Update storefront sections based on final storefront_data
    try {
      const finalSf = mergedStorefrontData ?? {};
      const slug = finalSf.slug ?? slugifyProductName(parsed.name);
      const isActive = finalSf.isActive !== false && parsed.publishingStatus === "live";

      // If admin explicitly requested removal of featured state, ensure it's cleared
      if (finalSf.removeFeatured) {
        finalSf.isFeatured = false;
      }

      // Kitchen Appliances: explicit flag
      await updateStorefrontSection(
        supabase,
        "kitchen_appliances",
        slug,
        Boolean(isActive && finalSf.showInKitchen),
        12,
      );

      // Best selling: explicit flag
      await updateStorefrontSection(
        supabase,
        "best_selling",
        slug,
        Boolean(isActive && finalSf.showInBestSelling),
        8,
      );

      // Trending: explicit flag
      await updateStorefrontSection(
        supabase,
        "trending",
        slug,
        Boolean(isActive && finalSf.showInTrending),
        8,
      );

      // Clearance deals: explicit flag
      await updateStorefrontSection(supabase, "clearance_deals", slug, Boolean(isActive && finalSf.showInClearance), 8);
    } catch (err) {
      // Do not block product save on storefront section update failures; log server-side
      console.error("Failed to update storefront sections:", err);
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${parsed.id}/edit`);
    revalidatePath("/");
    return { ok: true as const, product: mapRow(data as Record<string, unknown>) };
  }

  const { data, error } = await supabase
    .from("products")
    .insert(row)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false as const, errors: ["Product slug is already taken"] };
    }
    throw new Error(error.message);
  }

  // Insert flow: update storefront sections similarly
  try {
    const finalSf = mergedStorefrontData ?? {};
    const slug = finalSf.slug ?? slugifyProductName(parsed.name);
    const isActive = finalSf.isActive !== false && parsed.publishingStatus === "live";

    if (finalSf.removeFeatured) {
      finalSf.isFeatured = false;
    }

    await updateStorefrontSection(
      supabase,
      "kitchen_appliances",
      slug,
      Boolean(isActive && finalSf.showInKitchen),
      12,
    );

    await updateStorefrontSection(supabase, "best_selling", slug, Boolean(isActive && finalSf.showInBestSelling), 8);
    await updateStorefrontSection(supabase, "trending", slug, Boolean(isActive && finalSf.showInTrending), 8);
    await updateStorefrontSection(supabase, "clearance_deals", slug, Boolean(isActive && finalSf.showInClearance), 8);
  } catch (err) {
    console.error("Failed to update storefront sections:", err);
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { ok: true as const, product: mapRow(data as Record<string, unknown>) };
}

export async function deactivateProduct(id: string) {
  const { supabase } = await requireAdminUser();
  const { error } = await supabase
    .from("products")
    .update({ status: "inactive" })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
}

export async function softDeleteProduct(id: string) {
  const { supabase } = await requireAdminUser();
  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString(), status: "inactive" })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
}

export async function productToFormState(product: AdminProductRecord): Promise<ProductFormState> {
  return {
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    price: product.price,
    categoryId: product.category_id ?? "",
    categoryName: product.category,
    status: product.status,
    publishingStatus: product.publishing_status,
    images: product.images ?? [],
    storefrontData: product.storefront_data ?? {},
    variants: product.storefront_data?.variants ?? [],
  };
}
