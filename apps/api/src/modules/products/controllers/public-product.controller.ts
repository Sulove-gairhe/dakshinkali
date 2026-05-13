/**
* PublicProductController - API Layer for Public Product Access
* 
* Handles HTTP requests for public product browsing operations.
* No authentication required - open to all users.
* 
* @remarks
* - All endpoints are public (no authentication required)
* - Returns only active, non-deleted products
* - Request validation performed before service calls
* - Entity → DTO transformation for all responses
* - Consistent error response formatting
* 
* **Endpoints:**
* - GET /api/v1/products          - List active products with filters
* - GET /api/v1/products/:id      - Get active product by ID
* 
* **Validates: Requirements 5.1-5.6, 6.1-6.5, 7.1, 10.1**
*/

import { ProductService } from '../services/product.service';
import { mapEntityToDTO, ProductDTO } from '../dto/product.dto';
import { PublicListQuery } from '../dto/public-list-query.request';
import { PublicProductFilters, Pagination } from '../types/product.types';
import { ValidationException } from '../../../common/exceptions/validation.exception';
import { ProductNotFoundException } from '../exceptions/product-not-found.exception';

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
 * PublicProductController
 * 
 * Thin controller layer that orchestrates:
 * 1. Request validation
 * 2. Service method calls (active products only)
 * 3. Entity → DTO transformation
 * 4. HTTP status code mapping
 * 5. Error handling
 */
export class PublicProductController {
    constructor(private readonly productService: ProductService) { }

    /**
     * GET /api/v1/products
     * List active products with filtering, search, sorting, and pagination
     * 
     * @param query - PublicListQuery with filters and pagination params
     * @returns Promise resolving to { status: 200, data: PaginatedResponse<ProductDTO> }
     * 
     * @throws ValidationException (400) - Invalid query parameters
     * 
     * @remarks
     * - Returns only products with: deleted_at IS NULL AND status = 'active'
     * - Default pagination: page=1, pageSize=20
     * - Maximum pageSize: 100
     * - Default sorting: sortBy='createdAt', sortOrder='desc'
     * - Search is case-insensitive across name and description
     * 
     * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 7.1**
     */
    async listProducts(query: PublicListQuery): Promise<{ status: number; data: PaginatedResponse<ProductDTO> }> {
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

        // Validate sortBy
        if (query.sortBy && !['price', 'name', 'createdAt'].includes(query.sortBy)) {
            throw new ValidationException('Invalid sort field', [
                { field: 'sortBy', message: 'Sort field must be one of: price, name, createdAt' }
            ]);
        }

        // Validate sortOrder
        if (query.sortOrder && !['asc', 'desc'].includes(query.sortOrder)) {
            throw new ValidationException('Invalid sort order', [
                { field: 'sortOrder', message: 'Sort order must be one of: asc, desc' }
            ]);
        }

        // Build filters
        const filters: PublicProductFilters = {
            category: query.category,
            minPrice: query.minPrice,
            maxPrice: query.maxPrice,
            search: query.search,
            sortBy: query.sortBy || 'createdAt',
            sortOrder: query.sortOrder || 'desc',
        };

        // Build pagination
        const pagination: Pagination = {
            page,
            pageSize,
        };

        // Call service layer (returns only active, non-deleted products)
        const result = await this.productService.listActiveProducts(filters, pagination);

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
     * GET /api/v1/products/:id
     * Get a single active product by ID
     * 
     * @param id - Product UUID
     * @returns Promise resolving to { status: 200, data: ProductDTO }
     * 
     * @throws ValidationException (400) - Invalid UUID format
     * @throws ProductNotFoundException (404) - Product not found, deleted, or inactive
     * 
     * @remarks
     * - Returns only products with: deleted_at IS NULL AND status = 'active'
     * - Returns 404 for deleted products
     * - Returns 404 for inactive products
     * - Returns 404 for non-existent products
     * 
     * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 7.1**
     */
    async getProductById(id: string): Promise<{ status: number; data: ProductDTO }> {
        // Validate UUID format
        this.validateUUID(id);

        // Call service layer (returns only active, non-deleted products)
        const entity = await this.productService.getActiveProductById(id);

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
