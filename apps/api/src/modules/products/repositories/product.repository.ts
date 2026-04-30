/**
 * ProductRepository - Repository Layer Interface
 * 
 * This interface defines the contract for all database operations related to products.
 * It encapsulates SQL query construction, execution, and row-to-entity mapping.
 * 
 * @remarks
 * - This is the ONLY layer that directly interacts with Supabase client
 * - Service Layer calls these methods and SHALL NOT access database directly
 * - All methods return ProductEntity domain objects (not raw database rows)
 * - Database-specific errors are translated to domain exceptions
 * - Soft delete filtering is handled at this layer
 * 
 * @see ProductEntity for the domain model structure
 * @see RepositoryFilters for available query filters
 * 
 * **Validates: Requirements 8.1, 8.3**
 */

import { ProductEntity } from '../entities/product.entity';
import { Pagination, PaginatedResult, RepositoryFilters } from '../types/product.types';

/**
 * ProductRepository interface
 * 
 * Defines all database operations for the Product Module.
 * Implementations must handle:
 * - SQL query construction with parameterized values
 * - Database row to ProductEntity mapping
 * - JSONB parsing for images field
 * - Numeric to number type conversion for price
 * - Timestamp to Date object conversion
 * - Soft delete filtering (WHERE deleted_at IS NULL)
 * - Database error translation to domain exceptions
 */
export interface ProductRepository {
    /**
     * Insert a new product into the database
     * 
     * @param product - ProductEntity to insert (id will be generated if not provided)
     * @returns Promise resolving to the inserted ProductEntity with generated id and timestamps
     * 
     * @throws ConflictException if unique constraint violation (duplicate name in category)
     * @throws RepositoryException for database errors
     * 
     * @remarks
     * - Generates UUID for id if not provided
     * - Sets created_at and updated_at to NOW()
     * - Validates price > 0 (CHECK constraint)
     * - Validates status enum (CHECK constraint)
     * - Stores images as JSONB array
     * 
     * **Validates: Requirements 1.6, 8.4**
     */
    insert(product: ProductEntity): Promise<ProductEntity>;

    /**
     * Update an existing product with partial data
     * 
     * @param id - Product UUID to update
     * @param updates - Partial ProductEntity with fields to update
     * @returns Promise resolving to the updated ProductEntity
     * 
     * @throws NotFoundException if product not found or soft-deleted
     * @throws ConflictException if unique constraint violation
     * @throws RepositoryException for database errors
     * 
     * @remarks
     * - Only updates provided fields (partial update)
     * - updated_at is automatically set by database trigger
     * - Cannot update id, created_at, or deleted_at through this method
     * - Filters out soft-deleted products (WHERE deleted_at IS NULL)
     * 
     * **Validates: Requirements 3.1, 8.4**
     */
    update(id: string, updates: Partial<ProductEntity>): Promise<ProductEntity>;

    /**
     * Soft delete a product by setting deleted_at timestamp
     * 
     * @param id - Product UUID to soft delete
     * @returns Promise resolving when deletion is complete
     * 
     * @throws NotFoundException if product not found or already deleted
     * @throws RepositoryException for database errors
     * 
     * @remarks
     * - Sets deleted_at = NOW()
     * - Preserves all product data (soft delete)
     * - Product will be excluded from queries unless includeDeleted=true
     * - Idempotent: calling on already deleted product throws NotFoundException
     * 
     * **Validates: Requirements 4.1, 4.2**
     */
    softDelete(id: string): Promise<void>;

    /**
     * Find a product by ID
     * 
     * @param id - Product UUID to find
     * @param includeDeleted - If true, include soft-deleted products (default: false)
     * @returns Promise resolving to ProductEntity or null if not found
     * 
     * @remarks
     * - Returns null if product not found
     * - By default, excludes soft-deleted products (deleted_at IS NULL)
     * - Admin queries can set includeDeleted=true to view deleted products
     * - Maps database row to ProductEntity with proper type conversions
     * 
     * **Validates: Requirements 2.5, 4.4, 8.4**
     */
    findById(id: string, includeDeleted?: boolean): Promise<ProductEntity | null>;

    /**
     * Find all products with filtering, sorting, and pagination
     * 
     * @param filters - RepositoryFilters for query conditions
     * @param pagination - Pagination parameters (page, pageSize)
     * @returns Promise resolving to PaginatedResult with products and metadata
     * 
     * @remarks
     * - Applies all specified filters (category, status, price range, search)
     * - By default, excludes soft-deleted products unless filters.includeDeleted=true
     * - Supports full-text search in name and description (case-insensitive)
     * - Supports dynamic sorting by any field (sortBy, sortOrder)
     * - Returns total count for pagination UI
     * - Uses LIMIT and OFFSET for pagination
     * - All queries use indexes for performance
     * 
     * **Query Pattern:**
     * ```sql
     * SELECT * FROM products
     * WHERE deleted_at IS NULL
     *   AND ($1::text IS NULL OR category = $1)
     *   AND ($2::text IS NULL OR status = $2)
     *   AND ($3::numeric IS NULL OR price >= $3)
     *   AND ($4::numeric IS NULL OR price <= $4)
     *   AND ($5::text IS NULL OR (name ILIKE $5 OR description ILIKE $5))
     * ORDER BY created_at DESC
     * LIMIT $6 OFFSET $7;
     * ```
     * 
     * **Validates: Requirements 2.2, 5.2, 5.3, 5.4, 5.5, 8.4**
     */
    findAll(filters: RepositoryFilters, pagination: Pagination): Promise<PaginatedResult<ProductEntity>>;

    /**
     * Check if a product with the given name exists in the specified category
     * 
     * @param name - Product name to check
     * @param category - Product category to check within
     * @param excludeId - Optional product ID to exclude from check (for updates)
     * @returns Promise resolving to true if product exists, false otherwise
     * 
     * @remarks
     * - Used for enforcing unique name within category business rule
     * - Excludes soft-deleted products (deleted_at IS NULL)
     * - excludeId parameter allows checking uniqueness during updates
     * - Case-sensitive name comparison
     * 
     * **Query Pattern:**
     * ```sql
     * SELECT EXISTS(
     *   SELECT 1 FROM products
     *   WHERE name = $1
     *     AND category = $2
     *     AND deleted_at IS NULL
     *     AND ($3::uuid IS NULL OR id != $3)
     * );
     * ```
     * 
     * **Validates: Requirements 1.5, 3.5**
     */
    existsByNameAndCategory(name: string, category: string, excludeId?: string): Promise<boolean>;
}
