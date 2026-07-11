import { NextResponse } from "next/server";
import {
  fetchDbProductsPage,
  type StorefrontProductsPageParams,
} from "@/lib/db-products";

const SORT_VALUES = new Set(["newest", "price-high-low", "price-low-high"]);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cursor = Number(url.searchParams.get("cursor") ?? "0");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "12");
  const sort = url.searchParams.get("sort") || "newest";

  const params: StorefrontProductsPageParams = {
    cursor: Number.isFinite(cursor) ? cursor : 0,
    pageSize: Number.isFinite(pageSize) ? pageSize : 12,
    search: url.searchParams.get("q") || undefined,
    brand: url.searchParams.get("brand") || undefined,
    category: url.searchParams.get("category") || undefined,
    sort: SORT_VALUES.has(sort)
      ? (sort as StorefrontProductsPageParams["sort"])
      : "newest",
  };

  const page = await fetchDbProductsPage(params);
  return NextResponse.json(page);
}
