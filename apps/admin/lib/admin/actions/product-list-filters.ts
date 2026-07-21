import type { DbProductStatus, PublishingStatus } from "@/lib/admin/types";

export type AdminProductListFilterParams = {
  search?: string;
  categoryId?: string;
  publishingStatus?: PublishingStatus;
  status?: DbProductStatus;
};

type ProductFilterQuery<TQuery> = {
  ilike(column: string, pattern: string): TQuery;
  eq(column: string, value: string): TQuery;
};

export function applyAdminProductListFilters<
  TQuery extends ProductFilterQuery<TQuery>,
>(query: TQuery, filters: AdminProductListFilterParams): TQuery {
  let next = query;

  if (filters.search?.trim()) {
    next = next.ilike("name", `%${filters.search.trim()}%`);
  }
  if (filters.categoryId) {
    next = next.eq("category_id", filters.categoryId);
  }
  if (filters.publishingStatus) {
    next = next.eq("publishing_status", filters.publishingStatus);
  }
  if (filters.status) {
    next = next.eq("status", filters.status);
  }

  return next;
}
