/**
 * ProductValidator Unit Tests
 * 
 * Tests validation logic for product data including:
 * - Price validation (must be > 0)
 * - Image count validation (max 5)
 * - Product name validation (required, non-empty, max 200 chars)
 * - Complete product data validation (CreateProductData and UpdateProductData)
 */

import { describe, it, expect } from 'vitest';
import { ProductValidator } from './product.validator';
import { ValidationException } from '../../../common/exceptions/validation.exception';
import { CreateProductData, UpdateProductData } from '../services/product.service';

describe('ProductValidator', () => {
    describe('validatePrice', () => {
        it('should pass for valid positive price', () => {
            expect(() => ProductValidator.validatePrice(10.99)).not.toThrow();
            expect(() => ProductValidator.validatePrice(0.01)).not.toThrow();
            expect(() => ProductValidator.validatePrice(1000)).not.toThrow();
        });

        it('should throw ValidationException for zero price', () => {
            expect(() => ProductValidator.validatePrice(0)).toThrow(ValidationException);

            try {
                ProductValidator.validatePrice(0);
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationException);
                expect((error as ValidationException).message).toBe('Price must be greater than 0.');
                expect((error as ValidationException).fields).toEqual([
                    {
                        field: 'price',
                        message: 'Price must be greater than 0.'
                    }
                ]);
            }
        });

        it('should throw ValidationException for negative price', () => {
            expect(() => ProductValidator.validatePrice(-10)).toThrow(ValidationException);

            try {
                ProductValidator.validatePrice(-5.99);
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationException);
                expect((error as ValidationException).message).toBe('Price must be greater than 0.');
                expect((error as ValidationException).fields).toEqual([
                    {
                        field: 'price',
                        message: 'Price must be greater than 0.'
                    }
                ]);
            }
        });
    });

    describe('validateImageCount', () => {
        it('should pass for valid image counts', () => {
            expect(() => ProductValidator.validateImageCount(0)).not.toThrow();
            expect(() => ProductValidator.validateImageCount(1)).not.toThrow();
            expect(() => ProductValidator.validateImageCount(3)).not.toThrow();
            expect(() => ProductValidator.validateImageCount(5)).not.toThrow();
        });

        it('should throw ValidationException for exceeding max images', () => {
            expect(() => ProductValidator.validateImageCount(6)).toThrow(ValidationException);

            try {
                ProductValidator.validateImageCount(6);
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationException);
                expect((error as ValidationException).message).toBe('Maximum 5 images allowed per product. Provided: 6');
                expect((error as ValidationException).fields).toEqual([
                    {
                        field: 'images',
                        message: 'Maximum 5 images allowed per product. Provided: 6'
                    }
                ]);
            }
        });

        it('should throw ValidationException for significantly exceeding max images', () => {
            expect(() => ProductValidator.validateImageCount(10)).toThrow(ValidationException);

            try {
                ProductValidator.validateImageCount(10);
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationException);
                expect((error as ValidationException).message).toBe('Maximum 5 images allowed per product. Provided: 10');
            }
        });
    });

    describe('validateProductName', () => {
        it('should pass for valid product names', () => {
            expect(() => ProductValidator.validateProductName('iPhone 15')).not.toThrow();
            expect(() => ProductValidator.validateProductName('A')).not.toThrow();
            expect(() => ProductValidator.validateProductName('Product with spaces')).not.toThrow();
        });

        it('should throw ValidationException for empty name', () => {
            expect(() => ProductValidator.validateProductName('')).toThrow(ValidationException);

            try {
                ProductValidator.validateProductName('');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationException);
                expect((error as ValidationException).message).toBe('Product name is required and cannot be empty.');
                expect((error as ValidationException).fields).toEqual([
                    {
                        field: 'name',
                        message: 'Product name is required and cannot be empty.'
                    }
                ]);
            }
        });

        it('should throw ValidationException for whitespace-only name', () => {
            expect(() => ProductValidator.validateProductName('   ')).toThrow(ValidationException);

            try {
                ProductValidator.validateProductName('   ');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationException);
                expect((error as ValidationException).message).toBe('Product name is required and cannot be empty.');
            }
        });

        it('should throw ValidationException for name exceeding 200 characters', () => {
            const longName = 'A'.repeat(201);
            expect(() => ProductValidator.validateProductName(longName)).toThrow(ValidationException);

            try {
                ProductValidator.validateProductName(longName);
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationException);
                expect((error as ValidationException).message).toBe('Product name cannot exceed 200 characters.');
                expect((error as ValidationException).fields).toEqual([
                    {
                        field: 'name',
                        message: 'Product name cannot exceed 200 characters.'
                    }
                ]);
            }
        });

        it('should pass for name with exactly 200 characters', () => {
            const maxName = 'A'.repeat(200);
            expect(() => ProductValidator.validateProductName(maxName)).not.toThrow();
        });
    });

    describe('validateProductData', () => {
        describe('CreateProductData validation', () => {
            it('should pass for valid CreateProductData', () => {
                const validData: CreateProductData = {
                    name: 'iPhone 15',
                    description: 'Latest iPhone model',
                    price: 999.99,
                    category: 'Electronics',
                    status: 'active'
                };

                expect(() => ProductValidator.validateProductData(validData)).not.toThrow();
            });

            it('should pass for CreateProductData without optional fields', () => {
                const validData: CreateProductData = {
                    name: 'iPhone 15',
                    price: 999.99,
                    category: 'Electronics'
                };

                expect(() => ProductValidator.validateProductData(validData)).not.toThrow();
            });

            it('should throw ValidationException for missing name', () => {
                const invalidData = {
                    price: 999.99,
                    category: 'Electronics'
                } as CreateProductData;

                expect(() => ProductValidator.validateProductData(invalidData)).toThrow(ValidationException);

                try {
                    ProductValidator.validateProductData(invalidData);
                } catch (error) {
                    expect(error).toBeInstanceOf(ValidationException);
                    expect((error as ValidationException).fields).toContainEqual({
                        field: 'name',
                        message: 'Product name is required.'
                    });
                }
            });

            it('should throw ValidationException for missing price', () => {
                const invalidData = {
                    name: 'iPhone 15',
                    category: 'Electronics'
                } as CreateProductData;

                expect(() => ProductValidator.validateProductData(invalidData)).toThrow(ValidationException);

                try {
                    ProductValidator.validateProductData(invalidData);
                } catch (error) {
                    expect(error).toBeInstanceOf(ValidationException);
                    expect((error as ValidationException).fields).toContainEqual({
                        field: 'price',
                        message: 'Product price is required.'
                    });
                }
            });

            it('should throw ValidationException for missing category', () => {
                const invalidData = {
                    name: 'iPhone 15',
                    price: 999.99
                } as CreateProductData;

                expect(() => ProductValidator.validateProductData(invalidData)).toThrow(ValidationException);

                try {
                    ProductValidator.validateProductData(invalidData);
                } catch (error) {
                    expect(error).toBeInstanceOf(ValidationException);
                    expect((error as ValidationException).fields).toContainEqual({
                        field: 'category',
                        message: 'Product category is required.'
                    });
                }
            });

            it('should throw ValidationException for invalid price', () => {
                const invalidData: CreateProductData = {
                    name: 'iPhone 15',
                    price: -10,
                    category: 'Electronics'
                };

                expect(() => ProductValidator.validateProductData(invalidData)).toThrow(ValidationException);

                try {
                    ProductValidator.validateProductData(invalidData);
                } catch (error) {
                    expect(error).toBeInstanceOf(ValidationException);
                    expect((error as ValidationException).fields).toContainEqual({
                        field: 'price',
                        message: 'Price must be greater than 0.'
                    });
                }
            });

            it('should throw ValidationException for empty name', () => {
                const invalidData: CreateProductData = {
                    name: '',
                    price: 999.99,
                    category: 'Electronics'
                };

                expect(() => ProductValidator.validateProductData(invalidData)).toThrow(ValidationException);

                try {
                    ProductValidator.validateProductData(invalidData);
                } catch (error) {
                    expect(error).toBeInstanceOf(ValidationException);
                    expect((error as ValidationException).fields).toContainEqual({
                        field: 'name',
                        message: 'Product name is required and cannot be empty.'
                    });
                }
            });

            it('should throw ValidationException for description exceeding 2000 characters', () => {
                const longDescription = 'A'.repeat(2001);
                const invalidData: CreateProductData = {
                    name: 'iPhone 15',
                    description: longDescription,
                    price: 999.99,
                    category: 'Electronics'
                };

                expect(() => ProductValidator.validateProductData(invalidData)).toThrow(ValidationException);

                try {
                    ProductValidator.validateProductData(invalidData);
                } catch (error) {
                    expect(error).toBeInstanceOf(ValidationException);
                    expect((error as ValidationException).fields).toContainEqual({
                        field: 'description',
                        message: 'Product description cannot exceed 2000 characters.'
                    });
                }
            });

            it('should throw ValidationException for invalid status', () => {
                const invalidData: CreateProductData = {
                    name: 'iPhone 15',
                    price: 999.99,
                    category: 'Electronics',
                    status: 'invalid_status' as any
                };

                expect(() => ProductValidator.validateProductData(invalidData)).toThrow(ValidationException);

                try {
                    ProductValidator.validateProductData(invalidData);
                } catch (error) {
                    expect(error).toBeInstanceOf(ValidationException);
                    expect((error as ValidationException).fields).toContainEqual({
                        field: 'status',
                        message: 'Product status must be one of: active, inactive, out_of_stock.'
                    });
                }
            });

            it('should throw ValidationException with multiple field errors', () => {
                const invalidData: CreateProductData = {
                    name: '',
                    price: -10,
                    category: 'Electronics'
                };

                expect(() => ProductValidator.validateProductData(invalidData)).toThrow(ValidationException);

                try {
                    ProductValidator.validateProductData(invalidData);
                } catch (error) {
                    expect(error).toBeInstanceOf(ValidationException);
                    const fields = (error as ValidationException).fields || [];
                    expect(fields.length).toBeGreaterThanOrEqual(2);
                    expect(fields.some(f => f.field === 'name')).toBe(true);
                    expect(fields.some(f => f.field === 'price')).toBe(true);
                }
            });
        });

        describe('UpdateProductData validation', () => {
            it('should pass for valid UpdateProductData with all fields', () => {
                const validData: UpdateProductData = {
                    name: 'iPhone 15 Pro',
                    description: 'Updated description',
                    price: 1099.99,
                    category: 'Electronics',
                    status: 'active'
                };

                expect(() => ProductValidator.validateProductData(validData)).not.toThrow();
            });

            it('should pass for UpdateProductData with only name', () => {
                const validData: UpdateProductData = {
                    name: 'iPhone 15 Pro'
                };

                expect(() => ProductValidator.validateProductData(validData)).not.toThrow();
            });

            it('should pass for UpdateProductData with only price', () => {
                const validData: UpdateProductData = {
                    price: 1099.99
                };

                expect(() => ProductValidator.validateProductData(validData)).not.toThrow();
            });

            it('should pass for empty UpdateProductData', () => {
                const validData: UpdateProductData = {};

                expect(() => ProductValidator.validateProductData(validData)).not.toThrow();
            });

            it('should throw ValidationException for invalid price in update', () => {
                const invalidData: UpdateProductData = {
                    price: 0
                };

                expect(() => ProductValidator.validateProductData(invalidData)).toThrow(ValidationException);

                try {
                    ProductValidator.validateProductData(invalidData);
                } catch (error) {
                    expect(error).toBeInstanceOf(ValidationException);
                    expect((error as ValidationException).fields).toContainEqual({
                        field: 'price',
                        message: 'Price must be greater than 0.'
                    });
                }
            });

            it('should throw ValidationException for empty name in update', () => {
                const invalidData: UpdateProductData = {
                    name: '   '
                };

                expect(() => ProductValidator.validateProductData(invalidData)).toThrow(ValidationException);

                try {
                    ProductValidator.validateProductData(invalidData);
                } catch (error) {
                    expect(error).toBeInstanceOf(ValidationException);
                    expect((error as ValidationException).fields).toContainEqual({
                        field: 'name',
                        message: 'Product name is required and cannot be empty.'
                    });
                }
            });

            it('should throw ValidationException for invalid status in update', () => {
                const invalidData: UpdateProductData = {
                    status: 'unknown' as any
                };

                expect(() => ProductValidator.validateProductData(invalidData)).toThrow(ValidationException);

                try {
                    ProductValidator.validateProductData(invalidData);
                } catch (error) {
                    expect(error).toBeInstanceOf(ValidationException);
                    expect((error as ValidationException).fields).toContainEqual({
                        field: 'status',
                        message: 'Product status must be one of: active, inactive, out_of_stock.'
                    });
                }
            });
        });
    });
});
