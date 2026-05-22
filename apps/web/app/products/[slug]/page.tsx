import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/product/product-detail';
import { fetchProductDetailDataBySlug } from '@/lib/product-catalog-api';
import { getSiteUrl, siteName } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await fetchProductDetailDataBySlug(params.slug)

  if (!product) {
    notFound()
  }

  return <ProductDetail product={product} />
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await fetchProductDetailDataBySlug(params.slug);

  if (!product) {
    return {
      title: 'Product not found',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const summary = product.descriptionSections
    .flatMap((section) => section.body ?? [])
    .find((line) => Boolean(line));
  const description = summary
    ? `${summary} Buy ${product.name} from Dakshinkali Electronics.`
    : `Buy ${product.name} from Dakshinkali Electronics.`;
  const canonical = `/products/${product.slug}`;
  const image = product.images[0]?.src ?? '/images/logo-placeholder.jpeg';

  return {
    metadataBase: new URL(getSiteUrl()),
    title: product.name,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'website',
      siteName,
      title: product.name,
      description,
      url: canonical,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: [image],
    },
  };
}
