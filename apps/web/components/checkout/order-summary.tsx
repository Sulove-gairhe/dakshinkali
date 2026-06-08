"use client";

import Image from "next/image";
import { useState } from "react";
import { BadgePercent, CheckCircle2, Loader2, ShieldCheck, X } from "lucide-react";
import { formatPrice, useCart } from "@/components/cart-provider";

export function OrderSummary() {
  const {
    items,
    subtotal,
    discountedSubtotal,
    appliedCoupon,
    applyCoupon,
    clearCoupon,
  } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const deliveryFee = 150; // Rs. 150 delivery fee
  const grandTotal = discountedSubtotal + deliveryFee;

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
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xl backdrop-blur-md">
      <h2 className="text-xl font-bold uppercase tracking-wider text-foreground mb-6 pb-4 border-b border-border/60">
        Order Summary
      </h2>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm py-4 text-center">Your cart is empty.</p>
      ) : (
        <>
          <div className="max-h-[320px] overflow-y-auto pr-2 space-y-4 mb-6 scrollbar-thin">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 items-center">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                  </p>
                </div>
                <span className="text-sm font-bold text-foreground shrink-0">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4 border-t border-border/60">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-foreground">{formatPrice(subtotal)}</span>
            </div>
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary ring-1 ring-primary/20">
                  <BadgePercent className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-black uppercase tracking-wide text-foreground">
                    Coupon Code
                  </p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-muted-foreground">
                    Verified against live offers, validity dates, products, and category rules.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <input
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
                  className="rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
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
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs text-emerald-800">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {appliedCoupon.code} applied
                    </span>
                    <button
                      type="button"
                      onClick={clearCoupon}
                      className="rounded p-1 hover:bg-emerald-100"
                      aria-label="Remove coupon"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 font-medium text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Server verified for this cart
                  </p>
                </div>
              ) : null}
            </div>
            {appliedCoupon ? (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Coupon ({appliedCoupon.code})
                </span>
                <span className="font-semibold text-emerald-700">
                  -{formatPrice(appliedCoupon.discountAmount)}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span className="font-semibold text-foreground">{formatPrice(deliveryFee)}</span>
            </div>
            
            <div className="pt-4 border-t border-dashed border-border flex justify-between items-end">
              <div>
                <span className="font-bold text-base text-foreground">Grand Total</span>
                <p className="text-[10px] text-muted-foreground">VAT Inclusive</p>
              </div>
              <span className="text-2xl font-black text-primary tracking-tight">
                {formatPrice(grandTotal)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
