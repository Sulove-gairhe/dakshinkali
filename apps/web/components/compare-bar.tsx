'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ArrowRight, Scale, X } from 'lucide-react';
import { useCompare } from '@/contexts/compare-context';

export function CompareBar() {
  const { products, removeProduct, count } = useCompare();
  const pathname = usePathname();

  if (count === 0 || pathname?.startsWith('/compare')) return null;

  return (
    <div className="fixed inset-x-0 bottom-3 z-40 px-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-xl border border-border bg-card/95 px-3.5 py-2.5 shadow-xl backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
            <Scale className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              {count} product{count !== 1 ? 's' : ''} selected
            </p>
            <p className="text-xs text-muted-foreground">Up to 4 products</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          {products.slice(0, 3).map((product) => (
            <div
              key={product.id}
              className="group relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-border bg-background"
            >
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeProduct(product.id)}
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
          {products.length > 3 ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted text-sm font-bold text-muted-foreground">
              +{products.length - 3}
            </div>
          ) : null}
        </div>

        <Link
          href="/compare"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Compare
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
