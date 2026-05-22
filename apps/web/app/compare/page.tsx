import { Suspense } from 'react';
import type { Metadata } from 'next';
import ComparePageClient from './compare-page-client';
import { fetchCatalogProducts } from '@/lib/product-catalog-api';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Compare Products',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ComparePage() {
  const initialProducts = await fetchCatalogProducts();

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f6f2] text-foreground">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Loading compare
              </p>
              <h1 className="mt-3 text-3xl font-black">Preparing the compare view</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Pulling your saved compare items into the comparison layout.
              </p>
            </div>
          </div>
        </main>
      }
    >
      <ComparePageClient initialProducts={initialProducts} />
    </Suspense>
  );
}
