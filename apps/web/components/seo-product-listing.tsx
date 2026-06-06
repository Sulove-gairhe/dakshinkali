import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { SiteNavbar } from "@/components/site-navbar";
import type { StoreProduct } from "@/lib/store-products";
import {
  getProductLandingSlugs,
  productMatchesBrandSlug,
  productMatchesCategorySlug,
} from "@/lib/seo";
import { getBrandDisplayName, getCategoryDisplayName } from "@/lib/search-products";

type SeoProductListingProps = {
  title: string;
  eyebrow: string;
  description: string;
  products: StoreProduct[];
  activeBrandSlug?: string;
  activeCategorySlug?: string;
};

export function SeoProductListing({
  title,
  eyebrow,
  description,
  products,
  activeBrandSlug,
  activeCategorySlug,
}: SeoProductListingProps) {
  const landingSlugs = getProductLandingSlugs(products);
  const relatedBrands = activeCategorySlug
    ? landingSlugs.brands.filter((brandSlug) =>
        products.some(
          (product) =>
            productMatchesBrandSlug(product, brandSlug) &&
            productMatchesCategorySlug(product, activeCategorySlug),
        ),
      )
    : landingSlugs.brands;
  const relatedCategories = activeBrandSlug
    ? landingSlugs.categories.filter((categorySlug) =>
        products.some(
          (product) =>
            productMatchesBrandSlug(product, activeBrandSlug) &&
            productMatchesCategorySlug(product, categorySlug),
        ),
      )
    : landingSlugs.categories;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNavbar />

      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-wide text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:px-8 lg:py-10">
        <aside className="space-y-6">
          {relatedCategories.length > 0 && (
            <LinkGroup title="Categories">
              {relatedCategories.map((categorySlug) => (
                <Link
                  key={categorySlug}
                  href={
                    activeBrandSlug
                      ? `/brands/${activeBrandSlug}/${categorySlug}`
                      : `/categories/${categorySlug}`
                  }
                  className="block rounded-lg px-3 py-2 text-sm font-bold text-foreground transition-colors hover:bg-muted"
                >
                  {getCategoryDisplayName(categorySlug)}
                </Link>
              ))}
            </LinkGroup>
          )}

          {relatedBrands.length > 0 && (
            <LinkGroup title="Brands">
              {relatedBrands.map((brandSlug) => (
                <Link
                  key={brandSlug}
                  href={
                    activeCategorySlug
                      ? `/brands/${brandSlug}/${activeCategorySlug}`
                      : `/brands/${brandSlug}`
                  }
                  className="block rounded-lg px-3 py-2 text-sm font-bold text-foreground transition-colors hover:bg-muted"
                >
                  {getBrandDisplayName(brandSlug)}
                </Link>
              ))}
            </LinkGroup>
          )}
        </aside>

        <div className="min-w-0">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <StaticProductCard key={product.slug} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card px-5 py-10 text-center shadow-sm">
              <h2 className="text-xl font-bold text-foreground">
                No products found
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Browse another brand or category to see available products.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

function StaticProductCard({ product }: { product: StoreProduct }) {
  const badgeItems = product.badges ?? (product.badge ? [product.badge] : []);

  return (
    <article className="card-base group relative flex h-full flex-col overflow-hidden rounded-xl">
      {badgeItems.length > 0 && (
        <div className="absolute left-4 top-4 z-10 flex max-w-[calc(100%-2rem)] flex-wrap gap-2">
          {badgeItems.map((badge) => (
            <span key={badge} className="badge-discount inline-block">
              {badge}
            </span>
          ))}
        </div>
      )}

      <Link
        href={product.href || `/products/${product.slug}`}
        className="card-img-wrap relative block aspect-square w-full bg-white p-4"
      >
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-sm font-bold text-muted-foreground">
            No image
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {product.brand || product.category}
        </p>
        <Link
          href={product.href || `/products/${product.slug}`}
          className="mt-1 line-clamp-2 text-base font-bold text-foreground transition-colors hover:text-primary"
        >
          {product.name}
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {product.shortDescription}
        </p>
        <div className="flex-1" />
        <div className="mt-4 flex items-baseline gap-2">
          <span className="price text-xl">{product.currentPrice}</span>
          {product.oldPrice && (
            <span className="price-original text-sm">{product.oldPrice}</span>
          )}
        </div>
        <Link
          href={product.href || `/products/${product.slug}`}
          className="mt-4 inline-flex justify-center rounded-lg border border-accent/45 bg-white px-4 py-2.5 text-sm font-bold text-primary shadow-sm transition-colors hover:border-accent hover:bg-accent/10"
        >
          View product
        </Link>
      </div>
    </article>
  );
}

function LinkGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h2 className="px-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="mt-2 space-y-1">{children}</div>
    </div>
  );
}
