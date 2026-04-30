/**
 * AdminProductController Unit Tests
 * 
 * Tests controller layer logic:
 * - Request validation
 * - Service method orchestration
 * - Entity → DTO transformation
 * - HTTP status code mapping
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminProductController } from './admin-product.controller';
import { ProductService } from '../services/product.service';
import { ProductEntity } from '../entities/product.entity';
import { CreateProductRequest } from '../dto/create-product.request';
import { UpdateProductRequest } from '../dto/update-product.request';
import { AdminListQuery } from '../dto/admin-list-query.request';
import { ValidationException } from '../../../common/exceptions/validation.exception';
import { ProductNotFoundException } from '../exceptions/product-not-found.exception';
import { DuplicateProductException } from '../exceptions/duplicate-product.exception';

// Mock ProductService
class MockProductService implements ProductService {
    createProduct = vi.fn();
    updateProduct = vi.fn();
    deleteProduct = vi.fn();
    getProductById = vi.fn();
    listProducts = vi.fn();
    getActiveProductById = vi.fn();
    listActiveProducts = vi.fn();
}

describe('AdminProductController', () => {
    let controller: AdminProductController;
    let mockService: MockProductService;

    beforeEach(() => {
        mockService = new MockProductService();
        controller = new AdminProductController(mockService);
    });

    describe('createProduct', () => {
        it('should create product and return 201 with ProductDTO', async () => {
            // Arrange
            const request: CreateProductRequest = {
                name: 'iPhone 15',
                description: 'Latest iPhone model',
                price: 999.99,
                category: 'Electronics',
                status: 'active',
            };

            const mockEntity: ProductEntity = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: request.name,
                description: request.description || null,
                price: request.price,
                category: request.category,
                status: request.status || 'active',
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            };

            mockService.createProduct.mockResolvedValue(mockEntity);

            // Act
            const result = await controller.createProduct(request);

            // Assert
            expect(result.status).toBe(201);
            expect(result.data.id).toBe(mockEntity.id);
            expect(result.data.name).toBe(mockEntity.name);
            expect(result.data.price).toBe(mockEntity.price);
            expect(mockService.createProduct).toHaveBeenCalledWith(
                {
                    name: request.name,
                    description: request.description,
                    price: request.price,
                    category: request.category,
                    status: request.status,
                },
                undefined
            );
        });

        it('should throw ValidationException for missing name', async () => {
            // Arrange
            const request: CreateProductRequest = {
                name: '',
                price: 999.99,
                category: 'Electronics',
            };

            // Act & Assert
            await expect(controller.createProduct(request)).rejects.toThrow(ValidationException);
        });

        it('should throw ValidationException for invalid price', async () => {
            // Arrange
            const request: CreateProductRequest = {
                name: 'iPhone 15',
                price: -10,
                category: 'Electronics',
            };

            // Act & Assert
            await expect(controller.createProduct(request)).rejects.toThrow(ValidationException);
        });

        it('should throw ValidationException for too many images', async () => {
            // Arrange
            const request: CreateProductRequest = {
                name: 'iPhone 15',
                price: 999.99,
                category: 'Electronics',
                images: new Array(6).fill(new File([], 'test.jpg')),
            };

            // Act & Assert
            await expect(controller.createProduct(request)).rejects.toThrow(ValidationException);
        });

        it('should throw DuplicateProductException when product exists', async () => {
            // Arrange
            const request: CreateProductRequest = {
                name: 'iPhone 15',
                price: 999.99,
                category: 'Electronics',
            };

            mockService.createProduct.mockRejectedValue(
                new Error("A product with name 'iPhone 15' already exists in category 'Electronics'.")
            );

            // Act & Assert
            await expect(controller.createProduct(request)).rejects.toThrow(DuplicateProductException);
        });
    });

    describe('listProducts', () => {
        it('should list products with default pagination', async () => {
            // Arrange
            const query: AdminListQuery = {};

            const mockEntity: ProductEntity = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'iPhone 15',
                description: 'Latest iPhone model',
                price: 999.99,
                category: 'Electronics',
                status: 'active',
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            };

            mockService.listProducts.mockResolvedValue({
                data: [mockEntity],
                total: 1,
                page: 1,
                pageSize: 20,
                totalPages: 1,
            });

            // Act
            const result = await controller.listProducts(query);

            // Assert
            expect(result.status).toBe(200);
            expect(result.data.data).toHaveLength(1);
            expect(result.data.page).toBe(1);
            expect(result.data.pageSize).toBe(20);
            expect(mockService.listProducts).toHaveBeenCalledWith(
                expect.objectContaining({ includeDeleted: false }),
                { page: 1, pageSize: 20 }
            );
        });

        it('should cap pageSize at 100', async () => {
            // Arrange
            const query: AdminListQuery = {
                pageSize: 500,
            };

            mockService.listProducts.mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                pageSize: 100,
                totalPages: 0,
            });

            // Act
            await controller.listProducts(query);

            // Assert
            expect(mockService.listProducts).toHaveBeenCalledWith(
                expect.anything(),
                { page: 1, pageSize: 100 }
            );
        });

        it('should throw ValidationException for invalid price range', async () => {
            // Arrange
            const query: AdminListQuery = {
                minPrice: 100,
                maxPrice: 50,
            };

            // Act & Assert
            await expect(controller.listProducts(query)).rejects.toThrow(ValidationException);
        });
    });

    describe('getProductById', () => {
        it('should return product with 200 status', async () => {
            // Arrange
            const id = '123e4567-e89b-12d3-a456-426614174000';

            const mockEntity: ProductEntity = {
                id,
                name: 'iPhone 15',
                description: 'Latest iPhone model',
                price: 999.99,
                category: 'Electronics',
                status: 'active',
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            };

            mockService.getProductById.mockResolvedValue(mockEntity);

            // Act
            const result = await controller.getProductById(id);

            // Assert
            expect(result.status).toBe(200);
            expect(result.data.id).toBe(id);
            expect(mockService.getProductById).toHaveBeenCalledWith(id, false);
        });

        it('should throw ProductNotFoundException when product not found', async () => {
            // Arrange
            const id = '123e4567-e89b-12d3-a456-426614174000';
            mockService.getProductById.mockResolvedValue(null);

            // Act & Assert
            await expect(controller.getProductById(id)).rejects.toThrow(ProductNotFoundException);
        });

        it('should throw ValidationException for invalid UUID', async () => {
            // Arrange
            const id = 'invalid-uuid';

            // Act & Assert
            await expect(controller.getProductById(id)).rejects.toThrow(ValidationException);
        });
    });

    describe('updateProduct', () => {
        it('should update product and return 200 with ProductDTO', async () => {
            // Arrange
            const id = '123e4567-e89b-12d3-a456-426614174000';
            const request: UpdateProductRequest = {
                name: 'iPhone 15 Pro',
                price: 1099.99,
            };

            const mockEntity: ProductEntity = {
                id,
                name: request.name!,
                description: 'Latest iPhone model',
                price: request.price!,
                category: 'Electronics',
                status: 'active',
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            };

            mockService.updateProduct.mockResolvedValue(mockEntity);

            // Act
            const result = await controller.updateProduct(id, request);

            // Assert
            expect(result.status).toBe(200);
            expect(result.data.name).toBe(request.name);
            expect(result.data.price).toBe(request.price);
            expect(mockService.updateProduct).toHaveBeenCalledWith(
                id,
                {
                    name: request.name,
                    description: undefined,
                    price: request.price,
                    category: undefined,
                    status: undefined,
                },
                undefined,
                undefined
            );
        });

        it('should throw ProductNotFoundException when product not found', async () => {
            // Arrange
            const id = '123e4567-e89b-12d3-a456-426614174000';
            const request: UpdateProductRequest = {
                name: 'iPhone 15 Pro',
            };

            mockService.updateProduct.mockRejectedValue(
                new Error(`Product with ID '${id}' not found.`)
            );

            // Act & Assert
            await expect(controller.updateProduct(id, request)).rejects.toThrow(ProductNotFoundException);
        });

        it('should throw ValidationException for invalid price', async () => {
            // Arrange
            const id = '123e4567-e89b-12d3-a456-426614174000';
            const request: UpdateProductRequest = {
                price: -10,
            };

            // Act & Assert
            await expect(controller.updateProduct(id, request)).rejects.toThrow(ValidationException);
        });
    });

    describe('deleteProduct', () => {
        it('should delete product and return 204 status', async () => {
            // Arrange
            const id = '123e4567-e89b-12d3-a456-426614174000';
            mockService.deleteProduct.mockResolvedValue(undefined);

            // Act
            const result = await controller.deleteProduct(id);

            // Assert
            expect(result.status).toBe(204);
            expect(mockService.deleteProduct).toHaveBeenCalledWith(id);
        });

        it('should throw ProductNotFoundException when product not found', async () => {
            // Arrange
            const id = '123e4567-e89b-12d3-a456-426614174000';
            mockService.deleteProduct.mockRejectedValue(
                new Error(`Product with ID '${id}' not found.`)
            );

            // Act & Assert
            await expect(controller.deleteProduct(id)).rejects.toThrow(ProductNotFoundException);
        });

        it('should throw ValidationException for invalid UUID', async () => {
            // Arrange
            const id = 'invalid-uuid';

            // Act & Assert
            await expect(controller.deleteProduct(id)).rejects.toThrow(ValidationException);
        });
    });
});
