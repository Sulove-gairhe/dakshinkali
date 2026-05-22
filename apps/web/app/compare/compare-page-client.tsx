'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Check, Filter, PackageSearch, Plus, ShoppingCart, Sparkles, X } from 'lucide-react';
import { SiteNavbar } from '@/components/site-navbar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart } from '@/components/cart-provider';
import { useCompare } from '@/contexts/compare-context';
import {
  compareCategories,
  type CompareCategory,
  type CompareProductCard,
  buildCompareProductsByCategory,
} from '@/data/compare-catalog';
import { type CatalogProduct } from '@/data/catalog';

const categoryMap = new Map(compareCategories.map((category) => [category.id, category]));

type ComparePageClientProps = {
  initialProducts: CatalogProduct[];
};

function resolveCategory(searchCategory: string | null): CompareCategory {
  if (!searchCategory) return compareCategories[0];
  return categoryMap.get(searchCategory) ?? compareCategories[0];
}

export default function ComparePage({ initialProducts }: ComparePageClientProps) {
  const searchParams = useSearchParams();
  const initialCategory = resolveCategory(searchParams.get('category'));
  const { products: selectedProducts, addProduct, removeProduct, clearProducts, maxProducts } = useCompare();
  const { addItem: addToCart } = useCart();
  const [activeCategoryId, setActiveCategoryId] = useState(initialCategory.id);
  const [hideSame, setHideSame] = useState(false);

  const activeCategory = categoryMap.get(activeCategoryId) ?? initialCategory;
  const compareProductsByCategory = useMemo(
    () => buildCompareProductsByCategory(initialProducts),
    [initialProducts],
  );
  const catalog = compareProductsByCategory[activeCategory.id] ?? [];
  const selectedIds = new Set(selectedProducts.map((product) => product.slug ?? product.id));
  const allCatalogProducts = useMemo(
    () =>
      Object.values(compareProductsByCategory).reduce<CompareProductCard[]>(
        (all, items) => all.concat(items),
        [],
      ),
    [compareProductsByCategory],
  );
  const selectedCompareProducts = useMemo(
    () =>
      selectedProducts.map((selected) => {
        const catalogMatch = allCatalogProducts.find((product) => product.id === selected.id);

        return {
          ...selected,
          compareFields: selected.compareFields ?? catalogMatch?.compareFields ?? [],
        };
      }),
    [allCatalogProducts, selectedProducts],
  );
  const selectedCatalogProducts = useMemo(
    () =>
      selectedCompareProducts
        .map((selected) => allCatalogProducts.find((product) => product.id === selected.id))
        .filter((product): product is CompareProductCard => Boolean(product)),
    [allCatalogProducts, selectedCompareProducts],
  );
  const compareRows = useMemo(() => {
    const rows = new Map<string, string[]>();

    selectedCompareProducts.forEach((product) => {
      (product.compareFields ?? []).forEach((field) => {
        if (!rows.has(field.label)) {
          rows.set(field.label, []);
        }
        rows.get(field.label)?.push(field.value);
      });
    });

    return Array.from(rows.entries())
      .map(([label, values]) => ({ label, values }))
      .filter((row) => !hideSame || new Set(row.values).size > 1);
  }, [hideSame, selectedCompareProducts]);

  const canAddMore = selectedProducts.length < maxProducts;
  const showSelection = selectedProducts.length > 0;

  function handleToggle(product: CompareProductCard) {
    const key = product.slug ?? product.legacySlug ?? product.id;

    if (selectedIds.has(key)) {
      removeProduct(key);
      return;
    }

    if (!canAddMore) return;

    addProduct({
      id: product.id,
      slug: key,
      name: product.title,
      price: Number(product.price.replace(/[^\d.]/g, '')) || 0,
      image: product.image,
      category: product.category,
      status: 'active',
      description: product.shortSpec,
      compareFields: product.compareFields,
    });
  }

  function handleAddToCart(productId: string) {
    const product = selectedCatalogProducts.find((item) => item.id === productId || item.slug === productId || item.legacySlug === productId);
    if (!product) return;

    addToCart({
      id: product.id,
      slug: product.slug ?? product.legacySlug ?? product.href.split('/').filter(Boolean).pop() ?? product.id,
      name: product.title,
      shortDescription: product.shortSpec,
      image: product.image,
      currentPrice: product.price,
      href: product.href,
    });
  }

  const selectedSummary = selectedCompareProducts.length === 0
    ? 'Choose 2 to 4 products to compare side by side.'
    : `${selectedCompareProducts.length} product${selectedCompareProducts.length === 1 ? '' : 's'} selected`;

  return (
    <main className="min-h-screen bg-[#f7f6f2] text-foreground">
      <SiteNavbar />

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="overflow-hidden rounded-[1.25rem] border border-white/70 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
          <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="border-b border-border/60 bg-[#faf9f6] p-3.5 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Compare Electronics
              </div>
              <h1 className="mt-3 text-xl font-black tracking-tight text-foreground sm:text-2xl">
                Find the better fit.
              </h1>
              <p className="mt-2.5 text-xs leading-5 text-muted-foreground sm:text-sm">
                Pick a category first, then compare 2 to 4 curated products with specs that matter.
              </p>

              <div className="mt-4 space-y-2">
                {compareCategories.map((category) => {
                  const active = category.id === activeCategory.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setActiveCategoryId(category.id);
                      }}
                      className={`flex w-full items-start justify-between gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all ${
                        active
                          ? 'border-primary/30 bg-primary/10 shadow-sm'
                          : 'border-border/70 bg-white hover:border-primary/20 hover:bg-muted/40'
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-bold">{category.label}</span>
                        <span className="mt-1 block text-[11px] leading-4.5 text-muted-foreground">
                          {category.description}
                        </span>
                      </span>
                      {active ? <Check className="mt-0.5 h-4 w-4 text-primary" /> : null}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-lg bg-foreground px-3.5 py-3 text-background">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-background/60">
                  Selected
                </p>
                <p className="mt-1.5 text-sm font-bold leading-5">{selectedSummary}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-background/80">
                  <Filter className="h-4 w-4" />
                  Max {maxProducts} products
                </div>
              </div>
            </aside>

            <div className="p-3 sm:p-4 lg:p-5">
              <div className={`grid gap-3 ${showSelection ? 'lg:grid-cols-[minmax(0,1fr)_280px]' : ''}`}>
                <div className="space-y-4">
                  <div className={`rounded-[1.15rem] bg-gradient-to-br ${activeCategory.accent} p-4 text-white shadow-md`}>
                    <div className="flex flex-col gap-2.5 md:flex-row md:items-end md:justify-between">
                      <div className="max-w-2xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                          Curated selection
                        </p>
                        <h2 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">
                          Compare {activeCategory.label.toLowerCase()} that matter.
                        </h2>
                        <p className="mt-2 max-w-xl text-xs leading-5 text-white/75 sm:text-sm">
                          {activeCategory.description} Use the checkboxes to build a comparison of up to four products.
                        </p>
                      </div>

                      <div className="rounded-lg bg-white/12 px-3.5 py-2.5 backdrop-blur-sm">
                        <p className="text-xs uppercase tracking-[0.24em] text-white/60">Selection</p>
                        <p className="mt-1 text-lg font-black">{selectedCompareProducts.length}/{maxProducts}</p>
                      </div>
                    </div>
                  </div>

                  {catalog.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-dashed border-border bg-white p-8 text-center">
                      <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-xl font-bold">No products in this category yet</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Browse another category to start comparing.
                      </p>
                      <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">
                        Browse products
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                      {catalog.map((product) => {
                        const checked = selectedIds.has(product.id);
                        const disabled = !checked && !canAddMore;

                        return (
                          <article
                            key={product.id}
                            className={`group overflow-hidden rounded-[1rem] border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                              checked ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border/70'
                            } ${disabled ? 'opacity-60' : ''}`}
                          >
                            <div className="relative aspect-[1/1] bg-[#f5f3ed]">
                              <Image
                                src={product.image}
                                alt={product.title}
                                fill
                                className="object-contain p-3.5 transition-transform duration-300 group-hover:scale-[1.03]"
                              />
                              {product.badge ? (
                                <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground shadow-sm">
                                  {product.badge}
                                </span>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => handleToggle(product)}
                                disabled={disabled && !checked}
                                className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-all ${
                                  checked
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-white/80 bg-white text-foreground hover:border-primary hover:text-primary'
                                }`}
                                aria-label={checked ? 'Remove from compare' : 'Add to compare'}
                              >
                                {checked ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                              </button>
                            </div>

                            <div className="space-y-2.5 p-3.5">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                                  {product.category}
                                </p>
                                <h3 className="mt-1.5 text-sm font-bold leading-5">
                                  {product.title}
                                </h3>
                                <p className="mt-1.5 text-xs leading-5 text-muted-foreground sm:text-sm">
                                  {product.shortSpec}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-1.5">
                                {product.features.map((feature) => (
                                  <span
                                    key={feature}
                                    className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
                                  >
                                    {feature}
                                  </span>
                                ))}
                              </div>

                              <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-2.5">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                                    Price
                                  </p>
                                  <p className="mt-1 text-base font-black text-foreground">
                                    {product.price}
                                  </p>
                                </div>

                                <Button asChild variant="secondary" size="sm" className="rounded-full px-3 py-2 text-xs">
                                  <Link href={product.href}>
                                    View
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>

                {showSelection ? (
                  <aside className="space-y-3.5 rounded-[1rem] border border-border/70 bg-white p-3.5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                          Compare tray
                        </p>
                        <h3 className="mt-1 text-sm font-bold">Selected products</h3>
                      </div>
                      <button
                        type="button"
                        onClick={clearProducts}
                        className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted"
                      >
                        Clear all
                      </button>
                    </div>

                    <div className="space-y-3">
                      {selectedCompareProducts.map((product) => (
                        <div key={product.id} className="flex items-center gap-3 rounded-lg border border-border/70 bg-[#fbfaf7] p-2.5">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white">
                            <Image src={product.image} alt={product.name} fill sizes="80px" className="object-contain p-1.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold leading-5">{product.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{product.description}</p>
                            <p className="mt-1 text-xs font-semibold sm:text-sm">{product.price ? `Rs ${product.price.toLocaleString('en-NP')}` : '-'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeProduct(product.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-muted-foreground hover:bg-muted hover:text-destructive"
                            aria-label={`Remove ${product.name}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-lg bg-foreground p-3.5 text-white">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                        Ready to compare
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/80">
                        Use the button below to jump to the side-by-side comparison table.
                      </p>
                      <Button asChild className="mt-4 w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                        <a href="#compare-table">
                          Open comparison
                          <ArrowRight className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </aside>
                ) : null}
              </div>

              {showSelection ? (
                <div id="compare-table" className="mt-7 rounded-[1.25rem] border border-border/70 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Side-by-side compare
                      </p>
                      <h3 className="mt-1 text-xl font-black">Technical comparison</h3>
                    </div>

                    <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Checkbox checked={hideSame} onCheckedChange={(value) => setHideSame(Boolean(value))} />
                      Hide same specs
                    </label>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-[0.9rem] border border-border/70">
                      <div className="grid min-w-[720px] grid-cols-[180px_repeat(auto-fit,minmax(160px,1fr))] bg-muted/40 text-sm font-bold text-foreground">
                        <div className="border-r border-border/70 px-3.5 py-3">Specification</div>
                       {selectedCompareProducts.map((product) => (
                          <div key={product.id} className="border-r border-border/70 px-3.5 py-3 last:border-r-0">
                            <div className="flex items-center gap-3">
                              <div className="relative h-9 w-9 overflow-hidden rounded-lg bg-white">
                                <Image src={product.image} alt={product.name} fill sizes="48px" className="object-contain p-1" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold">{product.name}</p>
                                <p className="mt-1 text-[11px] text-muted-foreground">{product.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                    {compareRows.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground">
                        No shared comparison data available.
                      </div>
                    ) : (
                      compareRows.map((row, rowIndex) => (
                        <div key={row.label} className={`grid min-w-[720px] grid-cols-[180px_repeat(auto-fit,minmax(160px,1fr))] text-sm ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-[#fbfaf7]'}`}>
                          <div className="border-r border-border/70 px-3.5 py-3 font-semibold text-foreground">{row.label}</div>
                          {selectedCompareProducts.map((product, columnIndex) => {
                            const value = product.compareFields.find((field) => field.label === row.label)?.value ?? '-';
                            return (
                              <div
                                key={`${product.id}-${row.label}`}
                                className={`border-r border-border/70 px-3.5 py-3 last:border-r-0 ${selectedCompareProducts.some((other, index) => index !== columnIndex && (other.compareFields ?? []).find((field) => field.label === row.label)?.value !== value) ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
                              >
                                {value}
                              </div>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                    {selectedCompareProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleAddToCart(product.id)}
                        className="flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-foreground/90"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Add to cart
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {!showSelection ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-[1rem] border border-dashed border-border bg-white px-6 py-8 text-center shadow-sm">
            <PackageSearch className="h-9 w-9 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-black sm:text-xl">No products selected yet</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Start with a category, pick 2 to 4 products, then open the comparison table.
            </p>
            <Link href="/" className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground">
              Browse products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
