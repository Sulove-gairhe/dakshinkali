import type { Metadata } from "next";
import { ProductsClient } from "./products-client";
import {
  dbBrandToFilterOption,
  fetchDbBrands,
  fetchDbCategories,
  fetchDbProductsPage,
} from "@/lib/db-products";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    brand?: string;
    category?: string;
    sort?: string;
  }>;
};

export const metadata: Metadata = {
  title: `Products | ${SITE_NAME}`,
  description:
    "Browse electronics and home appliances at Dakshinkali Electronics.",
  alternates: {
    canonical: absoluteUrl("/products"),
  },
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const [initialPage, dbCategories, dbBrands] = await Promise.all([
    fetchDbProductsPage({
      pageSize: 12,
      search: params.q,
      brand: params.brand,
      category: params.category,
      sort:
        params.sort === "price-high-low" || params.sort === "price-low-high"
          ? params.sort
          : "newest",
    }),
    fetchDbCategories(),
    fetchDbBrands(),
  ]);

  const brandOptions = dbBrands.map(dbBrandToFilterOption);
  const categoryOptions = dbCategories.map((category) => ({
    name: category.name,
    slug: category.slug,
  }));

  return (
    <ProductsClient
      initialPage={initialPage}
      brandOptions={brandOptions}
      categoryOptions={categoryOptions}
    />
  );
}
