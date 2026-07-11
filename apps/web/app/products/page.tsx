import type { Metadata } from "next";
import { ProductsClient } from "./products-client";
import { fetchDbCategories, fetchDbProductsPage } from "@/lib/db-products";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";
import { getAvailableBrands } from "@/lib/search-products";

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
  const [initialPage, dbCategories] = await Promise.all([
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
  ]);

  const brandOptions = getAvailableBrands().map((brand) => ({
    name: brand.name,
    slug: brand.slug,
  }));
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
