import { notFound } from "next/navigation";
import { SiteNavbar } from "@/components/site-navbar";
import { ProductDetail } from "@/components/product/product-detail";
import { getProductBySlug } from "@/lib/store-products";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

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
