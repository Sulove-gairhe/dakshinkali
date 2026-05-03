/**
 * Property Test: Public API Exclusion of Deleted and Inactive Products
 * 
 * **Property 2: Public API Exclusion of Deleted and Inactive Products**
 * **Validates: Requirements 4.3, 5.6**
 * 
 * For any product with `deleted_at IS NOT NULL` OR `status != "active"`,
 * the Public API SHALL never return that product in listing or detail responses.
 * 
 * This property test generates random product lists with various statuses and deleted_at values,
 * calls public API methods, and verifies that deleted and inactive products are never returned.
 * 
 * Tag: Feature: product-module, Property 2: Public API Exclusion of Deleted and Inactive Products
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ProductEntity, ProductStatus } from '../../entities/product.entity';
import { ProductServiceImpl } from '../../services/product.service.impl';
import { ProductRepository } from '../../repositories/product.repository';
import { ImageStorageService } from '../../services/image-storage.service';
import { Pagination, PaginatedResult, PublicProductFilters } from '../../types/product.types';

/**
 * Arbitrary generator for ProductStatus
 */
const productStatusArbitrary = fc.constantFrom<ProductStatus>('active', 'inactive', 'out_of_stock');

/**
 * Counter for generating unique IDs
 */
let idCounter = 0;

/**
 * Arbitrary generator for ProductEntity with controlled status and deletedAt
 * This generator creates products with various combinations of status and deletion states
 */
const productEntityArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 200 }),
    description: fc.option(fc.string({ maxLength: 2000 }), { nil: null }),
    price: fc.double({ min: 0.01, max: 100000, noNaN: true }),
    category: fc.constantFrom('Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Toys'),
    status: productStatusArbitrary,
    images: fc.array(
        fc.record({
            id: fc.uuid(),
            url: fc.webUrl(),
            filename: fc.string({ minLength: 1, maxLength: 100 }),
            order: fc.nat({ max: 10 }),
        }),
        { maxLength: 5 }
    ),
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
    updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
    deletedAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }), { nil: null }),
}).map(product => ({
    ...product,
    id: `test-product-${idCounter++}`, // Ensure unique IDs
}));

/**
 * Arbitrary generator for PublicProductFilters
 */
const publicFiltersArbitrary = fc.record({
    category: fc.option(fc.constantFrom('Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Toys'), { nil: undefined }),
    minPrice: fc.option(fc.double({ min: 0, max: 50000, noNaN: true }), { nil: undefined }),
    maxPrice: fc.option(fc.double({ min: 0, max: 100000, noNaN: true }), { nil: undefined }),
    search: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    sortBy: fc.option(fc.constantFrom<'price' | 'name' | 'createdAt'>('price', 'name', 'createdAt'), { nil: undefined }),
    sortOrder: fc.option(fc.constantFrom<'asc' | 'desc'>('asc', 'desc'), { nil: undefined }),
}).filter(filters => {
    // Ensure minPrice <= maxPrice when both are defined
    if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
        return filters.minPrice <= filters.maxPrice;
    }
    return true;
});

/**
 * Mock ProductRepository for testing
 * Simulates repository behavior with in-memory product list
 */
class MockProductRepository implements ProductRepository {
    private products: ProductEntity[] = [];

    setProducts(products: ProductEntity[]): void {
        this.products = products;
    }

    async findById(id: string, includeDeleted: boolean = false): Promise<ProductEntity | null> {
        const product = this.products.find(p => p.id === id);
        if (!product) return null;
        if (!includeDeleted && product.deletedAt !== null) return null;
        return product;
    }

    async findAll(filters: any, pagination: Pagination): Promise<PaginatedResult<ProductEntity>> {
        let filtered = this.products;

        // Apply soft delete filter
        if (!filters.includeDeleted) {
            filtered = filtered.filter(p => p.deletedAt === null);
        }

        // Apply status filter
        if (filters.status) {
            filtered = filtered.filter(p => p.status === filters.status);
        }

        // Apply category filter
        if (filters.category) {
            filtered = filtered.filter(p => p.category === filters.category);
        }

        // Apply price range filters
        if (filters.minPrice !== undefined) {
            filtered = filtered.filter(p => p.price >= filters.minPrice);
        }
        if (filters.maxPrice !== undefined) {
            filtered = filtered.filter(p => p.price <= filters.maxPrice);
        }

        // Apply search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(p => {
                const nameMatch = p.name.toLowerCase().includes(searchLower);
                const descriptionMatch = p.description?.toLowerCase().includes(searchLower) || false;
                return nameMatch || descriptionMatch;
            });
        }

        // Apply sorting
        if (filters.sortBy) {
            filtered = [...filtered].sort((a, b) => {
                let aVal: any;
                let bVal: any;

                switch (filters.sortBy) {
                    case 'price':
                        aVal = a.price;
                        bVal = b.price;
                        break;
                    case 'name':
                        aVal = a.name.toLowerCase();
                        bVal = b.name.toLowerCase();
                        break;
                    case 'createdAt':
                    case 'created_at':
                        aVal = a.createdAt.getTime();
                        bVal = b.createdAt.getTime();
                        break;
                    default:
                        return 0;
                }

                if (filters.sortOrder === 'desc') {
                    return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
                } else {
                    return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                }
            });
        }

        // Apply pagination
        const start = (pagination.page - 1) * pagination.pageSize;
        const end = start + pagination.pageSize;
        const paginatedData = filtered.slice(start, end);

        return {
            data: paginatedData,
            total: filtered.length,
            page: pagination.page,
            pageSize: pagination.pageSize,
            totalPages: Math.ceil(filtered.length / pagination.pageSize),
        };
    }

    async insert(product: ProductEntity): Promise<ProductEntity> {
        this.products.push(product);
        return product;
    }

    async update(id: string, updates: Partial<ProductEntity>): Promise<ProductEntity> {
        const index = this.products.findIndex(p => p.id === id);
        if (index === -1) throw new Error('Product not found');
        this.products[index] = { ...this.products[index], ...updates };
        return this.products[index];
    }

    async softDelete(id: string): Promise<void> {
        const product = this.products.find(p => p.id === id);
        if (product) {
            product.deletedAt = new Date();
        }
    }

    async existsByNameAndCategory(name: string, category: string, excludeId?: string): Promise<boolean> {
        return this.products.some(p =>
            p.name === name &&
            p.category === category &&
            p.deletedAt === null &&
            (!excludeId || p.id !== excludeId)
        );
    }
}

/**
 * Mock ImageStorageService for testing
 */
class MockImageStorageService implements ImageStorageService {
    async uploadImage(buffer: Buffer, productId: string, originalFilename: string): Promise<{ url: string; filename: string }> {
        const filename = this.generateUniqueFilename(originalFilename);
        return {
            url: `https://storage.example.com/${productId}/${filename}`,
            filename,
        };
    }

    async deleteImage(imageUrl: string): Promise<void> {
        // Mock implementation
    }

    async deleteImages(imageUrls: string[]): Promise<void> {
        // Mock implementation
    }

    generateUniqueFilename(originalFilename: string): string {
        const timestamp = Date.now();
        const uuid = crypto.randomUUID();
        const extension = originalFilename.split('.').pop() || 'jpg';
        return `${uuid}-${timestamp}.${extension}`;
    }

    validateImageFile(file: { mimetype: string; size: number }): void {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new Error('Invalid image type');
        }
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('Image size exceeds 5MB');
        }
    }
}

describe('Property Test: Public API Exclusion of Deleted and Inactive Products', () => {
    let mockRepository: MockProductRepository;
    let mockImageStorage: MockImageStorageService;
    let productService: ProductServiceImpl;

    beforeEach(() => {
        mockRepository = new MockProductRepository();
        mockImageStorage = new MockImageStorageService();
        productService = new ProductServiceImpl(mockRepository, mockImageStorage);
    });

    it('should never return deleted products in listActiveProducts', () => {
        fc.assert(
            fc.property(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 100 }),
                publicFiltersArbitrary,
                async (products, filters) => {
                    // Set up mock repository with test products
                    mockRepository.setProducts(products);

                    // Call public API method
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Verify: NO returned product should have deletedAt !== null
                    for (const product of result.data) {
                        expect(product.deletedAt).toBeNull();
                    }

                    // Verify: Count of deleted products in input
                    const deletedCount = products.filter(p => p.deletedAt !== null).length;
                    if (deletedCount > 0) {
                        // If there are deleted products, they should NOT be in the result
                        const deletedInResult = result.data.filter(p => p.deletedAt !== null).length;
                        expect(deletedInResult).toBe(0);
                    }
                }
            ),
            {
                numRuns: 100,
                verbose: true,
            }
        );
    });

    it('should never return inactive products in listActiveProducts', () => {
        fc.assert(
            fc.property(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 100 }),
                publicFiltersArbitrary,
                async (products, filters) => {
                    // Set up mock repository with test products
                    mockRepository.setProducts(products);

                    // Call public API method
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Verify: ALL returned products must have status === 'active'
                    for (const product of result.data) {
                        expect(product.status).toBe('active');
                    }

                    // Verify: Count of inactive products in input
                    const inactiveCount = products.filter(p => p.status !== 'active').length;
                    if (inactiveCount > 0) {
                        // If there are inactive products, they should NOT be in the result
                        const inactiveInResult = result.data.filter(p => p.status !== 'active').length;
                        expect(inactiveInResult).toBe(0);
                    }
                }
            ),
            {
                numRuns: 100,
                verbose: true,
            }
        );
    });

    it('should never return deleted products in getActiveProductById', () => {
        fc.assert(
            fc.property(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 50 }),
                async (products) => {
                    // Set up mock repository with test products
                    mockRepository.setProducts(products);

                    // Test each product
                    for (const product of products) {
                        const result = await productService.getActiveProductById(product.id);

                        if (product.deletedAt !== null) {
                            // Deleted products should return null
                            expect(result).toBeNull();
                        } else if (product.status !== 'active') {
                            // Inactive products should return null
                            expect(result).toBeNull();
                        } else {
                            // Active, non-deleted products should be returned
                            expect(result).not.toBeNull();
                            expect(result?.id).toBe(product.id);
                            expect(result?.deletedAt).toBeNull();
                            expect(result?.status).toBe('active');
                        }
                    }
                }
            ),
            {
                numRuns: 100,
                verbose: true,
            }
        );
    });

    it('should never return inactive products in getActiveProductById', () => {
        fc.assert(
            fc.property(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 50 }),
                async (products) => {
                    // Set up mock repository with test products
                    mockRepository.setProducts(products);

                    // Test each product
                    for (const product of products) {
                        const result = await productService.getActiveProductById(product.id);

                        if (product.status !== 'active') {
                            // Inactive products should return null
                            expect(result).toBeNull();
                        } else if (product.deletedAt !== null) {
                            // Deleted products should return null
                            expect(result).toBeNull();
                        } else {
                            // Active, non-deleted products should be returned
                            expect(result).not.toBeNull();
                            expect(result?.status).toBe('active');
                        }
                    }
                }
            ),
            {
                numRuns: 100,
                verbose: true,
            }
        );
    });

    it('should only return products that are both active AND non-deleted', () => {
        fc.assert(
            fc.property(
                fc.array(productEntityArbitrary, { minLength: 10, maxLength: 100 }),
                publicFiltersArbitrary,
                async (products, filters) => {
                    // Set up mock repository with test products
                    mockRepository.setProducts(products);

                    // Call public API method
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Verify: ALL returned products must satisfy BOTH conditions
                    for (const product of result.data) {
                        expect(product.status).toBe('active');
                        expect(product.deletedAt).toBeNull();
                    }

                    // Count products that should be excluded
                    const shouldBeExcluded = products.filter(p =>
                        p.deletedAt !== null || p.status !== 'active'
                    );

                    // Verify: None of the excluded products appear in results
                    for (const excluded of shouldBeExcluded) {
                        const foundInResult = result.data.some(p => p.id === excluded.id);
                        expect(foundInResult).toBe(false);
                    }
                }
            ),
            {
                numRuns: 100,
                verbose: true,
            }
        );
    });

    it('should handle edge case: all products are deleted', () => {
        fc.assert(
            fc.property(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 50 }),
                publicFiltersArbitrary,
                async (products, filters) => {
                    // Mark all products as deleted
                    const allDeleted = products.map(p => ({
                        ...p,
                        deletedAt: new Date(),
                    }));

                    mockRepository.setProducts(allDeleted);

                    // Call public API method
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Should return empty result
                    expect(result.data).toEqual([]);
                    expect(result.total).toBe(0);
                }
            ),
            {
                numRuns: 100,
                verbose: true,
            }
        );
    });

    it('should handle edge case: all products are inactive', () => {
        fc.assert(
            fc.property(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 50 }),
                publicFiltersArbitrary,
                async (products, filters) => {
                    // Mark all products as inactive
                    const allInactive = products.map(p => ({
                        ...p,
                        status: 'inactive' as ProductStatus,
                        deletedAt: null, // Ensure not deleted
                    }));

                    mockRepository.setProducts(allInactive);

                    // Call public API method
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Should return empty result
                    expect(result.data).toEqual([]);
                    expect(result.total).toBe(0);
                }
            ),
            {
                numRuns: 100,
                verbose: true,
            }
        );
    });

    it('should handle edge case: mix of active, inactive, and deleted products', () => {
        fc.assert(
            fc.property(
                fc.nat({ max: 30 }),
                fc.nat({ max: 30 }),
                fc.nat({ max: 30 }),
                publicFiltersArbitrary,
                async (activeCount, inactiveCount, deletedCount, filters) => {
                    // Generate specific product sets
                    const activeProducts = await fc.sample(
                        productEntityArbitrary.map(p => ({ ...p, status: 'active' as ProductStatus, deletedAt: null })),
                        activeCount
                    );
                    const inactiveProducts = await fc.sample(
                        productEntityArbitrary.map(p => ({ ...p, status: 'inactive' as ProductStatus, deletedAt: null })),
                        inactiveCount
                    );
                    const deletedProducts = await fc.sample(
                        productEntityArbitrary.map(p => ({ ...p, deletedAt: new Date() })),
                        deletedCount
                    );

                    const allProducts = [...activeProducts, ...inactiveProducts, ...deletedProducts];
                    mockRepository.setProducts(allProducts);

                    // Call public API method
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Verify: Only active, non-deleted products are returned
                    for (const product of result.data) {
                        expect(product.status).toBe('active');
                        expect(product.deletedAt).toBeNull();
                    }

                    // Verify: Result count should be <= activeCount (may be less due to filters)
                    expect(result.data.length).toBeLessThanOrEqual(activeCount);
                }
            ),
            {
                numRuns: 100,
                verbose: true,
            }
        );
    });

    it('should handle edge case: product with out_of_stock status', () => {
        fc.assert(
            fc.property(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 50 }),
                publicFiltersArbitrary,
                async (products, filters) => {
                    // Mark some products as out_of_stock
                    const withOutOfStock = products.map((p, i) => ({
                        ...p,
                        status: i % 3 === 0 ? ('out_of_stock' as ProductStatus) : p.status,
                        deletedAt: null, // Ensure not deleted
                    }));

                    mockRepository.setProducts(withOutOfStock);

                    // Call public API method
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Verify: NO out_of_stock products in result
                    for (const product of result.data) {
                        expect(product.status).not.toBe('out_of_stock');
                        expect(product.status).toBe('active');
                    }
                }
            ),
            {
                numRuns: 100,
                verbose: true,
            }
        );
    });

    it('should maintain exclusion rules across pagination', () => {
        fc.assert(
            fc.property(
                fc.array(productEntityArbitrary, { minLength: 20, maxLength: 100 }),
                fc.nat({ min: 1, max: 10 }),
                publicFiltersArbitrary,
                async (products, pageSize, filters) => {
                    mockRepository.setProducts(products);

                    // Test multiple pages
                    const totalPages = Math.ceil(products.length / pageSize);
                    for (let page = 1; page <= Math.min(totalPages, 5); page++) {
                        const pagination: Pagination = { page, pageSize };
                        const result = await productService.listActiveProducts(filters, pagination);

                        // Verify: ALL products on ALL pages must be active and non-deleted
                        for (const product of result.data) {
                            expect(product.status).toBe('active');
                            expect(product.deletedAt).toBeNull();
                        }
                    }
                }
            ),
            {
                numRuns: 50, // Reduced runs due to nested loop
                verbose: true,
            }
        );
    });
});
