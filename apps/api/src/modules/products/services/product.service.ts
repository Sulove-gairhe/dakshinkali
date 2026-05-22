/**
 * ProductService - Service Layer Interface
 * 
 * This interface defines the contract for all business logic operations related to products.
 * It orchestrates repository operations, enforces business rules, and manages image storage.
 * 
 * @remarks
 * - This layer validates all business rules before calling Repository Layer
 * - Handles multi-step operations (validation → image upload → database insert)
 * - Coordinates ProductRepository and ImageStorageService
 * - Translates repository exceptions into appropriate domain exceptions
 * - Enforces authorization rules (admin-only operations)
 * 
 * @see ProductRepository for database operations
 * @see ImageStorageService for image management
 * 
 * **Validates: Requirements 9.1, 9.2**
 */

import { ProductEntity } from '../entities/product.entity';
import { Pagination, PaginatedResult, ProductFilters, PublicProductFilters } from '../types/product.types';

/**
 * CreateProductData - Input data for creating a new product
 * 
 * Used by createProduct method. Excludes generated fields (id, timestamps).
 */
export interface CreateProductData {
    /** Product name (required, 1-200 chars, unique within category) */
    name: string;

    /** Product description (optional, max 2000 chars) */
    description?: string;

    /** Product brand / manufacturer (optional) */
    brand?: string | null;

    /** Flexible product metadata/specifications (optional) */
    specs?: Record<string, unknown> | null;

    /** Product price (required, must be > 0) */
    price: number;

    /** Product category (required) */
    category: string;

    /** Product availability status (optional, defaults to "active") */
    status?: 'active' | 'inactive' | 'out_of_stock';
}

/**
 * UpdateProductData - Input data for updating an existing product
 * 
 * Used by updateProduct method. All fields are optional (partial update).
 */
export interface UpdateProductData {
    /** Product name (optional, 1-200 chars, unique within category) */
    name?: string;

    /** Public slug derived from category and name */
    slug?: string;

    /** Product description (optional, max 2000 chars) */
    description?: string;

    /** Product brand / manufacturer (optional) */
    brand?: string | null;

    /** Flexible product metadata/specifications (optional) */
    specs?: Record<string, unknown> | null;

    /** Product price (optional, must be > 0) */
    price?: number;

    /** Product category (optional) */
    category?: string;

    /** Product availability status (optional) */
    status?: 'active' | 'inactive' | 'out_of_stock';
}

/**
 * ProductService interface
 * 
 * Defines all business logic operations for the Product Module.
 * Implementations must handle:
 * - Business rule validation (unique names, price > 0, max 5 images)
 * - Multi-step operation orchestration (image upload + DB operations)
 * - Transaction coordination
 * - Image storage management
 * - Authorization logic
 * - Exception translation
 */
export interface ProductService {
    /**
     * Create a new product with optional images
     * 
     * Business rules enforced:
     * - Product name must be unique within category
     * - Price must be > 0
     * - Maximum 5 images allowed
     * - Status defaults to "active" if not provided
     * 
     * Multi-step operation:
     * 1. Validate business rules
     * 2. Upload images to storage (if provided)
     * 3. Insert product entity with image references
     * 
     * @param data - Product data to create
     * @param images - Optional array of image files (max 5, 5MB each)
     * @returns Promise resolving to the created ProductEntity
     * 
     * @throws ValidationException if business rules are violated
     * @throws ConflictException if product name already exists in category
     * @throws ImageValidationError if image validation fails
     * @throws ImageStorageError if image upload fails
     * 
     * **Validates: Requirements 1.1, 1.2, 1.5, 1.7, 9.1, 9.2, 9.3**
     */
    createProduct(data: CreateProductData, images?: Express.Multer.File[]): Promise<ProductEntity>;

    /**
     * Update an existing product with optional image management
     * 
     * Business rules enforced:
     * - Product must exist and not be soft-deleted
     * - Name uniqueness checked if name is being changed
     * - Price must be > 0 if being updated
     * - Total images after update must not exceed 5
     * 
     * Multi-step operation:
     * 1. Validate product exists
     * 2. Validate business rules
     * 3. Upload new images (if provided)
     * 4. Delete removed images from storage (if specified)
     * 5. Update product entity
     * 
     * @param id - Product UUID to update
     * @param data - Partial product data to update
     * @param images - Optional array of new image files to add
     * @param removeImages - Optional array of image IDs to remove
     * @returns Promise resolving to the updated ProductEntity
     * 
     * @throws NotFoundException if product not found or soft-deleted
     * @throws ValidationException if business rules are violated
     * @throws ConflictException if updated name conflicts with existing product
     * @throws ImageValidationError if image validation fails
     * @throws ImageStorageError if image operations fail
     * 
     * **Validates: Requirements 3.1, 3.2, 3.3, 3.5, 9.2, 9.3**
     */
    updateProduct(
        id: string,
        data: UpdateProductData,
        images?: Express.Multer.File[],
        removeImages?: string[]
    ): Promise<ProductEntity>;

    /**
     * Soft delete a product
     * 
     * Sets deleted_at timestamp without removing data.
     * Optionally deletes images based on configuration.
     * 
     * @param id - Product UUID to soft delete
     * @returns Promise resolving when deletion is complete
     * 
     * @throws NotFoundException if product not found or already deleted
     * 
     * **Validates: Requirements 4.1, 9.1**
     */
    deleteProduct(id: string): Promise<void>;

    /**
     * Get a product by ID (admin operation)
     * 
     * Supports viewing soft-deleted products with includeDeleted parameter.
     * 
     * @param id - Product UUID to retrieve
     * @param includeDeleted - If true, include soft-deleted products (default: false)
     * @returns Promise resolving to ProductEntity or null if not found
     * 
     * **Validates: Requirements 2.1, 2.2, 4.4, 9.1**
     */
    getProductById(id: string, includeDeleted?: boolean): Promise<ProductEntity | null>;

    /**
     * List products with filtering and pagination (admin operation)
     * 
     * Supports all filters including soft-deleted products.
     * 
     * @param filters - ProductFilters for query conditions
     * @param pagination - Pagination parameters
     * @returns Promise resolving to PaginatedResult with products and metadata
     * 
     * **Validates: Requirements 2.1, 2.2, 4.4, 9.1**
     */
    listProducts(
        filters: ProductFilters,
        pagination: Pagination
    ): Promise<PaginatedResult<ProductEntity>>;

    /**
     * Get an active product by ID (public operation)
     * 
     * Returns only products that are:
     * - Not soft-deleted (deleted_at IS NULL)
     * - Status is "active"
     * 
     * @param id - Product UUID to retrieve
     * @returns Promise resolving to ProductEntity or null if not found/inactive/deleted
     * 
     * **Validates: Requirements 5.1, 5.6, 6.1, 6.2, 6.3, 9.1**
     */
    getActiveProductById(id: string): Promise<ProductEntity | null>;

    /**
     * List active products with filtering and pagination (public operation)
     * 
     * Returns only products that are:
     * - Not soft-deleted (deleted_at IS NULL)
     * - Status is "active"
     * 
     * Supports filtering by category, price range, search, and sorting.
     * 
     * @param filters - PublicProductFilters for query conditions
     * @param pagination - Pagination parameters
     * @returns Promise resolving to PaginatedResult with active products and metadata
     * 
     * **Validates: Requirements 5.1, 5.6, 6.1, 6.2, 6.3, 9.1**
     */
    listActiveProducts(
        filters: PublicProductFilters,
        pagination: Pagination
    ): Promise<PaginatedResult<ProductEntity>>;
}
