/**
 * Property Test: Sort Order Correctness
 * 
 * **Property 13: Sort Order Correctness**
 * **Validates: Requirements 5.5**
 * 
 * For any sort field (price, name, createdAt) and sort order (asc, desc),
 * the returned product list SHALL be correctly ordered according to the specified criteria.
 * 
 * This property test generates random product lists, applies various sort criteria
 * (price, name, createdAt) and orders (asc, desc), and verifies that the returned
 * list is correctly ordered.
 * 
 * Tag: Feature: product-module, Property 13: Sort Order Correctness
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
const validDateArbitrary = fc
    .date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') })
    .filter(date => !Number.isNaN(date.getTime()));

/**
 * Arbitrary generator for ProductEntity
 * Generates random valid product entities for testing
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
    createdAt: validDateArbitrary,
    updatedAt: validDateArbitrary,
    deletedAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }), { nil: null }),
});

/**
 * Arbitrary generator for sort criteria
 */
const sortByArbitrary = fc.constantFrom<'price' | 'name' | 'createdAt'>('price', 'name', 'createdAt');
const sortOrderArbitrary = fc.constantFrom<'asc' | 'desc'>('asc', 'desc');

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
                let comparison: number;

                switch (filters.sortBy) {
                    case 'price':
                        comparison = a.price - b.price;
                        break;
                    case 'name':
                        comparison = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
                        break;
                    case 'createdAt':
                    case 'created_at':
                        comparison = a.createdAt.getTime() - b.createdAt.getTime();
                        break;
                    default:
                        return 0;
                }

                // For descending order, negate the comparison
                return filters.sortOrder === 'desc' ? -comparison : comparison;
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

/**
 * Verify that a list is sorted correctly according to the specified criteria
 * 
 * @param products - List of products to verify
 * @param sortBy - Sort field
 * @param sortOrder - Sort order (asc or desc)
 * @returns true if list is correctly sorted, false otherwise
 */
function verifySortOrder(
    products: ProductEntity[],
    sortBy: 'price' | 'name' | 'createdAt',
    sortOrder: 'asc' | 'desc'
): boolean {
    if (products.length <= 1) {
        return true; // Single item or empty list is always sorted
    }

    for (let i = 0; i < products.length - 1; i++) {
        const current = products[i];
        const next = products[i + 1];

        let comparison: number;

        switch (sortBy) {
            case 'price':
                comparison = current.price - next.price;
                break;
            case 'name':
                comparison = current.name.toLowerCase().localeCompare(next.name.toLowerCase());
                break;
            case 'createdAt':
                comparison = current.createdAt.getTime() - next.createdAt.getTime();
                break;
        }

        if (sortOrder === 'asc') {
            // For ascending order, comparison should be <= 0 (current <= next)
            if (comparison > 0) {
                return false;
            }
        } else {
            // For descending order, comparison should be >= 0 (current >= next)
            if (comparison < 0) {
                return false;
            }
        }
    }

    return true;
}

describe('Property Test: Sort Order Correctness', () => {
    let mockRepository: MockProductRepository;
    let mockImageStorage: MockImageStorageService;
    let productService: ProductServiceImpl;

    beforeEach(() => {
        mockRepository = new MockProductRepository();
        mockImageStorage = new MockImageStorageService();
        productService = new ProductServiceImpl(mockRepository, mockImageStorage);
    });

    it('should return products sorted correctly for any sort criteria and order', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(productEntityArbitrary, { minLength: 2, maxLength: 100 }),
                sortByArbitrary,
                sortOrderArbitrary,
                async (products, sortBy, sortOrder) => {
                    // Ensure all products are active and non-deleted for public API
                    const activeProducts = products.map(p => ({
                        ...p,
                        status: 'active' as ProductStatus,
                        deletedAt: null,
                    }));

                    mockRepository.setProducts(activeProducts);

                    // Call public API method with sort criteria
                    const filters: PublicProductFilters = {
                        sortBy,
                        sortOrder,
                    };
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Verify: Returned list is correctly sorted
                    const isSorted = verifySortOrder(result.data, sortBy, sortOrder);
                    expect(isSorted).toBe(true);
                }
            ),
            {
                numRuns: 100,
                verbose: true,
            }
        );
    });

    it('should sort by price in ascending order correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(productEntityArbitrary, { minLength: 2, maxLength: 50 }),
                async (products) => {
                    // Ensure all products are active and non-deleted
                    const activeProducts = products.map(p => ({
                        ...p,
                        status: 'active' as ProductStatus,
                        deletedAt: null,
                    }));

                    mockRepository.setProducts(activeProducts);

                    // Call with price ascending sort
                    const filters: PublicProductFilters = {
                        sortBy: 'price',
                        sortOrder: 'asc',
                    };
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Verify: Each product's price is <= next product's price
                    for (let i = 0; i < result.data.length - 1; i++) {
                        expect(result.data[i].price).toBeLessThanOrEqual(result.data[i + 1].price);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should sort by price in descending order correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(productEntityArbitrary, { minLength: 2, maxLength: 50 }),
                async (products) => {
                    // Ensure all products are active and non-deleted
                    const activeProducts = products.map(p => ({
                        ...p,
                        status: 'active' as ProductStatus,
                        deletedAt: null,
                    }));

                    mockRepository.setProducts(activeProducts);

                    // Call with price descending sort
                    const filters: PublicProductFilters = {
                        sortBy: 'price',
                        sortOrder: 'desc',
                    };
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Verify: Each product's price is >= next product's price
                    for (let i = 0; i < result.data.length - 1; i++) {
                        expect(result.data[i].price).toBeGreaterThanOrEqual(result.data[i + 1].price);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should sort by name in ascending order correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(productEntityArbitrary, { minLength: 2, maxLength: 50 }),
                async (products) => {
                    // Ensure all products are active and non-deleted
                    const activeProducts = products.map(p => ({
                        ...p,
                        status: 'active' as ProductStatus,
                        deletedAt: null,
                    }));

                    mockRepository.setProducts(activeProducts);

                    // Call with name ascending sort
                    const filters: PublicProductFilters = {
                        sortBy: 'name',
                        sortOrder: 'asc',
                    };
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Verify: Each product's name is <= next product's name (case-insensitive)
                    for (let i = 0; i < result.data.length - 1; i++) {
                        const currentName = result.data[i].name.toLowerCase();
                        const nextName = result.data[i + 1].name.toLowerCase();
                        expect(currentName.localeCompare(nextName)).toBeLessThanOrEqual(0);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should sort by name in descending order correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(productEntityArbitrary, { minLength: 2, maxLength: 50 }),
                async (products) => {
                    // Ensure all products are active and non-deleted
                    const activeProducts = products.map(p => ({
                        ...p,
                        status: 'active' as ProductStatus,
                        deletedAt: null,
                    }));

                    mockRepository.setProducts(activeProducts);

                    // Call with name descending sort
                    const filters: PublicProductFilters = {
                        sortBy: 'name',
                        sortOrder: 'desc',
                    };
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Verify: Each product's name is >= next product's name (case-insensitive)
                    for (let i = 0; i < result.data.length - 1; i++) {
                        const currentName = result.data[i].name.toLowerCase();
                        const nextName = result.data[i + 1].name.toLowerCase();
                        expect(currentName.localeCompare(nextName)).toBeGreaterThanOrEqual(0);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should sort by createdAt in ascending order correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(productEntityArbitrary, { minLength: 2, maxLength: 50 }),
                async (products) => {
                    // Ensure all products are active and non-deleted
                    const activeProducts = products.map(p => ({
                        ...p,
                        status: 'active' as ProductStatus,
                        deletedAt: null,
                    }));

                    mockRepository.setProducts(activeProducts);

                    // Call with createdAt ascending sort
                    const filters: PublicProductFilters = {
                        sortBy: 'createdAt',
                        sortOrder: 'asc',
                    };
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Verify: Each product's createdAt is <= next product's createdAt
                    for (let i = 0; i < result.data.length - 1; i++) {
                        const currentTime = result.data[i].createdAt.getTime();
                        const nextTime = result.data[i + 1].createdAt.getTime();
                        expect(currentTime).toBeLessThanOrEqual(nextTime);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should sort by createdAt in descending order correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(productEntityArbitrary, { minLength: 2, maxLength: 50 }),
                async (products) => {
                    // Ensure all products are active and non-deleted
                    const activeProducts = products.map(p => ({
                        ...p,
                        status: 'active' as ProductStatus,
                        deletedAt: null,
                    }));

                    mockRepository.setProducts(activeProducts);

                    // Call with createdAt descending sort
                    const filters: PublicProductFilters = {
                        sortBy: 'createdAt',
                        sortOrder: 'desc',
                    };
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Verify: Each product's createdAt is >= next product's createdAt
                    for (let i = 0; i < result.data.length - 1; i++) {
                        const currentTime = result.data[i].createdAt.getTime();
                        const nextTime = result.data[i + 1].createdAt.getTime();
                        expect(currentTime).toBeGreaterThanOrEqual(nextTime);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should maintain sort order across pagination', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(productEntityArbitrary, { minLength: 20, maxLength: 100 }),
                sortByArbitrary,
                sortOrderArbitrary,
                fc.integer({ min: 5, max: 20 }),
                async (products, sortBy, sortOrder, pageSize) => {
                    // Ensure all products are active and non-deleted
                    const activeProducts = products.map(p => ({
                        ...p,
                        status: 'active' as ProductStatus,
                        deletedAt: null,
                    }));

                    mockRepository.setProducts(activeProducts);

                    // Fetch all pages
                    const filters: PublicProductFilters = { sortBy, sortOrder };
                    const allResults: ProductEntity[] = [];
                    const totalPages = Math.ceil(activeProducts.length / pageSize);

                    for (let page = 1; page <= Math.min(totalPages, 5); page++) {
                        const pagination: Pagination = { page, pageSize };
                        const result = await productService.listActiveProducts(filters, pagination);
                        allResults.push(...result.data);
                    }

                    // Verify: Combined results from all pages are correctly sorted
                    const isSorted = verifySortOrder(allResults, sortBy, sortOrder);
                    expect(isSorted).toBe(true);
                }
            ),
            {
                numRuns: 50, // Reduced runs due to nested loop
                verbose: true,
            }
        );
    });

    it('should handle edge case: products with identical sort values', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(productEntityArbitrary, { minLength: 5, maxLength: 20 }),
                sortByArbitrary,
                sortOrderArbitrary,
                async (products, sortBy, sortOrder) => {
                    // Create products with identical values for the sort field
                    let modifiedProducts: ProductEntity[];

                    switch (sortBy) {
                        case 'price':
                            // All products have the same price
                            modifiedProducts = products.map(p => ({
                                ...p,
                                price: 99.99,
                                status: 'active' as ProductStatus,
                                deletedAt: null,
                            }));
                            break;
                        case 'name':
                            // All products have the same name
                            modifiedProducts = products.map(p => ({
                                ...p,
                                name: 'Test Product',
                                status: 'active' as ProductStatus,
                                deletedAt: null,
                            }));
                            break;
                        case 'createdAt':
                            // All products have the same createdAt
                            const sameDate = new Date('2024-01-01');
                            modifiedProducts = products.map(p => ({
                                ...p,
                                createdAt: sameDate,
                                status: 'active' as ProductStatus,
                                deletedAt: null,
                            }));
                            break;
                    }

                    mockRepository.setProducts(modifiedProducts);

                    // Call with sort criteria
                    const filters: PublicProductFilters = { sortBy, sortOrder };
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Verify: Should not throw error and return all products
                    expect(result.data.length).toBe(modifiedProducts.length);

                    // Verify: Sort order is still valid (all equal values)
                    const isSorted = verifySortOrder(result.data, sortBy, sortOrder);
                    expect(isSorted).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should handle edge case: empty product list', async () => {
        await fc.assert(
            fc.asyncProperty(
                sortByArbitrary,
                sortOrderArbitrary,
                async (sortBy, sortOrder) => {
                    mockRepository.setProducts([]);

                    // Call with sort criteria
                    const filters: PublicProductFilters = { sortBy, sortOrder };
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Should return empty result
                    expect(result.data).toEqual([]);
                    expect(result.total).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should handle edge case: single product', async () => {
        await fc.assert(
            fc.asyncProperty(
                productEntityArbitrary,
                sortByArbitrary,
                sortOrderArbitrary,
                async (product, sortBy, sortOrder) => {
                    const activeProduct = {
                        ...product,
                        status: 'active' as ProductStatus,
                        deletedAt: null,
                    };

                    mockRepository.setProducts([activeProduct]);

                    // Call with sort criteria
                    const filters: PublicProductFilters = { sortBy, sortOrder };
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Should return the single product
                    expect(result.data.length).toBe(1);
                    expect(result.data[0].id).toBe(activeProduct.id);

                    // Single item is always sorted
                    const isSorted = verifySortOrder(result.data, sortBy, sortOrder);
                    expect(isSorted).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should combine sorting with other filters correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(productEntityArbitrary, { minLength: 10, maxLength: 100 }),
                fc.constantFrom('Electronics', 'Clothing', 'Books'),
                sortByArbitrary,
                sortOrderArbitrary,
                async (products, category, sortBy, sortOrder) => {
                    // Ensure all products are active and non-deleted
                    const activeProducts = products.map(p => ({
                        ...p,
                        status: 'active' as ProductStatus,
                        deletedAt: null,
                    }));

                    mockRepository.setProducts(activeProducts);

                    // Call with category filter and sort criteria
                    const filters: PublicProductFilters = {
                        category,
                        sortBy,
                        sortOrder,
                    };
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Verify: All returned products match the category filter
                    for (const product of result.data) {
                        expect(product.category).toBe(category);
                    }

                    // Verify: Results are correctly sorted
                    const isSorted = verifySortOrder(result.data, sortBy, sortOrder);
                    expect(isSorted).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });
});

