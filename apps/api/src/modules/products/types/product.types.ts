/**
 * Product Module Shared Types
 * 
 * This file contains shared type definitions used across multiple layers
 * of the product module (Service Layer, Repository Layer, API Layer).
 * 
 * @remarks
 * - Pagination types are used by all layers for consistent pagination handling
 * - Filter interfaces define query parameters for different API surfaces
 * - PaginatedResult provides a standard response format for paginated data
 * 
 * @see ProductEntity for the database representation
 * @see ProductDTO for the API response format
 */

import { ProductStatus } from '../entities/product.entity';

/**
 * Pagination parameters
 * 
 * Used by Service Layer and Repository Layer to handle paginated queries.
 * 
 * @remarks
 * - page: 1-indexed page number
 * - pageSize: Number of items per page (max 100)
 */
export interface Pagination {
    /** Page number (1-indexed) */
    page: number;

    /** Number of items per page */
    pageSize: number;
}

/**
 * Cursor-based pagination parameters
 * 
 * Used for efficient pagination of large datasets.
 * Cursor-based pagination is more efficient than offset-based for large result sets.
 * 
 * @remarks
 * - cursor: Opaque cursor string pointing to a position in the result set
 * - limit: Number of items to return
 * - Cursor format: base64-encoded JSON with sort field values
 * 
 * @example
 * ```typescript
 * // First page
 * { cursor: null, limit: 20 }
 * 
 * // Next page using cursor from previous response
 * { cursor: "eyJjcmVhdGVkX2F0IjoiMjAyNC0wMS0wMVQwMDowMDowMFoiLCJpZCI6IjEyMyJ9", limit: 20 }
 * ```
 */
export interface CursorPagination {
    /** Cursor pointing to the start position (null for first page) */
    cursor: string | null;

    /** Number of items to return */
    limit: number;
}

/**
 * Cursor-based paginated result
 * 
 * Response format for cursor-based pagination.
 * Includes next cursor for fetching subsequent pages.
 * 
 * @template T - The type of items in the data array
 */
export interface CursorPaginatedResult<T> {
    /** Array of items for the current page */
    data: T[];

    /** Cursor for the next page (null if no more pages) */
    nextCursor: string | null;

    /** Whether there are more items available */
    hasMore: boolean;
}

/**
 * Paginated result wrapper
 * 
 * Standard response format for all paginated API endpoints.
 * Provides data array along with pagination metadata.
 * 
 * @template T - The type of items in the data array
 * 
 * @remarks
 * - data: Array of items for the current page
 * - total: Total number of items across all pages
 * - page: Current page number (1-indexed)
 * - pageSize: Number of items per page
 * - totalPages: Calculated total number of pages
 */
export interface PaginatedResult<T> {
    /** Array of items for the current page */
    data: T[];

    /** Total number of items across all pages */
    total: number;

    /** Current page number (1-indexed) */
    page: number;

    /** Number of items per page */
    pageSize: number;

    /** Total number of pages */
    totalPages: number;
}

/**
 * Product filters for admin queries
 * 
 * Used by Service Layer to filter product queries for admin users.
 * Supports all filtering options including soft-deleted products.
 * 
 * @remarks
 * - All fields are optional
 * - includeDeleted allows admin to view soft-deleted products
 * - search performs case-insensitive search in name and description
 */
export interface ProductFilters {
    /** Filter by category (exact match) */
    category?: string;

    /** Filter by product status */
    status?: ProductStatus;

    /** Filter products with price >= minPrice */
    minPrice?: number;

    /** Filter products with price <= maxPrice */
    maxPrice?: number;

    /** Search in product name and description (case-insensitive) */
    search?: string;

    /** Include soft-deleted products (admin only) */
    includeDeleted?: boolean;
}

/**
 * Product filters for public queries
 * 
 * Used by Service Layer to filter product queries for public users.
 * Excludes soft-deleted and inactive products automatically.
 * 
 * @remarks
 * - All fields are optional
 * - Public queries always filter: deleted_at IS NULL AND status = 'active'
 * - sortBy and sortOrder control result ordering
 */
export interface PublicProductFilters {
    /** Filter by category (exact match) */
    category?: string;

    /** Filter products with price >= minPrice */
    minPrice?: number;

    /** Filter products with price <= maxPrice */
    maxPrice?: number;

    /** Search in product name and description (case-insensitive) */
    search?: string;

    /** Field to sort by (default: 'createdAt') */
    sortBy?: 'price' | 'name' | 'createdAt';

    /** Sort direction (default: 'desc') */
    sortOrder?: 'asc' | 'desc';
}

/**
 * Repository-level filters
 * 
 * Used by Repository Layer for database query construction.
 * Combines all possible filter options with sorting parameters.
 * 
 * @remarks
 * - Superset of ProductFilters and PublicProductFilters
 * - sortBy accepts string to allow dynamic field sorting
 * - Repository Layer is responsible for SQL injection prevention
 */
export interface RepositoryFilters {
    /** Filter by category (exact match) */
    category?: string;

    /** Filter by product status */
    status?: ProductStatus;

    /** Filter products with price >= minPrice */
    minPrice?: number;

    /** Filter products with price <= maxPrice */
    maxPrice?: number;

    /** Search in product name and description (case-insensitive) */
    search?: string;

    /** Include soft-deleted products */
    includeDeleted?: boolean;

    /** Field to sort by (e.g., 'price', 'name', 'created_at') */
    sortBy?: string;

    /** Sort direction */
    sortOrder?: 'asc' | 'desc';
}
