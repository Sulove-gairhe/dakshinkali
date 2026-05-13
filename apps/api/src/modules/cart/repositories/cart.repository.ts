/**
 * CartRepository Interface
 * 
 * Defines the contract for cart data access operations.
 * Provides abstraction over Supabase database for loose coupling.
 * 
 * Requirements: AR-1, AR-6 (Repository layer with abstraction)
 */

import { CartEntity, CartWithItemsEntity } from '../entities';

/**
 * Repository interface for cart data access
 * 
 * Provides CRUD operations for carts with support for both
 * authenticated users (user_id) and anonymous users (session_id).
 */
export interface CartRepository {
    /**
     * Create a new cart
     * 
     * @param userId - Authenticated user ID (NULL for anonymous)
     * @param sessionId - Session ID for anonymous users (NULL for authenticated)
     * @returns Created cart entity
     * @throws Error if both userId and sessionId are NULL or both are set
     * 
     * @example
     * // Create cart for authenticated user
     * const cart = await repository.create('user-uuid', null);
     * 
     * @example
     * // Create cart for anonymous user
     * const cart = await repository.create(null, 'session-uuid');
     */
    create(userId: string | null, sessionId: string | null): Promise<CartEntity>;

    /**
     * Find cart by ID
     * 
     * @param cartId - Cart ID to find
     * @returns Cart entity or null if not found
     * 
     * @example
     * const cart = await repository.findById('cart-uuid');
     */
    findById(cartId: string): Promise<CartEntity | null>;

    /**
     * Find cart by user ID
     * 
     * @param userId - User ID to find cart for
     * @returns Cart entity or null if not found
     * 
     * @example
     * const cart = await repository.findByUserId('user-uuid');
     */
    findByUserId(userId: string): Promise<CartEntity | null>;

    /**
     * Find cart by session ID
     * 
     * @param sessionId - Session ID to find cart for
     * @returns Cart entity or null if not found
     * 
     * @example
     * const cart = await repository.findBySessionId('session-uuid');
     */
    findBySessionId(sessionId: string): Promise<CartEntity | null>;

    /**
     * Find cart with all items and product details
     * 
     * Performs efficient JOIN query to retrieve cart with items
     * and associated product information in a single query.
     * 
     * @param cartId - Cart ID to find
     * @returns Cart with items or null if not found
     * 
     * @example
     * const cartWithItems = await repository.findWithItems('cart-uuid');
     * console.log(cartWithItems.items.length); // Number of items
     * console.log(cartWithItems.items[0].product.name); // Product name
     */
    findWithItems(cartId: string): Promise<CartWithItemsEntity | null>;

    /**
     * Update cart
     * 
     * @param cartId - Cart ID to update
     * @param data - Partial cart data to update
     * @returns Updated cart entity
     * @throws Error if cart not found
     * 
     * @example
     * // Transfer anonymous cart to authenticated user
     * const cart = await repository.update('cart-uuid', {
     *   userId: 'user-uuid',
     *   sessionId: null,
     * });
     */
    update(cartId: string, data: Partial<CartEntity>): Promise<CartEntity>;

    /**
     * Delete cart
     * 
     * Deletes cart and all associated items (CASCADE DELETE).
     * 
     * @param cartId - Cart ID to delete
     * @returns void
     * 
     * @example
     * await repository.delete('cart-uuid');
     */
    delete(cartId: string): Promise<void>;
}
