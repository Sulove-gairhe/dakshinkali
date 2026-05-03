/**
 * CartItemRepositoryImpl Unit Tests
 * 
 * Tests for the CartItemRepository implementation focusing on:
 * - Create cart item
 * - Find cart item by ID, cart ID, cart and product
 * - Update cart item quantity
 * - Delete cart item, delete by cart ID
 * - Uniqueness constraint (cart_id, product_id)
 * - Quantity constraint (1-99)
 * - Error cases (not found, constraint violations)
 * - Row-to-entity mapping correctness
 * - Numeric to number conversion for price
 * - Timestamp to Date conversion
 * 
 * **Validates: Requirements AR-9, AR-12**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CartItemRepositoryImpl } from './cart-item.repository.impl';
import { CartItemEntity } from '../entities/cart-item.entity';

// Mock Supabase client
const createMockSupabaseClient = () => {
    const mockSingle = vi.fn();
    const mockEq = vi.fn();
    const mockSelect = vi.fn();
    const mockInsert = vi.fn();
    const mockUpdate = vi.fn();
    const mockDelete = vi.fn();
    const mockFrom = vi.fn();

    // Set up proper chaining
    mockSelect.mockReturnValue({
        single: mockSingle,
        eq: mockEq
    });

    mockEq.mockReturnValue({
        single: mockSingle,
        select: mockSelect,
        eq: mockEq
    });

    mockInsert.mockReturnValue({
        select: mockSelect
    });

    mockUpdate.mockReturnValue({
        eq: mockEq
    });

    mockDelete.mockReturnValue({
        eq: mockEq
    });

    mockFrom.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        update: mockUpdate,
        delete: mockDelete
    });

    return {
        from: mockFrom,
        mockSelect,
        mockSingle,
        mockInsert,
        mockUpdate,
        mockDelete,
        mockEq,
        mockFrom,
        // Helper to set up mock responses
        __setInsertResponse: (data: any, error: any = null) => {
            mockSingle.mockResolvedValue({ data, error });
        },
        __setSelectResponse: (data: any, error: any = null) => {
            mockSingle.mockResolvedValue({ data, error });
        },
        __setSelectMultipleResponse: (data: any, error: any = null) => {
            mockSelect.mockResolvedValue({ data, error });
        },
        __setUpdateResponse: (data: any, error: any = null) => {
            mockSingle.mockResolvedValue({ data, error });
        },
        __setDeleteResponse: (data: any, error: any = null) => {
            mockSingle.mockResolvedValue({ data, error });
        },
        // Helper to reset mocks between tests
        __reset: () => {
            mockSingle.mockReset();
            mockEq.mockReset();
            mockSelect.mockReset();
            mockInsert.mockReset();
            mockUpdate.mockReset();
            mockDelete.mockReset();
            mockFrom.mockReset();

            // Re-setup chaining after reset
            mockSelect.mockReturnValue({
                single: mockSingle,
                eq: mockEq
            });

            mockEq.mockReturnValue({
                single: mockSingle,
                select: mockSelect,
                eq: mockEq
            });

            mockInsert.mockReturnValue({
                select: mockSelect
            });

            mockUpdate.mockReturnValue({
                eq: mockEq
            });

            mockDelete.mockReturnValue({
                eq: mockEq
            });

            mockFrom.mockReturnValue({
                insert: mockInsert,
                select: mockSelect,
                update: mockUpdate,
                delete: mockDelete
            });
        }
    };
};

describe('CartItemRepositoryImpl', () => {
    describe('create', () => {
        it('should create a cart item successfully', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const cartId = 'cart-123e4567-e89b-12d3-a456-426614174000';
            const productId = 'prod-123e4567-e89b-12d3-a456-426614174000';
            const quantity = 2;
            const price = 99.99;

            // Mock database response (snake_case)
            const mockDbRow = {
                id: 'item-123e4567-e89b-12d3-a456-426614174000',
                cart_id: cartId,
                product_id: productId,
                quantity: quantity,
                price_at_addition: '99.99',
                created_at: '2024-01-15T10:30:00.000Z',
                updated_at: '2024-01-15T10:30:00.000Z'
            };

            mockClient.__setInsertResponse(mockDbRow);

            // Act
            const result = await repository.create(cartId, productId, quantity, price);

            // Assert
            expect(result).toBeDefined();
            expect(result.id).toBe('item-123e4567-e89b-12d3-a456-426614174000');
            expect(result.cartId).toBe(cartId);
            expect(result.productId).toBe(productId);
            expect(result.quantity).toBe(quantity);
            expect(result.priceAtAddition).toBe(99.99);
            expect(typeof result.priceAtAddition).toBe('number');
            expect(result.createdAt).toBeInstanceOf(Date);
            expect(result.updatedAt).toBeInstanceOf(Date);
            expect(result.createdAt.toISOString()).toBe('2024-01-15T10:30:00.000Z');
        });

        it('should handle numeric price as number from database', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const cartId = 'cart-123';
            const productId = 'prod-123';
            const quantity = 1;
            const price = 49.50;

            const mockDbRow = {
                id: 'item-456',
                cart_id: cartId,
                product_id: productId,
                quantity: quantity,
                price_at_addition: 49.50, // Number instead of string
                created_at: '2024-01-15T10:30:00.000Z',
                updated_at: '2024-01-15T10:30:00.000Z'
            };

            mockClient.__setInsertResponse(mockDbRow);

            // Act
            const result = await repository.create(cartId, productId, quantity, price);

            // Assert
            expect(result.priceAtAddition).toBe(49.50);
            expect(typeof result.priceAtAddition).toBe('number');
        });

        it('should throw error on unique constraint violation (duplicate product in cart)', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const cartId = 'cart-123';
            const productId = 'prod-123';
            const quantity = 1;
            const price = 99.99;

            // Mock unique constraint violation error
            const mockError = {
                code: '23505',
                message: 'duplicate key value violates unique constraint "cart_items_cart_id_product_id_key"'
            };

            mockClient.__setInsertResponse(null, mockError);

            // Act & Assert
            await expect(repository.create(cartId, productId, quantity, price)).rejects.toThrow(
                `Product '${productId}' already exists in cart '${cartId}'.`
            );
        });

        it('should throw error on quantity check constraint violation', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const cartId = 'cart-123';
            const productId = 'prod-123';
            const quantity = 100; // Exceeds max of 99
            const price = 99.99;

            const mockError = {
                code: '23514',
                message: 'new row for relation "cart_items" violates check constraint "cart_items_quantity_range"'
            };

            mockClient.__setInsertResponse(null, mockError);

            // Act & Assert
            await expect(repository.create(cartId, productId, quantity, price)).rejects.toThrow(
                'Quantity must be between 1 and 99.'
            );
        });

        it('should throw error on price check constraint violation', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const cartId = 'cart-123';
            const productId = 'prod-123';
            const quantity = 1;
            const price = 0; // Invalid price

            const mockError = {
                code: '23514',
                message: 'new row for relation "cart_items" violates check constraint "cart_items_price_positive"'
            };

            mockClient.__setInsertResponse(null, mockError);

            // Act & Assert
            await expect(repository.create(cartId, productId, quantity, price)).rejects.toThrow(
                'Price must be greater than 0.'
            );
        });

        it('should throw error on foreign key violation for cart_id', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const cartId = 'non-existent-cart';
            const productId = 'prod-123';
            const quantity = 1;
            const price = 99.99;

            const mockError = {
                code: '23503',
                message: 'insert or update on table "cart_items" violates foreign key constraint "cart_items_cart_id_fkey"'
            };

            mockClient.__setInsertResponse(null, mockError);

            // Act & Assert
            await expect(repository.create(cartId, productId, quantity, price)).rejects.toThrow(
                `Cart with ID '${cartId}' not found.`
            );
        });

        it('should throw error on foreign key violation for product_id', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const cartId = 'cart-123';
            const productId = 'non-existent-product';
            const quantity = 1;
            const price = 99.99;

            const mockError = {
                code: '23503',
                message: 'insert or update on table "cart_items" violates foreign key constraint "cart_items_product_id_fkey"'
            };

            mockClient.__setInsertResponse(null, mockError);

            // Act & Assert
            await expect(repository.create(cartId, productId, quantity, price)).rejects.toThrow(
                `Product with ID '${productId}' not found.`
            );
        });

        it('should throw error when no data returned', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const cartId = 'cart-123';
            const productId = 'prod-123';
            const quantity = 1;
            const price = 99.99;

            mockClient.__setInsertResponse(null);

            // Act & Assert
            await expect(repository.create(cartId, productId, quantity, price)).rejects.toThrow(
                'Failed to create cart item: No data returned'
            );
        });
    });

    describe('findById', () => {
        it('should find cart item by ID', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const itemId = 'item-123e4567-e89b-12d3-a456-426614174000';

            const mockDbRow = {
                id: itemId,
                cart_id: 'cart-123',
                product_id: 'prod-123',
                quantity: 3,
                price_at_addition: '149.99',
                created_at: '2024-01-15T10:30:00.000Z',
                updated_at: '2024-01-15T10:30:00.000Z'
            };

            mockClient.__setSelectResponse(mockDbRow);

            // Act
            const result = await repository.findById(itemId);

            // Assert
            expect(result).toBeDefined();
            expect(result?.id).toBe(itemId);
            expect(result?.cartId).toBe('cart-123');
            expect(result?.productId).toBe('prod-123');
            expect(result?.quantity).toBe(3);
            expect(result?.priceAtAddition).toBe(149.99);
            expect(result?.createdAt).toBeInstanceOf(Date);
            expect(result?.updatedAt).toBeInstanceOf(Date);
        });

        it('should return null when cart item not found', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const itemId = 'non-existent-item';

            const mockError = {
                code: 'PGRST116',
                message: 'No rows found'
            };

            mockClient.__setSelectResponse(null, mockError);

            // Act
            const result = await repository.findById(itemId);

            // Assert
            expect(result).toBeNull();
        });

        it('should return null when data is null', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const itemId = 'item-123';

            mockClient.__setSelectResponse(null);

            // Act
            const result = await repository.findById(itemId);

            // Assert
            expect(result).toBeNull();
        });

        it('should throw error on database error', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const itemId = 'item-123';

            const mockError = {
                code: '42P01',
                message: 'relation "cart_items" does not exist'
            };

            mockClient.__setSelectResponse(null, mockError);

            // Act & Assert
            await expect(repository.findById(itemId)).rejects.toThrow(
                'Failed to find cart item'
            );
        });
    });

    describe('findByCartId', () => {
        it('should find all cart items for a cart', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const cartId = 'cart-123';

            const mockDbRows = [
                {
                    id: 'item-1',
                    cart_id: cartId,
                    product_id: 'prod-1',
                    quantity: 2,
                    price_at_addition: '99.99',
                    created_at: '2024-01-15T10:30:00.000Z',
                    updated_at: '2024-01-15T10:30:00.000Z'
                },
                {
                    id: 'item-2',
                    cart_id: cartId,
                    product_id: 'prod-2',
                    quantity: 1,
                    price_at_addition: '49.99',
                    created_at: '2024-01-15T10:35:00.000Z',
                    updated_at: '2024-01-15T10:35:00.000Z'
                }
            ];

            // Mock the chain: from().select().eq()
            const mockEqResult = { data: mockDbRows, error: null };
            mockClient.mockEq.mockResolvedValue(mockEqResult);

            // Act
            const result = await repository.findByCartId(cartId);

            // Assert
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('item-1');
            expect(result[0].cartId).toBe(cartId);
            expect(result[0].quantity).toBe(2);
            expect(result[0].priceAtAddition).toBe(99.99);
            expect(result[1].id).toBe('item-2');
            expect(result[1].quantity).toBe(1);
            expect(result[1].priceAtAddition).toBe(49.99);
        });

        it('should return empty array when cart has no items', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const cartId = 'empty-cart';

            const mockEqResult = { data: [], error: null };
            mockClient.mockEq.mockResolvedValue(mockEqResult);

            // Act
            const result = await repository.findByCartId(cartId);

            // Assert
            expect(result).toEqual([]);
            expect(Array.isArray(result)).toBe(true);
        });

        it('should return empty array when data is null', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const cartId = 'cart-123';

            const mockEqResult = { data: null, error: null };
            mockClient.mockEq.mockResolvedValue(mockEqResult);

            // Act
            const result = await repository.findByCartId(cartId);

            // Assert
            expect(result).toEqual([]);
        });

        it('should throw error on database error', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const cartId = 'cart-123';

            const mockError = {
                code: '42P01',
                message: 'relation "cart_items" does not exist'
            };

            const mockEqResult = { data: null, error: mockError };
            mockClient.mockEq.mockResolvedValue(mockEqResult);

            // Act & Assert
            await expect(repository.findByCartId(cartId)).rejects.toThrow(
                'Failed to find cart items'
            );
        });
    });

    describe('findByCartAndProduct', () => {
        it('should find cart item by cart and product', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const cartId = 'cart-123';
            const productId = 'prod-123';

            const mockDbRow = {
                id: 'item-123',
                cart_id: cartId,
                product_id: productId,
                quantity: 5,
                price_at_addition: '199.99',
                created_at: '2024-01-15T10:30:00.000Z',
                updated_at: '2024-01-15T10:30:00.000Z'
            };

            mockClient.__setSelectResponse(mockDbRow);

            // Act
            const result = await repository.findByCartAndProduct(cartId, productId);

            // Assert
            expect(result).toBeDefined();
            expect(result?.id).toBe('item-123');
            expect(result?.cartId).toBe(cartId);
            expect(result?.productId).toBe(productId);
            expect(result?.quantity).toBe(5);
            expect(result?.priceAtAddition).toBe(199.99);
        });

        it('should return null when product not in cart', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const cartId = 'cart-123';
            const productId = 'prod-not-in-cart';

            const mockError = {
                code: 'PGRST116',
                message: 'No rows found'
            };

            mockClient.__setSelectResponse(null, mockError);

            // Act
            const result = await repository.findByCartAndProduct(cartId, productId);

            // Assert
            expect(result).toBeNull();
        });

        it('should return null when data is null', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const cartId = 'cart-123';
            const productId = 'prod-123';

            mockClient.__setSelectResponse(null);

            // Act
            const result = await repository.findByCartAndProduct(cartId, productId);

            // Assert
            expect(result).toBeNull();
        });

        it('should throw error on database error', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const cartId = 'cart-123';
            const productId = 'prod-123';

            const mockError = {
                code: '42P01',
                message: 'relation "cart_items" does not exist'
            };

            mockClient.__setSelectResponse(null, mockError);

            // Act & Assert
            await expect(repository.findByCartAndProduct(cartId, productId)).rejects.toThrow(
                'Failed to find cart item'
            );
        });
    });

    describe('updateQuantity', () => {
        it('should update cart item quantity successfully', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const itemId = 'item-123';
            const newQuantity = 10;

            const mockDbRow = {
                id: itemId,
                cart_id: 'cart-123',
                product_id: 'prod-123',
                quantity: newQuantity,
                price_at_addition: '99.99',
                created_at: '2024-01-15T10:30:00.000Z',
                updated_at: '2024-01-15T10:45:00.000Z' // Updated timestamp
            };

            mockClient.__setUpdateResponse(mockDbRow);

            // Act
            const result = await repository.updateQuantity(itemId, newQuantity);

            // Assert
            expect(result).toBeDefined();
            expect(result.id).toBe(itemId);
            expect(result.quantity).toBe(newQuantity);
            expect(result.priceAtAddition).toBe(99.99); // Price unchanged
            expect(result.updatedAt.toISOString()).toBe('2024-01-15T10:45:00.000Z');
        });

        it('should throw error when cart item not found (PGRST116)', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const itemId = 'non-existent-item';
            const newQuantity = 5;

            const mockError = {
                code: 'PGRST116',
                message: 'No rows found'
            };

            mockClient.__setUpdateResponse(null, mockError);

            // Act & Assert
            await expect(repository.updateQuantity(itemId, newQuantity)).rejects.toThrow(
                `Cart item with ID '${itemId}' not found.`
            );
        });

        it('should throw error when data is null', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const itemId = 'item-123';
            const newQuantity = 5;

            mockClient.__setUpdateResponse(null);

            // Act & Assert
            await expect(repository.updateQuantity(itemId, newQuantity)).rejects.toThrow(
                `Cart item with ID '${itemId}' not found.`
            );
        });

        it('should throw error on quantity check constraint violation', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const itemId = 'item-123';
            const newQuantity = 100; // Exceeds max of 99

            const mockError = {
                code: '23514',
                message: 'new row for relation "cart_items" violates check constraint "cart_items_quantity_range"'
            };

            mockClient.__setUpdateResponse(null, mockError);

            // Act & Assert
            await expect(repository.updateQuantity(itemId, newQuantity)).rejects.toThrow(
                'Quantity must be between 1 and 99.'
            );
        });

        it('should throw error on generic database error', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const itemId = 'item-123';
            const newQuantity = 5;

            const mockError = {
                code: '42P01',
                message: 'relation "cart_items" does not exist'
            };

            mockClient.__setUpdateResponse(null, mockError);

            // Act & Assert
            await expect(repository.updateQuantity(itemId, newQuantity)).rejects.toThrow(
                'Failed to update cart item quantity'
            );
        });
    });

    describe('delete', () => {
        it('should delete cart item successfully', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const itemId = 'item-123';

            const mockDbRow = {
                id: itemId,
                cart_id: 'cart-123',
                product_id: 'prod-123',
                quantity: 2,
                price_at_addition: '99.99',
                created_at: '2024-01-15T10:30:00.000Z',
                updated_at: '2024-01-15T10:30:00.000Z'
            };

            mockClient.__setDeleteResponse(mockDbRow);

            // Act & Assert
            await expect(repository.delete(itemId)).resolves.toBeUndefined();
        });

        it('should throw error when cart item not found', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const itemId = 'non-existent-item';

            mockClient.__setDeleteResponse(null);

            // Act & Assert
            await expect(repository.delete(itemId)).rejects.toThrow(
                `Cart item with ID '${itemId}' not found or could not be deleted.`
            );
        });

        it('should throw error on database error', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const itemId = 'item-123';

            const mockError = {
                code: '42P01',
                message: 'relation "cart_items" does not exist'
            };

            mockClient.__setDeleteResponse(null, mockError);

            // Act & Assert
            await expect(repository.delete(itemId)).rejects.toThrow(
                `Cart item with ID '${itemId}' not found or could not be deleted.`
            );
        });
    });

    describe('deleteByCartId', () => {
        it('should delete all cart items for a cart successfully', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const cartId = 'cart-123';

            // Mock successful delete (no error)
            const mockEqResult = { error: null };
            mockClient.mockEq.mockResolvedValue(mockEqResult);

            // Act & Assert
            await expect(repository.deleteByCartId(cartId)).resolves.toBeUndefined();
        });

        it('should be idempotent (no error when cart has no items)', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const cartId = 'empty-cart';

            const mockEqResult = { error: null };
            mockClient.mockEq.mockResolvedValue(mockEqResult);

            // Act & Assert
            await expect(repository.deleteByCartId(cartId)).resolves.toBeUndefined();
        });

        it('should throw error on database error', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartItemRepositoryImpl(mockClient);

            const cartId = 'cart-123';

            const mockError = {
                code: '42P01',
                message: 'relation "cart_items" does not exist'
            };

            const mockEqResult = { error: mockError };
            mockClient.mockEq.mockResolvedValue(mockEqResult);

            // Act & Assert
            await expect(repository.deleteByCartId(cartId)).rejects.toThrow(
                'Failed to delete cart items'
            );
        });
    });
});
