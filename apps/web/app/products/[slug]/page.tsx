import { notFound } from "next/navigation";
import { SiteNavbar } from "@/components/site-navbar";
import { ProductDetail } from "@/components/product/product-detail";
import { getProductBySlug } from "@/lib/store-products";
import { fetchDbProductBySlug } from "@/lib/db-products";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  // Check static catalog first, then fall back to DB for admin-created products
  const product = getProductBySlug(slug) ?? (await fetchDbProductBySlug(slug));

  if (!product) {
    notFound();
  }

  return (
    <>
      <SiteNavbar />
      <ProductDetail product={product} />
    </>
  );
}
