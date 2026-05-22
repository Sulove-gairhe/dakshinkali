import type { ProductDetailData } from '@/types/product';

export type CatalogCategoryId =
  | 'televisions'
  | 'refrigerators'
  | 'water-geyser'
  | 'air-conditioners'
  | 'audio'
  | 'computers';

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  categoryId: CatalogCategoryId;
  categoryLabel: string;
  brand: string;
  shortDescription: string;
  image: string;
  currentPrice: string;
  oldPrice?: string;
  badge?: string;
  href: string;
  comparePath: string;
  features: string[];
  specs?: Record<string, unknown>;
};

export type CatalogCategory = {
  id: CatalogCategoryId;
  label: string;
  description: string;
  heroTitle: string;
  accent: string;
};

export const catalogCategories: CatalogCategory[] = [
  {
    id: 'televisions',
    label: 'Televisions',
    description: '4K, smart TV, OLED, and large-screen picks.',
    heroTitle: 'Compare Televisions',
    accent: 'from-slate-950 via-slate-900 to-neutral-800',
  },
  {
    id: 'refrigerators',
    label: 'Refrigerators',
    description: 'Double door, single door, and deep freezer options.',
    heroTitle: 'Compare Refrigerators',
    accent: 'from-zinc-950 via-stone-900 to-neutral-800',
  },
  {
    id: 'water-geyser',
    label: 'Water Geysers',
    description: 'Storage and instant heating models for home use.',
    heroTitle: 'Compare Water Geysers',
    accent: 'from-amber-950 via-orange-900 to-stone-800',
  },
  {
    id: 'air-conditioners',
    label: 'Air Conditioners',
    description: 'Cooling capacity, inverter tech, and low-noise models.',
    heroTitle: 'Compare Air Conditioners',
    accent: 'from-sky-950 via-blue-900 to-slate-800',
  },
  {
    id: 'audio',
    label: 'Audio',
    description: 'Earphones, neckbands, and portable audio gear.',
    heroTitle: 'Compare Audio Devices',
    accent: 'from-violet-950 via-fuchsia-900 to-slate-800',
  },
  {
    id: 'computers',
    label: 'Computers',
    description: 'Laptops and portable computing essentials.',
    heroTitle: 'Compare Computers',
    accent: 'from-emerald-950 via-green-900 to-slate-800',
  },
];

export const catalogProducts: CatalogProduct[] = [
  {
    id: 'tv-ua55cu7700',
    slug: 'samsung-ua55cu7700-55-inch-crystal-ultra-hd-4k-smart-tv',
    name: 'Samsung 55-inch Crystal Ultra HD 4K Smart TV',
    categoryId: 'televisions',
    categoryLabel: 'Televisions',
    brand: 'Samsung',
    shortDescription: '55" 4K display • Tizen OS • HDMI x3',
    image: '/images/tcl tv(hero-grid).jpeg',
    currentPrice: 'Rs 89,000',
    oldPrice: 'Rs 95,000',
    badge: 'Popular',
    href: '/products/samsung-ua55cu7700-55-inch-crystal-ultra-hd-4k-smart-tv',
    comparePath: '/compare?category=televisions',
    features: ['4K UHD', 'HDR10+', 'Tizen OS'],
  },
  {
    id: 'tv-65u8500f',
    slug: 'samsung-65-crystal-uhd-tv',
    name: 'Samsung 65 inch Crystal UHD 4K Smart TV',
    categoryId: 'televisions',
    categoryLabel: 'Televisions',
    brand: 'Samsung',
    shortDescription: '65" 4K TV • Slim design • Smart features',
    image: '/images/Samsung 65 inch tv.png',
    currentPrice: 'Rs 1,29,000',
    oldPrice: 'Rs 1,35,000',
    badge: 'Best value',
    href: '/products/samsung-65-crystal-uhd-tv',
    comparePath: '/compare?category=televisions',
    features: ['4K Resolution', 'Smart TV', 'Large screen'],
  },
  {
    id: 'fridge-253l',
    slug: 'samsung-253l-double-door',
    name: 'Samsung 253L Double Door Frost Free Refrigerator',
    categoryId: 'refrigerators',
    categoryLabel: 'Refrigerators',
    brand: 'Samsung',
    shortDescription: '253L • Frost free • Digital inverter',
    image: '/images/Samsung Double door 245 Litres.png',
    currentPrice: 'Rs 51,999',
    oldPrice: 'Rs 56,000',
    badge: 'Energy saver',
    href: '/products/samsung-253l-double-door',
    comparePath: '/compare?category=refrigerators',
    features: ['Double door', 'Frost free', '10 year warranty'],
  },
  {
    id: 'fridge-192l',
    slug: 'samsung-192l-single-door',
    name: 'Samsung 192L Single Door Refrigerator',
    categoryId: 'refrigerators',
    categoryLabel: 'Refrigerators',
    brand: 'Samsung',
    shortDescription: '192L • Direct cool • Single door',
    image: '/images/Samsung 192Litre Single door refrigerator.jpeg',
    currentPrice: 'Rs 32,980',
    oldPrice: 'Rs 36,500',
    badge: 'Compact',
    href: '/products/samsung-192l-single-door',
    comparePath: '/compare?category=refrigerators',
    features: ['Single door', 'Direct cool', 'Fast cooling'],
  },
  {
    id: 'freezer-himstar-170',
    slug: 'himstar-chest-freezer-170',
    name: 'Himstar Chest Freezer 170 Ltr',
    categoryId: 'refrigerators',
    categoryLabel: 'Refrigerators',
    brand: 'Himstar',
    shortDescription: '170L • Chest freezer • Efficient cooling',
    image: '/images/himstal 165 Litre deepfreezer.png',
    currentPrice: 'Rs 37,900',
    oldPrice: 'Rs 41,200',
    badge: 'Store more',
    href: '/products/himstar-chest-freezer-170',
    comparePath: '/compare?category=refrigerators',
    features: ['Large storage', 'Deep freeze', 'Energy efficient'],
  },
  {
    id: 'geyser-15l',
    slug: 'electric-water-geyser-15l',
    name: 'Electric Water Geyser 15L',
    categoryId: 'water-geyser',
    categoryLabel: 'Water Geysers',
    brand: 'Generic',
    shortDescription: '15L • 2000W • Storage geyser',
    image: '/images/geyeser(hero grid-1).png',
    currentPrice: 'Rs 12,500',
    badge: 'Fast heat',
    href: '/products/electric-water-geyser-15l',
    comparePath: '/compare?category=water-geyser',
    features: ['Tank storage', 'Thermal cut-out', 'Safety valve'],
  },
  {
    id: 'ac-1-5ton',
    slug: 'inverter-split-ac-1-5-ton',
    name: 'Inverter Split AC 1.5 Ton',
    categoryId: 'air-conditioners',
    categoryLabel: 'Air Conditioners',
    brand: 'Generic',
    shortDescription: '1.5 Ton • Inverter • Low noise',
    image: '/images/logo-placeholder.jpeg',
    currentPrice: 'Rs 68,000',
    badge: 'Inverter',
    href: '/products/inverter-split-ac-1-5-ton',
    comparePath: '/compare?category=air-conditioners',
    features: ['Inverter', 'Silent mode', 'Fast cooling'],
  },
  {
    id: 'audio-neckband',
    slug: 'wireless-neckband-earphones',
    name: 'Wireless Neckband Earphones',
    categoryId: 'audio',
    categoryLabel: 'Audio',
    brand: 'Generic',
    shortDescription: '20hr battery • Bluetooth 5.3',
    image: '/images/logo-placeholder-transparent.png',
    currentPrice: 'Rs 4,990',
    badge: 'Bluetooth',
    href: '/products/wireless-neckband-earphones',
    comparePath: '/compare?category=audio',
    features: ['Fast charging', 'Noise isolation', 'Mic support'],
  },
  {
    id: 'computer-slim-14',
    slug: 'ultra-slim-laptop-14-inch',
    name: 'Ultra Slim Laptop 14-inch',
    categoryId: 'computers',
    categoryLabel: 'Computers',
    brand: 'Generic',
    shortDescription: 'i5 • 8GB RAM • 512GB SSD',
    image: '/images/logo-placeholder.jpeg',
    currentPrice: 'Rs 92,000',
    badge: 'Portable',
    href: '/products/ultra-slim-laptop-14-inch',
    comparePath: '/compare?category=computers',
    features: ['Full HD display', 'SSD storage', 'Lightweight body'],
  },
];

export function getCatalogProductBySlug(slug: string) {
  return catalogProducts.find((product) => product.slug === slug);
}

export function getCatalogProductsByCategory(categoryId?: string) {
  if (!categoryId) return catalogProducts;
  return catalogProducts.filter((product) => product.categoryId === categoryId);
}

export function getCatalogCategory(categoryId?: string) {
  return catalogCategories.find((category) => category.id === categoryId) ?? catalogCategories[0];
}

const detailSectionsByCategory: Record<
  CatalogCategoryId,
  {
    intro: string;
    highlightsTitle: string;
    highlights: string[];
    specs: string[];
  }
> = {
  televisions: {
    intro: 'A balanced pick for movie nights, gaming, and everyday streaming.',
    highlightsTitle: 'Why it stands out',
    highlights: ['Large screen presence', 'Smart TV platform', 'Clean HDMI connectivity'],
    specs: ['4K Ultra HD panel', 'HDR support', 'Smart OS', 'Multiple HDMI inputs'],
  },
  refrigerators: {
    intro: 'Designed to keep food fresh with practical storage and efficient cooling.',
    highlightsTitle: 'Cooling strengths',
    highlights: ['Daily-use capacity', 'Energy-minded operation', 'Low maintenance design'],
    specs: ['Frost free / direct cool', 'Inverter compressor where available', 'Fast cooling', 'Warranty support'],
  },
  'water-geyser': {
    intro: 'Compact heating with the safety and insulation expected in a home geyser.',
    highlightsTitle: 'Heating strengths',
    highlights: ['Quick hot water delivery', 'Tank storage', 'Safety-first controls'],
    specs: ['Wall mount format', 'Thermal cut-out', 'High-power heating element', 'Storage tank'],
  },
  'air-conditioners': {
    intro: 'Cooling comfort with a focus on energy efficiency and quieter operation.',
    highlightsTitle: 'Cooling strengths',
    highlights: ['Inverter performance', 'Low-noise operation', 'Stable room cooling'],
    specs: ['Split AC format', 'Inverter technology', 'Energy-saving mode', 'Remote control'],
  },
  audio: {
    intro: 'Portable audio gear for calls, commuting, and casual listening.',
    highlightsTitle: 'Listening strengths',
    highlights: ['Lightweight wear', 'Wireless convenience', 'Fast charging support'],
    specs: ['Bluetooth connectivity', 'Mic support', 'Battery life focus', 'USB-C charging'],
  },
  computers: {
    intro: 'Thin-and-light computing for work, study, and everyday productivity.',
    highlightsTitle: 'Productivity strengths',
    highlights: ['Portable body', 'Fast storage', 'Balanced performance'],
    specs: ['CPU driven performance', 'SSD storage', 'FHD display', 'Portable chassis'],
  },
};

export function buildProductDetailData(product: CatalogProduct): ProductDetailData {
  const detail = detailSectionsByCategory[product.categoryId];

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.categoryLabel,
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: product.categoryLabel, href: `/products?category=${product.categoryId}` },
      { label: product.name },
    ],
    badge: product.badge,
    ratingText: `${product.brand} selection in ${product.categoryLabel}`,
    currentPrice: product.currentPrice,
    oldPrice: product.oldPrice,
    features: product.features,
    images: [
      { id: `${product.id}-1`, src: product.image, alt: `${product.name} front view` },
      { id: `${product.id}-2`, src: product.image, alt: `${product.name} angle view` },
      { id: `${product.id}-3`, src: product.image, alt: `${product.name} detail view` },
      { id: `${product.id}-4`, src: product.image, alt: `${product.name} lifestyle view` },
      { id: `${product.id}-5`, src: product.image, alt: `${product.name} close view` },
      { id: `${product.id}-6`, src: product.image, alt: `${product.name} alternate view` },
    ],
    variants: [],
    descriptionSections: [
      {
        id: 'intro',
        title: product.name,
        body: [product.shortDescription, detail.intro],
      },
      {
        id: 'highlights',
        title: detail.highlightsTitle,
        bullets: [...detail.highlights, ...product.features],
      },
      {
        id: 'specifications',
        title: 'Specifications',
        body: [
          `Brand: ${product.brand}`,
          `Category: ${product.categoryLabel}`,
          `Price: ${product.currentPrice}`,
        ],
        bullets: detail.specs,
      },
    ],
  };
}
