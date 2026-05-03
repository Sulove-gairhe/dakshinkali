/**
 * CartItemRepository - Repository Layer Interface
 * 
 * This interface defines the contract for all database operations related to cart items.
 * It encapsulates SQL query construction, execution, and row-to-entity mapping for cart_items table.
 * 
 * @remarks
 * - This is the ONLY layer that directly interacts with Supabase client for cart item operations
 * - Service Layer calls these methods and SHALL NOT access database directly
 * - All methods return CartItemEntity domain objects (not raw database rows)
 * - Database-specific errors are translated to domain exceptions
 * - Enforces quantity constraints (1-99) and uniqueness (cart_id, product_id)
 * 
 * @see CartItemEntity for the domain model structure
 * @see CartItemWithProductEntity for items enriched with product data
 * 
 * **Validates: Requirements AR-1, AR-6**
 */

import { CartItemEntity } from '../entities/cart-item.entity';

/**
 * CartItemRepository interface
 * 
 * Defines all database operations for cart items.
 * Implementations must handle:
 * - SQL query construction with parameterized values
 * - Database row to CartItemEntity mapping
 * - Timestamp to Date object conversion
 * - Uniqueness constraint enforcement (cart_id, product_id)
 * - Quantity constraint enforcement (1-99)
 * - Database error translation to domain exceptions
 */
export interface CartItemRepository {
    /**
     * Create a new cart item
     * 
     * @param cartId - Cart UUID that owns this item
     * @param productId - Product UUID being added to cart
     * @param quantity - Item quantity (must be 1-99)
     * @param price - Product price at time of adding (price snapshot)
     * @returns Promise resolving to the created CartItemEntity with generated id and timestamps
     * 
     * @throws ConflictException if item already exists for this cart and product
     * @throws ValidationException if quantity is outside 1-99 range or price <= 0
     * @throws NotFoundException if cart or product does not exist (foreign key violation)
     * @throws RepositoryException for database errors
     * 
     * @remarks
     * - Generates UUID for id if not provided
     * - Sets created_at and updated_at to NOW()
     * - Enforces UNIQUE constraint on (cart_id, product_id)
     * - Enforces CHECK constraint: quantity > 0 AND quantity <= 99
     * - Enforces CHECK constraint: price > 0
     * - Price is a snapshot captured at time of adding (not a reference to product table)
     * 
     * **Example:**
     * ```typescript
     * // Add product to cart with price snapshot
     * const item = await cartItemRepo.create(
     *   'cart-uuid-123',
     *   'product-uuid-456',
     *   2,
     *   29.99
     * );
     * ```
     * 
     * **Validates: Requirements AR-1, AR-6, BR-1, BR-10, NFR-8, NFR-9, NFR-10**
     */
    create(cartId: string, productId: string, quantity: number, price: number): Promise<CartItemEntity>;

    /**
     * Find a cart item by its unique identifier
     * 
     * @param itemId - Cart item UUID to find
     * @returns Promise resolving to CartItemEntity or null if not found
     * 
     * @remarks
     * - Returns null if cart item not found
     * - Maps database row to CartItemEntity with proper type conversions
     * - Does not include product details (use findWithItems on CartRepository for that)
     * 
     * **Example:**
     * ```typescript
     * const item = await cartItemRepo.findById('item-uuid-789');
     * if (item) {
     *   console.log(`Item quantity: ${item.quantity}`);
     * }
     * ```
     * 
     * **Validates: Requirements AR-1, AR-6**
     */
    findById(itemId: string): Promise<CartItemEntity | null>;

    /**
     * Find all cart items for a specific cart
     * 
     * @param cartId - Cart UUID to find items for
     * @returns Promise resolving to array of CartItemEntity (empty array if no items)
     * 
     * @remarks
     * - Returns empty array if cart has no items
     * - Uses index on cart_id for fast lookup
     * - Results are not ordered (Service layer can sort if needed)
     * - Does not include product details (use findWithItems on CartRepository for that)
     * 
     * **Example:**
     * ```typescript
     * const items = await cartItemRepo.findByCartId('cart-uuid-123');
     * const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
     * ```
     * 
     * **Validates: Requirements AR-1, AR-6, NFR-1**
     */
    findByCartId(cartId: string): Promise<CartItemEntity[]>;

    /**
     * Find a specific cart item by cart and product
     * 
     * @param cartId - Cart UUID
     * @param productId - Product UUID
     * @returns Promise resolving to CartItemEntity or null if not found
     * 
     * @remarks
     * - Returns null if product not in cart
     * - Uses unique constraint index for fast lookup
     * - Used to check if product already exists in cart before adding
     * - Service layer uses this to update quantity instead of creating duplicate
     * 
     * **Example:**
     * ```typescript
     * const existingItem = await cartItemRepo.findByCartAndProduct(
     *   'cart-uuid-123',
     *   'product-uuid-456'
     * );
     * if (existingItem) {
     *   // Product already in cart, update quantity
     *   await cartItemRepo.updateQuantity(existingItem.id, existingItem.quantity + 2);
     * } else {
     *   // Product not in cart, create new item
     *   await cartItemRepo.create('cart-uuid-123', 'product-uuid-456', 2, 29.99);
     * }
     * ```
     * 
     * **Validates: Requirements AR-1, AR-6, NFR-1**
     */
    findByCartAndProduct(cartId: string, productId: string): Promise<CartItemEntity | null>;

    /**
     * Update the quantity of a cart item
     * 
     * @param itemId - Cart item UUID to update
     * @param quantity - New quantity (must be 1-99)
     * @returns Promise resolving to the updated CartItemEntity
     * 
     * @throws NotFoundException if cart item not found
     * @throws ValidationException if quantity is outside 1-99 range
     * @throws RepositoryException for database errors
     * 
     * @remarks
     * - Only updates quantity field (price snapshot remains unchanged)
     * - updated_at is automatically set by database trigger
     * - Enforces CHECK constraint: quantity > 0 AND quantity <= 99
     * - Service layer should delete item if quantity becomes 0
     * 
     * **Example:**
     * ```typescript
     * // Increase quantity by 1
     * const item = await cartItemRepo.findById('item-uuid-789');
     * const updated = await cartItemRepo.updateQuantity(item.id, item.quantity + 1);
     * ```
     * 
     * **Validates: Requirements AR-1, AR-6, BR-10**
     */
    updateQuantity(itemId: string, quantity: number): Promise<CartItemEntity>;

    /**
     * Delete a single cart item
     * 
     * @param itemId - Cart item UUID to delete
     * @returns Promise resolving when deletion is complete
     * 
     * @throws NotFoundException if cart item not found
     * @throws RepositoryException for database errors
     * 
     * @remarks
     * - Hard delete (not soft delete)
     * - Does not cascade to cart (cart remains even if all items deleted)
     * - Used when customer removes item from cart
     * - Idempotent: calling on non-existent item throws NotFoundException
     * 
     * **Example:**
     * ```typescript
     * // Remove item from cart
     * await cartItemRepo.delete('item-uuid-789');
     * ```
     * 
     * **Validates: Requirements AR-1, AR-6**
     */
    delete(itemId: string): Promise<void>;

    /**
     * Delete all cart items for a specific cart
     * 
     * @param cartId - Cart UUID to delete all items from
     * @returns Promise resolving when deletion is complete
     * 
     * @remarks
     * - Hard delete (not soft delete)
     * - Deletes all items in a single query (efficient bulk delete)
     * - Does not delete the cart itself (cart remains empty)
     * - Used when customer clears cart or when cart is deleted (cascade)
     * - Idempotent: calling on cart with no items completes successfully
     * 
     * **Example:**
     * ```typescript
     * // Clear all items from cart
     * await cartItemRepo.deleteByCartId('cart-uuid-123');
     * ```
     * 
     * **Validates: Requirements AR-1, AR-6**
     */
    deleteByCartId(cartId: string): Promise<void>;
}
