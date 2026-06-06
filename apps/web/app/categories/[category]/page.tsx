import { notFound } from "next/navigation";
import { SeoProductListing } from "@/components/seo-product-listing";
import { getAllLiveProducts } from "@/lib/catalog";
import { getCategoryDisplayName, normalizeCategorySlug } from "@/lib/search-products";
import {
  buildCategoryMetadata,
  productMatchesCategorySlug,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export async function generateMetadata({ params }: CategoryPageProps) {
  const { category } = await params;
  return buildCategoryMetadata(category);
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const normalizedCategory = normalizeCategorySlug(category);
  const products = (await getAllLiveProducts()).filter((product) =>
    productMatchesCategorySlug(product, normalizedCategory),
  );

  if (products.length === 0) {
    notFound();
  }

  const categoryName = getCategoryDisplayName(normalizedCategory);

  return (
    <SeoProductListing
      title={`${categoryName} Price in Nepal`}
      eyebrow="Category collection"
      description={`Shop ${categoryName.toLowerCase()} in Nepal at Dakshinkali Electronics. Compare available models, features, warranty support, and prices.`}
      products={products}
      activeCategorySlug={normalizedCategory}
    />
  );
}
