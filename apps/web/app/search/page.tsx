import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchResultsClient } from "./search-results-client";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    brand?: string;
    category?: string;
  }>;
};

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q?.trim();
  const title = query
    ? `Search results for ${query} | ${SITE_NAME}`
    : `Search Products | ${SITE_NAME}`;
  const description = query
    ? `Search results for ${query} at ${SITE_NAME}. Browse matching products, then compare prices and features.`
    : `Search products at ${SITE_NAME}. Browse electronics and home appliances by product, category, or brand.`;

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl("/search"),
    },
    robots: {
      index: false,
      follow: true,
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: absoluteUrl("/search"),
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

// Data is already fetched in the root layout and available via SearchDataContext.
// The SearchResultsClient reads it from context — no extra fetch needed here.
export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchResultsClient />
    </Suspense>
  );
}
