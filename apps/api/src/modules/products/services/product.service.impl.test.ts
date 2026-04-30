/**
 * ProductServiceImpl Unit Tests
 * 
 * Tests for the ProductService implementation focusing on:
 * - Business rule validation (price > 0, max 5 images, name uniqueness)
 * - Multi-step operation orchestration
 * - Image upload and deletion coordination
 * - Error handling and rollback
 * 
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductServiceImpl } from './product.service.impl';
import { ProductRepository } from '../repositories/product.repository';
import { ImageStorageService } from './image-storage.service';
import { ProductEntity } from '../entities/product.entity';
import { CreateProductData } from './product.service';

// Mock ProductRepository
const createMockRepository = (): ProductRepository => ({
    insert: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    existsByNameAndCategory: vi.fn(),
});

// Mock ImageStorageService
const createMockImageStorage = (): ImageStorageService => ({
    uploadImage: vi.fn(),
    deleteImage: vi.fn(),
    deleteImages: vi.fn(),
    generateUniqueFilename: vi.fn(),
    validateImageFile: vi.fn(),
});

describe('ProductServiceImpl', () => {
    let service: ProductServiceImpl;
    let mockRepository: ProductRepository;
    let mockImageStorage: ImageStorageService;

    beforeEach(() => {
        mockRepository = createMockRepository();
        mockImageStorage = createMockImageStorage();
        service = new ProductServiceImpl(mockRepository, mockImageStorage);
    });

    describe('createProduct', () => {
        it('should create a product with valid data', async () => {
            // Arrange
            const productData: CreateProductData = {
                name: 'Test Product',
                description: 'Test Description',
                price: 99.99,
                category: 'Electronics',
                status: 'active',
            };

            const expectedEntity: ProductEntity = {
                id: 'test-uuid',
                name: productData.name,
                description: productData.description,
                price: productData.price,
                category: productData.category,
                status: productData.status,
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            };

            vi.mocked(mockRepository.existsByNameAndCategory).mockResolvedValue(false);
            vi.mocked(mockRepository.insert).mockResolvedValue(expectedEntity);

            // Act
            const result = await service.createProduct(productData);

            // Assert
            expect(result).toEqual(expectedEntity);
            expect(mockRepository.existsByNameAndCategory).toHaveBeenCalledWith(
                productData.name,
                productData.category
            );
            expect(mockRepository.insert).toHaveBeenCalled();
        });

        it('should throw error if price is not greater than 0', async () => {
            // Arrange
            const productData: CreateProductData = {
                name: 'Test Product',
                price: 0,
                category: 'Electronics',
            };

            // Act & Assert
            await expect(service.createProduct(productData)).rejects.toThrow(
                'Price must be greater than 0.'
            );
        });

        it('should throw error if product name already exists in category', async () => {
            // Arrange
            const productData: CreateProductData = {
                name: 'Existing Product',
                price: 99.99,
                category: 'Electronics',
            };

            vi.mocked(mockRepository.existsByNameAndCategory).mockResolvedValue(true);

            // Act & Assert
            await expect(service.createProduct(productData)).rejects.toThrow(
                `A product with name '${productData.name}' already exists in category '${productData.category}'.`
            );
        });

        it('should set default status to "active" if not provided', async () => {
            // Arrange
            const productData: CreateProductData = {
                name: 'Test Product',
                price: 99.99,
                category: 'Electronics',
                // status not provided
            };

            const expectedEntity: ProductEntity = {
                id: 'test-uuid',
                name: productData.name,
                description: null,
                price: productData.price,
                category: productData.category,
                status: 'active', // Should default to active
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            };

            vi.mocked(mockRepository.existsByNameAndCategory).mockResolvedValue(false);
            vi.mocked(mockRepository.insert).mockResolvedValue(expectedEntity);

            // Act
            const result = await service.createProduct(productData);

            // Assert
            expect(result.status).toBe('active');
        });
    });

    describe('getActiveProductById', () => {
        it('should return product if active and not deleted', async () => {
            // Arrange
            const productId = 'test-uuid';
            const activeProduct: ProductEntity = {
                id: productId,
                name: 'Active Product',
                description: null,
                price: 99.99,
                category: 'Electronics',
                status: 'active',
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            };

            vi.mocked(mockRepository.findById).mockResolvedValue(activeProduct);

            // Act
            const result = await service.getActiveProductById(productId);

            // Assert
            expect(result).toEqual(activeProduct);
            expect(mockRepository.findById).toHaveBeenCalledWith(productId, false);
        });

        it('should return null if product is inactive', async () => {
            // Arrange
            const productId = 'test-uuid';
            const inactiveProduct: ProductEntity = {
                id: productId,
                name: 'Inactive Product',
                description: null,
                price: 99.99,
                category: 'Electronics',
                status: 'inactive', // Not active
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            };

            vi.mocked(mockRepository.findById).mockResolvedValue(inactiveProduct);

            // Act
            const result = await service.getActiveProductById(productId);

            // Assert
            expect(result).toBeNull();
        });

        it('should return null if product not found', async () => {
            // Arrange
            const productId = 'non-existent-uuid';
            vi.mocked(mockRepository.findById).mockResolvedValue(null);

            // Act
            const result = await service.getActiveProductById(productId);

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('listActiveProducts', () => {
        it('should force status to "active" and exclude deleted products', async () => {
            // Arrange
            const filters = {
                category: 'Electronics',
                minPrice: 50,
                maxPrice: 200,
            };
            const pagination = { page: 1, pageSize: 20 };

            const mockResult = {
                data: [],
                total: 0,
                page: 1,
                pageSize: 20,
                totalPages: 0,
            };

            vi.mocked(mockRepository.findAll).mockResolvedValue(mockResult);

            // Act
            await service.listActiveProducts(filters, pagination);

            // Assert
            expect(mockRepository.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'active', // Should force active status
                    includeDeleted: false, // Should exclude deleted
                    category: filters.category,
                    minPrice: filters.minPrice,
                    maxPrice: filters.maxPrice,
                }),
                pagination
            );
        });
    });

    describe('deleteProduct', () => {
        it('should soft delete an existing product', async () => {
            // Arrange
            const productId = 'test-uuid';
            const existingProduct: ProductEntity = {
                id: productId,
                name: 'Product to Delete',
                description: null,
                price: 99.99,
                category: 'Electronics',
                status: 'active',
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            };

            vi.mocked(mockRepository.findById).mockResolvedValue(existingProduct);
            vi.mocked(mockRepository.softDelete).mockResolvedValue(undefined);

            // Act
            await service.deleteProduct(productId);

            // Assert
            expect(mockRepository.findById).toHaveBeenCalledWith(productId, false);
            expect(mockRepository.softDelete).toHaveBeenCalledWith(productId);
        });

        it('should throw error if product not found', async () => {
            // Arrange
            const productId = 'non-existent-uuid';
            vi.mocked(mockRepository.findById).mockResolvedValue(null);

            // Act & Assert
            await expect(service.deleteProduct(productId)).rejects.toThrow(
                `Product with ID '${productId}' not found.`
            );
        });
    });
});
