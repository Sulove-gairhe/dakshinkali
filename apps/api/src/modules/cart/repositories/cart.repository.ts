/**
 * CartRepository - Repository Layer Interface
 * 
 * This interface defines the contract for all database operations related to shopping carts.
 * It encapsulates SQL query construction, execution, and row-to-entity mapping.
 * 
 * @remarks
 * - This is the ONLY layer that directly interacts with Supabase client for cart operations
 * - Service Layer calls these methods and SHALL NOT access database directly
 * - All methods return CartEntity domain objects (not raw database rows)
 * - Database-specific errors are translated to domain exceptions
 * - Supports both authenticated users (userId) and guest users (sessionId)
 * 
 * @see CartEntity for the domain model structure
 * @see CartWithItemsEntity for the aggregate with items
 * 
 * **Validates: Requirements AR-1, AR-6**
 */

import { CartEntity } from '../entities/cart.entity';
import { CartWithItemsEntity } from '../entities/cart-item.entity';

/**
 * CartRepository interface
 * 
 * Defines all database operations for the Cart Module.
 * Implementations must handle:
 * - SQL query construction with parameterized values
 * - Database row to CartEntity mapping
 * - Timestamp to Date object conversion
 * - Efficient JOIN queries for cart with items
 * - Database error translation to domain exceptions
 * - Enforcement of business rules (one cart per user/session)
 */
export interface CartRepository {
    /**
     * Create a new cart for a user or session
     * 
     * @param userId - Authenticated user identifier (UUID, nullable)
     * @param sessionId - Anonymous session identifier (TEXT, nullable)
     * @returns Promise resolving to the created CartEntity with generated id and timestamps
     * 
     * @throws ConflictException if cart already exists for user or session
     * @throws ValidationException if both userId and sessionId are null or both are provided
     * @throws RepositoryException for database errors
     * 
     * @remarks
     * - Generates UUID for id if not provided
     * - Sets created_at and updated_at to NOW()
     * - Either userId OR sessionId must be set (enforced by CHECK constraint)
     * - A user can have only one cart (enforced by unique constraint on user_id)
     * - A session can have only one cart (enforced by unique constraint on session_id)
     * 
     * **Example:**
     * ```typescript
     * // Create cart for authenticated user
     * const cart = await cartRepo.create('user-uuid-123', null);
     * 
     * // Create cart for guest user
     * const guestCart = await cartRepo.create(null, 'session-uuid-456');
     * ```
     * 
     * **Validates: Requirements AR-1, BR-6, NFR-12**
     */
    create(userId: string | null, sessionId: string | null): Promise<CartEntity>;

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
     * **Example:**
     * ```typescript
     * const cart = await cartRepo.findById('cart-uuid-123');
     * if (cart) {
     *   console.log(`Cart belongs to user: ${cart.userId}`);
     * }
     * ```
     * 
     * **Validates: Requirements AR-1, AR-6**
     */
    findById(cartId: string): Promise<CartEntity | null>;

    /**
     * Find a cart by authenticated user ID
     * 
     * @param userId - User UUID to find cart for
     * @returns Promise resolving to CartEntity or null if not found
     * 
     * @remarks
     * - Returns null if user has no cart
     * - Uses index on user_id for fast lookup
     * - A user can have only one cart (enforced by unique constraint)
     * 
     * **Example:**
     * ```typescript
     * const cart = await cartRepo.findByUserId('user-uuid-123');
     * if (!cart) {
     *   // User has no cart, create one
     *   cart = await cartRepo.create('user-uuid-123', null);
     * }
     * ```
     * 
     * **Validates: Requirements AR-1, AR-6, NFR-1**
     */
    findByUserId(userId: string): Promise<CartEntity | null>;

    /**
     * Find a cart by anonymous session ID
     * 
     * @param sessionId - Session identifier to find cart for
     * @returns Promise resolving to CartEntity or null if not found
     * 
     * @remarks
     * - Returns null if session has no cart
     * - Uses index on session_id for fast lookup
     * - A session can have only one cart (enforced by unique constraint)
     * 
     * **Example:**
     * ```typescript
     * const cart = await cartRepo.findBySessionId('session-uuid-456');
     * if (!cart) {
     *   // Session has no cart, create one
     *   cart = await cartRepo.create(null, 'session-uuid-456');
     * }
     * ```
     * 
     * **Validates: Requirements AR-1, AR-6, NFR-1**
     */
    findBySessionId(sessionId: string): Promise<CartEntity | null>;

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
     * ```sql
     * SELECT 
     *   c.id, c.user_id, c.session_id, c.created_at, c.updated_at,
     *   ci.id as item_id, ci.product_id, ci.quantity, ci.price_at_addition,
     *   p.name, p.price, p.status, p.images, p.deleted_at
     * FROM carts c
     * LEFT JOIN cart_items ci ON ci.cart_id = c.id
     * LEFT JOIN products p ON p.id = ci.product_id
     * WHERE c.id = $1;
     * ```
     * 
     * **Example:**
     * ```typescript
     * const cartWithItems = await cartRepo.findWithItems('cart-uuid-123');
     * if (cartWithItems) {
     *   const subtotal = cartWithItems.items.reduce(
     *     (sum, item) => sum + (item.quantity * item.priceAtAddition), 0
     *   );
     * }
     * ```
     * 
     * **Validates: Requirements AR-1, AR-6, NFR-1, NFR-4**
     */
    findWithItems(cartId: string): Promise<CartWithItemsEntity | null>;

    /**
     * Update a cart with partial data
     * 
     * @param cartId - Cart UUID to update
     * @param data - Partial CartEntity with fields to update
     * @returns Promise resolving to the updated CartEntity
     * 
     * @throws NotFoundException if cart not found
     * @throws ValidationException if attempting to set both userId and sessionId
     * @throws RepositoryException for database errors
     * 
     * @remarks
     * - Only updates provided fields (partial update)
     * - updated_at is automatically set by database trigger
     * - Cannot update id or created_at through this method
     * - Commonly used to convert guest cart to user cart (set userId, clear sessionId)
     * 
     * **Example:**
     * ```typescript
     * // Convert guest cart to user cart after login
     * const updatedCart = await cartRepo.update('cart-uuid-123', {
     *   userId: 'user-uuid-789',
     *   sessionId: null
     * });
     * ```
     * 
     * **Validates: Requirements AR-1, AR-6**
     */
    update(cartId: string, data: Partial<CartEntity>): Promise<CartEntity>;

    /**
     * Delete a cart and all its items
     * 
     * @param cartId - Cart UUID to delete
     * @returns Promise resolving when deletion is complete
     * 
     * @throws NotFoundException if cart not found
     * @throws RepositoryException for database errors
     * 
     * @remarks
     * - Hard delete (not soft delete)
     * - Cascades to delete all cart items (ON DELETE CASCADE)
     * - Used when merging carts (delete guest cart after merge)
     * - Idempotent: calling on non-existent cart throws NotFoundException
     * 
     * **Example:**
     * ```typescript
     * // Delete guest cart after merging into user cart
     * await cartRepo.delete('guest-cart-uuid-456');
     * ```
     * 
     * **Validates: Requirements AR-1, AR-6**
     */
    delete(cartId: string): Promise<void>;
}
