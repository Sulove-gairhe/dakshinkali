/**
 * CartRepositoryImpl Unit Tests
 * 
 * Tests for the CartRepository implementation focusing on:
 * - Create cart (user and session)
 * - Find cart by ID, user ID, session ID
 * - Find cart with items (JOIN query)
 * - Update cart
 * - Delete cart
 * - Error cases (not found, constraint violations)
 * - Row-to-entity mapping correctness
 * - Timestamp to Date conversion
 * 
 * **Validates: Requirements AR-9, AR-12**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CartRepositoryImpl } from './cart.repository.impl';
import { CartEntity } from '../entities/cart.entity';
import { CartWithItemsEntity } from '../entities/cart-item.entity';

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
        select: mockSelect
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
        __setUpdateResponse: (data: any, error: any = null) => {
            mockSingle.mockResolvedValue({ data, error });
        },
        __setDeleteResponse: (data: any, error: any = null) => {
            mockSingle.mockResolvedValue({ data, error });
        },
        __setSelectMultipleResponse: (data: any, error: any = null) => {
            mockSelect.mockResolvedValue({ data, error });
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
                select: mockSelect
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

describe('CartRepositoryImpl', () => {
    describe('create', () => {
        it('should create a cart for authenticated user', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            const userId = '123e4567-e89b-12d3-a456-426614174000';
            const sessionId = null;

            // Mock database response (snake_case)
            const mockDbRow = {
                id: 'cart-123e4567-e89b-12d3-a456-426614174000',
                user_id: userId,
                session_id: null,
                created_at: '2024-01-15T10:30:00.000Z',
                updated_at: '2024-01-15T10:30:00.000Z'
            };

            mockClient.__setInsertResponse(mockDbRow);

            // Act
            const result = await repository.create(userId, sessionId);

            // Assert
            expect(result).toBeDefined();
            expect(result.id).toBe('cart-123e4567-e89b-12d3-a456-426614174000');
            expect(result.userId).toBe(userId);
            expect(result.sessionId).toBeNull();
            expect(result.createdAt).toBeInstanceOf(Date);
            expect(result.updatedAt).toBeInstanceOf(Date);
            expect(result.createdAt.toISOString()).toBe('2024-01-15T10:30:00.000Z');
        });

        it('should create a cart for anonymous session', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            const userId = null;
            const sessionId = 'session-123e4567-e89b-12d3-a456-426614174000';

            const mockDbRow = {
                id: 'cart-223e4567-e89b-12d3-a456-426614174000',
                user_id: null,
                session_id: sessionId,
                created_at: '2024-01-15T10:30:00.000Z',
                updated_at: '2024-01-15T10:30:00.000Z'
            };

            mockClient.__setInsertResponse(mockDbRow);

            // Act
            const result = await repository.create(userId, sessionId);

            // Assert
            expect(result).toBeDefined();
            expect(result.id).toBe('cart-223e4567-e89b-12d3-a456-426614174000');
            expect(result.userId).toBeNull();
            expect(result.sessionId).toBe(sessionId);
            expect(result.createdAt).toBeInstanceOf(Date);
            expect(result.updatedAt).toBeInstanceOf(Date);
        });

        it('should throw error when both userId and sessionId are null', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            // Act & Assert
            await expect(repository.create(null, null)).rejects.toThrow(
                'Either userId or sessionId must be provided, but not both.'
            );
        });

        it('should throw error when both userId and sessionId are provided', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            const userId = '123e4567-e89b-12d3-a456-426614174000';
            const sessionId = 'session-123e4567-e89b-12d3-a456-426614174000';

            // Act & Assert
            await expect(repository.create(userId, sessionId)).rejects.toThrow(
                'Either userId or sessionId must be provided, but not both.'
            );
        });

        it('should throw error on unique constraint violation for user', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            const userId = '123e4567-e89b-12d3-a456-426614174000';

            // Mock unique constraint violation error
            const mockError = {
                code: '23505',
                message: 'duplicate key value violates unique constraint'
            };

            mockClient.__setInsertResponse(null, mockError);

            // Act & Assert
            await expect(repository.create(userId, null)).rejects.toThrow(
                `A cart already exists for user '${userId}'.`
            );
        });

        it('should throw error on unique constraint violation for session', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            const sessionId = 'session-123e4567-e89b-12d3-a456-426614174000';

            const mockError = {
                code: '23505',
                message: 'duplicate key value violates unique constraint'
            };

            mockClient.__setInsertResponse(null, mockError);

            // Act & Assert
            await expect(repository.create(null, sessionId)).rejects.toThrow(
                `A cart already exists for session '${sessionId}'.`
            );
        });

        it('should throw error on check constraint violation', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            const userId = '123e4567-e89b-12d3-a456-426614174000';

            const mockError = {
                code: '23514',
                message: 'check constraint violation'
            };

            mockClient.__setInsertResponse(null, mockError);

            // Act & Assert
            await expect(repository.create(userId, null)).rejects.toThrow(
                'Either userId or sessionId must be provided, but not both.'
            );
        });
    });

    describe('findById', () => {
        it('should find cart by ID', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            const cartId = 'cart-123e4567-e89b-12d3-a456-426614174000';

            const mockDbRow = {
                id: cartId,
                user_id: '123e4567-e89b-12d3-a456-426614174000',
                session_id: null,
                created_at: '2024-01-15T10:30:00.000Z',
                updated_at: '2024-01-15T10:30:00.000Z'
            };

            mockClient.__setSelectResponse(mockDbRow);

            // Act
            const result = await repository.findById(cartId);

            // Assert
            expect(result).toBeDefined();
            expect(result?.id).toBe(cartId);
            expect(result?.userId).toBe('123e4567-e89b-12d3-a456-426614174000');
            expect(result?.sessionId).toBeNull();
            expect(result?.createdAt).toBeInstanceOf(Date);
            expect(result?.updatedAt).toBeInstanceOf(Date);
        });

        it('should return null when cart not found', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            const cartId = 'non-existent-cart';

            const mockError = {
                code: 'PGRST116',
                message: 'No rows found'
            };

            mockClient.__setSelectResponse(null, mockError);

            // Act
            const result = await repository.findById(cartId);

            // Assert
            expect(result).toBeNull();
        });

        it('should throw error on database error', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            const cartId = 'cart-123';

            const mockError = {
                code: '42P01',
                message: 'relation "carts" does not exist'
            };

            mockClient.__setSelectResponse(null, mockError);

            // Act & Assert
            await expect(repository.findById(cartId)).rejects.toThrow(
                'Failed to find cart'
            );
        });
    });

    describe('findByUserId', () => {
        it('should find cart by user ID', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            const userId = '123e4567-e89b-12d3-a456-426614174000';

            const mockDbRow = {
                id: 'cart-123e4567-e89b-12d3-a456-426614174000',
                user_id: userId,
                session_id: null,
                created_at: '2024-01-15T10:30:00.000Z',
                updated_at: '2024-01-15T10:30:00.000Z'
            };

            mockClient.__setSelectResponse(mockDbRow);

            // Act
            const result = await repository.findByUserId(userId);

            // Assert
            expect(result).toBeDefined();
            expect(result?.userId).toBe(userId);
            expect(result?.sessionId).toBeNull();
        });

        it('should return null when user has no cart', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            const userId = 'user-without-cart';

            const mockError = {
                code: 'PGRST116',
                message: 'No rows found'
            };

            mockClient.__setSelectResponse(null, mockError);

            // Act
            const result = await repository.findByUserId(userId);

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('findBySessionId', () => {
        it('should find cart by session ID', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            const sessionId = 'session-123e4567-e89b-12d3-a456-426614174000';

            const mockDbRow = {
                id: 'cart-223e4567-e89b-12d3-a456-426614174000',
                user_id: null,
                session_id: sessionId,
                created_at: '2024-01-15T10:30:00.000Z',
                updated_at: '2024-01-15T10:30:00.000Z'
            };

            mockClient.__setSelectResponse(mockDbRow);

            // Act
            const result = await repository.findBySessionId(sessionId);

            // Assert
            expect(result).toBeDefined();
            expect(result?.userId).toBeNull();
            expect(result?.sessionId).toBe(sessionId);
        });

        it('should return null when session has no cart', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            const sessionId = 'session-without-cart';

            const mockError = {
                code: 'PGRST116',
                message: 'No rows found'
            };

            mockClient.__setSelectResponse(null, mockError);

            // Act
            const result = await repository.findBySessionId(sessionId);

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('findWithItems', () => {
        it('should return null when cart not found', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            const cartId = 'non-existent-cart';

            const mockError = {
                code: 'PGRST116',
                message: 'No rows found'
            };

            mockClient.__setSelectResponse(null, mockError);

            // Act
            const result = await repository.findWithItems(cartId);

            // Assert
            expect(result).toBeNull();
        });

        // Note: Full integration tests for findWithItems with items are covered in integration tests
        // Unit testing this method with mocks is complex due to multiple database calls
        // The method is tested indirectly through other repository methods
    });

    describe('update', () => {
        it('should update cart userId', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            const cartId = 'cart-123e4567-e89b-12d3-a456-426614174000';
            const newUserId = '456e4567-e89b-12d3-a456-426614174000';

            const mockDbRow = {
                id: cartId,
                user_id: newUserId,
                session_id: null,
                created_at: '2024-01-15T10:30:00.000Z',
                updated_at: '2024-01-15T10:45:00.000Z'
            };

            mockClient.__setUpdateResponse(mockDbRow);

            // Act
            const result = await repository.update(cartId, { userId: newUserId, sessionId: null });

            // Assert
            expect(result).toBeDefined();
            expect(result.id).toBe(cartId);
            expect(result.userId).toBe(newUserId);
            expect(result.sessionId).toBeNull();
            expect(result.updatedAt.toISOString()).toBe('2024-01-15T10:45:00.000Z');
        });

        it('should update cart sessionId', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            const cartId = 'cart-123';
            const newSessionId = 'new-session-123';

            const mockDbRow = {
                id: cartId,
                user_id: null,
                session_id: newSessionId,
                created_at: '2024-01-15T10:30:00.000Z',
                updated_at: '2024-01-15T10:45:00.000Z'
            };

            mockClient.__setUpdateResponse(mockDbRow);

            // Act
            const result = await repository.update(cartId, { sessionId: newSessionId });

            // Assert
            expect(result.sessionId).toBe(newSessionId);
        });

        it('should throw error when cart not found', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            const cartId = 'non-existent-cart';

            const mockError = {
                code: 'PGRST116',
                message: 'No rows found'
            };

            mockClient.__setUpdateResponse(null, mockError);

            // Act & Assert
            await expect(repository.update(cartId, { userId: 'user-123' })).rejects.toThrow(
                `Cart with ID '${cartId}' not found.`
            );
        });

        it('should throw error on unique constraint violation', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            const cartId = 'cart-123';
            const userId = 'existing-user-123';

            const mockError = {
                code: '23505',
                message: 'duplicate key value violates unique constraint'
            };

            mockClient.__setUpdateResponse(null, mockError);

            // Act & Assert
            await expect(repository.update(cartId, { userId })).rejects.toThrow(
                `A cart already exists for user '${userId}'.`
            );
        });

        it('should throw error on check constraint violation', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            const cartId = 'cart-123';

            const mockError = {
                code: '23514',
                message: 'check constraint violation'
            };

            mockClient.__setUpdateResponse(null, mockError);

            // Act & Assert
            await expect(repository.update(cartId, { userId: 'user-123' })).rejects.toThrow(
                'Either userId or sessionId must be provided, but not both.'
            );
        });
    });

    describe('delete', () => {
        it('should delete cart successfully', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            const cartId = 'cart-123e4567-e89b-12d3-a456-426614174000';

            const mockDbRow = {
                id: cartId,
                user_id: '123e4567-e89b-12d3-a456-426614174000',
                session_id: null,
                created_at: '2024-01-15T10:30:00.000Z',
                updated_at: '2024-01-15T10:30:00.000Z'
            };

            mockClient.__setDeleteResponse(mockDbRow);

            // Act & Assert
            await expect(repository.delete(cartId)).resolves.toBeUndefined();
        });

        it('should throw error when cart not found', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            const cartId = 'non-existent-cart';

            mockClient.__setDeleteResponse(null);

            // Act & Assert
            await expect(repository.delete(cartId)).rejects.toThrow(
                `Cart with ID '${cartId}' not found or could not be deleted.`
            );
        });

        it('should throw error on database error', async () => {
            // Arrange
            const mockClient = createMockSupabaseClient() as any;
            const repository = new CartRepositoryImpl(mockClient);

            const cartId = 'cart-123';

            const mockError = {
                code: '42P01',
                message: 'relation "carts" does not exist'
            };

            mockClient.__setDeleteResponse(null, mockError);

            // Act & Assert
            await expect(repository.delete(cartId)).rejects.toThrow(
                `Cart with ID '${cartId}' not found or could not be deleted.`
            );
        });
    });
});
