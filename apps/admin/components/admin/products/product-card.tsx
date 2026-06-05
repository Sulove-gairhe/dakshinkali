"use client";

import type React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, PowerOff, Package } from "lucide-react";
import type { AdminProductRecord } from "@/lib/admin/types";

// ─── Price formatting ────────────────────────────────────────────────────────
// Mirrors parseProductPrice from apps/web/lib/store-products.ts:
// strips all non-digit/dot characters, parses to number.
// Falls back to the numeric `price` column when no string price is available.
function parseRawPrice(value: number | string | undefined | null): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const numericPrice = Number(String(value).match(/\d+(?:\.\d+)?/g)?.join("") ?? "");
  return Number.isFinite(numericPrice) ? numericPrice : 0;
}

function formatNpr(price: number): string {
  if (!Number.isFinite(price)) return "Rs. —";
  if (price === 0) return "Rs. 0";
  return `Rs. ${Math.round(price).toLocaleString("en-NP")}`;
}

function resolveDisplayPrice(product: AdminProductRecord): string {
  // For synced products, check storefront_data for the original price string
  // This preserves the formatted price from store-products.ts
  const sf = product.storefront_data;

  // If product was synced from store-products.ts, use the original currentPrice if available
  // The sync script stores the parsed price in the numeric field, but we can reconstruct
  // the display price from the numeric value for consistency
  const numeric = parseRawPrice(product.price);

  // For draft products with placeholder price (1), show a more informative message
  if (numeric === 1 && product.publishing_status === "draft") {
    return "Rs. — (Draft)";
  }

  return formatNpr(numeric);
}

function resolveStorefrontProductUrl(slug: string): string {
  const configuredBase =
    process.env.NEXT_PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredBase) {
    return `${configuredBase.replace(/\/$/, "")}/products/${slug}`;
  }

  const origin = window.location.origin
    .replace(":3001", ":3000")
    .replace("admin.dakshinkali.shop", "dakshinkali.shop");

  return `${origin}/products/${slug}`;
}

// ─── Status pill ────────────────────────────────────────────────────────────

function StatusPill({ product }: { product: AdminProductRecord }) {
  const pub =
    product.storefront_data?.publishingStatus ?? product.publishing_status;
  const status = product.status;

  if (pub === "live" && status === "active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700 ring-1 ring-green-200">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Live
      </span>
    );
  }
  if (pub === "draft") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary ring-1 ring-accent/25">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        Draft
      </span>
    );
  }
  if (status === "out_of_stock") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700 ring-1 ring-red-200">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Out of Stock
      </span>
    );
  }
  if (status === "low_stock") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary ring-1 ring-accent/25">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        Low Stock
      </span>
    );
  }
  if (status === "inactive") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 ring-1 ring-gray-200">
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
        Inactive
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700 ring-1 ring-green-200">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Active
      </span>
    );
  }
  return null;
}

// ─── Image / placeholder ─────────────────────────────────────────────────────

function ProductThumbnail({ product }: { product: AdminProductRecord }) {
  const thumb = [...(product.images ?? [])].sort(
    (a, b) => a.order - b.order,
  )[0];

  if (thumb?.url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={thumb.url}
        alt={product.name}
        className="h-full w-full object-cover"
      />
    );
  }

  const initial = (product.category ?? product.name ?? "?")
    .charAt(0)
    .toUpperCase();
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 bg-gray-50">
      <Package className="h-5 w-5 text-gray-300" />
      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-300">
        {initial}
      </span>
    </div>
  );
}

// ─── Badge row ───────────────────────────────────────────────────────────────

function BadgeRow({ product }: { product: AdminProductRecord }) {
  const sf = product.storefront_data;
  if (!sf) return null;

  const badges: { label: string; cls: string }[] = [];

  if (sf.isFeatured)
    badges.push({
      label: "Featured",
      cls: "bg-accent/10 text-primary ring-accent/25",
    });
  if (sf.isBestSeller)
    badges.push({
      label: "Best Seller",
      cls: "bg-accent/15 text-primary ring-accent/30",
    });
  if (sf.isNewArrival)
    badges.push({
      label: "New",
      cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    });

  // Render storefront badges if they are not "Imported" or "Manual" placeholders
  const sfBadges = sf.badges ?? (sf.badge ? [sf.badge] : []);
  sfBadges.forEach((b) => {
    const norm = b.toLowerCase().trim();
    if (norm !== "imported" && norm !== "manual") {
      badges.push({
        label: b,
      cls: "bg-gray-50 text-gray-700 ring-gray-200",
      });
    }
  });

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((b) => (
        <span
          key={b.label}
          className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ring-1 ${b.cls}`}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}

// ─── Main card ───────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: AdminProductRecord;
  onDeactivate: (product: AdminProductRecord) => void;
  onDelete: (product: AdminProductRecord) => void;
}

export function ProductCard({
  product,
  onDeactivate,
  onDelete,
}: ProductCardProps) {
  const router = useRouter();

  const brand = product.storefront_data?.brand?.trim() || null;
  const category = product.category?.trim() || "Uncategorized";
  const price = resolveDisplayPrice(product);
  const slug = product.storefront_data?.slug ?? null;

  function handleCardClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button, a")) return;
    if (!slug) return;
    window.location.href = resolveStorefrontProductUrl(slug);
  }

  return (
    <article
      onClick={handleCardClick}
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md focus-within:border-primary/40 focus-within:shadow-md${slug ? " cursor-pointer" : ""}`}
      aria-label={product.name}
    >
      {/* ── Hover action buttons (top-right) ── */}
      <div
        className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
        role="group"
        aria-label="Product actions"
      >
        <button
          type="button"
          onClick={() => router.push(`/admin/products/${product.id}/edit`)}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow ring-1 ring-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          aria-label={`Edit ${product.name}`}
          title="Edit product"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(product)}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow ring-1 ring-gray-200 text-red-400 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          aria-label={`Delete ${product.name}`}
          title="Delete product"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Tier 1: Category + Status ── */}
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <span className="truncate text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {category}
        </span>
        <StatusPill product={product} />
      </div>

      {/* ── Tier 2: Thumbnail + Identity ── */}
      <div className="flex items-start gap-3 px-3 pb-2">
        {/* Thumbnail */}
        <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
          <ProductThumbnail product={product} />
        </div>

        {/* Identity */}
        <div className="min-w-0 flex-1 pt-0.5">
          {brand ? (
            <p className="mb-0.5 truncate text-[10px] font-bold uppercase tracking-widest text-accent">
              {brand}
            </p>
          ) : (
            <p className="mb-0.5 truncate text-[10px] font-bold uppercase tracking-widest text-gray-300">
              Unbranded
            </p>
          )}
          <p
            className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900"
            title={product.name}
          >
            {product.name}
          </p>
          <div className="mt-1.5">
            <BadgeRow product={product} />
          </div>
        </div>
      </div>

      {/* ── Tier 3: Price + Stock status ── */}
      <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">{price}</span>
          {product.status === "out_of_stock" && (
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-700">
              Out of Stock
            </span>
          )}
          {product.status === "low_stock" && (
            <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary ring-1 ring-accent/25">
              Low Stock
            </span>
          )}
        </div>

        {/* Deactivate button at the bottom right */}
        <button
          type="button"
          onClick={() => onDeactivate(product)}
          className="flex items-center gap-1 rounded bg-white px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-800 ring-1 ring-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          aria-label={`Deactivate ${product.name}`}
          title="Deactivate product"
        >
          <PowerOff className="h-3 w-3" />
          <span>Deactivate</span>
        </button>
      </div>
    </article>
  );
}
