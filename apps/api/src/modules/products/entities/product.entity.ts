/**
 * ProductEntity - Domain model representing a product in the database
 * 
 * This entity maps directly to the products table in Supabase PostgreSQL.
 * It includes all fields from the database schema with proper TypeScript typing.
 * 
 * @remarks
 * - Price is stored as numeric in DB but represented as number in TypeScript
 * - Images are stored as JSONB in DB but represented as ProductImage[] in TypeScript
 * - Soft deletion is implemented via deletedAt timestamp
 */

/**
 * Product availability status enum
 * Maps to the CHECK constraint in the database: status IN ('active', 'inactive', 'out_of_stock')
 */
export type ProductStatus = 'active' | 'inactive' | 'out_of_stock';

/**
 * Product image metadata
 * Stored as JSONB array in the database images field
 */
export interface ProductImage {
    /** Unique identifier for the image */
    id: string;

    /** Full public URL from Supabase Storage */
    url: string;

    /** Original filename stored in Supabase Storage */
    filename: string;

    /** Display order for image gallery (0-indexed) */
    order: number;
}

/**
 * ProductEntity - Complete product domain model
 * 
 * Represents a product with all database fields mapped to TypeScript types.
 * This entity is used internally by the Repository and Service layers.
 * 
 * @remarks
 * - API responses use ProductDTO instead of this entity
 * - deletedAt is used for soft deletion (null = active, timestamp = deleted)
 * - updatedAt is automatically managed by database trigger
 */
export interface ProductEntity {
    /** Unique product identifier (UUID v4) */
    id: string;

    /** Public product slug used in frontend URLs */
    slug?: string | null;

    /** Product brand / manufacturer */
    brand?: string | null;

    /** Product name (required, 1-200 chars, unique within category) */
    name: string;

    /** Product description (optional, max 2000 chars) */
    description: string | null;

    /** Product price (required, must be > 0, stored as numeric(10,2) in DB) */
    price: number;

    /** Product category (required, used for filtering and uniqueness constraint) */
    category: string;

    /** Product availability status (required, defaults to 'active') */
    status: ProductStatus;

    /** Array of product images with metadata (stored as JSONB in DB) */
    images: ProductImage[];

    /** Flexible product metadata/specifications */
    specs?: Record<string, unknown> | null;

    /** Timestamp when product was created (auto-generated) */
    createdAt: Date;

    /** Timestamp when product was last updated (auto-updated by trigger) */
    updatedAt: Date;

    /** Timestamp when product was soft-deleted (null = not deleted) */
    deletedAt: Date | null;
}
