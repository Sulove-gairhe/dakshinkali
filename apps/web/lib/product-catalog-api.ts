import 'server-only';

import { cache } from 'react';
import { createApiClient } from '@/lib/api-client';
import {
  catalogCategories,
  catalogProducts as fallbackCatalogProducts,
  buildProductDetailData,
  type CatalogCategory,
  type CatalogCategoryId,
  type CatalogProduct,
} from '@/data/catalog';
import {
  compareProductsByCategory as fallbackCompareProductsByCategory,
  type CompareCategory,
  type CompareProductCard,
} from '@/data/compare-catalog';
import { extractCompareFieldsFromSpecs, type CompareField } from '@/lib/product-specs';
import type { ProductDetailData } from '@/types/product';

type ProductImageDTO = {
  id: string;
  url: string;
  order: number;
};

export type ProductDTO = {
  id: string;
  slug: string;
  brand: string | null;
  name: string;
  description: string | null;
  price: number;
  category: string;
  status: string;
  images: ProductImageDTO[];
  specs: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type ProductsResponse = {
  data: ProductDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type CompareDataset = {
  categories: CompareCategory[];
  productsByCategory: Record<string, CompareProductCard[]>;
};

const fallbackProductBySlug = new Map(
  fallbackCatalogProducts.map((product) => [product.slug, product]),
);

const fallbackCompareProductBySlug = new Map(
  Object.values(fallbackCompareProductsByCategory)
    .flat()
    .map((product) => [getSlugFromHref(product.href), product]),
);

const fallbackOrderBySlug = new Map(
  fallbackCatalogProducts.map((product, index) => [product.slug, index]),
);

export const fetchCatalogProducts = cache(async (): Promise<CatalogProduct[]> => {
  const api = createApiClient();

  try {
    const response = await api.request<ProductsResponse>('/api/v1/products?pageSize=100');
    const products = Array.isArray(response?.data)
      ? response.data.map(mapProductDtoToCatalogProduct)
      : [];

    if (products.length > 0) {
      return sortProductsByFallbackOrder(products);
    }
  } catch {
    // Fall back to the local catalog during build or if the API is unavailable.
  }

  return fallbackCatalogProducts;
});

export const fetchCatalogProductBySlug = cache(async (slug: string): Promise<CatalogProduct | null> => {
  const products = await fetchCatalogProducts();
  const exact = products.find((product) => product.slug === slug);
  if (exact) {
    return exact;
  }

  const legacy = fallbackProductBySlug.get(slug);
  if (!legacy) {
    return null;
  }

  return (
    products.find(
      (product) =>
        normalize(product.name) === normalize(legacy.name) &&
        normalize(product.categoryLabel) === normalize(legacy.categoryLabel),
    ) ?? legacy
  );
});

export const fetchProductDetailDataBySlug = cache(async (slug: string): Promise<ProductDetailData | null> => {
  const product = await fetchCatalogProductBySlug(slug);

  if (!product) {
    return null;
  }

  return buildProductDetailData(product);
});

export const fetchCompareDataset = cache(async (): Promise<CompareDataset> => {
  const products = await fetchCatalogProducts();

  return {
    categories: catalogCategories.map((category) => ({
      id: category.id,
      label: category.label,
      accent: category.accent,
      description: category.description,
    })),
    productsByCategory: buildCompareProductsByCategory(products),
  };
});

export function buildCompareProductsByCategory(
  products: CatalogProduct[],
): Record<string, CompareProductCard[]> {
  const grouped: Record<string, CompareProductCard[]> = {};

  for (const category of catalogCategories) {
    grouped[category.id] = [];
  }

  const compareCards = products.map((product) => mapCatalogProductToCompareCard(product));

  for (const card of compareCards) {
    const categoryId = getCategoryIdFromCompareCard(card);
    if (!grouped[categoryId]) {
      grouped[categoryId] = [];
    }

    grouped[categoryId].push(card);
  }

  for (const categoryId of Object.keys(grouped)) {
    grouped[categoryId].sort((a, b) => {
      const aOrder = fallbackOrderBySlug.get(getSlugFromHref(a.href)) ?? Number.MAX_SAFE_INTEGER;
      const bOrder = fallbackOrderBySlug.get(getSlugFromHref(b.href)) ?? Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder;
    });
  }

  return grouped;
}

export function mapProductDtoToCatalogProduct(product: ProductDTO): CatalogProduct {
  const fallback = fallbackProductBySlug.get(product.slug) ?? findFallbackByNameAndCategory(product.name, product.category);
  const category = resolveCategory(product.category, fallback?.categoryId);
  const brand = product.brand ?? fallback?.brand ?? category.label;
  const image = primaryImageUrl(product.images) ?? fallback?.image ?? '/images/logo-placeholder.jpeg';
  const features = resolveFeatures(product.specs, fallback?.features);
  const shortDescription =
    product.description ??
    fallback?.shortDescription ??
    summarizeFeatures(features) ??
    category.description;
  const slug = product.slug;

  return {
    id: product.id,
    slug,
    name: product.name,
    categoryId: category.id,
    categoryLabel: category.label,
    brand,
    shortDescription,
    image,
    currentPrice: formatPrice(product.price),
    oldPrice: resolveStringSpec(product.specs, 'oldPrice') ?? fallback?.oldPrice,
    badge: resolveStringSpec(product.specs, 'badge') ?? fallback?.badge ?? undefined,
    href: `/products/${slug}`,
    comparePath: `/compare?category=${category.id}`,
    features,
    specs: product.specs,
  };
}

export function mapCatalogProductToCompareCard(product: CatalogProduct): CompareProductCard {
  const fallback = fallbackCompareProductBySlug.get(product.slug);
  const compareFields = product.specs ? extractCompareFieldsFromSpecs(product.specs) : [];

  if (fallback) {
    return {
      ...fallback,
      id: product.id,
      category: product.categoryLabel,
      title: product.name,
      image: product.image,
      price: product.currentPrice,
      badge: product.badge ?? fallback.badge,
      shortSpec: product.shortDescription,
      features: product.features,
      href: product.href,
      compareFields: compareFields.length > 0 ? compareFields : fallback.compareFields,
    };
  }

  return {
    id: product.id,
    category: product.categoryLabel,
    title: product.name,
    image: product.image,
    price: product.currentPrice,
    badge: product.badge,
    shortSpec: product.shortDescription,
    features: product.features,
    href: product.href,
    compareFields: compareFields.length > 0 ? compareFields : buildGenericCompareFields(product.features),
  };
}

function buildGenericCompareFields(features: string[]): CompareField[] {
  return features.slice(0, 6).map((feature, index) => ({
    label: `Feature ${index + 1}`,
    value: feature,
  }));
}

function findFallbackByNameAndCategory(name: string, category: string): CatalogProduct | undefined {
  return fallbackCatalogProducts.find(
    (product) => product.name === name && product.categoryLabel === category,
  );
}

function resolveFeatures(
  specs: Record<string, unknown>,
  fallbackFeatures?: string[],
): string[] {
  const values = getStringArraySpec(specs, 'features');
  if (values.length > 0) {
    return values;
  }

  return fallbackFeatures ?? [];
}

function resolveStringSpec(specs: Record<string, unknown>, key: string): string | undefined {
  const value = specs[key];
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function formatPrice(price: number): string {
  return `Rs ${price.toLocaleString('en-NP')}`;
}

function summarizeFeatures(features: string[]): string | undefined {
  if (features.length === 0) {
    return undefined;
  }

  return features.slice(0, 3).join(' • ');
}

function getStringArraySpec(specs: Record<string, unknown>, key: string): string[] {
  const value = specs[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
}

function primaryImageUrl(images: ProductImageDTO[]): string | undefined {
  return images.find((image) => Boolean(image.url))?.url;
}

function resolveCategory(categoryId: string, fallbackCategoryId?: CatalogCategoryId): CatalogCategory {
  return (
    catalogCategories.find((category) => category.id === categoryId) ||
    (fallbackCategoryId ? catalogCategories.find((category) => category.id === fallbackCategoryId) : undefined) ||
    catalogCategories[0]
  );
}

function getCategoryIdFromCompareCard(product: CompareProductCard): string {
  return (
    catalogCategories.find((category) => category.label === product.category)?.id ??
    catalogCategories[0].id
  );
}

function getSlugFromHref(href: string): string {
  return href.split('?')[0].split('/').filter(Boolean).pop() ?? href;
}

function sortProductsByFallbackOrder(products: CatalogProduct[]): CatalogProduct[] {
  return [...products].sort((a, b) => {
    const aOrder = getProductOrder(a);
    const bOrder = getProductOrder(b);
    return aOrder - bOrder;
  });
}

function getProductOrder(product: CatalogProduct): number {
  const direct = fallbackOrderBySlug.get(product.slug);
  if (direct !== undefined) {
    return direct;
  }

  const legacy = findFallbackByNameAndCategory(product.name, product.categoryLabel);
  if (legacy) {
    const legacyOrder = fallbackOrderBySlug.get(legacy.slug);
    if (legacyOrder !== undefined) {
      return legacyOrder;
    }
  }

  return Number.MAX_SAFE_INTEGER;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}
