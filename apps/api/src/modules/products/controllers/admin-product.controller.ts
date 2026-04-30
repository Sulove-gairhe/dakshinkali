/**
 * AdminProductController - API Layer for Admin Product Management
 * 
 * Handles HTTP requests for admin product CRUD operations.
 * Applies authentication and authorization middleware.
 * 
 * @remarks
 * - All endpoints require authentication (JWT token)
 * - All endpoints require admin role authorization
 * - Request validation performed before service calls
 * - Entity → DTO transformation for all responses
 * - Consistent error response formatting
 * 
 * **Endpoints:**
 * - POST   /api/v1/admin/products          - Create product
 * - GET    /api/v1/admin/products          - List products with filters
 * - GET    /api/v1/admin/products/:id      - Get product by ID
 * - PUT    /api/v1/admin/products/:id      - Update product
 * - DELETE /api/v1/admin/products/:id      - Soft delete product
 * 
 * **Validates: Requirements 1.1-1.4, 2.1-2.5, 3.1-3.4, 4.1, 4.4, 7.1, 10.1**
 */

import { ProductService } from '../services/product.service';
import { mapEntityToDTO, ProductDTO } from '../dto/product.dto';
import { CreateProductRequest } from '../dto/create-product.request';
import { UpdateProductRequest } from '../dto/update-product.request';
import { AdminListQuery } from '../dto/admin-list-query.request';
import { ProductFilters, Pagination, PaginatedResult } from '../types/product.types';
import { ValidationException } from '../../../common/exceptions/validation.exception';
import { ProductNotFoundException } from '../exceptions/product-not-found.exception';
import { DuplicateProductException } from '../exceptions/duplicate-product.exception';

/**
 * Paginated response wrapper for product listings
 */
interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

/**
 * AdminProductController
 * 
 * Thin controller layer that orchestrates:
 * 1. Request validation
 * 2. Service method calls
 * 3. Entity → DTO transformation
 * 4. HTTP status code mapping
 * 5. Error handling
 */
export class AdminProductController {
    constructor(private readonly productService: ProductService) { }

    /**
     * POST /api/v1/admin/products
     * Create a new product with optional images
     * 
     * @param request - CreateProductRequest with product data
     * @returns Promise resolving to { status: 201, data: ProductDTO }
     * 
     * @throws ValidationException (400) - Invalid product data
     * @throws DuplicateProductException (409) - Product name exists in category
     * @throws UnauthorizedException (401) - Missing/invalid auth token (handled by middleware)
     * @throws ForbiddenException (403) - Non-admin user (handled by middleware)
     * 
     * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 7.1**
     */
    async createProduct(request: CreateProductRequest): Promise<{ status: number; data: ProductDTO }> {
        // Validate required fields
        this.validateCreateRequest(request);

        // Validate image count
        if (request.images && request.images.length > 5) {
            throw new ValidationException('Maximum 5 images allowed per product', [
                { field: 'images', message: 'Maximum 5 images allowed' }
            ]);
        }

        try {
            // Call service layer
            const entity = await this.productService.createProduct(
                {
                    name: request.name,
                    description: request.description,
                    price: request.price,
                    category: request.category,
                    status: request.status,
                },
                request.images
            );

            // Map Entity → DTO
            const dto = mapEntityToDTO(entity);

            return {
                status: 201,
                data: dto,
            };
        } catch (error) {
            // Translate service errors to HTTP exceptions
            if (error instanceof Error && error.message.includes('already exists')) {
                throw new DuplicateProductException(request.name, request.category);
            }
            throw error;
        }
    }

    /**
     * GET /api/v1/admin/products
     * List products with filtering and pagination
     * 
     * @param query - AdminListQuery with filters and pagination params
     * @returns Promise resolving to { status: 200, data: PaginatedResponse<ProductDTO> }
     * 
     * @throws ValidationException (400) - Invalid query parameters
     * @throws UnauthorizedException (401) - Missing/invalid auth token (handled by middleware)
     * @throws ForbiddenException (403) - Non-admin user (handled by middleware)
     * 
     * **Validates: Requirements 2.1, 2.3, 2.4, 7.1**
     */
    async listProducts(query: AdminListQuery): Promise<{ status: number; data: PaginatedResponse<ProductDTO> }> {
        // Apply defaults and validate pagination
        const page = query.page && query.page > 0 ? query.page : 1;
        const pageSize = this.capPageSize(query.pageSize);

        // Validate price range
        if (query.minPrice !== undefined && query.minPrice < 0) {
            throw new ValidationException('Invalid price range', [
                { field: 'minPrice', message: 'Minimum price must be >= 0' }
            ]);
        }

        if (query.maxPrice !== undefined && query.maxPrice < 0) {
            throw new ValidationException('Invalid price range', [
                { field: 'maxPrice', message: 'Maximum price must be >= 0' }
            ]);
        }

        if (
            query.minPrice !== undefined &&
            query.maxPrice !== undefined &&
            query.minPrice > query.maxPrice
        ) {
            throw new ValidationException('Invalid price range', [
                { field: 'minPrice', message: 'Minimum price cannot be greater than maximum price' }
            ]);
        }

        // Build filters
        const filters: ProductFilters = {
            category: query.category,
            status: query.status,
            minPrice: query.minPrice,
            maxPrice: query.maxPrice,
            search: query.search,
            includeDeleted: query.includeDeleted || false,
        };

        // Build pagination
        const pagination: Pagination = {
            page,
            pageSize,
        };

        // Call service layer
        const result = await this.productService.listProducts(filters, pagination);

        // Map Entities → DTOs
        const dtos = result.data.map(entity => mapEntityToDTO(entity));

        return {
            status: 200,
            data: {
                data: dtos,
                total: result.total,
                page: result.page,
                pageSize: result.pageSize,
                totalPages: result.totalPages,
            },
        };
    }

    /**
     * GET /api/v1/admin/products/:id
     * Get a single product by ID
     * 
     * @param id - Product UUID
     * @param includeDeleted - Optional flag to include soft-deleted products
     * @returns Promise resolving to { status: 200, data: ProductDTO }
     * 
     * @throws ValidationException (400) - Invalid UUID format
     * @throws ProductNotFoundException (404) - Product not found
     * @throws UnauthorizedException (401) - Missing/invalid auth token (handled by middleware)
     * @throws ForbiddenException (403) - Non-admin user (handled by middleware)
     * 
     * **Validates: Requirements 2.5, 7.1**
     */
    async getProductById(id: string, includeDeleted: boolean = false): Promise<{ status: number; data: ProductDTO }> {
        // Validate UUID format
        this.validateUUID(id);

        // Call service layer
        const entity = await this.productService.getProductById(id, includeDeleted);

        if (!entity) {
            throw new ProductNotFoundException(id);
        }

        // Map Entity → DTO
        const dto = mapEntityToDTO(entity);

        return {
            status: 200,
            data: dto,
        };
    }

    /**
     * PUT /api/v1/admin/products/:id
     * Update an existing product
     * 
     * @param id - Product UUID
     * @param request - UpdateProductRequest with partial product data
     * @returns Promise resolving to { status: 200, data: ProductDTO }
     * 
     * @throws ValidationException (400) - Invalid product data or UUID format
     * @throws ProductNotFoundException (404) - Product not found
     * @throws DuplicateProductException (409) - Updated name conflicts with existing product
     * @throws UnauthorizedException (401) - Missing/invalid auth token (handled by middleware)
     * @throws ForbiddenException (403) - Non-admin user (handled by middleware)
     * 
     * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 7.1**
     */
    async updateProduct(id: string, request: UpdateProductRequest): Promise<{ status: number; data: ProductDTO }> {
        // Validate UUID format
        this.validateUUID(id);

        // Validate update request
        this.validateUpdateRequest(request);

        // Validate total image count if adding new images
        if (request.images && request.images.length > 5) {
            throw new ValidationException('Maximum 5 images can be added at once', [
                { field: 'images', message: 'Maximum 5 images can be added at once' }
            ]);
        }

        try {
            // Call service layer
            const entity = await this.productService.updateProduct(
                id,
                {
                    name: request.name,
                    description: request.description,
                    price: request.price,
                    category: request.category,
                    status: request.status,
                },
                request.images,
                request.removeImages
            );

            // Map Entity → DTO
            const dto = mapEntityToDTO(entity);

            return {
                status: 200,
                data: dto,
            };
        } catch (error) {
            // Translate service errors to HTTP exceptions
            if (error instanceof Error) {
                if (error.message.includes('not found')) {
                    throw new ProductNotFoundException(id);
                }
                if (error.message.includes('already exists')) {
                    throw new DuplicateProductException(
                        request.name || '',
                        request.category || ''
                    );
                }
            }
            throw error;
        }
    }

    /**
     * DELETE /api/v1/admin/products/:id
     * Soft delete a product
     * 
     * @param id - Product UUID
     * @returns Promise resolving to { status: 204 }
     * 
     * @throws ValidationException (400) - Invalid UUID format
     * @throws ProductNotFoundException (404) - Product not found
     * @throws UnauthorizedException (401) - Missing/invalid auth token (handled by middleware)
     * @throws ForbiddenException (403) - Non-admin user (handled by middleware)
     * 
     * **Validates: Requirements 4.1, 4.4, 7.1**
     */
    async deleteProduct(id: string): Promise<{ status: number }> {
        // Validate UUID format
        this.validateUUID(id);

        try {
            // Call service layer
            await this.productService.deleteProduct(id);

            return {
                status: 204,
            };
        } catch (error) {
            // Translate service errors to HTTP exceptions
            if (error instanceof Error && error.message.includes('not found')) {
                throw new ProductNotFoundException(id);
            }
            throw error;
        }
    }

    /**
     * Validate CreateProductRequest
     * 
     * @param request - CreateProductRequest to validate
     * @throws ValidationException if validation fails
     */
    private validateCreateRequest(request: CreateProductRequest): void {
        const errors: Array<{ field: string; message: string }> = [];

        // Validate name
        if (!request.name || request.name.trim() === '') {
            errors.push({ field: 'name', message: 'Product name is required' });
        } else if (request.name.length > 200) {
            errors.push({ field: 'name', message: 'Product name must not exceed 200 characters' });
        }

        // Validate price
        if (request.price === undefined || request.price === null) {
            errors.push({ field: 'price', message: 'Product price is required' });
        } else if (typeof request.price !== 'number' || request.price <= 0) {
            errors.push({ field: 'price', message: 'Product price must be greater than 0' });
        }

        // Validate category
        if (!request.category || request.category.trim() === '') {
            errors.push({ field: 'category', message: 'Product category is required' });
        }

        // Validate description length
        if (request.description && request.description.length > 2000) {
            errors.push({ field: 'description', message: 'Product description must not exceed 2000 characters' });
        }

        // Validate status
        if (request.status) {
            const validStatuses = ['active', 'inactive', 'out_of_stock'];
            if (!validStatuses.includes(request.status)) {
                errors.push({
                    field: 'status',
                    message: `Product status must be one of: ${validStatuses.join(', ')}`
                });
            }
        }

        if (errors.length > 0) {
            throw new ValidationException('Invalid product data', errors);
        }
    }

    /**
     * Validate UpdateProductRequest
     * 
     * @param request - UpdateProductRequest to validate
     * @throws ValidationException if validation fails
     */
    private validateUpdateRequest(request: UpdateProductRequest): void {
        const errors: Array<{ field: string; message: string }> = [];

        // Validate name if provided
        if (request.name !== undefined) {
            if (request.name.trim() === '') {
                errors.push({ field: 'name', message: 'Product name cannot be empty' });
            } else if (request.name.length > 200) {
                errors.push({ field: 'name', message: 'Product name must not exceed 200 characters' });
            }
        }

        // Validate price if provided
        if (request.price !== undefined) {
            if (typeof request.price !== 'number' || request.price <= 0) {
                errors.push({ field: 'price', message: 'Product price must be greater than 0' });
            }
        }

        // Validate category if provided
        if (request.category !== undefined && request.category.trim() === '') {
            errors.push({ field: 'category', message: 'Product category cannot be empty' });
        }

        // Validate description length if provided
        if (request.description !== undefined && request.description.length > 2000) {
            errors.push({ field: 'description', message: 'Product description must not exceed 2000 characters' });
        }

        // Validate status if provided
        if (request.status !== undefined) {
            const validStatuses = ['active', 'inactive', 'out_of_stock'];
            if (!validStatuses.includes(request.status)) {
                errors.push({
                    field: 'status',
                    message: `Product status must be one of: ${validStatuses.join(', ')}`
                });
            }
        }

        if (errors.length > 0) {
            throw new ValidationException('Invalid product data', errors);
        }
    }

    /**
     * Validate UUID format
     * 
     * @param id - UUID string to validate
     * @throws ValidationException if UUID format is invalid
     */
    private validateUUID(id: string): void {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            throw new ValidationException('Invalid product ID format', [
                { field: 'id', message: 'Product ID must be a valid UUID' }
            ]);
        }
    }

    /**
     * Cap page size at maximum allowed value
     * 
     * @param pageSize - Requested page size
     * @returns Capped page size (default: 20, max: 100)
     */
    private capPageSize(pageSize?: number): number {
        const defaultPageSize = 20;
        const maxPageSize = 100;

        if (!pageSize || pageSize <= 0) {
            return defaultPageSize;
        }

        return Math.min(pageSize, maxPageSize);
    }
}
