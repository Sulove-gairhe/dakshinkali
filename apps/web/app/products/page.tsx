import type { Metadata } from 'next';
import { Suspense } from 'react';
import ProductsPageClient from './products-page-client';
import {
  catalogCategories,
  type CatalogCategoryId,
  getCatalogCategory,
} from '@/data/catalog';
import { getSiteUrl, siteDescription, siteName } from '@/lib/site';
import { fetchCatalogProducts } from '@/lib/product-catalog-api';

export const dynamic = 'force-dynamic';

type SearchParams = {
  category?: string | string[];
  brand?: string | string[];
  badge?: string | string[];
  q?: string | string[];
};

type ProductsPageProps = {
  searchParams?: SearchParams | Promise<SearchParams>;
};

function getFirstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveCategory(category?: string): CatalogCategoryId | undefined {
  if (!category) return undefined;

  return catalogCategories.some((item) => item.id === category)
    ? (category as CatalogCategoryId)
    : undefined;
}

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const category = resolveCategory(getFirstParam(resolvedSearchParams?.category));
  const brand = getFirstParam(resolvedSearchParams?.brand);
  const badge = getFirstParam(resolvedSearchParams?.badge);
  const query = getFirstParam(resolvedSearchParams?.q);
  const categoryLabel = category ? getCatalogCategory(category).label : 'Products';
  const hasFilters = Boolean(category || brand || badge || query);
  const description = category
    ? `Browse ${categoryLabel.toLowerCase()} and other electronics from Dakshinkali Electronics.`
    : siteDescription;

  return {
    metadataBase: new URL(getSiteUrl()),
    title: hasFilters ? `${categoryLabel}` : 'Products',
    description,
    alternates: {
      canonical: '/products',
    },
    robots: hasFilters
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
        },
    openGraph: {
      type: 'website',
      siteName,
      title: hasFilters ? `${categoryLabel}` : 'Products',
      description,
      url: '/products',
      images: [
        {
          url: '/images/logo-placeholder.jpeg',
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: hasFilters ? `${categoryLabel}` : 'Products',
      description,
      images: ['/images/logo-placeholder.jpeg'],
    },
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = await searchParams;
  const category = resolveCategory(getFirstParam(resolvedSearchParams?.category));
  const brand = getFirstParam(resolvedSearchParams?.brand) ?? undefined;
  const badge = getFirstParam(resolvedSearchParams?.badge) ?? undefined;
  const query = getFirstParam(resolvedSearchParams?.q) ?? undefined;
  const products = await fetchCatalogProducts();

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f6f2] text-foreground">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Loading catalog
              </p>
              <h1 className="mt-3 text-3xl font-black">Preparing the catalog</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Pulling the current category and filter selection into the storefront grid.
              </p>
            </div>
          </div>
        </main>
      }
    >
      <ProductsPageClient
        initialCategory={category}
        initialBrand={brand}
        initialBadge={badge}
        initialQuery={query}
        initialProducts={products}
      />
    </Suspense>
  );
}
