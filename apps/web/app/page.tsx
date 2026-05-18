"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { HeroGrid } from "@/components/hero-grid";
import { ApplianceStrip } from "@/components/appliance-strip";
import { ClearanceDeals } from "@/components/clearance-deals";
import { SiteNavbar } from "@/components/site-navbar";
import { TrendingProducts } from "@/components/trending-products";

export default function WebStorePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNavbar />

      <HeroGrid
        primary={{
          badge: "Featured",
          title: "Electric Water Geysers",
          description: "Best-in-class electric geysers for your home.",
          imageSrc: "/images/geyeser(hero grid-1).png",
          imageAlt: "Electric Water Geyser",
          href: "/products?category=water-geyser",
          buttonLabel: "Shop Now",
        }}
        secondary={{
          badge: "Home Appliance",
          title: "Multi-Door Refrigerators",
          description: "Same Footprint, Bigger Capacity",
          imageSrc: "/images/fridge-hero grid(2).png",
          imageAlt: "Refrigerator",
          href: "/products?category=refrigerators",
        }}
        tertiary={{
          badge: "Entertainment",
          title: "Neo QLED 8K TVs",
          description: "Incredible Picture & Sound",
          imageSrc: "/images/tcl tv(hero-grid).jpeg",
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
