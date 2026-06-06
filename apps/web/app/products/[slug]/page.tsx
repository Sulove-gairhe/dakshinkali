import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/product-detail";
import { getProductBySlug } from "@/lib/store-products";
import { fetchDbProductBySlug } from "@/lib/db-products";
import { buildProductJsonLd, buildProductMetadata } from "@/lib/seo";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug) ?? (await fetchDbProductBySlug(slug));

  if (!product) {
    return {
      title: "Product Not Found | Dakshinkali Electronics",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  return buildProductMetadata(product);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  // Check static catalog first, then fall back to DB for admin-created products
  const product = getProductBySlug(slug) ?? (await fetchDbProductBySlug(slug));

  if (!product) {
    notFound();
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildProductJsonLd(product)).replace(
            /</g,
            "\\u003c",
          ),
        }}
      />
      <ProductDetail product={product} />
    </>
  );
}
