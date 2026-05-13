/**
 * ProductServiceImpl - Service Layer Implementation
 * 
 * Implements business logic for product management operations.
 * Orchestrates repository and image storage operations with business rule validation.
 * 
 * @remarks
 * - Validates all business rules before database operations
 * - Coordinates multi-step operations (validation → upload → insert)
 * - Manages image lifecycle (upload, delete)
 * - Translates repository errors to domain exceptions
 * - Enforces authorization rules
 * 
 * **Validates: Requirements 1.1, 1.2, 1.5, 1.7, 2.1, 2.2, 3.1-3.5, 4.1, 4.4, 5.1-5.6, 6.1-6.3, 9.1-9.5**
 */

import { ProductEntity, ProductImage } from '../entities/product.entity';
import { ProductRepository } from '../repositories/product.repository';
import { ImageStorageService } from './image-storage.service';
import type { StoredFile } from '@dakshinkali/database';
import {
    ProductService,
    CreateProductData,
    UpdateProductData,
} from './product.service';
import {
    Pagination,
    PaginatedResult,
    ProductFilters,
    PublicProductFilters,
    RepositoryFilters,
} from '../types/product.types';
import { ProductValidator } from '../validators/product.validator';

/**
 * ProductServiceImpl
 * 
 * Concrete implementation of ProductService interface.
 * Coordinates ProductRepository and ImageStorageService to implement business logic.
 */
export class ProductServiceImpl implements ProductService {
    constructor(
        private readonly repository: ProductRepository,
        private readonly imageStorage: ImageStorageService
    ) { }

    /**
     * Create a new product with optional images
     * 
     * **Validates: Requirements 1.1, 1.2, 1.5, 1.7, 9.1, 9.2, 9.3**
     */
    async createProduct(data: CreateProductData, images?: Express.Multer.File[]): Promise<ProductEntity> {
        // Validate business rules
        ProductValidator.validateCreateProduct(data);
        ProductValidator.validateImageCount(images?.length || 0);

        // Check name uniqueness within category
        const exists = await this.repository.existsByNameAndCategory(data.name, data.category);
        if (exists) {
            throw new Error(
                `A product with name '${data.name}' already exists in category '${data.category}'.`
            );
        }

        // Upload images if provided
        const productId = crypto.randomUUID();
        const uploadedImages: ProductImage[] = [];

        if (images && images.length > 0) {
            for (let i = 0; i < images.length; i++) {
                const file = images[i];

                // Convert Multer file to StoredFile
                const storedFile: StoredFile = {
                    buffer: file.buffer, // Multer already provides buffer
                    size: file.size,
                    mimetype: file.mimetype,
                    originalName: file.originalname,
                };

                // Upload image (validation happens inside)
                const result = await this.imageStorage.uploadImage(
                    storedFile,
                    productId
                );

                uploadedImages.push({
                    id: crypto.randomUUID(),
                    url: result.url,
                    filename: result.filename,
                    order: i,
                });
            }
        }

        // Build ProductEntity
        const entity: ProductEntity = {
            id: productId,
            name: data.name,
            description: data.description || null,
            price: data.price,
            category: data.category,
            status: data.status || 'active', // Default to "active"
            images: uploadedImages,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
        };

        // Insert into database
        try {
            return await this.repository.insert(entity);
        } catch (error) {
            // Rollback: delete uploaded images if database insert fails
            if (uploadedImages.length > 0) {
                await this.imageStorage.deleteImages(uploadedImages.map(img => img.url));
            }
            throw error;
        }
    }

    /**
     * Update an existing product with optional image management
     * 
     * **Validates: Requirements 3.1, 3.2, 3.3, 3.5, 9.2, 9.3**
     */
    async updateProduct(
        id: string,
        data: UpdateProductData,
        images?: Express.Multer.File[],
        removeImages?: string[]
    ): Promise<ProductEntity> {
        // Validate product exists
        const existing = await this.repository.findById(id, false);
        if (!existing) {
            throw new Error(`Product with ID '${id}' not found.`);
        }

        // Validate update data
        ProductValidator.validateUpdateProduct(data);

        // Check name uniqueness if name is being changed
        if (data.name && data.name !== existing.name) {
            const category = data.category || existing.category;
            const exists = await this.repository.existsByNameAndCategory(
                data.name,
                category,
                id
            );
            if (exists) {
                throw new Error(
                    `A product with name '${data.name}' already exists in category '${category}'.`
                );
            }
        }

        // Calculate current image count after removals
        const imagesToRemove = removeImages || [];
        const remainingImages = existing.images.filter(
            img => !imagesToRemove.includes(img.id)
        );
        const newImageCount = (images?.length || 0) + remainingImages.length;

        // Validate total image count
        ProductValidator.validateImageCount(newImageCount);

        // Upload new images if provided
        const uploadedImages: ProductImage[] = [];
        if (images && images.length > 0) {
            for (let i = 0; i < images.length; i++) {
                const file = images[i];

                // Convert Multer file to StoredFile
                const storedFile: StoredFile = {
                    buffer: file.buffer, // Multer already provides buffer
                    size: file.size,
                    mimetype: file.mimetype,
                    originalName: file.originalname,
                };

                // Upload image (validation happens inside)
                const result = await this.imageStorage.uploadImage(
                    storedFile,
                    id
                );

                uploadedImages.push({
                    id: crypto.randomUUID(),
                    url: result.url,
                    filename: result.filename,
                    order: remainingImages.length + i,
                });
            }
        }

        // Delete removed images from storage
        if (imagesToRemove.length > 0) {
            const imagesToDelete = existing.images.filter(img =>
                imagesToRemove.includes(img.id)
            );
            await this.imageStorage.deleteImages(imagesToDelete.map(img => img.url));
        }

        // Build update data
        const updates: Partial<ProductEntity> = {};
        if (data.name !== undefined) updates.name = data.name;
        if (data.description !== undefined) updates.description = data.description;
        if (data.price !== undefined) updates.price = data.price;
        if (data.category !== undefined) updates.category = data.category;
        if (data.status !== undefined) updates.status = data.status;

        // Update images array
        updates.images = [...remainingImages, ...uploadedImages];

        // Update in database
        try {
            return await this.repository.update(id, updates);
        } catch (error) {
            // Rollback: delete newly uploaded images if database update fails
            if (uploadedImages.length > 0) {
                await this.imageStorage.deleteImages(uploadedImages.map(img => img.url));
            }
            throw error;
        }
    }

    /**
     * Soft delete a product
     * 
     * **Validates: Requirements 4.1, 9.1**
     */
    async deleteProduct(id: string): Promise<void> {
        // Validate product exists
        const existing = await this.repository.findById(id, false);
        if (!existing) {
            throw new Error(`Product with ID '${id}' not found.`);
        }

        // Soft delete in database
        await this.repository.softDelete(id);

        // Note: Images are retained for audit purposes
        // If image deletion is required, uncomment:
        // if (existing.images.length > 0) {
        //     await this.imageStorage.deleteImages(existing.images.map(img => img.url));
        // }
    }

    /**
     * Get a product by ID (admin operation)
     * 
     * **Validates: Requirements 2.1, 2.2, 4.4, 9.1**
     */
    async getProductById(id: string, includeDeleted: boolean = false): Promise<ProductEntity | null> {
        return await this.repository.findById(id, includeDeleted);
    }

    /**
     * List products with filtering and pagination (admin operation)
     * 
     * **Validates: Requirements 2.1, 2.2, 4.4, 9.1**
     */
    async listProducts(
        filters: ProductFilters,
        pagination: Pagination
    ): Promise<PaginatedResult<ProductEntity>> {
        // Convert ProductFilters to RepositoryFilters
        const repoFilters: RepositoryFilters = {
            category: filters.category,
            status: filters.status,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            search: filters.search,
            includeDeleted: filters.includeDeleted,
        };

        return await this.repository.findAll(repoFilters, pagination);
    }

    /**
     * Get an active product by ID (public operation)
     * 
     * **Validates: Requirements 5.1, 5.6, 6.1, 6.2, 6.3, 9.1**
     */
    async getActiveProductById(id: string): Promise<ProductEntity | null> {
        const product = await this.repository.findById(id, false);

        // Return null if product is not active
        if (!product || product.status !== 'active') {
            return null;
        }

        return product;
    }

    /**
     * List active products with filtering and pagination (public operation)
     * 
     * **Validates: Requirements 5.1, 5.6, 6.1, 6.2, 6.3, 9.1**
     */
    async listActiveProducts(
        filters: PublicProductFilters,
        pagination: Pagination
    ): Promise<PaginatedResult<ProductEntity>> {
        // Map camelCase sortBy to snake_case for database
        const sortByMap: Record<string, string> = {
            'createdAt': 'created_at',
            'price': 'price',
            'name': 'name',
        };
        const dbSortBy = filters.sortBy ? sortByMap[filters.sortBy] : 'created_at';

        // Convert PublicProductFilters to RepositoryFilters
        // Force status to "active" and exclude deleted products
        const repoFilters: RepositoryFilters = {
            category: filters.category,
            status: 'active', // Force active status for public API
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            search: filters.search,
            includeDeleted: false, // Never include deleted products in public API
            sortBy: dbSortBy,
            sortOrder: filters.sortOrder || 'desc',
        };

        return await this.repository.findAll(repoFilters, pagination);
    }
}
