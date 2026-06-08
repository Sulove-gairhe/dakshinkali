"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  BadgePercent,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { formatPrice, useCart } from "@/components/cart-provider";
import { SiteNavbar } from "@/components/site-navbar";

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    discountedSubtotal,
    appliedCoupon,
    removeItem,
    updateQuantity,
    applyCoupon,
    clearCoupon,
  } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const grandTotal = discountedSubtotal;

  async function handleApplyCoupon() {
    setCouponLoading(true);
    setCouponError(null);
    try {
      await applyCoupon(couponCode);
      setCouponCode("");
    } catch (error) {
      setCouponError(
        error instanceof Error ? error.message : "Unable to apply coupon.",
      );
    } finally {
      setCouponLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNavbar />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Shopping Cart</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {itemCount} {itemCount === 1 ? "item" : "items"} enlisted for
              checkout
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
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-bold">Your cart is empty</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Add products from the trending section and they will appear here.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center justify-center rounded-md bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
            <section className="space-y-4">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm sm:grid-cols-[128px_minmax(0,1fr)]"
                >
                  <Link
                    href={item.href}
                    className="relative aspect-square overflow-hidden rounded-md bg-muted"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <Link
                          href={item.href}
                          className="line-clamp-2 text-base font-bold hover:text-primary"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {item.shortDescription}
                        </p>
                      </div>
                      <div className="shrink-0 text-left sm:text-right">
                        <p className="font-bold text-gray-950">{item.currentPrice}</p>
                        {item.oldPrice && (
                          <p className="text-sm text-muted-foreground line-through">
                            {item.oldPrice}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center rounded-md border border-border">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-muted"
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="flex h-10 min-w-10 items-center justify-center border-x border-border px-3 text-sm font-bold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-muted"
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <p className="text-sm font-bold text-gray-950">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <aside className="h-fit rounded-lg border border-border bg-card p-5 shadow-sm lg:sticky lg:top-28">
              <h2 className="text-lg font-bold uppercase tracking-wide">
                Summary
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>

                <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-primary ring-1 ring-primary/20">
                      <BadgePercent className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <label
                        htmlFor="coupon-code"
                        className="block text-xl font-black uppercase tracking-wide text-foreground"
                      >
                        Coupon Code
                      </label>
                      <p className="mt-1 text-xs font-medium leading-relaxed text-muted-foreground">
                        Enter an active code. We verify the discount, dates, category, products, and limits before applying it.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <input
                      id="coupon-code"
                      type="text"
                      value={couponCode}
                      onChange={(event) =>
                        setCouponCode(event.target.value.toUpperCase().replace(/\s+/g, ""))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && couponCode.trim()) {
                          void handleApplyCoupon();
                        }
                      }}
                      placeholder="DASHAIN2000"
                      className="min-w-0 flex-1 rounded-lg border border-primary/30 bg-white px-3 py-3 text-sm font-bold uppercase tracking-wide outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
                    />
                    <button
                      type="button"
                      onClick={() => void handleApplyCoupon()}
                      disabled={couponLoading || !couponCode.trim()}
                      className="shrink-0 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {couponLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>
                  {couponError ? (
                    <p className="mt-2 text-xs font-medium text-destructive">
                      {couponError}
                    </p>
                  ) : null}
                  {appliedCoupon ? (
                    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 font-bold">
                          <CheckCircle2 className="h-4 w-4" />
                          {appliedCoupon.code} applied
                        </span>
                        <button
                          type="button"
                          onClick={clearCoupon}
                          className="rounded p-1 hover:bg-emerald-100"
                          aria-label="Remove coupon"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Server verified and saved for checkout
                      </p>
                    </div>
                  ) : null}
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Coupon Discount</span>
                    <span className="font-semibold text-emerald-700">
                      -{formatPrice(appliedCoupon.discountAmount)}
                    </span>
                  </div>
                ) : null}

                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Grand Total</span>
                    <span className="text-xl font-bold text-gray-950">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="block w-full text-center rounded-md bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Proceed to Checkout
                </Link>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
