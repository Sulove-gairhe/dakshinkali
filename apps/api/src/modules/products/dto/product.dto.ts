/**
 * ProductDTO - API response representation of a product
 * 
 * This DTO is used for all API responses to clients (Next.js web).
 * It excludes internal database fields and uses client-friendly formats.
 * 
 * @remarks
 * - Excludes deletedAt (internal soft-delete field)
 * - Uses ISO 8601 strings for timestamps (createdAt, updatedAt)
 * - Uses camelCase naming convention for JSON responses
 * - Mapping is unidirectional: Entity → DTO only
 * - Images include only client-relevant fields (id, url, order)
 * 
 * @see ProductEntity for the database representation
 */

import { ProductEntity, ProductStatus } from '../entities/product.entity';

/**
 * Product image metadata for API responses
 * Excludes internal storage details (filename)
 */
export interface ProductImageDTO {
    /** Unique identifier for the image */
    id: string;

    /** Full public URL from Supabase Storage */
    url: string;

    /** Display order for image gallery (0-indexed) */
    order: number;
}

/**
 * ProductDTO - Complete product API response
 * 
 * Used by both Admin API and Public API endpoints.
 * Shields clients from database schema changes.
 * 
 * @remarks
 * - deletedAt is excluded (internal field)
 * - Timestamps are ISO 8601 strings for multi-client compatibility
 * - Price is returned as number type in JSON
 * - All field names follow camelCase convention
 */
export interface ProductDTO {
    /** Unique product identifier (UUID v4) */
    id: string;

    /** Public product slug used in frontend URLs */
    slug: string;

    /** Product brand / manufacturer */
    brand: string | null;

    /** Product name */
    name: string;

    /** Product description (null if not provided) */
    description: string | null;

    /** Product price (numeric value) */
    price: number;

    /** Product category */
    category: string;

    /** Product availability status */
    status: ProductStatus;

    /** Array of product images with public URLs */
    images: ProductImageDTO[];

    /** Flexible product metadata/specifications */
    specs: Record<string, unknown>;

    /** ISO 8601 timestamp when product was created */
    createdAt: string;

    /** ISO 8601 timestamp when product was last updated */
    updatedAt: string;
}

/**
 * Maps a ProductEntity to ProductDTO for API responses
 * 
 * This function performs the following transformations:
 * - Converts Date objects to ISO 8601 strings
 * - Excludes internal fields (deletedAt)
 * - Maps ProductImage[] to ProductImageDTO[] (excludes filename)
 * - Validates required fields are present
 * 
 * @param entity - The ProductEntity to map
 * @returns ProductDTO ready for API response
 * @throws Error if required fields are missing or invalid
 * 
 * @remarks
 * - Handles null optional fields (description) correctly
 * - Throws descriptive errors for invalid entities
 * - Validates: name, price, status, createdAt, updatedAt
 * 
 * @example
 * ```typescript
 * const entity: ProductEntity = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   name: 'iPhone 15',
 *   description: 'Latest iPhone model',
 *   price: 999.99,
 *   category: 'Electronics',
 *   status: 'active',
 *   images: [{ id: 'img1', url: 'https://...', filename: 'img.jpg', order: 0 }],
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 *   deletedAt: null
 * };
 * 
 * const dto = mapEntityToDTO(entity);
 * // dto.deletedAt is excluded
 * // dto.createdAt and dto.updatedAt are ISO 8601 strings
 * // dto.images[0].filename is excluded
 * ```
 */
export function mapEntityToDTO(entity: ProductEntity): ProductDTO {
    function slugify(value: string): string {
        return value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // Validate required fields
    if (!entity.name || entity.name.trim() === '') {
        throw new Error('Invalid ProductEntity: name is required and cannot be empty');
    }

    if (entity.price === undefined || entity.price === null) {
        throw new Error('Invalid ProductEntity: price is required');
    }

    if (typeof entity.price !== 'number' || entity.price <= 0) {
        throw new Error('Invalid ProductEntity: price must be a positive number');
    }

    if (!entity.status) {
        throw new Error('Invalid ProductEntity: status is required');
    }

    const validStatuses: ProductStatus[] = ['active', 'inactive', 'out_of_stock'];
    if (!validStatuses.includes(entity.status)) {
        throw new Error(`Invalid ProductEntity: status must be one of ${validStatuses.join(', ')}`);
    }

    if (!entity.createdAt || !(entity.createdAt instanceof Date)) {
        throw new Error('Invalid ProductEntity: createdAt must be a valid Date object');
    }

    if (!entity.updatedAt || !(entity.updatedAt instanceof Date)) {
        throw new Error('Invalid ProductEntity: updatedAt must be a valid Date object');
    }

    if (isNaN(entity.createdAt.getTime())) {
        throw new Error('Invalid ProductEntity: createdAt is an invalid Date');
    }

    if (isNaN(entity.updatedAt.getTime())) {
        throw new Error('Invalid ProductEntity: updatedAt is an invalid Date');
    }

    // Map ProductImage[] to ProductImageDTO[] (exclude filename)
    const images: ProductImageDTO[] = (entity.images || []).map(img => ({
        id: img.id,
        url: img.url,
        order: img.order
    }));

    const slugSource = entity.slug && entity.slug.trim() !== ''
        ? entity.slug
        : `${entity.category} ${entity.name}`;

    const specs = entity.specs && typeof entity.specs === 'object' && !Array.isArray(entity.specs)
        ? entity.specs
        : {};

    // Build ProductDTO (exclude deletedAt)
    return {
        id: entity.id,
        slug: slugify(slugSource),
        brand: entity.brand ?? null,
        name: entity.name,
        description: entity.description, // Handles null correctly
        price: entity.price,
        category: entity.category,
        status: entity.status,
        images,
        specs,
        createdAt: entity.createdAt.toISOString(),
        updatedAt: entity.updatedAt.toISOString()
    };
}
