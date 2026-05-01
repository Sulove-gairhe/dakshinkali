/**
 * PublicProductController Unit Tests
 * 
 * Tests controller layer logic:
 * - Request validation
 * - Service method orchestration
 * - Entity → DTO transformation
 * - HTTP status code mapping
 * - Error handling
 * - Active product filtering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublicProductController } from './public-product.controller';
import { ProductService } from '../services/product.service';
import { ProductEntity } from '../entities/product.entity';
import { PublicListQuery } from '../dto/public-list-query.request';
import { ValidationException } from '../../../common/exceptions/validation.exception';
import { ProductNotFoundException } from '../exceptions/product-not-found.exception';

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

describe('PublicProductController', () => {
    let controller: PublicProductController;
    let mockService: MockProductService;

    beforeEach(() => {
        mockService = new MockProductService();
        controller = new PublicProductController(mockService);
    });

    describe('listProducts', () => {
        it('should list active products with default pagination and sorting', async () => {
            // Arrange
            const query: PublicListQuery = {};

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

            mockService.listActiveProducts.mockResolvedValue({
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
            expect(mockService.listActiveProducts).toHaveBeenCalledWith(
                expect.objectContaining({
                    sortBy: 'createdAt',
                    sortOrder: 'desc',
                }),
                { page: 1, pageSize: 20 }
            );
        });

        it('should apply custom pagination parameters', async () => {
            // Arrange
            const query: PublicListQuery = {
                page: 2,
                pageSize: 50,
            };

            mockService.listActiveProducts.mockResolvedValue({
                data: [],
                total: 0,
                page: 2,
                pageSize: 50,
                totalPages: 0,
            });

            // Act
            await controller.listProducts(query);

            // Assert
            expect(mockService.listActiveProducts).toHaveBeenCalledWith(
                expect.anything(),
                { page: 2, pageSize: 50 }
            );
        });

        it('should cap pageSize at 100', async () => {
            // Arrange
            const query: PublicListQuery = {
                pageSize: 500,
            };

            mockService.listActiveProducts.mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                pageSize: 100,
                totalPages: 0,
            });

            // Act
            await controller.listProducts(query);

            // Assert
            expect(mockService.listActiveProducts).toHaveBeenCalledWith(
                expect.anything(),
                { page: 1, pageSize: 100 }
            );
        });

        it('should apply category filter', async () => {
            // Arrange
            const query: PublicListQuery = {
                category: 'Electronics',
            };

            mockService.listActiveProducts.mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                pageSize: 20,
                totalPages: 0,
            });

            // Act
            await controller.listProducts(query);

            // Assert
            expect(mockService.listActiveProducts).toHaveBeenCalledWith(
                expect.objectContaining({
                    category: 'Electronics',
                }),
                expect.anything()
            );
        });

        it('should apply price range filters', async () => {
            // Arrange
            const query: PublicListQuery = {
                minPrice: 100,
                maxPrice: 1000,
            };

            mockService.listActiveProducts.mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                pageSize: 20,
                totalPages: 0,
            });

            // Act
            await controller.listProducts(query);

            // Assert
            expect(mockService.listActiveProducts).toHaveBeenCalledWith(
                expect.objectContaining({
                    minPrice: 100,
                    maxPrice: 1000,
                }),
                expect.anything()
            );
        });

        it('should apply search filter', async () => {
            // Arrange
            const query: PublicListQuery = {
                search: 'iPhone',
            };

            mockService.listActiveProducts.mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                pageSize: 20,
                totalPages: 0,
            });

            // Act
            await controller.listProducts(query);

            // Assert
            expect(mockService.listActiveProducts).toHaveBeenCalledWith(
                expect.objectContaining({
                    search: 'iPhone',
                }),
                expect.anything()
            );
        });

        it('should apply custom sorting', async () => {
            // Arrange
            const query: PublicListQuery = {
                sortBy: 'price',
                sortOrder: 'asc',
            };

            mockService.listActiveProducts.mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                pageSize: 20,
                totalPages: 0,
            });

            // Act
            await controller.listProducts(query);

            // Assert
            expect(mockService.listActiveProducts).toHaveBeenCalledWith(
                expect.objectContaining({
                    sortBy: 'price',
                    sortOrder: 'asc',
                }),
                expect.anything()
            );
        });

        it('should throw ValidationException for negative minPrice', async () => {
            // Arrange
            const query: PublicListQuery = {
                minPrice: -10,
            };

            // Act & Assert
            await expect(controller.listProducts(query)).rejects.toThrow(ValidationException);
        });

        it('should throw ValidationException for negative maxPrice', async () => {
            // Arrange
            const query: PublicListQuery = {
                maxPrice: -10,
            };

            // Act & Assert
            await expect(controller.listProducts(query)).rejects.toThrow(ValidationException);
        });

        it('should throw ValidationException when minPrice > maxPrice', async () => {
            // Arrange
            const query: PublicListQuery = {
                minPrice: 1000,
                maxPrice: 100,
            };

            // Act & Assert
            await expect(controller.listProducts(query)).rejects.toThrow(ValidationException);
        });

        it('should throw ValidationException for invalid sortBy', async () => {
            // Arrange
            const query: PublicListQuery = {
                sortBy: 'invalid' as any,
            };

            // Act & Assert
            await expect(controller.listProducts(query)).rejects.toThrow(ValidationException);
        });

        it('should throw ValidationException for invalid sortOrder', async () => {
            // Arrange
            const query: PublicListQuery = {
                sortOrder: 'invalid' as any,
            };

            // Act & Assert
            await expect(controller.listProducts(query)).rejects.toThrow(ValidationException);
        });

        it('should return empty array when no products match filters', async () => {
            // Arrange
            const query: PublicListQuery = {
                category: 'NonExistent',
            };

            mockService.listActiveProducts.mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                pageSize: 20,
                totalPages: 0,
            });

            // Act
            const result = await controller.listProducts(query);

            // Assert
            expect(result.status).toBe(200);
            expect(result.data.data).toHaveLength(0);
            expect(result.data.total).toBe(0);
        });

        it('should map multiple entities to DTOs correctly', async () => {
            // Arrange
            const query: PublicListQuery = {};

            const mockEntities: ProductEntity[] = [
                {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    name: 'iPhone 15',
                    description: 'Latest iPhone',
                    price: 999.99,
                    category: 'Electronics',
                    status: 'active',
                    images: [],
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-01'),
                    deletedAt: null,
                },
                {
                    id: '223e4567-e89b-12d3-a456-426614174000',
                    name: 'Samsung Galaxy',
                    description: 'Latest Samsung',
                    price: 899.99,
                    category: 'Electronics',
                    status: 'active',
                    images: [],
                    createdAt: new Date('2024-01-02'),
                    updatedAt: new Date('2024-01-02'),
                    deletedAt: null,
                },
            ];

            mockService.listActiveProducts.mockResolvedValue({
                data: mockEntities,
                total: 2,
                page: 1,
                pageSize: 20,
                totalPages: 1,
            });

            // Act
            const result = await controller.listProducts(query);

            // Assert
            expect(result.status).toBe(200);
            expect(result.data.data).toHaveLength(2);
            expect(result.data.data[0].id).toBe(mockEntities[0].id);
            expect(result.data.data[1].id).toBe(mockEntities[1].id);
        });
    });

    describe('getProductById', () => {
        it('should return active product with 200 status', async () => {
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

            mockService.getActiveProductById.mockResolvedValue(mockEntity);

            // Act
            const result = await controller.getProductById(id);

            // Assert
            expect(result.status).toBe(200);
            expect(result.data.id).toBe(id);
            expect(result.data.name).toBe('iPhone 15');
            expect(mockService.getActiveProductById).toHaveBeenCalledWith(id);
        });

        it('should throw ProductNotFoundException when product not found', async () => {
            // Arrange
            const id = '123e4567-e89b-12d3-a456-426614174000';
            mockService.getActiveProductById.mockResolvedValue(null);

            // Act & Assert
            await expect(controller.getProductById(id)).rejects.toThrow(ProductNotFoundException);
        });

        it('should throw ProductNotFoundException when product is deleted', async () => {
            // Arrange
            const id = '123e4567-e89b-12d3-a456-426614174000';
            // Service returns null for deleted products
            mockService.getActiveProductById.mockResolvedValue(null);

            // Act & Assert
            await expect(controller.getProductById(id)).rejects.toThrow(ProductNotFoundException);
        });

        it('should throw ProductNotFoundException when product is inactive', async () => {
            // Arrange
            const id = '123e4567-e89b-12d3-a456-426614174000';
            // Service returns null for inactive products
            mockService.getActiveProductById.mockResolvedValue(null);

            // Act & Assert
            await expect(controller.getProductById(id)).rejects.toThrow(ProductNotFoundException);
        });

        it('should throw ValidationException for invalid UUID format', async () => {
            // Arrange
            const id = 'invalid-uuid';

            // Act & Assert
            await expect(controller.getProductById(id)).rejects.toThrow(ValidationException);
        });

        it('should throw ValidationException for empty UUID', async () => {
            // Arrange
            const id = '';

            // Act & Assert
            await expect(controller.getProductById(id)).rejects.toThrow(ValidationException);
        });

        it('should map entity to DTO correctly', async () => {
            // Arrange
            const id = '123e4567-e89b-12d3-a456-426614174000';
            const createdAt = new Date('2024-01-01T10:00:00Z');
            const updatedAt = new Date('2024-01-02T10:00:00Z');

            const mockEntity: ProductEntity = {
                id,
                name: 'iPhone 15',
                description: 'Latest iPhone model',
                price: 999.99,
                category: 'Electronics',
                status: 'active',
                images: [
                    {
                        id: 'img-1',
                        url: 'https://example.com/image1.jpg',
                        filename: 'image1.jpg',
                        order: 0,
                    },
                ],
                createdAt,
                updatedAt,
                deletedAt: null,
            };

            mockService.getActiveProductById.mockResolvedValue(mockEntity);

            // Act
            const result = await controller.getProductById(id);

            // Assert
            expect(result.data.id).toBe(id);
            expect(result.data.name).toBe('iPhone 15');
            expect(result.data.price).toBe(999.99);
            expect(result.data.images).toHaveLength(1);
            expect(result.data.images[0].url).toBe('https://example.com/image1.jpg');
            expect(result.data.createdAt).toBe(createdAt.toISOString());
            expect(result.data.updatedAt).toBe(updatedAt.toISOString());
            // Verify deletedAt is not in DTO
            expect('deletedAt' in result.data).toBe(false);
        });
    });
});
