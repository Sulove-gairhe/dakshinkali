import { notFound } from "next/navigation";
import { SeoProductListing } from "@/components/seo-product-listing";
import { getAllLiveProducts } from "@/lib/catalog";
import {
  getBrandDisplayName,
  getCategoryDisplayName,
  normalizeBrandSlug,
  normalizeCategorySlug,
} from "@/lib/search-products";
import {
  buildBrandCategoryMetadata,
  productMatchesBrandSlug,
  productMatchesCategorySlug,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

type BrandCategoryPageProps = {
  params: Promise<{ brand: string; category: string }>;
};

export async function generateMetadata({ params }: BrandCategoryPageProps) {
  const { brand, category } = await params;
  return buildBrandCategoryMetadata(brand, category);
}

export default async function BrandCategoryPage({
  params,
}: BrandCategoryPageProps) {
  const { brand, category } = await params;
  const normalizedBrand = normalizeBrandSlug(brand);
  const normalizedCategory = normalizeCategorySlug(category);
  const products = (await getAllLiveProducts()).filter(
    (product) =>
      productMatchesBrandSlug(product, normalizedBrand) &&
      productMatchesCategorySlug(product, normalizedCategory),
  );

  if (products.length === 0) {
    notFound();
  }

  const brandName = getBrandDisplayName(normalizedBrand);
  const categoryName = getCategoryDisplayName(normalizedCategory);

  return (
    <SeoProductListing
      title={`${brandName} ${categoryName} Price in Nepal`}
      eyebrow="Brand category"
      description={`Shop ${brandName} ${categoryName.toLowerCase()} in Nepal at Dakshinkali Electronics. Compare models, capacity, features, warranty support, and prices.`}
      products={products}
      activeBrandSlug={normalizedBrand}
      activeCategorySlug={normalizedCategory}
    />
  );
}
