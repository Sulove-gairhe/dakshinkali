"use server";

import { requireAdminUser } from "@/lib/admin/auth-server";
import type {
  AdminProductRecord,
  DbProductStatus,
  ProductImageRecord,
  PublishingStatus,
  StorefrontData,
} from "@/lib/admin/types";

/** Shape returned by the infinite query fetch function */
export interface AdminProductsPage {
  products: AdminProductRecord[];
  nextCursor: number | null;
  total: number;
}

export interface FetchAdminProductsPageParams {
  cursor?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  status?: DbProductStatus;
  publishingStatus?: PublishingStatus;
}

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

/**
 * Paginated product fetcher for infinite scroll.
 * Uses offset-based pagination via Supabase `.range()`.
 */
export async function fetchAdminProductsPage(
  params: FetchAdminProductsPageParams,
): Promise<AdminProductsPage> {
  const { supabase } = await requireAdminUser();
  const cursor = params.cursor ?? 0;
  const pageSize = params.pageSize ?? 16;
  const from = cursor;
  const to = from + pageSize - 1;

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (params.search?.trim()) {
    query = query.ilike("name", `%${params.search.trim()}%`);
  }
  if (params.categoryId) {
    query = query.eq("category_id", params.categoryId);
  }
  if (params.status) {
    query = query.eq("status", params.status);
  }
  if (params.publishingStatus) {
    query = query.eq("publishing_status", params.publishingStatus);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(error.message);

  const products = (data ?? []).map((row) =>
    mapRow(row as Record<string, unknown>),
  );
  const total = count ?? 0;
  const nextOffset = from + products.length;
  const nextCursor = nextOffset < total ? nextOffset : null;

  return { products, nextCursor, total };
}
