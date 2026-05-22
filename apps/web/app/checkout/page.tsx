"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LockKeyhole, MapPin, PackageCheck, Phone, ShoppingBag, User } from "lucide-react";
import { useAuth } from "@dakshinkali/auth";
import { SiteNavbar } from "@/components/site-navbar";
import { formatPrice, useCart } from "@/components/cart-provider";
import { createApiClient } from "@/lib/api-client";

type OrderResponse = {
  id: string;
  orderNumber: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();
  const { items, itemCount, subtotal, loading: cartLoading, syncing, refreshCart } = useCart();
  const [form, setForm] = useState({
    customerName: user?.user_metadata?.full_name ?? "",
    customerEmail: user?.email ?? "",
    customerPhone: user?.user_metadata?.phone ?? "",
    line1: "",
    line2: "",
    city: "Kathmandu",
    state: "Bagmati",
    postalCode: "44600",
    paymentMethod: "cash_on_delivery",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const api = useMemo(
    () => createApiClient({ accessToken: session?.access_token ?? null }),
    [session?.access_token],
  );

  const disabled = submitting || cartLoading || syncing || items.length === 0 || !session?.access_token;

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!session?.access_token) {
      setError("Please sign in before checkout.");
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setSubmitting(true);

    try {
      const order = await api.request<OrderResponse>("/api/v1/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName: form.customerName || user?.email || "Customer",
          customerEmail: form.customerEmail || user?.email,
          customerPhone: form.customerPhone || null,
          shippingAddress: {
            line1: form.line1,
            line2: form.line2 || null,
            city: form.city,
            state: form.state,
            postalCode: form.postalCode,
            country: "Nepal",
          },
          paymentMethod: form.paymentMethod,
          notes: form.notes || null,
        }),
      });

      await refreshCart();
      router.push(`/account?order=${encodeURIComponent(order.orderNumber)}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to place order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2] text-foreground">
      <SiteNavbar />

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8 lg:py-12">
        <div className="rounded-[1.5rem] border border-border/70 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Secure checkout
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">Place your order</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Cash on delivery is ready for MVP. Online payment options can be connected after the purchase loop is stable.
              </p>
            </div>
          </div>

          {!authLoading && !session?.access_token ? (
            <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/10 p-5">
              <div className="flex items-center gap-2 font-bold">
                <LockKeyhole className="h-5 w-5 text-primary" />
                Sign in required
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Orders are connected to your account so you can track them later.
              </p>
              <Link
                href="/login?redirect=/checkout"
                className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
              >
                Sign in to continue
              </Link>
            </div>
          ) : null}

          <form className="mt-7 grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <User className="h-4 w-4 text-primary" />
                  Full name
                </span>
                <input
                  required
                  value={form.customerName}
                  onChange={(event) => updateField("customerName", event.target.value)}
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">Email</span>
                <input
                  required
                  type="email"
                  value={form.customerEmail}
                  onChange={(event) => updateField("customerEmail", event.target.value)}
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </label>

              <label className="grid gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Phone className="h-4 w-4 text-primary" />
                  Phone
                </span>
                <input
                  type="tel"
                  value={form.customerPhone}
                  onChange={(event) => updateField("customerPhone", event.target.value)}
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">Payment</span>
                <select
                  value={form.paymentMethod}
                  onChange={(event) => updateField("paymentMethod", event.target.value)}
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="cash_on_delivery">Cash on delivery</option>
                  <option value="bank_transfer">Bank transfer</option>
                </select>
              </label>
            </div>

            <div className="rounded-2xl border border-border/70 bg-[#fbfaf7] p-4">
              <div className="mb-4 flex items-center gap-2 font-bold">
                <MapPin className="h-5 w-5 text-primary" />
                Delivery address
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-sm font-semibold">Address line 1</span>
                  <input
                    required
                    value={form.line1}
                    onChange={(event) => updateField("line1", event.target.value)}
                    placeholder="Street, ward, landmark"
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </label>
                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-sm font-semibold">Address line 2</span>
                  <input
                    value={form.line2}
                    onChange={(event) => updateField("line2", event.target.value)}
                    placeholder="Apartment, building, optional"
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold">City</span>
                  <input
                    required
                    value={form.city}
                    onChange={(event) => updateField("city", event.target.value)}
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold">Province / State</span>
                  <input
                    required
                    value={form.state}
                    onChange={(event) => updateField("state", event.target.value)}
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold">Postal code</span>
                  <input
                    required
                    value={form.postalCode}
                    onChange={(event) => updateField("postalCode", event.target.value)}
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </label>
              </div>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Order notes</span>
              <textarea
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                rows={3}
                placeholder="Delivery preference or special instruction"
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </label>

            {error ? (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={disabled}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-black text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Place order
            </button>
          </form>
        </div>

        <aside className="h-fit rounded-[1.5rem] border border-border/70 bg-white p-5 shadow-sm lg:sticky lg:top-28">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-black">Order summary</h2>
          </div>

          <div className="mt-5 space-y-3">
            {items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                Your cart is empty.
              </p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex justify-between gap-3 border-b border-border/60 pb-3 text-sm">
                  <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="text-muted-foreground">Qty {item.quantity}</p>
                  </div>
                  <p className="font-bold">{formatPrice(item.unitPrice * item.quantity)}</p>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 space-y-3 border-t border-border pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items</span>
              <span className="font-semibold">{itemCount}</span>
            </div>
            <div className="flex justify-between text-lg font-black">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
