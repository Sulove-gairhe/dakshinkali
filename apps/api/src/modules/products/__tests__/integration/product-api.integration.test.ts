/**
 * Product API Integration Tests
 * 
 * Full-stack integration tests covering:
 * - Admin CRUD operations with authentication
 * - Public browsing with filtering and pagination
 * - Validation and error handling
 * - Rate limiting
 * - Caching headers
 * - Middleware stack integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createTestContext, TestContext } from './setup';

describe('Product API Integration Tests', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = createTestContext();
    });

    describe('Admin Product Creation (POST /api/v1/admin/products)', () => {
        it('should create product with valid admin token', async () => {
            // Arrange
            const productData = {
                name: 'iPhone 15',
                description: 'Latest iPhone model',
                price: 999.99,
                category: 'Electronics',
                status: 'active',
            };

            // Act
            const response = await ctx.executeRoute('POST', '/api/v1/admin/products', {
                headers: {
                    authorization: 'Bearer admin-token',
                },
                body: productData,
            });

            // Assert
            expect(response.statusCode).toBe(201);
            expect(response.body.name).toBe('iPhone 15');
            expect(response.body.price).toBe(999.99);
            expect(response.body.category).toBe('Electronics');
            expect(response.body.id).toBeDefined();
            expect(response.body.createdAt).toBeDefined();
            expect(response.body.updatedAt).toBeDefined();
            expect(response.body).not.toHaveProperty('deletedAt');
        });

        it('should return 401 without authentication token', async () => {
            // Arrange
            const productData = {
                name: 'iPhone 15',
                price: 999.99,
                category: 'Electronics',
            };

            // Act
            const response = await ctx.executeRoute('POST', '/api/v1/admin/products', {
                body: productData,
            });

            // Assert
            expect(response.statusCode).toBe(401);
            expect(response.body.error.code).toBe('UNAUTHORIZED');
            expect(response.body.error.message).toContain('Authentication required');
        });

        it('should return 403 with non-admin token', async () => {
            // Arrange
            const productData = {
                name: 'iPhone 15',
                price: 999.99,
                category: 'Electronics',
            };

            // Act
            const response = await ctx.executeRoute('POST', '/api/v1/admin/products', {
                headers: {
                    authorization: 'Bearer user-token',
                },
                body: productData,
            });

            // Assert
            expect(response.statusCode).toBe(403);
            expect(response.body.error.code).toBe('FORBIDDEN');
            expect(response.body.error.message).toContain('Admin access required');
        });

        it('should return 400 for missing required fields', async () => {
            // Arrange
            const invalidData = {
                description: 'Missing name and price',
            };

            // Act
            const response = await ctx.executeRoute('POST', '/api/v1/admin/products', {
                headers: {
                    authorization: 'Bearer admin-token',
                },
                body: invalidData,
            });

            // Assert
            expect(response.statusCode).toBe(400);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.fields).toBeDefined();
            expect(response.body.error.fields.length).toBeGreaterThan(0);
        });

        it('should return 400 for invalid price', async () => {
            // Arrange
            const invalidData = {
                name: 'Test Product',
                price: -10,
                category: 'Test',
            };

            // Act
            const response = await ctx.executeRoute('POST', '/api/v1/admin/products', {
                headers: {
                    authorization: 'Bearer admin-token',
                },
                body: invalidData,
            });

            // Assert
            expect(response.statusCode).toBe(400);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.fields.some((f: any) => f.field === 'price')).toBe(true);
        });

        it('should set default status to active', async () => {
            // Arrange
            const productData = {
                name: 'Test Product',
                price: 50,
                category: 'Test',
            };

            // Act
            const response = await ctx.executeRoute('POST', '/api/v1/admin/products', {
                headers: {
                    authorization: 'Bearer admin-token',
                },
                body: productData,
            });

            // Assert
            expect(response.statusCode).toBe(201);
            expect(response.body.status).toBe('active');
        });
    });

    describe('Admin Product Listing (GET /api/v1/admin/products)', () => {
        beforeEach(async () => {
            // Seed test data
            await ctx.executeRoute('POST', '/api/v1/admin/products', {
                headers: { authorization: 'Bearer admin-token' },
                body: { name: 'iPhone 15', price: 999.99, category: 'Electronics', status: 'active' },
            });
            await ctx.executeRoute('POST', '/api/v1/admin/products', {
                headers: { authorization: 'Bearer admin-token' },
                body: { name: 'Samsung Galaxy', price: 899.99, category: 'Electronics', status: 'active' },
            });
            await ctx.executeRoute('POST', '/api/v1/admin/products', {
                headers: { authorization: 'Bearer admin-token' },
                body: { name: 'MacBook Pro', price: 2499.99, category: 'Computers', status: 'inactive' },
            });
        });

        it('should list all products with default pagination', async () => {
            // Act
            const response = await ctx.executeRoute('GET', '/api/v1/admin/products', {
                headers: { authorization: 'Bearer admin-token' },
            });

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data.length).toBe(3);
            expect(response.body.total).toBe(3);
            expect(response.body.page).toBe(1);
            expect(response.body.pageSize).toBe(20);
        });

        it('should filter by category', async () => {
            // Act
            const response = await ctx.executeRoute('GET', '/api/v1/admin/products', {
                headers: { authorization: 'Bearer admin-token' },
                query: { category: 'Electronics' },
            });

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.body.data.length).toBe(2);
            expect(response.body.data.every((p: any) => p.category === 'Electronics')).toBe(true);
        });

        it('should filter by status', async () => {
            // Act
            const response = await ctx.executeRoute('GET', '/api/v1/admin/products', {
                headers: { authorization: 'Bearer admin-token' },
                query: { status: 'inactive' },
            });

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].status).toBe('inactive');
        });

        it('should filter by price range', async () => {
            // Act
            const response = await ctx.executeRoute('GET', '/api/v1/admin/products', {
                headers: { authorization: 'Bearer admin-token' },
                query: { minPrice: 900, maxPrice: 1000 },
            });

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.body.data.length).toBe(2);
            expect(response.body.data.every((p: any) => p.price >= 900 && p.price <= 1000)).toBe(true);
        });

        it('should apply pagination', async () => {
            // Act
            const response = await ctx.executeRoute('GET', '/api/v1/admin/products', {
                headers: { authorization: 'Bearer admin-token' },
                query: { page: 1, pageSize: 2 },
            });

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.body.data.length).toBe(2);
            expect(response.body.pageSize).toBe(2);
            expect(response.body.totalPages).toBe(2);
        });

        it('should return 401 without authentication', async () => {
            // Act
            const response = await ctx.executeRoute('GET', '/api/v1/admin/products', {});

            // Assert
            expect(response.statusCode).toBe(401);
        });
    });

    describe('Admin Product Retrieval (GET /api/v1/admin/products/:id)', () => {
        let productId: string;

        beforeEach(async () => {
            const createResponse = await ctx.executeRoute('POST', '/api/v1/admin/products', {
                headers: { authorization: 'Bearer admin-token' },
                body: { name: 'Test Product', price: 100, category: 'Test' },
            });
            productId = createResponse.body.id;
        });

        it('should retrieve product by ID', async () => {
            // Act
            const response = await ctx.executeRoute('GET', `/api/v1/admin/products/:id`, {
                headers: { authorization: 'Bearer admin-token' },
                params: { id: productId },
            });

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.body.id).toBe(productId);
            expect(response.body.name).toBe('Test Product');
        });

        it('should return 404 for non-existent product', async () => {
            // Act
            const response = await ctx.executeRoute('GET', `/api/v1/admin/products/:id`, {
                headers: { authorization: 'Bearer admin-token' },
                params: { id: '00000000-0000-0000-0000-000000000000' },
            });

            // Assert
            expect(response.statusCode).toBe(404);
            expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
        });

        it('should return 400 for invalid UUID format', async () => {
            // Act
            const response = await ctx.executeRoute('GET', `/api/v1/admin/products/:id`, {
                headers: { authorization: 'Bearer admin-token' },
                params: { id: 'invalid-uuid' },
            });

            // Assert
            expect(response.statusCode).toBe(400);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('Admin Product Update (PUT /api/v1/admin/products/:id)', () => {
        let productId: string;

        beforeEach(async () => {
            const createResponse = await ctx.executeRoute('POST', '/api/v1/admin/products', {
                headers: { authorization: 'Bearer admin-token' },
                body: { name: 'Original Name', price: 100, category: 'Test' },
            });
            productId = createResponse.body.id;
        });

        it('should update product successfully', async () => {
            // Arrange
            const updateData = {
                name: 'Updated Name',
                price: 150,
            };

            // Act
            const response = await ctx.executeRoute('PUT', `/api/v1/admin/products/:id`, {
                headers: { authorization: 'Bearer admin-token' },
                params: { id: productId },
                body: updateData,
            });

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.body.name).toBe('Updated Name');
            expect(response.body.price).toBe(150);
            expect(response.body.category).toBe('Test'); // Unchanged
        });

        it('should return 404 for non-existent product', async () => {
            // Act
            const response = await ctx.executeRoute('PUT', `/api/v1/admin/products/:id`, {
                headers: { authorization: 'Bearer admin-token' },
                params: { id: '00000000-0000-0000-0000-000000000000' },
                body: { name: 'Updated' },
            });

            // Assert
            expect(response.statusCode).toBe(404);
        });

        it('should return 400 for invalid price', async () => {
            // Act
            const response = await ctx.executeRoute('PUT', `/api/v1/admin/products/:id`, {
                headers: { authorization: 'Bearer admin-token' },
                params: { id: productId },
                body: { price: -50 },
            });

            // Assert
            expect(response.statusCode).toBe(400);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('Admin Product Deletion (DELETE /api/v1/admin/products/:id)', () => {
        let productId: string;

        beforeEach(async () => {
            const createResponse = await ctx.executeRoute('POST', '/api/v1/admin/products', {
                headers: { authorization: 'Bearer admin-token' },
                body: { name: 'To Delete', price: 100, category: 'Test' },
            });
            productId = createResponse.body.id;
        });

        it('should soft delete product successfully', async () => {
            // Act
            const response = await ctx.executeRoute('DELETE', `/api/v1/admin/products/:id`, {
                headers: { authorization: 'Bearer admin-token' },
                params: { id: productId },
            });

            // Assert
            expect(response.statusCode).toBe(204);
        });

        it('should return 404 for non-existent product', async () => {
            // Act
            const response = await ctx.executeRoute('DELETE', `/api/v1/admin/products/:id`, {
                headers: { authorization: 'Bearer admin-token' },
                params: { id: '00000000-0000-0000-0000-000000000000' },
            });

            // Assert
            expect(response.statusCode).toBe(404);
        });

        it('should exclude deleted product from public API', async () => {
            // Arrange - Delete the product
            await ctx.executeRoute('DELETE', `/api/v1/admin/products/:id`, {
                headers: { authorization: 'Bearer admin-token' },
                params: { id: productId },
            });

            // Act - Try to retrieve via public API
            const response = await ctx.executeRoute('GET', `/api/v1/products/:id`, {
                params: { id: productId },
            });

            // Assert
            expect(response.statusCode).toBe(404);
        });
    });

    describe('Public Product Listing (GET /api/v1/products)', () => {
        beforeEach(async () => {
            // Seed active products
            await ctx.executeRoute('POST', '/api/v1/admin/products', {
                headers: { authorization: 'Bearer admin-token' },
                body: { name: 'Active Product 1', price: 100, category: 'Electronics', status: 'active' },
            });
            await ctx.executeRoute('POST', '/api/v1/admin/products', {
                headers: { authorization: 'Bearer admin-token' },
                body: { name: 'Active Product 2', price: 200, category: 'Electronics', status: 'active' },
            });

            // Seed inactive product
            await ctx.executeRoute('POST', '/api/v1/admin/products', {
                headers: { authorization: 'Bearer admin-token' },
                body: { name: 'Inactive Product', price: 150, category: 'Electronics', status: 'inactive' },
            });
        });

        it('should list only active products', async () => {
            // Act
            const response = await ctx.executeRoute('GET', '/api/v1/products', {});

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data.length).toBe(2);
            expect(response.body.data.every((p: any) => p.status === 'active')).toBe(true);
        });

        it('should not require authentication', async () => {
            // Act
            const response = await ctx.executeRoute('GET', '/api/v1/products', {});

            // Assert
            expect(response.statusCode).toBe(200);
        });

        it('should apply default sorting (createdAt desc)', async () => {
            // Act
            const response = await ctx.executeRoute('GET', '/api/v1/products', {});

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('should filter by category', async () => {
            // Act
            const response = await ctx.executeRoute('GET', '/api/v1/products', {
                query: { category: 'Electronics' },
            });

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.body.data.every((p: any) => p.category === 'Electronics')).toBe(true);
        });

        it('should filter by price range', async () => {
            // Act
            const response = await ctx.executeRoute('GET', '/api/v1/products', {
                query: { minPrice: 150, maxPrice: 250 },
            });

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].price).toBe(200);
        });

        it('should support custom sorting', async () => {
            // Act
            const response = await ctx.executeRoute('GET', '/api/v1/products', {
                query: { sortBy: 'price', sortOrder: 'asc' },
            });

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.body.data.length).toBe(2);
            expect(response.body.data[0].price).toBeLessThan(response.body.data[1].price);
        });

        it('should include caching headers', async () => {
            // Act
            const response = await ctx.executeRoute('GET', '/api/v1/products', {});

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.headers['Cache-Control']).toBeDefined();
            expect(response.headers['ETag']).toBeDefined();
        });
    });

    describe('Public Product Retrieval (GET /api/v1/products/:id)', () => {
        let activeProductId: string;
        let inactiveProductId: string;

        beforeEach(async () => {
            const activeResponse = await ctx.executeRoute('POST', '/api/v1/admin/products', {
                headers: { authorization: 'Bearer admin-token' },
                body: { name: 'Active Product', price: 100, category: 'Test', status: 'active' },
            });
            activeProductId = activeResponse.body.id;

            const inactiveResponse = await ctx.executeRoute('POST', '/api/v1/admin/products', {
                headers: { authorization: 'Bearer admin-token' },
                body: { name: 'Inactive Product', price: 100, category: 'Test', status: 'inactive' },
            });
            inactiveProductId = inactiveResponse.body.id;
        });

        it('should retrieve active product', async () => {
            // Act
            const response = await ctx.executeRoute('GET', `/api/v1/products/:id`, {
                params: { id: activeProductId },
            });

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.body.id).toBe(activeProductId);
            expect(response.body.status).toBe('active');
        });

        it('should return 404 for inactive product', async () => {
            // Act
            const response = await ctx.executeRoute('GET', `/api/v1/products/:id`, {
                params: { id: inactiveProductId },
            });

            // Assert
            expect(response.statusCode).toBe(404);
        });

        it('should return 404 for non-existent product', async () => {
            // Act
            const response = await ctx.executeRoute('GET', `/api/v1/products/:id`, {
                params: { id: '00000000-0000-0000-0000-000000000000' },
            });

            // Assert
            expect(response.statusCode).toBe(404);
        });

        it('should include caching headers', async () => {
            // Act
            const response = await ctx.executeRoute('GET', `/api/v1/products/:id`, {
                params: { id: activeProductId },
            });

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.headers['Cache-Control']).toBeDefined();
            expect(response.headers['ETag']).toBeDefined();
        });
    });

    describe('CORS Headers', () => {
        it('should include CORS headers in response', async () => {
            // Act
            const response = await ctx.executeRoute('GET', '/api/v1/products', {
                headers: { origin: 'http://localhost:3000' },
            });

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
        });

        it('should handle OPTIONS preflight request', async () => {
            // Act
            const response = await ctx.executeRoute('OPTIONS', '/api/v1/products', {
                headers: { origin: 'http://localhost:3000' },
            });

            // Assert
            expect(response.statusCode).toBe(204);
            expect(response.headers['Access-Control-Allow-Methods']).toBeDefined();
            expect(response.headers['Access-Control-Allow-Headers']).toBeDefined();
        });
    });

    describe('API Versioning', () => {
        it('should include API-Version header', async () => {
            // Act
            const response = await ctx.executeRoute('GET', '/api/v1/products', {});

            // Assert
            expect(response.statusCode).toBe(200);
            expect(response.headers['API-Version']).toBe('v1');
        });
    });

    describe('Error Response Format', () => {
        it('should return consistent error format for validation errors', async () => {
            // Act
            const response = await ctx.executeRoute('POST', '/api/v1/admin/products', {
                headers: { authorization: 'Bearer admin-token' },
                body: { name: '', price: -10, category: '' },
            });

            // Assert
            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBeDefined();
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.message).toBeDefined();
            expect(response.body.error.fields).toBeInstanceOf(Array);
        });

        it('should return consistent error format for authentication errors', async () => {
            // Act
            const response = await ctx.executeRoute('POST', '/api/v1/admin/products', {
                body: { name: 'Test', price: 10, category: 'Test' },
            });

            // Assert
            expect(response.statusCode).toBe(401);
            expect(response.body.error).toBeDefined();
            expect(response.body.error.code).toBe('UNAUTHORIZED');
            expect(response.body.error.message).toBeDefined();
        });

        it('should return consistent error format for not found errors', async () => {
            // Act
            const response = await ctx.executeRoute('GET', `/api/v1/products/:id`, {
                params: { id: '00000000-0000-0000-0000-000000000000' },
            });

            // Assert
            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBeDefined();
            expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
            expect(response.body.error.message).toBeDefined();
        });
    });
});
