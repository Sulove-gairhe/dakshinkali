export type DbProductStatus =
  | "active"
  | "inactive"
  | "out_of_stock"
  | "low_stock";

export type PublishingStatus = "draft" | "live";

export type StorefrontStatus = "In Stock" | "Low Stock" | "Out of Stock";

export interface ProductImageRecord {
  id: string;
  url: string;
  filename: string;
  order: number;
  storagePath?: string;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface ProductSpecificationGroup {
  title: string;
  specs: ProductSpecification[];
}

export interface ProductDescriptionSection {
  id: string;
  title: string;
  subtitle?: string;
  body?: string[];
  bullets?: string[];
  image?: { id: string; src: string; alt: string };
}

export interface ProductVariantGroup {
  label: string;
  options: { label: string; value: string; selected?: boolean }[];
}

export interface StorefrontData {
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
  descriptionSections?: ProductDescriptionSection[];
  specifications?: ProductSpecificationGroup[];
  boxContents?: string[];
  deliveryInfo?: string[];
  relatedProductSlugs?: string[];
  variants?: ProductVariantGroup[];
  ratingText?: string;
  searchTerms?: string[];
  seoTitle?: string;
  seoDescription?: string;
  source?: string;
  syncedAt?: string;
  publishingStatus?: PublishingStatus;
}

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AdminProductRecord {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  category_id: string | null;
  status: DbProductStatus;
  publishing_status: PublishingStatus;
  images: ProductImageRecord[];
  storefront_data: StorefrontData | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductFormState {
  id?: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  categoryName: string;
  status: DbProductStatus;
  publishingStatus: PublishingStatus;
  images: ProductImageRecord[];
  storefrontData: StorefrontData;
  variants?: ProductVariantGroup[];
}

export interface StoreProductPreview {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  image: string;
  currentPrice: string;
  oldPrice?: string;
  warranty: string;
  badge?: string;
  badges?: string[];
  href: string;
  brand: string;
  category: string;
  collection?: string;
  status?: StorefrontStatus;
  searchTerms?: string[];
  galleryImages?: { id: string; src: string; alt: string }[];
  highlights?: string[];
  descriptionSections?: ProductDescriptionSection[];
  specifications?: ProductSpecificationGroup[];
  boxContents?: string[];
  deliveryInfo?: string[];
  relatedProductSlugs?: string[];
  variants?: ProductVariantGroup[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isActive?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ProductListFilters {
  search?: string;
  categoryId?: string;
  status?: DbProductStatus;
  publishingStatus?: PublishingStatus;
  page?: number;
  pageSize?: number;
}
