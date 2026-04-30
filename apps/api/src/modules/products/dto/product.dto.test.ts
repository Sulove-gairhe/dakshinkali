/**
 * Unit tests for ProductDTO mapper function
 * 
 * Tests cover:
 * - Valid entity mapping
 * - Date to ISO 8601 conversion
 * - Internal field exclusion (deletedAt)
 * - Image mapping (filename exclusion)
 * - Error handling for invalid entities
 * - Null handling for optional fields
 */

import { describe, it, expect } from 'vitest';
import { mapEntityToDTO, ProductDTO } from './product.dto';
import { ProductEntity } from '../entities/product.entity';

describe('mapEntityToDTO', () => {
    describe('Valid entity mapping', () => {
        it('should map a valid ProductEntity to ProductDTO', () => {
            const entity: ProductEntity = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'iPhone 15',
                description: 'Latest iPhone model',
                price: 999.99,
                category: 'Electronics',
                status: 'active',
                images: [
                    { id: 'img1', url: 'https://storage.example.com/img1.jpg', filename: 'img1.jpg', order: 0 },
                    { id: 'img2', url: 'https://storage.example.com/img2.jpg', filename: 'img2.jpg', order: 1 }
                ],
                createdAt: new Date('2024-01-15T10:30:00.000Z'),
                updatedAt: new Date('2024-01-20T15:45:00.000Z'),
                deletedAt: null
            };

            const dto = mapEntityToDTO(entity);

            expect(dto.id).toBe(entity.id);
            expect(dto.name).toBe(entity.name);
            expect(dto.description).toBe(entity.description);
            expect(dto.price).toBe(entity.price);
            expect(dto.category).toBe(entity.category);
            expect(dto.status).toBe(entity.status);
            expect(dto.images).toHaveLength(2);
            expect(dto.createdAt).toBe('2024-01-15T10:30:00.000Z');
            expect(dto.updatedAt).toBe('2024-01-20T15:45:00.000Z');
        });

        it('should convert Date objects to ISO 8601 strings', () => {
            const entity: ProductEntity = {
                id: '123',
                name: 'Test Product',
                description: null,
                price: 50,
                category: 'Test',
                status: 'active',
                images: [],
                createdAt: new Date('2024-03-15T08:00:00.000Z'),
                updatedAt: new Date('2024-03-16T12:30:45.123Z'),
                deletedAt: null
            };

            const dto = mapEntityToDTO(entity);

            expect(dto.createdAt).toBe('2024-03-15T08:00:00.000Z');
            expect(dto.updatedAt).toBe('2024-03-16T12:30:45.123Z');
            expect(typeof dto.createdAt).toBe('string');
            expect(typeof dto.updatedAt).toBe('string');
        });

        it('should exclude deletedAt field from DTO', () => {
            const entity: ProductEntity = {
                id: '123',
                name: 'Deleted Product',
                description: 'This was deleted',
                price: 100,
                category: 'Test',
                status: 'inactive',
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: new Date('2024-01-01T00:00:00.000Z') // Should be excluded
            };

            const dto = mapEntityToDTO(entity);

            expect(dto).not.toHaveProperty('deletedAt');
            expect((dto as any).deletedAt).toBeUndefined();
        });

        it('should map images array and exclude filename', () => {
            const entity: ProductEntity = {
                id: '123',
                name: 'Product with Images',
                description: null,
                price: 200,
                category: 'Test',
                status: 'active',
                images: [
                    { id: 'img1', url: 'https://example.com/1.jpg', filename: 'secret-filename-1.jpg', order: 0 },
                    { id: 'img2', url: 'https://example.com/2.jpg', filename: 'secret-filename-2.jpg', order: 1 }
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null
            };

            const dto = mapEntityToDTO(entity);

            expect(dto.images).toHaveLength(2);
            expect(dto.images[0]).toEqual({ id: 'img1', url: 'https://example.com/1.jpg', order: 0 });
            expect(dto.images[1]).toEqual({ id: 'img2', url: 'https://example.com/2.jpg', order: 1 });
            expect((dto.images[0] as any).filename).toBeUndefined();
            expect((dto.images[1] as any).filename).toBeUndefined();
        });

        it('should handle empty images array', () => {
            const entity: ProductEntity = {
                id: '123',
                name: 'Product without Images',
                description: null,
                price: 50,
                category: 'Test',
                status: 'active',
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null
            };

            const dto = mapEntityToDTO(entity);

            expect(dto.images).toEqual([]);
            expect(dto.images).toHaveLength(0);
        });
    });

    describe('Null handling for optional fields', () => {
        it('should handle null description correctly', () => {
            const entity: ProductEntity = {
                id: '123',
                name: 'Product without Description',
                description: null,
                price: 75,
                category: 'Test',
                status: 'active',
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null
            };

            const dto = mapEntityToDTO(entity);

            expect(dto.description).toBeNull();
            expect(dto).toHaveProperty('description');
        });

        it('should handle null deletedAt correctly (not included in DTO)', () => {
            const entity: ProductEntity = {
                id: '123',
                name: 'Active Product',
                description: 'Active',
                price: 100,
                category: 'Test',
                status: 'active',
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null
            };

            const dto = mapEntityToDTO(entity);

            expect(dto).not.toHaveProperty('deletedAt');
        });
    });

    describe('Error handling for invalid entities', () => {
        it('should throw error when name is missing', () => {
            const entity = {
                id: '123',
                name: '',
                description: null,
                price: 100,
                category: 'Test',
                status: 'active',
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null
            } as ProductEntity;

            expect(() => mapEntityToDTO(entity)).toThrow('Invalid ProductEntity: name is required and cannot be empty');
        });

        it('should throw error when price is missing', () => {
            const entity = {
                id: '123',
                name: 'Test Product',
                description: null,
                price: undefined,
                category: 'Test',
                status: 'active',
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null
            } as any;

            expect(() => mapEntityToDTO(entity)).toThrow('Invalid ProductEntity: price is required');
        });

        it('should throw error when price is not a positive number', () => {
            const entity = {
                id: '123',
                name: 'Test Product',
                description: null,
                price: -50,
                category: 'Test',
                status: 'active',
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null
            } as ProductEntity;

            expect(() => mapEntityToDTO(entity)).toThrow('Invalid ProductEntity: price must be a positive number');
        });

        it('should throw error when price is zero', () => {
            const entity = {
                id: '123',
                name: 'Test Product',
                description: null,
                price: 0,
                category: 'Test',
                status: 'active',
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null
            } as ProductEntity;

            expect(() => mapEntityToDTO(entity)).toThrow('Invalid ProductEntity: price must be a positive number');
        });

        it('should throw error when status is missing', () => {
            const entity = {
                id: '123',
                name: 'Test Product',
                description: null,
                price: 100,
                category: 'Test',
                status: undefined,
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null
            } as any;

            expect(() => mapEntityToDTO(entity)).toThrow('Invalid ProductEntity: status is required');
        });

        it('should throw error when status is invalid', () => {
            const entity = {
                id: '123',
                name: 'Test Product',
                description: null,
                price: 100,
                category: 'Test',
                status: 'invalid_status',
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null
            } as any;

            expect(() => mapEntityToDTO(entity)).toThrow('Invalid ProductEntity: status must be one of active, inactive, out_of_stock');
        });

        it('should throw error when createdAt is missing', () => {
            const entity = {
                id: '123',
                name: 'Test Product',
                description: null,
                price: 100,
                category: 'Test',
                status: 'active',
                images: [],
                createdAt: undefined,
                updatedAt: new Date(),
                deletedAt: null
            } as any;

            expect(() => mapEntityToDTO(entity)).toThrow('Invalid ProductEntity: createdAt must be a valid Date object');
        });

        it('should throw error when updatedAt is missing', () => {
            const entity = {
                id: '123',
                name: 'Test Product',
                description: null,
                price: 100,
                category: 'Test',
                status: 'active',
                images: [],
                createdAt: new Date(),
                updatedAt: undefined,
                deletedAt: null
            } as any;

            expect(() => mapEntityToDTO(entity)).toThrow('Invalid ProductEntity: updatedAt must be a valid Date object');
        });

        it('should throw error when createdAt is an invalid Date', () => {
            const entity = {
                id: '123',
                name: 'Test Product',
                description: null,
                price: 100,
                category: 'Test',
                status: 'active',
                images: [],
                createdAt: new Date('invalid'),
                updatedAt: new Date(),
                deletedAt: null
            } as ProductEntity;

            expect(() => mapEntityToDTO(entity)).toThrow('Invalid ProductEntity: createdAt is an invalid Date');
        });

        it('should throw error when updatedAt is an invalid Date', () => {
            const entity = {
                id: '123',
                name: 'Test Product',
                description: null,
                price: 100,
                category: 'Test',
                status: 'active',
                images: [],
                createdAt: new Date(),
                updatedAt: new Date('invalid'),
                deletedAt: null
            } as ProductEntity;

            expect(() => mapEntityToDTO(entity)).toThrow('Invalid ProductEntity: updatedAt is an invalid Date');
        });
    });

    describe('All product statuses', () => {
        it('should handle active status', () => {
            const entity: ProductEntity = {
                id: '123',
                name: 'Active Product',
                description: null,
                price: 100,
                category: 'Test',
                status: 'active',
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null
            };

            const dto = mapEntityToDTO(entity);
            expect(dto.status).toBe('active');
        });

        it('should handle inactive status', () => {
            const entity: ProductEntity = {
                id: '123',
                name: 'Inactive Product',
                description: null,
                price: 100,
                category: 'Test',
                status: 'inactive',
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null
            };

            const dto = mapEntityToDTO(entity);
            expect(dto.status).toBe('inactive');
        });

        it('should handle out_of_stock status', () => {
            const entity: ProductEntity = {
                id: '123',
                name: 'Out of Stock Product',
                description: null,
                price: 100,
                category: 'Test',
                status: 'out_of_stock',
                images: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null
            };

            const dto = mapEntityToDTO(entity);
            expect(dto.status).toBe('out_of_stock');
        });
    });
});
