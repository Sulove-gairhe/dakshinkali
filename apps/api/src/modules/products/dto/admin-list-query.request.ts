/**
 * AdminListQuery - Query parameters for admin product listing
 * 
 * Used by GET /api/v1/admin/products endpoint.
 * Supports pagination, filtering, and search for admin users.
 * 
 * @remarks
 * - All parameters are optional
 * - Default pagination: page=1, pageSize=20
 * - Maximum pageSize: 100 (will be capped)
 * - includeDeleted allows viewing soft-deleted products
 * - Search performs case-insensitive search in name and description
 * 
 * @see ProductDTO for the response format
 */

import { ProductStatus } from '../entities/product.entity';

/**
 * AdminListQuery interface
 * 
 * Query parameter validation:
 * - page: Optional, positive integer, defaults to 1
 * - pageSize: Optional, positive integer, defaults to 20, max 100
 * - category: Optional, filter by exact category match
 * - status: Optional, filter by product status
 * - minPrice: Optional, filter products with price >= minPrice
 * - maxPrice: Optional, filter products with price <= maxPrice
 * - includeDeleted: Optional, boolean, defaults to false
 * - search: Optional, case-insensitive search in name/description
 */
export interface AdminListQuery {
    /** Page number (default: 1) */
    page?: number;

    /** Number of items per page (default: 20, max: 100) */
    pageSize?: number;

    /** Filter by category (exact match) */
    category?: string;

    /** Filter by product status */
    status?: ProductStatus;

    /** Filter products with price >= minPrice */
    minPrice?: number;

    /** Filter products with price <= maxPrice */
    maxPrice?: number;

    /** Include soft-deleted products (default: false) */
    includeDeleted?: boolean;

    /** Search in product name and description (case-insensitive) */
    search?: string;
}
