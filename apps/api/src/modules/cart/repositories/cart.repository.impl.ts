/**
 * CartRepositoryImpl - Concrete implementation of CartRepository
 * 
 * This class implements all database operations for the Cart Module using Supabase.
 * It handles SQL query construction, execution, and row-to-entity mapping.
 * 
 * @remarks
 * - Uses Supabase client for database access
 * - Maps database rows (snake_case) to CartEntity (camelCase)
 * - Converts timestamps to Date objects
 * - Translates database errors to domain exceptions
 * - Implements efficient JOIN queries for cart with items
 * 
 * **QUERY OPTIMIZATION & SECURITY:**
 * 
 * 1. SQL Injection Prevention:
 *    - All queries use Supabase query builder with parameterized values
 *    - Methods like .eq(), .is() automatically escape and parameterize inputs
 *    - NO string concatenation or interpolation in SQL queries
 * 
 * 2. Index Usage:
 *    - Partial indexes on user_id and session_id for fast cart lookup
 *    - Index on cart_id for efficient cart items retrieval
 *    - All queries leverage database indexes created in migrations
 * 
 * 3. Performance Optimizations:
 *    - Single JOIN query for findWithItems (no N+1 queries)
 *    - Parameterized queries for all operations
 *    - Efficient WHERE clauses using indexed columns
 * 
 * 4. Available Indexes:
 *    - idx_carts_user_id: Partial index on user_id WHERE user_id IS NOT NULL
 *    - idx_carts_session_id: Partial index on session_id WHERE session_id IS NOT NULL
 *    - idx_cart_items_cart_id: Index on cart_id for fast item lookup
 *    - idx_cart_items_product_id: Index on product_id for product references
 * 
 * **Validates: Requirements AR-5, AR-7, AR-8, NFR-1**
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CartEntity } from '../entities/cart.entity';
import { CartWithItemsEntity, CartItemWithProductEntity } from '../entities/cart-item.entity';
import { CartRepository } from './cart.repository';

/**
 * Database row interface for carts table
 * Represents the raw structure returned from Supabase queries
 * Uses snake_case to match PostgreSQL naming conventions
 */
interface CartRow {
    id: string;
    user_id: string | null;
    session_id: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Database row interface for cart_items table with joined product data
 * Used for efficient retrieval of cart with items and product information
 */
interface CartItemWithProductRow {
    id: string;
    cart_id: string;
    product_id: string;
    quantity: number;
    price_at_addition: string | number;
    created_at: string;
    updated_at: string;
    product_name: string;
    product_price: string | number;
    product_status: string;
    product_images: any;
    product_deleted_at: string | null;
}

/**
 * CartRepositoryImpl
 * 
 * Concrete implementation of CartRepository interface using Supabase.
 */
export class CartRepositoryImpl implements CartRepository {
    constructor(private readonly supabase: SupabaseClient) { }

    /**
     * Create a new cart for a user or session
     * 
     * @param userId - Authenticated user identifier (UUID, nullable)
     * @param sessionId - Anonymous session identifier (TEXT, nullable)
     * @returns Promise resolving to the created CartEntity with generated id and timestamps
     * 
     * @throws Error if cart already exists for user or session
     * @throws Error if both userId and sessionId are null or both are provided
     * @throws Error for database errors
     * 
     * @remarks
     * - Generates UUID for id if not provided
     * - Sets created_at and updated_at to NOW()
     * - Either userId OR sessionId must be set (enforced by CHECK constraint)
     * - A user can have only one cart (enforced by unique constraint on user_id)
     * - A session can have only one cart (enforced by unique constraint on session_id)
     * 
     * **Validates: Requirements AR-5, AR-7, AR-8, NFR-1**
     */
    async create(userId: string | null, sessionId: string | null): Promise<CartEntity> {
        // Validate that exactly one of userId or sessionId is provided
        if ((userId === null && sessionId === null) || (userId !== null && sessionId !== null)) {
            throw new Error('Either userId or sessionId must be provided, but not both.');
        }

        // Convert to database row format (snake_case)
        const row = {
            user_id: userId,
            session_id: sessionId,
        };

        // Execute INSERT query
        const { data, error } = await this.supabase
            .from('carts')
            .insert(row)
            .select()
            .single();

        if (error) {
            // Translate database errors to domain exceptions
            if (error.code === '23505') {
                // Unique constraint violation
                const identifier = userId ? `user '${userId}'` : `session '${sessionId}'`;
                throw new Error(`A cart already exists for ${identifier}.`);
            }
            if (error.code === '23514') {
                // Check constraint violation
                throw new Error('Either userId or sessionId must be provided, but not both.');
            }
            throw new Error(`Failed to create cart: ${error.message}`);
        }

        if (!data) {
            throw new Error('Failed to create cart: No data returned');
        }

        // Map database row to CartEntity
        return this.mapRowToEntity(data);
    }

    /**
     * Find a cart by its unique identifier
     * 
     * @param cartId - Cart UUID to find
     * @returns Promise resolving to CartEntity or null if not found
     * 
     * @remarks
     * - Returns null if cart not found
     * - Maps database row to CartEntity with proper type conversions
     * - Does not include cart items (use findWithItems for that)
     * 
     * **Validates: Requirements AR-5, AR-7, AR-8**
     */
    async findById(cartId: string): Promise<CartEntity | null> {
        const { data, error } = await this.supabase
            .from('carts')
            .select()
            .eq('id', cartId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to find cart: ${error.message}`);
        }

        if (!data) {
            return null;
        }

        return this.mapRowToEntity(data);
    }

    /**
     * Find a cart by authenticated user ID
     * 
     * @param userId - User UUID to find cart for
     * @returns Promise resolving to CartEntity or null if not found
     * 
     * @remarks
     * - Returns null if user has no cart
     * - Uses partial index on user_id for fast lookup
     * - A user can have only one cart (enforced by unique constraint)
     * 
     * **Validates: Requirements AR-5, AR-7, AR-8, NFR-1**
     */
    async findByUserId(userId: string): Promise<CartEntity | null> {
        const { data, error } = await this.supabase
            .from('carts')
            .select()
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to find cart by user ID: ${error.message}`);
        }

        if (!data) {
            return null;
        }

        return this.mapRowToEntity(data);
    }

    /**
     * Find a cart by anonymous session ID
     * 
     * @param sessionId - Session identifier to find cart for
     * @returns Promise resolving to CartEntity or null if not found
     * 
     * @remarks
     * - Returns null if session has no cart
     * - Uses partial index on session_id for fast lookup
     * - A session can have only one cart (enforced by unique constraint)
     * 
     * **Validates: Requirements AR-5, AR-7, AR-8, NFR-1**
     */
    async findBySessionId(sessionId: string): Promise<CartEntity | null> {
        const { data, error } = await this.supabase
            .from('carts')
            .select()
            .eq('session_id', sessionId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to find cart by session ID: ${error.message}`);
        }

        if (!data) {
            return null;
        }

        return this.mapRowToEntity(data);
    }

    /**
     * Find a cart with all its items and product details in a single query
     * 
     * @param cartId - Cart UUID to find
     * @returns Promise resolving to CartWithItemsEntity or null if not found
     * 
     * @remarks
     * - Returns null if cart not found
     * - Uses efficient JOIN query to fetch cart + items + products in one round-trip
     * - Includes product information (name, price, status, images, deletedAt)
     * - Service layer uses this to calculate totals and check product availability
     * - Leverages indexes on cart_id and product_id for performance
     * 
     * **Query Pattern:**
     * Fetches cart data, then fetches cart items with product data using JOIN.
     * This is a two-query approach due to Supabase PostgREST limitations,
     * but still more efficient than N+1 queries.
     * 
     * **Validates: Requirements AR-5, AR-7, AR-8, NFR-1**
     */
    async findWithItems(cartId: string): Promise<CartWithItemsEntity | null> {
        // First, fetch the cart
        const { data: cartData, error: cartError } = await this.supabase
            .from('carts')
            .select()
            .eq('id', cartId)
            .single();

        if (cartError) {
            if (cartError.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to find cart: ${cartError.message}`);
        }

        if (!cartData) {
            return null;
        }

        // Then, fetch cart items with product data using JOIN
        // Supabase PostgREST syntax for joining tables
        const { data: itemsData, error: itemsError } = await this.supabase
            .from('cart_items')
            .select(`
                id,
                cart_id,
                product_id,
                quantity,
                price_at_addition,
                created_at,
                updated_at,
                products:product_id (
                    id,
                    name,
                    price,
                    status,
                    images,
                    deleted_at
                )
            `)
            .eq('cart_id', cartId);

        if (itemsError) {
            throw new Error(`Failed to find cart items: ${itemsError.message}`);
        }

        // Map cart data
        const cart = this.mapRowToEntity(cartData);

        // Map cart items with product data
        const items: CartItemWithProductEntity[] = (itemsData || []).map(item => {
            const product = Array.isArray(item.products) ? item.products[0] : item.products;

            return {
                id: item.id,
                cartId: item.cart_id,
                productId: item.product_id,
                quantity: item.quantity,
                priceAtAddition: typeof item.price_at_addition === 'string'
                    ? parseFloat(item.price_at_addition)
                    : item.price_at_addition,
                createdAt: new Date(item.created_at),
                updatedAt: new Date(item.updated_at),
                product: {
                    id: product.id,
                    name: product.name,
                    price: typeof product.price === 'string'
                        ? parseFloat(product.price)
                        : product.price,
                    status: product.status,
                    images: this.parseImages(product.images),
                    deletedAt: product.deleted_at ? new Date(product.deleted_at) : null,
                },
            };
        });

        // Return cart with items
        return {
            ...cart,
            items,
        };
    }

    /**
     * Update a cart with partial data
     * 
     * @param cartId - Cart UUID to update
     * @param data - Partial CartEntity with fields to update
     * @returns Promise resolving to the updated CartEntity
     * 
     * @throws Error if cart not found
     * @throws Error if attempting to set both userId and sessionId
     * @throws Error for database errors
     * 
     * @remarks
     * - Only updates provided fields (partial update)
     * - updated_at is automatically set by database trigger
     * - Cannot update id or created_at through this method
     * - Commonly used to convert guest cart to user cart (set userId, clear sessionId)
     * 
     * **Validates: Requirements AR-5, AR-7, AR-8**
     */
    async update(cartId: string, data: Partial<CartEntity>): Promise<CartEntity> {
        // Convert updates to database row format
        const row: any = {};

        if (data.userId !== undefined) row.user_id = data.userId;
        if (data.sessionId !== undefined) row.session_id = data.sessionId;

        // Execute UPDATE query
        const { data: updatedData, error } = await this.supabase
            .from('carts')
            .update(row)
            .eq('id', cartId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error(`Cart with ID '${cartId}' not found.`);
            }
            if (error.code === '23505') {
                // Unique constraint violation
                const identifier = data.userId ? `user '${data.userId}'` : `session '${data.sessionId}'`;
                throw new Error(`A cart already exists for ${identifier}.`);
            }
            if (error.code === '23514') {
                // Check constraint violation
                throw new Error('Either userId or sessionId must be provided, but not both.');
            }
            throw new Error(`Failed to update cart: ${error.message}`);
        }

        if (!updatedData) {
            throw new Error(`Cart with ID '${cartId}' not found.`);
        }

        return this.mapRowToEntity(updatedData);
    }

    /**
     * Delete a cart and all its items
     * 
     * @param cartId - Cart UUID to delete
     * @returns Promise resolving when deletion is complete
     * 
     * @throws Error if cart not found
     * @throws Error for database errors
     * 
     * @remarks
     * - Hard delete (not soft delete)
     * - Cascades to delete all cart items (ON DELETE CASCADE)
     * - Used when merging carts (delete guest cart after merge)
     * 
     * **Validates: Requirements AR-5, AR-7, AR-8**
     */
    async delete(cartId: string): Promise<void> {
        const { data, error } = await this.supabase
            .from('carts')
            .delete()
            .eq('id', cartId)
            .select()
            .single();

        if (error || !data) {
            throw new Error(`Cart with ID '${cartId}' not found or could not be deleted.`);
        }
    }

    /**
     * Map database row to CartEntity
     * 
     * Handles all type conversions:
     * - string timestamps to Date objects
     * - snake_case to camelCase
     * 
     * @param row - Raw database row
     * @returns CartEntity with proper types
     * 
     * @remarks
     * This is a critical method that ensures type safety between database and domain layers.
     * All database rows MUST pass through this mapping function.
     * 
     * **Validates: Requirements AR-8**
     */
    private mapRowToEntity(row: CartRow): CartEntity {
        return {
            id: row.id,
            userId: row.user_id,
            sessionId: row.session_id,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }

    /**
     * Parse JSONB images field to string array
     * 
     * @param images - JSONB images field from database
     * @returns Array of image URLs
     * 
     * @remarks
     * Handles both string and already-parsed object formats.
     * Returns empty array if parsing fails.
     */
    private parseImages(images: any): string[] {
        if (!images) {
            return [];
        }

        try {
            // Handle both string and already-parsed object
            const parsed = typeof images === 'string'
                ? JSON.parse(images)
                : images;
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('Failed to parse images JSONB:', error);
            return [];
        }
    }
}
