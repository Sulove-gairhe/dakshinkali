/**
 * db-products.ts
 *
 * Fetches live products from Supabase and maps them to the StoreProduct shape
 * used by the storefront. Only products with publishing_status = 'live' and
 * status IN ('active', 'low_stock') are returned.
 *
 * This is a server-only module (no "use client" directive).
 */

import { createClient } from "@/lib/supabase/server";
import type { StoreProduct } from "@/lib/store-products";

// ─── DB row types ─────────────────────────────────────────────────────────────

type DbImageRecord = {
    id: string;
    url: string;
    filename: string;
    order: number;
    storagePath?: string;
};

type DbSpecification = { label: string; value: string };
type DbSpecificationGroup = { title: string; specs: DbSpecification[] };

type DbDescriptionSection = {
    id: string;
    title: string;
    subtitle?: string;
    body?: string[];
    bullets?: string[];
    image?: { id: string; src: string; alt: string };
};

type DbVariantGroup = {
    label: string;
    options: { label: string; value: string; selected?: boolean }[];
};

type DbStorefrontData = {
    slug?: string;
    brand?: string;
    shortDescription?: string;
    oldPrice?: string;
    warranty?: string;
    badge?: string;
    badges?: string[];
    collection?: string;
    isFeatured?: boolean;
    isBestSeller?: boolean;
    isNewArrival?: boolean;
    isActive?: boolean;
    highlights?: string[];
    descriptionSections?: DbDescriptionSection[];
    specifications?: DbSpecificationGroup[];
    boxContents?: string[];
    deliveryInfo?: string[];
    relatedProductSlugs?: string[];
    variants?: DbVariantGroup[];
    ratingText?: string;
    searchTerms?: string[];
    seoTitle?: string;
    seoDescription?: string;
};

type DbProductRow = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    category_id: string | null;
    status: "active" | "inactive" | "out_of_stock" | "low_stock";
    publishing_status: "draft" | "live";
    images: DbImageRecord[] | null;
    storefront_data: DbStorefrontData | null;
};

// ─── Status mapping ───────────────────────────────────────────────────────────

function mapStatus(
    status: DbProductRow["status"],
): StoreProduct["status"] {
    switch (status) {
        case "active":
            return "In Stock";
        case "low_stock":
            return "Low Stock";
        case "out_of_stock":
            return "Out of Stock";
        default:
            return "In Stock";
    }
}

// ─── Row → StoreProduct mapper ────────────────────────────────────────────────

function mapRowToStoreProduct(row: DbProductRow): StoreProduct | null {
    const sd = row.storefront_data ?? {};
    const slug = sd.slug?.trim();

    // A live product must have a slug to be routable on the storefront
    if (!slug) return null;

    const images: DbImageRecord[] = Array.isArray(row.images) ? row.images : [];
    const sortedImages = [...images].sort((a, b) => a.order - b.order);
    const primaryImage = sortedImages[0]?.url ?? "";

    const galleryImages = sortedImages.map((img) => ({
        id: img.id,
        src: img.url,
        alt: img.filename,
    }));

    const priceFormatted = `Rs. ${Number(row.price).toLocaleString("en-IN")}`;

    return {
        id: row.id,
        slug,
        name: row.name,
        shortDescription: sd.shortDescription ?? row.description ?? "",
        image: primaryImage,
        currentPrice: priceFormatted,
        oldPrice: sd.oldPrice,
        warranty: sd.warranty ?? "Warranty support available",
        badge: sd.badge,
        badges: sd.badges,
        href: `/products/${slug}`,
        brand: sd.brand ?? "",
        category: row.category,
        categoryId: row.category_id,
        collection: sd.collection,
        status: mapStatus(row.status),
        searchTerms: sd.searchTerms,
        galleryImages: galleryImages.length > 0 ? galleryImages : undefined,
        highlights: sd.highlights,
        descriptionSections: sd.descriptionSections,
        specifications: sd.specifications,
        boxContents: sd.boxContents,
        deliveryInfo: sd.deliveryInfo,
        relatedProductSlugs: sd.relatedProductSlugs,
        variants: sd.variants,
        ratingText: sd.ratingText,
        isFeatured: sd.isFeatured ?? false,
        isBestSeller: sd.isBestSeller ?? false,
        isNewArrival: sd.isNewArrival ?? false,
        isActive: true,
        seoTitle: sd.seoTitle,
        seoDescription: sd.seoDescription,
    };
}

/**
 * Fetch storefront products for a given section key (e.g. "trending", "best_selling").
 * Replicates the logic of the API route at app/api/storefront-products/route.ts
 * but can be called directly from server components (no HTTP round-trip).
 */
export async function fetchStorefrontProductsByKey(
  key: string,
  max: number,
): Promise<StoreProduct[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("storefront_sections")
      .select("slugs")
      .eq("key", key)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[storefront-products] supabase error", error.message);
      return [];
    }

    const slugs: string[] =
      data?.slugs && Array.isArray(data.slugs) ? data.slugs : [];
    const limited = max > 0 ? slugs.slice(-max) : slugs;

    const products: StoreProduct[] = [];
    for (const slug of limited) {
      const product = await fetchDbProductBySlug(slug);
      if (product) products.push(product);
    }

    return products;
  } catch (err) {
    console.error("[storefront-products] unexpected error", err);
    return [];
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch all live, active/low-stock products from Supabase.
 * Returns an empty array on error so the storefront degrades gracefully.
 */
export async function fetchDbProducts(): Promise<StoreProduct[]> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("products")
            .select("id, name, description, price, category, category_id, status, publishing_status, images, storefront_data")
            .eq("publishing_status", "live")
            .in("status", ["active", "low_stock"])
            .is("deleted_at", null)
            .order("updated_at", { ascending: false });

        if (error) {
            console.error("[db-products] Supabase query error:", error.message);
            return [];
        }

        const products: StoreProduct[] = [];
        for (const row of data ?? []) {
            const mapped = mapRowToStoreProduct(row as DbProductRow);
            if (mapped) products.push(mapped);
        }

        return products;
    } catch (err) {
        console.error("[db-products] Unexpected error:", err);
        return [];
    }
}

/**
 * Fetch a single live product by slug from Supabase.
 * Returns null if not found or on error.
 */
export async function fetchDbProductBySlug(
    slug: string,
): Promise<StoreProduct | null> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("products")
            .select("id, name, description, price, category, category_id, status, publishing_status, images, storefront_data")
            .eq("publishing_status", "live")
            .in("status", ["active", "low_stock"])
            .is("deleted_at", null)
            .filter("storefront_data->>slug", "eq", slug)
            .maybeSingle();

        if (error) {
            console.error("[db-products] Supabase query error:", error.message);
            return null;
        }

        if (!data) return null;
        return mapRowToStoreProduct(data as DbProductRow);
    } catch (err) {
        console.error("[db-products] Unexpected error:", err);
        return null;
    }
}

// ─── Categories ───────────────────────────────────────────────────────────────

export type DbCategory = {
    id: string;
    name: string;
    slug: string;
};

/**
 * Fetch all active categories from Supabase, sorted alphabetically by name.
 * Returns an empty array on error so the storefront degrades gracefully.
 */
export async function fetchDbCategories(): Promise<DbCategory[]> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("categories")
            .select("id, name, slug")
            .eq("is_active", true)
            .order("name", { ascending: true });

        if (error) {
            console.error("[db-products] Categories query error:", error.message);
            return [];
        }

        return (data ?? []) as DbCategory[];
    } catch (err) {
        console.error("[db-products] Unexpected error fetching categories:", err);
        return [];
    }
}
