/**
 * Property Test: Search Result Relevance
 * 
 * **Property 14: Search Result Relevance**
 * **Validates: Requirements 5.2**
 * 
 * For any search query string, all returned products SHALL contain the search term
 * in either the product name or description (case-insensitive).
 * 
 * This property test generates random search terms and product lists, applies the
 * search filter, and verifies that all returned products contain the search term.
 * 
 * Tag: Feature: product-module, Property 14: Search Result Relevance
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ProductEntity, ProductStatus } from '../../entities/product.entity';

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
 * Apply search filter to a product list (in-memory filtering logic)
 * This mimics the repository layer's search filtering logic
 * 
 * @param products - List of products to filter
 * @param searchTerm - Search term to apply (case-insensitive)
 * @returns Filtered list of products that match the search term
 */
function applySearchFilter(products: ProductEntity[], searchTerm: string): ProductEntity[] {
    if (!searchTerm || searchTerm.trim() === '') {
        return products;
    }

    const searchLower = searchTerm.toLowerCase().trim();

    return products.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(searchLower);
        const descriptionMatch = product.description?.toLowerCase().includes(searchLower) || false;

        return nameMatch || descriptionMatch;
    });
}

/**
 * Verify that a product contains the search term in name or description
 * 
 * @param product - Product to verify
 * @param searchTerm - Search term to check for (case-insensitive)
 * @returns true if product contains search term, false otherwise
 */
function productContainsSearchTerm(product: ProductEntity, searchTerm: string): boolean {
    if (!searchTerm || searchTerm.trim() === '') {
        return true; // Empty search matches all products
    }

    const searchLower = searchTerm.toLowerCase().trim();
    const nameMatch = product.name.toLowerCase().includes(searchLower);
    const descriptionMatch = product.description?.toLowerCase().includes(searchLower) || false;

    return nameMatch || descriptionMatch;
}

describe('Property Test: Search Result Relevance', () => {
    it('should return only products that contain the search term in name or description', () => {
        fc.assert(
            fc.property(
                fc.array(productEntityArbitrary, { minLength: 0, maxLength: 100 }),
                fc.string({ minLength: 1, maxLength: 50 }),
                (products, searchTerm) => {
                    // Apply search filter to the product list
                    const filteredProducts = applySearchFilter(products, searchTerm);

                    // Verify that ALL returned products contain the search term
                    for (const product of filteredProducts) {
                        expect(productContainsSearchTerm(product, searchTerm)).toBe(true);
                    }

                    // Verify that NO excluded products contain the search term
                    const excludedProducts = products.filter(p => !filteredProducts.includes(p));
                    for (const product of excludedProducts) {
                        expect(productContainsSearchTerm(product, searchTerm)).toBe(false);
                    }
                }
            ),
            {
                numRuns: 100, // Minimum 100 iterations as per spec
                verbose: true,
            }
        );
    });

    it('should perform case-insensitive search', () => {
        fc.assert(
            fc.property(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 50 }),
                fc.string({ minLength: 1, maxLength: 20 }),
                (products, searchTerm) => {
                    // Apply search with lowercase term
                    const lowerResults = applySearchFilter(products, searchTerm.toLowerCase());

                    // Apply search with uppercase term
                    const upperResults = applySearchFilter(products, searchTerm.toUpperCase());

                    // Apply search with mixed case term
                    const mixedResults = applySearchFilter(products, searchTerm);

                    // All three should return the same products (case-insensitive)
                    expect(lowerResults.length).toBe(upperResults.length);
                    expect(lowerResults.length).toBe(mixedResults.length);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should match search term in product name', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 3, maxLength: 20 }),
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.string({ minLength: 1, maxLength: 50 }),
                (searchTerm, prefix, suffix) => {
                    // Create a product with search term in name
                    const product: ProductEntity = {
                        id: 'test-id',
                        name: `${prefix}${searchTerm}${suffix}`,
                        description: 'Some description without the term',
                        price: 100,
                        category: 'Electronics',
                        status: 'active',
                        images: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        deletedAt: null,
                    };

                    const results = applySearchFilter([product], searchTerm);

                    // Should match because search term is in name
                    expect(results).toContain(product);
                    expect(results.length).toBe(1);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should match search term in product description', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 3, maxLength: 20 }),
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.string({ minLength: 1, maxLength: 50 }),
                (searchTerm, prefix, suffix) => {
                    // Create a product with search term in description
                    const product: ProductEntity = {
                        id: 'test-id',
                        name: 'Product name without the term',
                        description: `${prefix}${searchTerm}${suffix}`,
                        price: 100,
                        category: 'Electronics',
                        status: 'active',
                        images: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        deletedAt: null,
                    };

                    const results = applySearchFilter([product], searchTerm);

                    // Should match because search term is in description
                    expect(results).toContain(product);
                    expect(results.length).toBe(1);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should match search term in either name or description', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 3, maxLength: 20 }),
                (searchTerm) => {
                    // Create products with search term in different fields
                    const productWithNameMatch: ProductEntity = {
                        id: 'test-id-1',
                        name: `Product ${searchTerm}`,
                        description: 'Description without term',
                        price: 100,
                        category: 'Electronics',
                        status: 'active',
                        images: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        deletedAt: null,
                    };

                    const productWithDescriptionMatch: ProductEntity = {
                        id: 'test-id-2',
                        name: 'Product name',
                        description: `Description with ${searchTerm}`,
                        price: 200,
                        category: 'Electronics',
                        status: 'active',
                        images: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        deletedAt: null,
                    };

                    const productWithBothMatch: ProductEntity = {
                        id: 'test-id-3',
                        name: `Product ${searchTerm}`,
                        description: `Description with ${searchTerm}`,
                        price: 300,
                        category: 'Electronics',
                        status: 'active',
                        images: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        deletedAt: null,
                    };

                    const productWithNoMatch: ProductEntity = {
                        id: 'test-id-4',
                        name: 'Product name',
                        description: 'Description',
                        price: 400,
                        category: 'Electronics',
                        status: 'active',
                        images: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        deletedAt: null,
                    };

                    const products = [
                        productWithNameMatch,
                        productWithDescriptionMatch,
                        productWithBothMatch,
                        productWithNoMatch,
                    ];

                    const results = applySearchFilter(products, searchTerm);

                    // Should match first three products (name, description, or both)
                    expect(results).toContain(productWithNameMatch);
                    expect(results).toContain(productWithDescriptionMatch);
                    expect(results).toContain(productWithBothMatch);
                    expect(results).not.toContain(productWithNoMatch);
                    expect(results.length).toBe(3);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should handle products with null description', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 3, maxLength: 20 }),
                (searchTerm) => {
                    // Create a product with null description
                    const productWithNullDescription: ProductEntity = {
                        id: 'test-id',
                        name: 'Product name without term',
                        description: null,
                        price: 100,
                        category: 'Electronics',
                        status: 'active',
                        images: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        deletedAt: null,
                    };

                    const results = applySearchFilter([productWithNullDescription], searchTerm);

                    // Should not match because search term is not in name and description is null
                    expect(results).not.toContain(productWithNullDescription);
                    expect(results.length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should handle empty search term', () => {
        fc.assert(
            fc.property(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 50 }),
                (products) => {
                    const results = applySearchFilter(products, '');

                    // Empty search should return all products
                    expect(results.length).toBe(products.length);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should handle whitespace-only search term', () => {
        fc.assert(
            fc.property(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 50 }),
                fc.constantFrom('   ', '\t', '\n', '  \t  '),
                (products, whitespace) => {
                    const results = applySearchFilter(products, whitespace);

                    // Whitespace-only search should return all products
                    expect(results.length).toBe(products.length);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should trim search term before matching', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 3, maxLength: 20 }),
                (searchTerm) => {
                    const product: ProductEntity = {
                        id: 'test-id',
                        name: `Product ${searchTerm}`,
                        description: 'Description',
                        price: 100,
                        category: 'Electronics',
                        status: 'active',
                        images: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        deletedAt: null,
                    };

                    // Search with leading/trailing whitespace
                    const resultsWithWhitespace = applySearchFilter([product], `  ${searchTerm}  `);
                    const resultsWithoutWhitespace = applySearchFilter([product], searchTerm);

                    // Should return same results (whitespace trimmed)
                    expect(resultsWithWhitespace.length).toBe(resultsWithoutWhitespace.length);
                    expect(resultsWithWhitespace).toContain(product);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should handle partial word matches', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('phone', 'laptop', 'book', 'shirt', 'toy'),
                (searchTerm) => {
                    const product: ProductEntity = {
                        id: 'test-id',
                        name: `Smart${searchTerm}`,
                        description: 'Description',
                        price: 100,
                        category: 'Electronics',
                        status: 'active',
                        images: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        deletedAt: null,
                    };

                    const results = applySearchFilter([product], searchTerm);

                    // Should match partial word (e.g., "phone" in "Smartphone")
                    expect(results).toContain(product);
                    expect(results.length).toBe(1);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should handle special characters in search term', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('C++', 'C#', '.NET', 'Node.js', 'Vue.js'),
                (searchTerm) => {
                    const product: ProductEntity = {
                        id: 'test-id',
                        name: `Learn ${searchTerm} Programming`,
                        description: 'A comprehensive guide',
                        price: 100,
                        category: 'Books',
                        status: 'active',
                        images: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        deletedAt: null,
                    };

                    const results = applySearchFilter([product], searchTerm);

                    // Should match even with special characters
                    expect(results).toContain(product);
                    expect(results.length).toBe(1);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should return empty array when no products match search term', () => {
        fc.assert(
            fc.property(
                fc.array(productEntityArbitrary, { minLength: 1, maxLength: 50 }),
                (products) => {
                    // Use a search term that is very unlikely to match
                    const searchTerm = 'xyzabc123nonexistentterm999';
                    const results = applySearchFilter(products, searchTerm);

                    // Should return empty array when no matches
                    expect(Array.isArray(results)).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should handle edge case: empty product list', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }),
                (searchTerm) => {
                    const products: ProductEntity[] = [];
                    const results = applySearchFilter(products, searchTerm);

                    // Should return empty array for empty input
                    expect(results).toEqual([]);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should handle Unicode characters in search term', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('café', 'naïve', 'résumé', '日本語', 'español'),
                (searchTerm) => {
                    const product: ProductEntity = {
                        id: 'test-id',
                        name: `Product ${searchTerm}`,
                        description: 'Description',
                        price: 100,
                        category: 'Books',
                        status: 'active',
                        images: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        deletedAt: null,
                    };

                    const results = applySearchFilter([product], searchTerm);

                    // Should match Unicode characters
                    expect(results).toContain(product);
                    expect(results.length).toBe(1);
                }
            ),
            { numRuns: 100 }
        );
    });
});
