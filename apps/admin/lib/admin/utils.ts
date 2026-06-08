import type { BlogContentBlock } from "./blog-types";
import type {
  DbProductStatus,
  ProductFormState,
  StorefrontData,
  StorefrontStatus,
  StoreProductPreview,
  ValidationResult,
} from "./types";

export function formatNprPrice(price: number): string {
  if (!Number.isFinite(price) || price <= 0) return "Rs. —";
  return `Rs. ${Math.round(price).toLocaleString("en-NP")}`;
}

export function slugifyProductName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugifyName(name: string): string {
  return slugifyProductName(name);
}

export function mapDbStatusToStoreStatus(
  status: DbProductStatus,
): StorefrontStatus | null {
  switch (status) {
    case "active":
      return "In Stock";
    case "low_stock":
      return "Low Stock";
    case "out_of_stock":
      return "Out of Stock";
    case "inactive":
    default:
      return null;
  }
}

export function mapStoreStatusToDbStatus(
  label: string,
): DbProductStatus {
  switch (label) {
    case "Low Stock":
      return "low_stock";
    case "Out of Stock":
      return "out_of_stock";
    case "Inactive":
      return "inactive";
    case "Active":
    case "In Stock":
    default:
      return "active";
  }
}

export function normalizeStorefrontData(
  data: StorefrontData,
): StorefrontData {
  const badges = data.badges?.filter(Boolean) ?? [];
  const badge = badges[0];
  const next: StorefrontData = { ...data, badges };
  if (badge) {
    next.badge = badge;
  } else {
    delete next.badge;
  }
  return next;
}

/**
 * Update a storefront section (ordered slug list) with rotation.
 * - If shouldInclude is true: ensure slug is present and moved to the end.
 * - If shouldInclude is false: ensure slug is removed.
 * - Keeps at most `max` items by removing from the start (oldest) when needed.
 *
 * The caller provides a Supabase client instance (service/admin context).
 */
export async function updateStorefrontSection(
  supabase: any,
  key: string,
  slug: string,
  shouldInclude: boolean,
  max = 12,
): Promise<string[] | null> {
  if (!key || !slug) return null;

  // Read existing row
  const { data: existingData, error: fetchError } = await supabase
    .from("storefront_sections")
    .select("slugs")
    .eq("key", key)
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message || "Failed to fetch storefront section");
  }

  let slugs: string[] = [];
  if (existingData && existingData.slugs) {
    try {
      slugs = Array.isArray(existingData.slugs) ? existingData.slugs : JSON.parse(existingData.slugs as string);
    } catch {
      slugs = [];
    }
  }

  // Remove any existing occurrence
  slugs = slugs.filter((s) => s !== slug);

  if (shouldInclude) {
    // Append to end
    slugs.push(slug);
    // Trim from start while length > max
    while (slugs.length > max) {
      slugs.shift();
    }
  }

  // Upsert the row
  const payload = { key, slugs };
  const { data: upserted, error: upsertError } = await supabase
    .from("storefront_sections")
    .upsert(payload, { onConflict: ["key"] })
    .select()
    .maybeSingle();

  if (upsertError) {
    throw new Error(upsertError.message || "Failed to upsert storefront section");
  }

  return slugs;
}

export function buildStoreProductPreview(
  product: ProductFormState,
  storefrontData: StorefrontData,
): StoreProductPreview {
  const normalized = normalizeStorefrontData(storefrontData);
  const slug = normalized.slug ?? slugifyProductName(product.name);
  const sortedImages = [...product.images].sort((a, b) => a.order - b.order);
  const primary = sortedImages[0];

  return {
    id: product.id ?? "preview",
    slug,
    name: product.name || "Product name",
    shortDescription:
      normalized.shortDescription || "Short description preview",
    image: primary?.url ?? "",
    currentPrice: formatNprPrice(product.price),
    oldPrice: normalized.oldPrice,
    warranty: normalized.warranty || "Warranty",
    badge: normalized.badge,
    badges: normalized.badges,
    href: `/products/${slug}`,
    brand: normalized.brand || "Brand",
    category: product.categoryName || "Category",
    collection: normalized.collection,
    status: mapDbStatusToStoreStatus(product.status) ?? undefined,
    searchTerms: normalized.searchTerms,
    galleryImages: sortedImages.map((img) => ({
      id: img.id,
      src: img.url,
      alt: product.name,
    })),
    highlights: normalized.highlights,
    descriptionSections: normalized.descriptionSections,
    specifications: normalized.specifications,
    boxContents: normalized.boxContents,
    deliveryInfo: normalized.deliveryInfo,
    relatedProductSlugs: normalized.relatedProductSlugs,
    variants: product.variants,
    isFeatured: normalized.isFeatured,
    isBestSeller: normalized.isBestSeller,
    isNewArrival: normalized.isNewArrival,
    isActive: normalized.isActive ?? product.status !== "inactive",
  };
}

export function validateStorefrontLiveData(
  product: ProductFormState,
  storefrontData: StorefrontData,
): ValidationResult {
  const errors: string[] = [];
  const sf = normalizeStorefrontData(storefrontData);

  if (!product.name?.trim()) errors.push("Product name is required");
  if (!product.price || product.price <= 0) errors.push("Price must be greater than 0");
  if (!product.categoryId) errors.push("Category is required");
  if (!sf.slug?.trim()) errors.push("Storefront slug is required");
  if (!sf.brand?.trim()) errors.push("Brand is required");
  if (!sf.shortDescription?.trim()) errors.push("Short description is required");
  if (!sf.warranty?.trim()) errors.push("Warranty is required");
  if (!product.images?.length) errors.push("At least one product image is required");

  return { valid: errors.length === 0, errors };
}

export function statusBadgeClass(status: DbProductStatus): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "low_stock":
      return "bg-primary/10 text-primary";
    case "out_of_stock":
      return "bg-red-100 text-red-800";
    case "inactive":
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function publishingBadgeClass(status: string): string {
  return status === "live"
    ? "bg-primary/10 text-primary"
    : "bg-gray-100 text-gray-700";
}

export function slugifyBlogTitle(title: string): string {
  return slugifyProductName(title);
}

export function calculateReadTime(content: BlogContentBlock[]): string {
  const words = content.reduce((count, block) => {
    if (block.type === "list") {
      return (
        count +
        block.items.reduce(
          (n, item) => n + item.split(/\s+/).filter(Boolean).length,
          0,
        )
      );
    }
    return count + block.text.split(/\s+/).filter(Boolean).length;
  }, 0);
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function blogStatusBadgeClass(status: string): string {
  return status === "published"
    ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-700";
}

export function getAdminSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://dakshinkali.shop"
  );
}

export {
  isValidOrderTransition,
  getValidNextStatuses,
  canShipOrder,
  formatFileSize,
  formatShippingAddress,
  orderItemPreview,
  orderStatusBadgeClass,
  orderStatusLabel,
  paymentStatusBadgeClass,
  paymentStatusLabel,
  formatRelativeTime,
  paymentMethodLabel,
} from "./order-utils";
