'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Filter, Grid2x2, ShoppingCart, Sparkles } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SiteNavbar } from '@/components/site-navbar';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart-provider';
import { useCompare } from '@/contexts/compare-context';
import {
  catalogCategories,
  getCatalogCategory,
  type CatalogCategoryId,
  type CatalogProduct,
} from '@/data/catalog';

type ProductsPageClientProps = {
  initialCategory?: CatalogCategoryId;
  initialBrand?: string;
  initialBadge?: string;
  initialQuery?: string;
  initialProducts: CatalogProduct[];
};

const badgeFilters = ['Popular', 'Best value', 'Energy saver', 'Compact', 'Store more', 'Fast heat', 'Inverter', 'Bluetooth', 'Portable'] as const;

export default function ProductsPageClient({
  initialCategory,
  initialBrand,
  initialBadge,
  initialQuery,
  initialProducts,
}: ProductsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCategory = initialCategory;
  const selectedBrand = initialBrand?.toLowerCase();
  const selectedBadge = initialBadge?.toLowerCase();
  const query = initialQuery?.toLowerCase() ?? '';
  const { addItem } = useCart();
  const { addProduct, isInCompare, removeProduct } = useCompare();

  const activeCategory = getCatalogCategory(selectedCategory);

  const brands = useMemo(() => {
    return Array.from(new Set(initialProducts.map((product) => product.brand))).sort((a, b) => a.localeCompare(b));
  }, [initialProducts]);

  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const products = useMemo(() => {
    let items = selectedCategory
      ? initialProducts.filter((product) => product.categoryId === selectedCategory)
      : initialProducts;

    if (selectedBrand) {
      items = items.filter((product) => product.brand.toLowerCase().includes(selectedBrand));
    }

    if (selectedBadge) {
      items = items.filter((product) => product.badge?.toLowerCase() === selectedBadge);
    }

    if (query) {
      items = items.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.shortDescription.toLowerCase().includes(query) ||
          product.features.some((feature) => feature.toLowerCase().includes(query)),
      );
    }

    return items;
  }, [initialProducts, query, selectedBadge, selectedBrand, selectedCategory]);

  const counts = useMemo(() => {
    return catalogCategories.reduce<Record<string, number>>((acc, category) => {
      acc[category.id] = initialProducts.filter((product) => product.categoryId === category.id).length;
      return acc;
    }, {});
  }, [initialProducts]);

  return (
    <main className="min-h-screen bg-[#f7f6f2] text-foreground">
      <SiteNavbar />

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-[2rem] border border-white/70 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:sticky lg:top-28 lg:h-fit">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-muted-foreground">
              <Grid2x2 className="h-4 w-4 text-primary" />
              Categories
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Browse products</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Use filters to narrow the catalog by category, brand, badge, or search term.
            </p>

            <div className="mt-5 space-y-4 rounded-3xl border border-border/70 bg-muted/30 p-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Search
                </label>
                <input
                  type="search"
                  defaultValue={initialQuery ?? ''}
                  onChange={(event) => updateFilters({ q: event.target.value.trim() || undefined })}
                  placeholder="Search products"
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Brand
                </label>
                <select
                  value={initialBrand ?? ''}
                  onChange={(event) => updateFilters({ brand: event.target.value || undefined })}
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                >
                  <option value="">All brands</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Badge
                </label>
                <select
                  value={initialBadge ?? ''}
                  onChange={(event) => updateFilters({ badge: event.target.value || undefined })}
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                >
                  <option value="">All badges</option>
                  {badgeFilters.map((badge) => (
                    <option key={badge} value={badge}>
                      {badge}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-2xl"
                onClick={() => router.replace('/products')}
              >
                Clear all filters
              </Button>
            </div>

            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={() => updateFilters({ category: undefined })}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${!selectedCategory ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/20 hover:bg-muted/40'}`}
              >
                All products
                <span className="text-xs text-muted-foreground">{initialProducts.length}</span>
              </button>
              {catalogCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => updateFilters({ category: category.id })}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${selectedCategory === category.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/20 hover:bg-muted/40'}`}
                >
                  <span>{category.label}</span>
                  <span className="text-xs text-muted-foreground">{counts[category.id]}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-foreground px-4 py-4 text-background">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-background/60">
                Current filter
              </p>
              <p className="mt-2 text-lg font-bold">{selectedCategory ? activeCategory.label : 'All products'}</p>
              <p className="mt-1 text-sm text-background/80">
                {selectedBrand ? `Brand: ${selectedBrand}` : 'No brand filter applied'}
                {selectedBadge ? ` • Badge: ${selectedBadge}` : ''}
              </p>
            </div>
          </aside>

          <div className="space-y-6">
            <div className={`rounded-[2rem] bg-gradient-to-br ${activeCategory.accent} p-6 text-white shadow-xl`}>
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                  Catalog
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  {selectedCategory ? activeCategory.heroTitle : 'All products'}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
                  {selectedCategory ? activeCategory.description : 'Explore the full curated electronics catalog and jump into compare or product detail.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-[1.5rem] border border-border/70 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                {products.length} product{products.length === 1 ? '' : 's'} found
              </div>
              <div className="flex flex-wrap gap-2">
                {catalogCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => updateFilters({ category: category.id })}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${selectedCategory === category.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {products.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-border bg-white p-10 text-center shadow-sm">
                <Filter className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-2xl font-black">No products match your filters</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try another category or clear the brand, badge, or search filters.
                </p>
                <Link href="/products" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">
                  Reset filters
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <CatalogCard
                    key={product.id}
                    product={product}
                    onAddToCart={() => addItem({
                      id: product.id,
                      slug: product.slug,
                      name: product.name,
                      shortDescription: product.shortDescription,
                      image: product.image,
                      currentPrice: product.currentPrice,
                      oldPrice: product.oldPrice,
                      href: product.href,
                    })}
                    onToggleCompare={() => {
                      if (isInCompare(product.id)) {
                        removeProduct(product.id);
                        return;
                      }

                      addProduct({
                        id: product.id,
                        name: product.name,
                        price: Number(product.currentPrice.replace(/[^\d.]/g, '')) || 0,
                        image: product.image,
                        category: product.categoryLabel,
                        status: 'active',
                        description: product.shortDescription,
                      });
                    }}
                    inCompare={isInCompare(product.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function CatalogCard({
  product,
  onAddToCart,
  onToggleCompare,
  inCompare,
}: {
  product: CatalogProduct;
  onAddToCart: () => void;
  onToggleCompare: () => void;
  inCompare: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={product.href} className="relative block aspect-[4/3] bg-[#f5f3ed]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-contain p-5"
        />
        {product.badge ? (
          <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-sm">
            {product.badge}
          </span>
        ) : null}
      </Link>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {product.categoryLabel} • {product.brand}
          </p>
          <h3 className="mt-2 text-lg font-bold leading-6">{product.name}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{product.shortDescription}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {product.features.map((feature) => (
            <span key={feature} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              {feature}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Price</p>
            <p className="mt-1 text-xl font-black text-foreground">{product.currentPrice}</p>
          </div>

          <Button asChild variant="secondary" size="sm" className="rounded-full px-4">
            <Link href={product.href}>View</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onAddToCart}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-foreground/90"
          >
            <ShoppingCart className="h-4 w-4" />
            Cart
          </button>
          <button
            type="button"
            onClick={onToggleCompare}
            className={`rounded-full px-4 py-3 text-sm font-bold transition-colors ${inCompare ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'}`}
          >
            {inCompare ? 'In Compare' : 'Compare'}
          </button>
        </div>
      </div>
    </article>
  );
}
