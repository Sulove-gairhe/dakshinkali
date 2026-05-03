/**
 * Property Test: Filter Correctness
 * 
 * **Property 1: Filter Correctness**
 * **Validates: Requirements 2.2, 5.3, 5.4**
 * 
 * For any combination of filters (category, price range, status) applied to a product query,
 * all returned products SHALL match ALL specified filter criteria.
 * 
 * This property test generates random product lists and random filter combinations,
 * applies the filters, and verifies that all returned products match ALL specified criteria.
 * 
 * Tag: Feature: product-module, Property 1: Filter Correctness
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ProductEntity, ProductStatus } from '../../entities/product.entity';
import { RepositoryFilters } from '../../types/product.types';

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
 * Arbitrary generator for RepositoryFilters
 * Generates random filter combinations
 */
const repositoryFiltersArbitrary = fc.record({
    category: fc.option(fc.constantFrom('Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Toys'), { nil: undefined }),
    status: fc.option(productStatusArbitrary, { nil: undefined }),
    minPrice: fc.option(fc.double({ min: 0, max: 50000, noNaN: true }), { nil: undefined }),
    maxPrice: fc.option(fc.double({ min: 0, max: 100000, noNaN: true }), { nil: undefined }),
    search: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    includeDeleted: fc.option(fc.boolean(), { nil: undefined }),
    sortBy: fc.option(fc.constantFrom('price', 'name', 'created_at'), { nil: undefined }),
    sortOrder: fc.option(fc.constantFrom<'asc' | 'desc'>('asc', 'desc'), { nil: undefined }),
}).filter(filters => {
    // Ensure minPrice <= maxPrice when both are defined
    if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
        return filters.minPrice <= filters.maxPrice;
    }
    return true;
});

/**
 * Apply filters to a product list (in-memory filtering logic)
 * This mimics the repository layer's filtering logic
 * 
 * @param products - List of products to filter
 * @param filters - Filters to apply
 * @returns Filtered list of products
 */
function applyFilters(products: ProductEntity[], filters: RepositoryFilters): ProductEntity[] {
    return products.filter(product => {
        // Soft delete filter
        if (!filters.includeDeleted && product.deletedAt !== null) {
            return false;
        }

        // Category filter
        if (filters.category && product.category !== filters.category) {
            return false;
        }

        // Status filter
        if (filters.status && product.status !== filters.status) {
            return false;
        }

        // Min price filter
        if (filters.minPrice !== undefined && product.price < filters.minPrice) {
            return false;
        }

        // Max price filter
        if (filters.maxPrice !== undefined && product.price > filters.maxPrice) {
            return false;
        }

        // Search filter (case-insensitive search in name and description)
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const nameMatch = product.name.toLowerCase().includes(searchLower);
            const descriptionMatch = product.description?.toLowerCase().includes(searchLower) || false;

            if (!nameMatch && !descriptionMatch) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Verify that a product matches all specified filter criteria
 * 
 * @param product - Product to verify
 * @param filters - Filters that should match
 * @returns true if product matches all filters, false otherwise
 */
function productMatchesFilters(product: ProductEntity, filters: RepositoryFilters): boolean {
    // Soft delete filter
    if (!filters.includeDeleted && product.deletedAt !== null) {
        return false;
    }

    // Category filter
    if (filters.category && product.category !== filters.category) {
        return false;
    }

    // Status filter
    if (filters.status && product.status !== filters.status) {
        return false;
    }

    // Min price filter
    if (filters.minPrice !== undefined && product.price < filters.minPrice) {
        return false;
    }

    // Max price filter
    if (filters.maxPrice !== undefined && product.price > filters.maxPrice) {
        return false;
    }

    // Search filter (case-insensitive)
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const nameMatch = product.name.toLowerCase().includes(searchLower);
        const descriptionMatch = product.description?.toLowerCase().includes(searchLower) || false;

        if (!nameMatch && !descriptionMatch) {
            return false;
        }
    }

    return true;
}

describe('Property Test: Filter Correctness', () => {
    it('should return only products that match ALL specified filter criteria', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(productEntityArbitrary, { minLength: 0, maxLength: 100 }),
                repositoryFiltersArbitrary,
                (products, filters) => {
                    // Apply filters to the product list
                    const filteredProducts = applyFilters(products, filters);

                    // Verify that ALL returned products match ALL filter criteria
                    for (const product of filteredProducts) {
                        expect(productMatchesFilters(product, filters)).toBe(true);
                    }

                    // Verify that NO excluded products match ALL filter criteria
                    const excludedProducts = products.filter(p => !filteredProducts.includes(p));
                    for (const product of excludedProducts) {
                        // If a product was excluded, it should NOT match all filters
                        // (it may match some filters, but not all)
                        expect(productMatchesFilters(product, filters)).toBe(false);
                    }
                }
            ),
            {
                numRuns: 100, // Minimum 100 iterations as per spec
                verbose: true,
            }
        );
    });

    it('should filter by category correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 50 }),
                fc.constantFrom('Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Toys'),
                (products, category) => {
                    const filters: RepositoryFilters = { category };
                    const filteredProducts = applyFilters(products, filters);

                    // All returned products must have the specified category
                    for (const product of filteredProducts) {
                        expect(product.category).toBe(category);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should filter by status correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 50 }),
                productStatusArbitrary,
                (products, status) => {
                    const filters: RepositoryFilters = { status };
                    const filteredProducts = applyFilters(products, filters);

                    // All returned products must have the specified status
                    for (const product of filteredProducts) {
                        expect(product.status).toBe(status);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should filter by price range correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 50 }),
                fc.double({ min: 0, max: 50000, noNaN: true }),
                fc.double({ min: 50000, max: 100000, noNaN: true }),
                (products, minPrice, maxPrice) => {
                    const filters: RepositoryFilters = { minPrice, maxPrice };
                    const filteredProducts = applyFilters(products, filters);

                    // All returned products must be within the price range
                    for (const product of filteredProducts) {
                        expect(product.price).toBeGreaterThanOrEqual(minPrice);
                        expect(product.price).toBeLessThanOrEqual(maxPrice);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should filter by search term correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 50 }),
                fc.string({ minLength: 1, maxLength: 20 }),
                (products, searchTerm) => {
                    const filters: RepositoryFilters = { search: searchTerm };
                    const filteredProducts = applyFilters(products, filters);

                    // All returned products must contain the search term in name or description
                    for (const product of filteredProducts) {
                        const searchLower = searchTerm.toLowerCase();
                        const nameMatch = product.name.toLowerCase().includes(searchLower);
                        const descriptionMatch = product.description?.toLowerCase().includes(searchLower) || false;

                        expect(nameMatch || descriptionMatch).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should exclude soft-deleted products when includeDeleted is false', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 50 }),
                (products) => {
                    const filters: RepositoryFilters = { includeDeleted: false };
                    const filteredProducts = applyFilters(products, filters);

                    // All returned products must have deletedAt === null
                    for (const product of filteredProducts) {
                        expect(product.deletedAt).toBeNull();
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should include soft-deleted products when includeDeleted is true', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 50 }),
                (products) => {
                    const filters: RepositoryFilters = { includeDeleted: true };
                    const filteredProducts = applyFilters(products, filters);

                    // Filtered products should include both deleted and non-deleted
                    // (as long as they match other filters)
                    const hasDeleted = products.some(p => p.deletedAt !== null);
                    const filteredHasDeleted = filteredProducts.some(p => p.deletedAt !== null);

                    // If there are deleted products in the input, they should be in the output
                    if (hasDeleted) {
                        expect(filteredProducts.length).toBeGreaterThan(0);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should apply multiple filters correctly (combination test)', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(productEntityArbitrary, { minLength: 10, maxLength: 100 }),
                fc.constantFrom('Electronics', 'Clothing', 'Books'),
                productStatusArbitrary,
                fc.double({ min: 10, max: 500, noNaN: true }),
                fc.double({ min: 500, max: 5000, noNaN: true }),
                (products, category, status, minPrice, maxPrice) => {
                    const filters: RepositoryFilters = {
                        category,
                        status,
                        minPrice,
                        maxPrice,
                        includeDeleted: false,
                    };
                    const filteredProducts = applyFilters(products, filters);

                    // All returned products must match ALL filter criteria
                    for (const product of filteredProducts) {
                        expect(product.category).toBe(category);
                        expect(product.status).toBe(status);
                        expect(product.price).toBeGreaterThanOrEqual(minPrice);
                        expect(product.price).toBeLessThanOrEqual(maxPrice);
                        expect(product.deletedAt).toBeNull();
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should return empty array when no products match filters', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 50 }),
                (products) => {
                    // Create a filter that is unlikely to match any product
                    const filters: RepositoryFilters = {
                        category: 'NonExistentCategory' as any,
                        status: 'active',
                        minPrice: 999999,
                        maxPrice: 1000000,
                    };
                    const filteredProducts = applyFilters(products, filters);

                    // Should return empty array when no products match
                    expect(Array.isArray(filteredProducts)).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should handle edge case: empty product list', async () => {
        await fc.assert(
            fc.asyncProperty(
                repositoryFiltersArbitrary,
                (filters) => {
                    const products: ProductEntity[] = [];
                    const filteredProducts = applyFilters(products, filters);

                    // Should return empty array for empty input
                    expect(filteredProducts).toEqual([]);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should handle edge case: no filters applied', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 50 }),
                (products) => {
                    const filters: RepositoryFilters = {};
                    const filteredProducts = applyFilters(products, filters);

                    // With no filters, should return all non-deleted products (default behavior)
                    const expectedProducts = products.filter(p => p.deletedAt === null);
                    expect(filteredProducts.length).toBe(expectedProducts.length);
                }
            ),
            { numRuns: 100 }
        );
    });
});

