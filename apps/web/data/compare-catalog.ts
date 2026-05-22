import { catalogCategories, catalogProducts, type CatalogProduct } from '@/data/catalog';
import { extractCompareFieldsFromSpecs } from '@/lib/product-specs';

export type CompareField = {
  label: string;
  value: string;
};

export type CompareProductCard = {
  id: string;
  slug?: string;
  legacySlug?: string;
  category: string;
  title: string;
  image: string;
  price: string;
  badge?: string;
  shortSpec: string;
  features: string[];
  href: string;
  compareFields: CompareField[];
};

export type CompareCategory = {
  id: string;
  label: string;
  accent: string;
  description: string;
};

export const compareCategories: CompareCategory[] = catalogCategories.map((category) => ({
  id: category.id,
  label: category.label,
  accent: category.accent,
  description: category.description,
}));

export const compareProductsByCategory: Record<string, CompareProductCard[]> = {
  televisions: catalogProducts
    .filter((product) => product.categoryId === 'televisions')
    .map((product) => ({
      id: product.id,
      category: product.categoryLabel,
      title: product.name,
      image: product.image,
      price: product.currentPrice,
      badge: product.badge,
      shortSpec: product.shortDescription,
      features: product.features,
      href: product.href,
      compareFields: [
        { label: 'Screen size', value: product.id === 'tv-65u8500f' ? '65-inch' : '55-inch' },
        { label: 'Resolution', value: '3840 x 2160' },
        { label: 'Panel', value: 'Crystal UHD' },
        { label: 'Refresh rate', value: '60Hz' },
        { label: 'Smart OS', value: 'Tizen OS' },
        { label: 'Ports', value: 'HDMI x3, USB x1' },
        { label: 'Warranty', value: '1 Year' },
      ],
    })),
  refrigerators: catalogProducts
    .filter((product) => product.categoryId === 'refrigerators')
    .map((product) => ({
      id: product.id,
      category: product.categoryLabel,
      title: product.name,
      image: product.image,
      price: product.currentPrice,
      badge: product.badge,
      shortSpec: product.shortDescription,
      features: product.features,
      href: product.href,
      compareFields: [
        { label: 'Capacity', value: product.id === 'fridge-253l' ? '253L' : product.id === 'fridge-192l' ? '192L' : '170L' },
        { label: 'Type', value: product.id === 'freezer-himstar-170' ? 'Chest Freezer' : product.id === 'fridge-192l' ? 'Single Door' : 'Double Door' },
        { label: 'Cooling', value: product.id === 'fridge-253l' ? 'Frost Free' : product.id === 'freezer-himstar-170' ? 'Fast Freeze' : 'Direct Cool' },
        { label: 'Energy rating', value: product.id === 'freezer-himstar-170' ? 'Low power use' : '3 Star' },
        { label: 'Compressor', value: product.id === 'freezer-himstar-170' ? 'Heavy duty' : 'Digital Inverter' },
        { label: 'Warranty', value: product.id === 'freezer-himstar-170' ? '1 Year' : '10 Years Compressor' },
      ],
    })),
  'water-geyser': catalogProducts
    .filter((product) => product.categoryId === 'water-geyser')
    .map((product) => ({
      id: product.id,
      category: product.categoryLabel,
      title: product.name,
      image: product.image,
      price: product.currentPrice,
      badge: product.badge,
      shortSpec: product.shortDescription,
      features: product.features,
      href: product.href,
      compareFields: [
        { label: 'Tank size', value: '15L' },
        { label: 'Power', value: '2000W' },
        { label: 'Heating', value: 'Fast heat' },
        { label: 'Safety', value: 'Multiple protection' },
        { label: 'Installation', value: 'Wall mount' },
        { label: 'Warranty', value: '2 Years' },
      ],
    })),
  'air-conditioners': catalogProducts
    .filter((product) => product.categoryId === 'air-conditioners')
    .map((product) => ({
      id: product.id,
      category: product.categoryLabel,
      title: product.name,
      image: product.image,
      price: product.currentPrice,
      badge: product.badge,
      shortSpec: product.shortDescription,
      features: product.features,
      href: product.href,
      compareFields: [
        { label: 'Cooling capacity', value: '1.5 Ton' },
        { label: 'Technology', value: 'Inverter' },
        { label: 'Energy rating', value: '3 Star' },
        { label: 'Gas', value: 'R32' },
        { label: 'Noise', value: 'Low noise' },
        { label: 'Warranty', value: '5 Years' },
      ],
    })),
  audio: catalogProducts
    .filter((product) => product.categoryId === 'audio')
    .map((product) => ({
      id: product.id,
      category: product.categoryLabel,
      title: product.name,
      image: product.image,
      price: product.currentPrice,
      badge: product.badge,
      shortSpec: product.shortDescription,
      features: product.features,
      href: product.href,
      compareFields: [
        { label: 'Driver', value: '10mm' },
        { label: 'Battery life', value: '20 hours' },
        { label: 'Connectivity', value: 'Bluetooth 5.3' },
        { label: 'Charging', value: 'USB-C' },
        { label: 'Water resistance', value: 'IPX4' },
        { label: 'Warranty', value: '1 Year' },
      ],
    })),
  computers: catalogProducts
    .filter((product) => product.categoryId === 'computers')
    .map((product) => ({
      id: product.id,
      category: product.categoryLabel,
      title: product.name,
      image: product.image,
      price: product.currentPrice,
      badge: product.badge,
      shortSpec: product.shortDescription,
      features: product.features,
      href: product.href,
      compareFields: [
        { label: 'Processor', value: 'Intel Core i5' },
        { label: 'RAM', value: '8GB' },
        { label: 'Storage', value: '512GB SSD' },
        { label: 'Display', value: '14-inch FHD' },
        { label: 'Battery', value: 'Up to 8 hours' },
        { label: 'Weight', value: '1.4kg' },
      ],
    })),
};

const compareProductBySlug = new Map(
  Object.values(compareProductsByCategory)
    .flat()
    .map((product) => [getSlugFromHref(product.href), product]),
);

export function buildCompareProductsByCategory(
  products: CatalogProduct[],
): Record<string, CompareProductCard[]> {
  const grouped: Record<string, CompareProductCard[]> = {};

  for (const category of compareCategories) {
    grouped[category.id] = [];
  }

  for (const product of products) {
    const card = mapCatalogProductToCompareCard(product);
    const categoryId = resolveCategoryId(product.categoryId, product.categoryLabel);

    if (!grouped[categoryId]) {
      grouped[categoryId] = [];
    }

    grouped[categoryId].push(card);
  }

  return grouped;
}

export function mapCatalogProductToCompareCard(product: CatalogProduct): CompareProductCard {
  const fallback = compareProductBySlug.get(product.slug);
  const compareFields = extractCompareFieldsFromSpecs(product.specs ?? {});
  const slug = product.slug;
  const legacySlug = fallback?.legacySlug ?? product.slug;

  return {
    id: product.id,
    slug,
    legacySlug,
    category: product.categoryLabel,
    title: product.name,
    image: product.image,
    price: product.currentPrice,
    badge: product.badge ?? fallback?.badge,
    shortSpec: product.shortDescription,
    features: product.features,
    href: product.href,
    compareFields: compareFields.length > 0 ? compareFields : fallback?.compareFields ?? buildGenericCompareFields(product.features),
  };
}

function buildGenericCompareFields(features: string[]): CompareField[] {
  return features.slice(0, 6).map((feature, index) => ({
    label: `Feature ${index + 1}`,
    value: feature,
  }));
}

function resolveCategoryId(categoryId: string, categoryLabel: string): string {
  return (
    compareCategories.find((category) => category.id === categoryId)?.id ||
    compareCategories.find((category) => normalize(category.label) === normalize(categoryLabel))?.id ||
    compareCategories[0].id
  );
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function getSlugFromHref(href: string): string {
  return href.split('?')[0].split('/').filter(Boolean).pop() ?? href;
}
