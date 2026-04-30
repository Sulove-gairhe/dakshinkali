/**
 * PublicListQuery - Query parameters for public product listing
 * 
 * Used by GET /api/v1/products endpoint.
 * Supports pagination, filtering, search, and sorting for public users.
 * 
 * @remarks
 * - All parameters are optional
 * - Default pagination: page=1, pageSize=20
 * - Maximum pageSize: 100 (will be capped)
 * - Default sorting: sortBy='createdAt', sortOrder='desc'
 * - Only returns active, non-deleted products
 * - Search performs case-insensitive search in name and description
 * 
 * @see ProductDTO for the response format
 */

/**
 * Sort field options for public product listing
 */
export type PublicSortBy = 'price' | 'name' | 'createdAt';

/**
 * Sort order options
 */
export type SortOrder = 'asc' | 'desc';

/**
 * PublicListQuery interface
 * 
 * Query parameter validation:
 * - page: Optional, positive integer, defaults to 1
 * - pageSize: Optional, positive integer, defaults to 20, max 100
 * - category: Optional, filter by exact category match
 * - minPrice: Optional, filter products with price >= minPrice
 * - maxPrice: Optional, filter products with price <= maxPrice
 * - search: Optional, case-insensitive search in name/description
 * - sortBy: Optional, field to sort by, defaults to 'createdAt'
 * - sortOrder: Optional, sort direction, defaults to 'desc'
 */
export interface PublicListQuery {
    /** Page number (default: 1) */
    page?: number;

    /** Number of items per page (default: 20, max: 100) */
    pageSize?: number;

    /** Filter by category (exact match) */
    category?: string;

    /** Filter products with price >= minPrice */
    minPrice?: number;

    /** Filter products with price <= maxPrice */
    maxPrice?: number;

    /** Search in product name and description (case-insensitive) */
    search?: string;

    /** Field to sort by (default: 'createdAt') */
    sortBy?: PublicSortBy;

    /** Sort direction (default: 'desc') */
    sortOrder?: SortOrder;
}
