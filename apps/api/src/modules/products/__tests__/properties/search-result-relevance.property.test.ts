/**
 * Property Test: Search Result Relevance
 * 
 * **Property 14: Search Result Relevance**
 * **Validates: Requirements 5.2**
 * 
 * For any search query string, all returned products SHALL contain the search term
 * in either the product name or description (case-insensitive).
 * 
 * This property test generates random search terms and product lists,
 * applies the search filter, and verifies that all returned products contain
 * the search term in their name or description.
 * 
 * Tag: Feature: product-module, Property 14: Search Result Relevance
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
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
    updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
    deletedAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }), { nil: null }),
});

/**
 * Arbitrary generator for search terms
 * Generates realistic search queries
 */
const searchTermArbitrary = fc.oneof(
    fc.string({ minLength: 1, maxLength: 50 }), // Random strings
    fc.constantFrom('phone', 'laptop', 'shirt', 'book', 'ball', 'toy', 'electronics', 'premium', 'sale'), // Common search terms
    fc.constantFrom('a', 'e', 'i', 'o', 'u'), // Single characters
    fc.constantFrom('the', 'and', 'for', 'with'), // Common words
);

/**
 * Check if a product matches a search term (case-insensitive)
 * 
 * @param product - Product to check
 * @param searchTerm - Search term to match
 * @returns true if product name or description contains the search term
 */
function productMatchesSearch(product: ProductEntity, searchTerm: string): boolean {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = product.name.toLowerCase().includes(searchLower);
    const descriptionMatch = product.description?.toLowerCase().includes(searchLower) || false;
    return nameMatch || descriptionMatch;
}

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

        // Apply soft delete filter (default: exclude deleted)
        if (!filters.includeDeleted) {
            filtered = filtered.filter(p => p.deletedAt === null);
        }

        // Apply status filter for public API (only active products)
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

        // Apply search filter (case-insensitive)
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

describe('Property Test: Search Result Relevance', () => {
    let mockRepository: MockProductRepository;
    let mockImageStorage: MockImageStorageService;
    let productService: ProductServiceImpl;

    beforeEach(() => {
        mockRepository = new MockProductRepository();
        mockImageStorage = new MockImageStorageService();
        productService = new ProductServiceImpl(mockRepository, mockImageStorage);
    });

    it('should return only products that contain the search term in name or description', () => {
        fc.assert(
            fc.property(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 100 }),
                searchTermArbitrary,
                async (products, searchTerm) => {
                    // Set up mock repository with test products
                    mockRepository.setProducts(products);

                    // Call public API method with search filter
                    const filters: PublicProductFilters = { search: searchTerm };
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Verify: ALL returned products must contain the search term
                    for (const product of result.data) {
                        const matches = productMatchesSearch(product, searchTerm);
                        expect(matches).toBe(true);
                    }
                }
            ),
            {
                numRuns: 100,
                verbose: true,
            }
        );
    });

    it('should perform case-insensitive search', () => {
        fc.assert(
            fc.property(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 50 }),
                fc.string({ minLength: 1, maxLength: 20 }),
                async (products, searchTerm) => {
                    // Set up mock repository with test products
                    mockRepository.setProducts(products);

                    // Test with different case variations
                    const variations = [
                        searchTerm.toLowerCase(),
                        searchTerm.toUpperCase(),
                        searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase(),
                    ];

                    for (const variant of variations) {
                        const filters: PublicProductFilters = { search: variant };
                        const pagination: Pagination = { page: 1, pageSize: 100 };
                        const result = await productService.listActiveProducts(filters, pagination);

                        // All returned products should match regardless of case
                        for (const product of result.data) {
                            const matches = productMatchesSearch(product, variant);
                            expect(matches).toBe(true);
                        }
                    }
                }
            ),
            {
                numRuns: 50, // Reduced due to nested loop
                verbose: true,
            }
        );
    });

    it('should search in product name', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 3, maxLength: 20 }),
                fc.nat({ max: 20 }),
                async (searchTerm, productCount) => {
                    // Create products with search term in name
                    const productsWithTermInName = await fc.sample(
                        productEntityArbitrary.map(p => ({
                            ...p,
                            name: `Product ${searchTerm} ${p.name}`,
                            description: 'No match here',
                            status: 'active' as ProductStatus,
                            deletedAt: null,
                        })),
                        productCount
                    );

                    mockRepository.setProducts(productsWithTermInName);

                    const filters: PublicProductFilters = { search: searchTerm };
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // All products should be returned (all have term in name)
                    expect(result.data.length).toBe(productCount);

                    // Verify each product has the term in name
                    for (const product of result.data) {
                        expect(product.name.toLowerCase()).toContain(searchTerm.toLowerCase());
                    }
                }
            ),
            {
                numRuns: 100,
                verbose: true,
            }
        );
    });

    it('should search in product description', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 3, maxLength: 20 }),
                fc.nat({ max: 20 }),
                async (searchTerm, productCount) => {
                    // Create products with search term in description
                    const productsWithTermInDescription = await fc.sample(
                        productEntityArbitrary.map(p => ({
                            ...p,
                            name: 'No match here',
                            description: `Description with ${searchTerm} included`,
                            status: 'active' as ProductStatus,
                            deletedAt: null,
                        })),
                        productCount
                    );

                    mockRepository.setProducts(productsWithTermInDescription);

                    const filters: PublicProductFilters = { search: searchTerm };
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // All products should be returned (all have term in description)
                    expect(result.data.length).toBe(productCount);

                    // Verify each product has the term in description
                    for (const product of result.data) {
                        expect(product.description?.toLowerCase()).toContain(searchTerm.toLowerCase());
                    }
                }
            ),
            {
                numRuns: 100,
                verbose: true,
            }
        );
    });

    it('should handle products with null description', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 3, maxLength: 20 }),
                fc.nat({ min: 5, max: 30 }),
                async (searchTerm, productCount) => {
                    // Create products with null descriptions
                    const productsWithNullDescription = await fc.sample(
                        productEntityArbitrary.map(p => ({
                            ...p,
                            name: Math.random() > 0.5 ? `Product ${searchTerm}` : 'No match',
                            description: null,
                            status: 'active' as ProductStatus,
                            deletedAt: null,
                        })),
                        productCount
                    );

                    mockRepository.setProducts(productsWithNullDescription);

                    const filters: PublicProductFilters = { search: searchTerm };
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Only products with term in name should be returned
                    for (const product of result.data) {
                        expect(product.name.toLowerCase()).toContain(searchTerm.toLowerCase());
                        expect(product.description).toBeNull();
                    }
                }
            ),
            {
                numRuns: 100,
                verbose: true,
            }
        );
    });

    it('should return empty array when no products match search term', () => {
        fc.assert(
            fc.property(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 50 }),
                async (products) => {
                    // Use a search term that is unlikely to match
                    const impossibleSearchTerm = 'xyzabc123impossible456search789term';

                    // Ensure no products contain this term
                    const cleanedProducts = products.map(p => ({
                        ...p,
                        name: 'Product Name',
                        description: 'Product Description',
                        status: 'active' as ProductStatus,
                        deletedAt: null,
                    }));

                    mockRepository.setProducts(cleanedProducts);

                    const filters: PublicProductFilters = { search: impossibleSearchTerm };
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Should return empty array
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

    it('should combine search with other filters correctly', () => {
        fc.assert(
            fc.property(
                fc.array(productEntityArbitrary, { minLength: 10, maxLength: 100 }),
                fc.string({ minLength: 3, maxLength: 20 }),
                fc.constantFrom('Electronics', 'Clothing', 'Books'),
                fc.double({ min: 10, max: 500, noNaN: true }),
                fc.double({ min: 500, max: 5000, noNaN: true }),
                async (products, searchTerm, category, minPrice, maxPrice) => {
                    // Ensure some products match all criteria
                    const enhancedProducts = products.map((p, i) => ({
                        ...p,
                        name: i % 2 === 0 ? `${searchTerm} Product` : p.name,
                        category: i % 3 === 0 ? category : p.category,
                        price: i % 4 === 0 ? (minPrice + maxPrice) / 2 : p.price,
                        status: 'active' as ProductStatus,
                        deletedAt: null,
                    }));

                    mockRepository.setProducts(enhancedProducts);

                    const filters: PublicProductFilters = {
                        search: searchTerm,
                        category,
                        minPrice,
                        maxPrice,
                    };
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Verify ALL filters are applied
                    for (const product of result.data) {
                        // Must match search term
                        expect(productMatchesSearch(product, searchTerm)).toBe(true);
                        // Must match category
                        expect(product.category).toBe(category);
                        // Must be within price range
                        expect(product.price).toBeGreaterThanOrEqual(minPrice);
                        expect(product.price).toBeLessThanOrEqual(maxPrice);
                        // Must be active and not deleted
                        expect(product.status).toBe('active');
                        expect(product.deletedAt).toBeNull();
                    }
                }
            ),
            {
                numRuns: 100,
                verbose: true,
            }
        );
    });

    it('should handle partial word matches', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('phone', 'laptop', 'shirt', 'book'),
                fc.nat({ min: 5, max: 20 }),
                async (baseWord, productCount) => {
                    // Create products with partial matches
                    const productsWithPartialMatches = await fc.sample(
                        productEntityArbitrary.map(p => ({
                            ...p,
                            name: `Smart${baseWord}s and accessories`,
                            description: `Best ${baseWord} in the market`,
                            status: 'active' as ProductStatus,
                            deletedAt: null,
                        })),
                        productCount
                    );

                    mockRepository.setProducts(productsWithPartialMatches);

                    // Search for partial word
                    const filters: PublicProductFilters = { search: baseWord };
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // All products should be returned (all contain the base word)
                    expect(result.data.length).toBe(productCount);

                    // Verify each product contains the search term
                    for (const product of result.data) {
                        expect(productMatchesSearch(product, baseWord)).toBe(true);
                    }
                }
            ),
            {
                numRuns: 100,
                verbose: true,
            }
        );
    });

    it('should handle single character search terms', () => {
        fc.assert(
            fc.property(
                fc.array(productEntityArbitrary, { minLength: 10, maxLength: 50 }),
                fc.constantFrom('a', 'e', 'i', 'o', 'u'),
                async (products, singleChar) => {
                    // Set up products with active status
                    const activeProducts = products.map(p => ({
                        ...p,
                        status: 'active' as ProductStatus,
                        deletedAt: null,
                    }));

                    mockRepository.setProducts(activeProducts);

                    const filters: PublicProductFilters = { search: singleChar };
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Verify all returned products contain the character
                    for (const product of result.data) {
                        expect(productMatchesSearch(product, singleChar)).toBe(true);
                    }
                }
            ),
            {
                numRuns: 100,
                verbose: true,
            }
        );
    });

    it('should maintain search relevance across pagination', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 3, maxLength: 20 }),
                fc.nat({ min: 30, max: 100 }),
                fc.nat({ min: 5, max: 20 }),
                async (searchTerm, productCount, pageSize) => {
                    // Create products that all match the search term
                    const matchingProducts = await fc.sample(
                        productEntityArbitrary.map(p => ({
                            ...p,
                            name: `Product ${searchTerm} ${p.name}`,
                            status: 'active' as ProductStatus,
                            deletedAt: null,
                        })),
                        productCount
                    );

                    mockRepository.setProducts(matchingProducts);

                    // Test multiple pages
                    const totalPages = Math.ceil(productCount / pageSize);
                    for (let page = 1; page <= Math.min(totalPages, 5); page++) {
                        const filters: PublicProductFilters = { search: searchTerm };
                        const pagination: Pagination = { page, pageSize };
                        const result = await productService.listActiveProducts(filters, pagination);

                        // Verify all products on all pages match the search term
                        for (const product of result.data) {
                            expect(productMatchesSearch(product, searchTerm)).toBe(true);
                        }
                    }
                }
            ),
            {
                numRuns: 50, // Reduced due to nested loop
                verbose: true,
            }
        );
    });

    it('should handle empty search term gracefully', () => {
        fc.assert(
            fc.property(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 50 }),
                async (products) => {
                    // Set up products with active status
                    const activeProducts = products.map(p => ({
                        ...p,
                        status: 'active' as ProductStatus,
                        deletedAt: null,
                    }));

                    mockRepository.setProducts(activeProducts);

                    // Empty search should return all active products
                    const filters: PublicProductFilters = { search: '' };
                    const pagination: Pagination = { page: 1, pageSize: 100 };
                    const result = await productService.listActiveProducts(filters, pagination);

                    // Should return all active products (empty string matches everything)
                    const expectedCount = activeProducts.length;
                    expect(result.data.length).toBe(expectedCount);
                }
            ),
            {
                numRuns: 100,
                verbose: true,
            }
        );
    });
});
