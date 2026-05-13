/**
 * CartItemRepository Interface
 * 
 * Defines the contract for cart item data access operations.
 * Provides abstraction over Supabase database for loose coupling.
 * 
 * Requirements: AR-1, AR-6 (Repository layer with abstraction)
 */

import { CartItemEntity } from '../entities';

/**
 * Repository interface for cart item data access
 * 
 * Provides CRUD operations for cart items with support for
 * quantity updates and product uniqueness per cart.
 */
export interface CartItemRepository {
    /**
     * Create a new cart item
     * 
     * @param cartId - Cart ID to add item to
     * @param productId - Product ID to add
     * @param quantity - Quantity of product (1-99)
     * @param priceSnapshot - Product price at time of adding
     * @returns Created cart item entity
     * @throws Error if product already exists in cart (UNIQUE constraint)
     * @throws Error if quantity out of range (CHECK constraint)
     * 
     * @example
     * const item = await repository.create(
     *   'cart-uuid',
     *   'product-uuid',
     *   2,
     *   99.99
     * );
     */
    create(
        cartId: string,
        productId: string,
        quantity: number,
        priceSnapshot: number
    ): Promise<CartItemEntity>;

    /**
     * Find cart item by ID
     * 
     * @param itemId - Cart item ID to find
     * @returns Cart item entity or null if not found
     * 
     * @example
     * const item = await repository.findById('item-uuid');
     */
    findById(itemId: string): Promise<CartItemEntity | null>;

    /**
     * Find all cart items by cart ID
     * 
     * @param cartId - Cart ID to find items for
     * @returns Array of cart item entities (empty if none)
     * 
     * @example
     * const items = await repository.findByCartId('cart-uuid');
     * console.log(items.length); // Number of items in cart
     */
    findByCartId(cartId: string): Promise<CartItemEntity[]>;

    /**
     * Find cart item by cart and product
     * 
     * Used to check if product already exists in cart before adding.
     * 
     * @param cartId - Cart ID
     * @param productId - Product ID
     * @returns Cart item entity or null if not found
     * 
     * @example
     * const existingItem = await repository.findByCartAndProduct(
     *   'cart-uuid',
     *   'product-uuid'
     * );
     * if (existingItem) {
     *   // Product already in cart, update quantity
     * }
     */
    findByCartAndProduct(
        cartId: string,
        productId: string
    ): Promise<CartItemEntity | null>;

    /**
     * Update cart item quantity
     * 
     * @param itemId - Cart item ID to update
     * @param quantity - New quantity (1-99)
     * @returns Updated cart item entity
     * @throws Error if item not found
     * @throws Error if quantity out of range (CHECK constraint)
     * 
     * @example
     * const item = await repository.updateQuantity('item-uuid', 5);
     */
    updateQuantity(itemId: string, quantity: number): Promise<CartItemEntity>;

    /**
     * Delete cart item
     * 
     * @param itemId - Cart item ID to delete
     * @returns void
     * 
     * @example
     * await repository.delete('item-uuid');
     */
    delete(itemId: string): Promise<void>;

    /**
     * Delete all cart items by cart ID
     * 
     * Used when clearing a cart or deleting a cart.
     * 
     * @param cartId - Cart ID to delete items for
     * @returns void
     * 
     * @example
     * await repository.deleteByCartId('cart-uuid');
     */
    deleteByCartId(cartId: string): Promise<void>;
}
