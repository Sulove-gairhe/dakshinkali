import { notFound } from "next/navigation";
import { SeoProductListing } from "@/components/seo-product-listing";
import { getAllLiveProducts } from "@/lib/catalog";
import { getBrandDisplayName, normalizeBrandSlug } from "@/lib/search-products";
import { buildBrandMetadata, productMatchesBrandSlug } from "@/lib/seo";

export const dynamic = "force-dynamic";

type BrandPageProps = {
  params: Promise<{ brand: string }>;
};

export async function generateMetadata({ params }: BrandPageProps) {
  const { brand } = await params;
  return buildBrandMetadata(brand);
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { brand } = await params;
  const normalizedBrand = normalizeBrandSlug(brand);
  const products = (await getAllLiveProducts()).filter((product) =>
    productMatchesBrandSlug(product, normalizedBrand),
  );

  if (products.length === 0) {
    notFound();
  }

  const brandName = getBrandDisplayName(normalizedBrand);

  return (
    <SeoProductListing
      title={`${brandName} Products Price in Nepal`}
      eyebrow="Brand collection"
      description={`Shop ${brandName} electronics and appliances in Nepal at Dakshinkali Electronics. Compare available products, warranty support, and prices.`}
      products={products}
      activeBrandSlug={normalizedBrand}
    />
  );
}
