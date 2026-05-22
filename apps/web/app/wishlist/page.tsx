"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { formatPrice, useCart } from "@/components/cart-provider";
import { SiteNavbar } from "@/components/site-navbar";
import { useWishlist } from "@/components/wishlist-provider";

export default function WishlistPage() {
  const { addItem, getQuantity } = useCart();
  const { items, itemCount, removeItem } = useWishlist();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNavbar />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-primary">
              Saved Products
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Wishlist</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {itemCount} {itemCount === 1 ? "product" : "products"} saved for
              later
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex w-fit items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
          >
            Continue Shopping
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center">
            <Heart className="h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-bold">Your wishlist is empty</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Save products from the trending section and compare them before
              checkout.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center justify-center rounded-md bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const cartQuantity = getQuantity(item.id);

              return (
                <article
                  key={item.id}
                  className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <Link
                    href={item.href}
                    className="relative block aspect-[4/3] overflow-hidden bg-muted"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </Link>

                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={item.href}
                        className="line-clamp-2 text-base font-bold transition-colors hover:text-primary"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                        aria-label={`Remove ${item.name} from wishlist`}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {item.shortDescription}
                    </p>

                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-xl font-bold">
                        {item.currentPrice}
                      </span>
                      {item.oldPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          {item.oldPrice}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto pt-5">
                      <button
                        type="button"
                        onClick={() => addItem(item)}
                        className="flex w-full items-center justify-center gap-2 rounded-md bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90"
                      >
                        <ShoppingCart className="h-5 w-5" />
                        {cartQuantity > 0
                          ? `In Cart (${cartQuantity})`
                          : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {items.length > 0 && (
          <aside className="mt-8 rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold">Ready to checkout?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Move saved products to your cart whenever you are ready.
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-muted-foreground">
                  Saved item value
                </p>
                <p className="text-xl font-bold">
                  {formatPrice(
                    items.reduce(
                      (total, item) =>
                        total + Number(item.currentPrice.replace(/[^\d.]/g, "")),
                      0,
                    ),
                  )}
                </p>
              </div>
            </div>
          </aside>
        )}
      </section>
    </main>
  );
}
