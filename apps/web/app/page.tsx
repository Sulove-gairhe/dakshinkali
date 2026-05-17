"use client";

import { ClearanceDeals } from "@/components/clearance-deals";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { HeroGrid } from "@/components/hero-grid";
import { ApplianceStrip } from "@/components/appliance-strip";
import { TrendingProducts } from "@/components/trending-products";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  images?: Array<{ url: string }>;
};

type CartItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  priceAtAddition: number;
  subtotal: number;
  isAvailable: boolean;
};

type Cart = {
  id: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  itemCount: number;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
};

type Profile = {
  id: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  role?: string;
};

function getSessionId() {
  const key = "dakshinkali_session_id";
  let value = window.localStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    window.localStorage.setItem(key, value);
  }
  return value;
}

export default function WebStorePage() {
  // Only keep cart and sessionId for Navbar
  const [cart, setCart] = useState<Cart | null>(null);
  const [sessionId, setSessionId] = useState("");

  // Only set sessionId in effect, do not call setState and another function in the same effect
  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  return (
    <main style={styles.shell}>
      <Navbar
        cartCount={cart?.itemCount || 0}
        accountHref="/login"
        cartHref="/cart"
        compareHref="/compare"
        wishlistHref="/wishlist"
        onSearch={(query) => {
          console.log(query);
        }}
      />

      <HeroGrid
        primary={{
          badge: "Featured",
          title: "Electric Water Geysers",
          description: "Best-in-class electric geysers for your home.",
          imageSrc:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-t1zMDTmOXCqYi5KZgzS3W1gxrmQ9jp.png",
          imageAlt: "Electric Water Geyser",
          href: "/products?category=water-geyser",
          buttonLabel: "Shop Now",
        }}
        secondary={{
          badge: "Home Appliance",
          title: "Multi-Door Refrigerators",
          description: "Same Footprint, Bigger Capacity",
          imageSrc:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-PsjUNUHtncntuInPrgCJWwKyk9YdUL.png",
          imageAlt: "Refrigerator",
          href: "/products?category=refrigerators",
        }}
        tertiary={{
          badge: "Entertainment",
          title: "Neo QLED 8K TVs",
          description: "Incredible Picture & Sound",
          imageSrc:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image.png-gzDJ5qQIla4LF2T2O6pQDgwQpmOuIx.jpeg",
          imageAlt: "TV",
          href: "/products?category=televisions",
        }}
      />

      <ApplianceStrip />

      {/* Render all main components for verification */}
      <div className="mt-12 space-y-12">
        {/* Trending/Featured Products */}
        <TrendingProducts />
        <ClearanceDeals />
      </div>
      {/* <section style={styles.toolbar}>
        <div>
          <h1 style={styles.title}>Dakshinkali Store</h1>
          <p style={styles.status}>{status}</p>
        </div>
        <Link href="/login" style={styles.link}>Login Page</Link>
        <input
          style={styles.token}
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Customer access token"
        />
        <button style={styles.button} onClick={() => void loadProfile()}>Profile</button>
        <button style={styles.button} onClick={() => void loadOrders()}>Orders</button>
      </section>

      <section style={styles.grid}>
        <div style={styles.panel}>
          <h2 style={styles.heading}>Products</h2>
          <div style={styles.list}>
            {products.map((product) => (
              <article key={product.id} style={styles.row}>
                <div>
                  <strong>{product.name}</strong>
                  <p style={styles.muted}>{product.category} · Rs. {product.price}</p>
                </div>
                <button style={styles.button} onClick={() => void addToCart(product.id)}>Add</button>
              </article>
            ))}
          </div>
        </div>

        <div style={styles.panel}>
          <h2 style={styles.heading}>Cart</h2>
          <div style={styles.list}>
            {(cart?.items || []).map((item) => (
              <article key={item.id} style={styles.row}>
                <div>
                  <strong>{item.productName}</strong>
                  <p style={styles.muted}>Qty {item.quantity} · Rs. {item.subtotal}</p>
                </div>
                <div style={styles.actions}>
                  <button style={styles.button} onClick={() => void updateQuantity(item.id, Math.max(0, item.quantity - 1))}>-</button>
                  <button style={styles.button} onClick={() => void updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
              </article>
            ))}
            <strong>Total: Rs. {cart?.total || 0}</strong>
          </div>
        </div>

        <form style={styles.panel} onSubmit={(event) => void createOrder(event)}>
          <h2 style={styles.heading}>Checkout</h2>
          <input style={styles.input} value={checkout.customerEmail} onChange={(event) => setCheckout({ ...checkout, customerEmail: event.target.value })} placeholder="Email" />
          <input style={styles.input} value={checkout.customerName} onChange={(event) => setCheckout({ ...checkout, customerName: event.target.value })} placeholder="Name" />
          <input style={styles.input} value={checkout.customerPhone} onChange={(event) => setCheckout({ ...checkout, customerPhone: event.target.value })} placeholder="Phone" />
          <input style={styles.input} value={checkout.line1} onChange={(event) => setCheckout({ ...checkout, line1: event.target.value })} placeholder="Address" />
          <button style={styles.primary} type="submit">Place Order</button>
        </form>

        <div style={styles.panel}>
          <h2 style={styles.heading}>Account</h2>
          <p style={styles.muted}>{profile ? `${profile.email} (${profile.role || 'customer'})` : 'No profile loaded'}</p>
          <h3 style={styles.subheading}>Recent Orders</h3>
          <div style={styles.list}>
            {orders.map((order) => (
              <article key={order.id} style={styles.row}>
                <strong>{order.orderNumber}</strong>
                <span style={styles.muted}>{order.status} · Rs. {order.total}</span>
              </article>
            ))}
          </div>
        </div>
      </section> */}
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: {
    minHeight: "100vh",
    padding: 24,
    background: "#f6f7f9",
    color: "#17202a",
    fontFamily: "system-ui, sans-serif",
  },
  toolbar: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    flexWrap: "wrap",
  },
  title: { margin: 0, fontSize: 28 },
  status: { margin: "4px 0 0", color: "#52616f" },
  token: {
    minWidth: 280,
    flex: 1,
    maxWidth: 520,
    padding: 10,
    border: "1px solid #c9d1d9",
    borderRadius: 6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 16,
  },
  panel: {
    background: "#ffffff",
    border: "1px solid #d8dee4",
    borderRadius: 8,
    padding: 16,
  },
  heading: { margin: "0 0 12px", fontSize: 18 },
  subheading: { margin: "16px 0 8px", fontSize: 15 },
  list: { display: "grid", gap: 10 },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottom: "1px solid #eef1f4",
    paddingBottom: 10,
  },
  muted: { margin: 0, color: "#667085", fontSize: 13 },
  actions: { display: "flex", gap: 6 },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: 10,
    border: "1px solid #c9d1d9",
    borderRadius: 6,
    marginBottom: 10,
  },
  button: {
    border: "1px solid #9aa6b2",
    background: "#ffffff",
    color: "#17202a",
    borderRadius: 6,
    padding: "8px 10px",
    cursor: "pointer",
  },
  primary: {
    border: "1px solid #14532d",
    background: "#166534",
    color: "#ffffff",
    borderRadius: 6,
    padding: "10px 12px",
    cursor: "pointer",
    width: "100%",
  },
  link: {
    border: "1px solid #14532d",
    background: "#166534",
    color: "#ffffff",
    borderRadius: 6,
    padding: "8px 14px",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
  },
};
