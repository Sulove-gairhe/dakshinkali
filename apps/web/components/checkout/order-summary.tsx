"use client";

import Image from "next/image";
import { formatPrice, useCart } from "@/components/cart-provider";

export function OrderSummary() {
  const { items, subtotal } = useCart();
  const deliveryFee = 150; // Rs. 150 delivery fee
  const grandTotal = subtotal + deliveryFee;

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
