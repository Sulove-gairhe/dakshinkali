import type { Metadata } from "next";
import type { StoreProduct } from "@/lib/store-products";
import {
  getBrandDisplayName,
  getCategoryDisplayName,
  normalizeBrandSlug,
  normalizeCategorySlug,
  slugify,
} from "@/lib/search-products";

export const SITE_NAME = "Dakshinkali Electronics";
export const DEFAULT_SITE_URL = "https://dakshinkali.shop";

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredUrl) {
    return stripTrailingSlash(configuredUrl);
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return DEFAULT_SITE_URL;
}

export function absoluteUrl(pathOrUrl = "/") {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${getSiteUrl()}${encodeURI(path)}`;
}

export function productCanonical(product: Pick<StoreProduct, "slug">) {
  return absoluteUrl(`/products/${product.slug}`);
}

export function categoryCanonical(categorySlug: string) {
  return absoluteUrl(`/categories/${normalizeCategorySlug(categorySlug)}`);
}

export function brandCanonical(brandSlug: string) {
  return absoluteUrl(`/brands/${normalizeBrandSlug(brandSlug)}`);
}

export function brandCategoryCanonical(brandSlug: string, categorySlug: string) {
  return absoluteUrl(
    `/brands/${normalizeBrandSlug(brandSlug)}/${normalizeCategorySlug(categorySlug)}`,
  );
}

export function buildProductMetadata(product: StoreProduct): Metadata {
  const canonical = productCanonical(product);
  const title = product.seoTitle?.trim() || buildProductTitle(product);
  const description =
    product.seoDescription?.trim() || buildProductDescription(product);
  const imageUrl = product.image ? absoluteUrl(product.image) : undefined;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: product.name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export function buildCategoryMetadata(categorySlug: string): Metadata {
  const categoryName = getCategoryDisplayName(categorySlug);
  const canonical = categoryCanonical(categorySlug);
  const title = `${categoryName} Price in Nepal | ${SITE_NAME}`;
  const description = `Shop ${categoryName.toLowerCase()} in Nepal at ${SITE_NAME}. Compare models, features, and prices before you order online.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export function buildBrandMetadata(brandSlug: string): Metadata {
  const brandName = getBrandDisplayName(brandSlug);
  const canonical = brandCanonical(brandSlug);
  const title = `${brandName} Products Price in Nepal | ${SITE_NAME}`;
  const description = `Shop ${brandName} electronics and appliances in Nepal at ${SITE_NAME}. Compare available products, features, and prices.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export function buildBrandCategoryMetadata(
  brandSlug: string,
  categorySlug: string,
): Metadata {
  const brandName = getBrandDisplayName(brandSlug);
  const categoryName = getCategoryDisplayName(categorySlug);
  const canonical = brandCategoryCanonical(brandSlug, categorySlug);
  const title = `${brandName} ${categoryName} Price in Nepal | ${SITE_NAME}`;
  const description = `Shop ${brandName} ${categoryName.toLowerCase()} in Nepal at ${SITE_NAME}. Compare models, capacity, features, and prices.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export function buildProductJsonLd(product: StoreProduct) {
  const price = parsePrice(product.currentPrice);
  const model = findSpecValue(product, /model/i);
  const sku = findSpecValue(product, /^sku$/i);
  const images = [
    product.image,
    ...(product.galleryImages?.map((image) => image.src) ?? []),
  ]
    .filter(Boolean)
    .map((image) => absoluteUrl(image));

  return removeUndefined({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: product.brand
      ? {
          "@type": "Brand",
          name: product.brand,
        }
      : undefined,
    model,
    sku,
    category: product.category,
    description: product.seoDescription || product.shortDescription || undefined,
    image: images.length > 0 ? [...new Set(images)] : undefined,
    url: productCanonical(product),
    offers:
      price === undefined
        ? undefined
        : {
            "@type": "Offer",
            url: productCanonical(product),
            priceCurrency: "NPR",
            price,
            availability: mapAvailability(product.status),
            seller: {
              "@type": "Organization",
              name: SITE_NAME,
            },
          },
  });
}

export function getProductLandingSlugs(products: StoreProduct[]) {
  const categories = new Map<string, string>();
  const brands = new Map<string, string>();

  for (const product of products) {
    if (product.category) {
      categories.set(normalizeCategorySlug(product.category), product.category);
    }

    if (product.brand) {
      brands.set(normalizeBrandSlug(product.brand), product.brand);
    }
  }

  return {
    categories: [...categories.keys()].sort(),
    brands: [...brands.keys()].sort(),
  };
}

export function productMatchesCategorySlug(
  product: StoreProduct,
  categorySlug: string,
) {
  const normalizedCategory = normalizeCategorySlug(categorySlug);
  return (
    normalizeCategorySlug(product.category) === normalizedCategory ||
    (product.collection
      ? normalizeCategorySlug(product.collection) === normalizedCategory
      : false)
  );
}

export function productMatchesBrandSlug(product: StoreProduct, brandSlug: string) {
  return normalizeBrandSlug(product.brand) === normalizeBrandSlug(brandSlug);
}

export function slugFromName(value: string) {
  return slugify(value);
}

function buildProductTitle(product: StoreProduct) {
  const productIntent = compact([
    product.brand && !product.name.toLowerCase().includes(product.brand.toLowerCase())
      ? product.brand
      : undefined,
    product.name,
  ]).join(" ");

  return `${productIntent} Price in Nepal | ${SITE_NAME}`;
}

function buildProductDescription(product: StoreProduct) {
  const category = product.category
    ? ` ${getCategoryDisplayName(product.category).toLowerCase()}`
    : "";
  const brand = product.brand ? `${product.brand} ` : "";
  const details = product.shortDescription
    ? ` with ${sentenceCase(product.shortDescription)}`
    : "";

  return truncate(
    `Buy ${brand}${product.name}${category} in Nepal${details}. Best price with fast delivery from ${SITE_NAME}.`,
    160,
  );
}

function parsePrice(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function mapAvailability(status: StoreProduct["status"]) {
  if (status === "Out of Stock") return "https://schema.org/OutOfStock";
  if (status === "Low Stock") return "https://schema.org/LimitedAvailability";
  if (status === "In Stock") return "https://schema.org/InStock";
  return undefined;
}

function findSpecValue(product: StoreProduct, matcher: RegExp) {
  for (const group of product.specifications ?? []) {
    const match = group.specs.find((spec) => matcher.test(spec.label));
    if (match?.value) return match.value;
  }

  return undefined;
}

function removeUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(removeUndefined).filter((item) => item !== undefined) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, removeUndefined(entry)]),
    ) as T;
  }

  return value;
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function truncate(value: string, length: number) {
  return value.length <= length ? value : `${value.slice(0, length - 1).trim()}.`;
}

function sentenceCase(value: string) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function compact<T>(values: Array<T | undefined | null | false>) {
  return values.filter(Boolean) as T[];
}
