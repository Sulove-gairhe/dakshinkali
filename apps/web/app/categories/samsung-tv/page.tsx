import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoProductListing } from "@/components/seo-product-listing";
import { getAllLiveProducts } from "@/lib/catalog";
import {
  productMatchesBrandSlug,
  productMatchesCategorySlug,
  SITE_NAME,
  absoluteUrl,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Samsung TVs Price in Nepal | ${SITE_NAME}`,
  description:
    "Shop Samsung TVs in Nepal at Dakshinkali Electronics. Compare Smart TV, Crystal UHD, 4K, and Full HD models with prices and warranty support.",
  alternates: {
    canonical: absoluteUrl("/categories/samsung-tv"),
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `Samsung TVs Price in Nepal | ${SITE_NAME}`,
    description:
      "Shop Samsung TVs in Nepal at Dakshinkali Electronics. Compare Smart TV, Crystal UHD, 4K, and Full HD models with prices.",
    url: absoluteUrl("/categories/samsung-tv"),
  },
  twitter: {
    card: "summary",
    title: `Samsung TVs Price in Nepal | ${SITE_NAME}`,
    description:
      "Shop Samsung TVs in Nepal at Dakshinkali Electronics. Compare models, features, prices, and warranty support.",
  },
};

export default async function SamsungTvCategoryPage() {
  const products = (await getAllLiveProducts()).filter(
    (product) =>
      productMatchesBrandSlug(product, "samsung") &&
      productMatchesCategorySlug(product, "televisions"),
  );

  if (products.length === 0) {
    notFound();
  }

  return (
    <SeoProductListing
      title="Samsung TVs Price in Nepal"
      eyebrow="Samsung TV collection"
      description="Shop Samsung TVs in Nepal at Dakshinkali Electronics. Compare Smart TV, Crystal UHD, 4K, and Full HD models with prices, features, and warranty support."
      products={products}
      activeBrandSlug="samsung"
      activeCategorySlug="televisions"
    />
  );
}
