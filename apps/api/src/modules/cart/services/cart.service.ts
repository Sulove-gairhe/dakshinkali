/**
 * CartService - Service Layer Interface
 * 
 * This interface defines the contract for all business logic operations related to shopping carts.
 * It orchestrates repository operations, enforces business rules, validates product availability,
 * manages price snapshots, and handles cart merging for authenticated users.
 * 
 * @remarks
 * - This layer validates all business rules before calling Repository Layer
 * - Handles multi-step operations (product validation → stock check → cart update)
 * - Coordinates CartRepository, CartItemRepository, and ProductService
 * - Translates repository exceptions into appropriate domain exceptions
 * - Enforces authorization rules (users can only access their own carts)
 * - Implements price snapshot strategy (captures price at time of adding to cart)
 * - Supports both authenticated users (userId) and guest users (sessionId)
 * 
 * @see CartRepository for cart database operations
 * @see CartItemRepository for cart item database operations
 * @see ProductService for product validation and availability checks
 * 
 * **Validates: Requirements AR-2**
 */

import { CartWithItemsEntity } from '../entities/cart-item.entity';
import { CartDTO } from '../dto/cart.dto';

/**
 * CartService interface
 * 
 * Defines all business logic operations for the Cart Module.
 * Implementations must handle:
 * - Business rule validation (quantity limits, product availability, stock checks)
 * - Multi-step operation orchestration (product validation + cart update)
 * - Price snapshot management (capture price at time of adding)
 * - Cart total calculations (subtotal, itemCount)
 * - Cart merging (guest cart → user cart on login)
 * - Authorization logic (users can only access their own carts)
 * - Exception translation (repository exceptions → domain exceptions)
 */
export interface CartService {
    /**
     * Add a product to cart with specified quantity
     * 
     * Business rules enforced:
     * - Product must exist and be active (status = 'active', deletedAt IS NULL)
     * - Quantity must be between 1 and 99
     * - If product already in cart, add quantities together (max 99)
     * - Requested quantity must not exceed available stock
     * - Price snapshot captured at time of adding (priceAtAddition)
     * 
     * Multi-step operation:
     * 1. Validate product exists and is active (via ProductService)
     * 2. Validate requested quantity does not exceed available stock
     * 3. Get current product price for snapshot
     * 4. Find or create cart for user/session
     * 5. Check if product already in cart
     *    - If yes: Update quantity (existing + new, max 99)
     *    - If no: Create new cart item with price snapshot
     * 6. Return updated cart with calculated totals
     * 
     * @param userId - Authenticated user identifier (UUID, nullable)
     * @param sessionId - Anonymous session identifier (UUID, nullable)
     * @param productId - Product UUID to add to cart
     * @param quantity - Quantity to add (must be 1-99)
     * @returns Promise resolving to CartDTO with updated cart and items
     * 
     * @throws ValidationException if quantity is invalid or exceeds stock
     * @throws NotFoundException if product not found or inactive
     * @throws ProductNotAvailableException if product is deleted or inactive
     * @throws InvalidQuantityException if quantity < 1 or > 99
     * @throws InvalidQuantityException if combined quantity exceeds 99
     * 
     * **Validates: Requirements FR-1 (Requirement 1: Add Item to Cart)**
     */
    addToCart(
        userId: string | null,
        sessionId: string | null,
        productId: string,
        quantity: number
    ): Promise<CartDTO>;

    /**
     * Get cart with all items and calculated totals
     * 
     * Business rules enforced:
     * - Returns cart for authenticated user (userId) or guest (sessionId)
     * - Enriches cart items with current product information
     * - Calculates subtotal (sum of all item totals)
     * - Calculates itemCount (sum of all item quantities)
     * - Indicates if product price has changed since adding to cart
     * - Indicates if product is no longer available (deleted or inactive)
     * 
     * Multi-step operation:
     * 1. Find cart by userId or sessionId
     * 2. If not found, return null
     * 3. Retrieve cart with items (joined with products)
     * 4. For each item:
     *    - Calculate item subtotal (quantity × priceAtAddition)
     *    - Check if product available (deletedAt IS NULL, status = 'active')
     *    - Check if price changed (currentPrice ≠ priceAtAddition)
     * 5. Calculate cart subtotal and itemCount
     * 6. Transform to CartDTO
     * 
     * @param userId - Authenticated user identifier (UUID, nullable)
     * @param sessionId - Anonymous session identifier (UUID, nullable)
     * @returns Promise resolving to CartDTO or null if cart not found
     * 
     * **Validates: Requirements FR-4 (Requirement 4: Get Cart with Items and Totals)**
     */
    getCart(userId: string | null, sessionId: string | null): Promise<CartDTO | null>;

    /**
     * Update cart item quantity
     * 
     * Business rules enforced:
     * - Cart item must belong to the user's cart (authorization check)
     * - New quantity must be between 1 and 99
     * - If quantity is 0, remove the item from cart
     * - New quantity must not exceed available stock
     * - Price snapshot (priceAtAddition) remains unchanged
     * 
     * Multi-step operation:
     * 1. Find cart item by itemId
     * 2. Validate cart item exists
     * 3. Validate cart item belongs to user's cart (authorization)
     * 4. Validate new quantity does not exceed stock
     * 5. If quantity is 0, delete cart item
     * 6. Otherwise, update cart item quantity
     * 7. Return updated cart with calculated totals
     * 
     * @param userId - Authenticated user identifier (UUID, nullable)
     * @param sessionId - Anonymous session identifier (UUID, nullable)
     * @param itemId - Cart item UUID to update
     * @param quantity - New quantity (0 to remove, 1-99 to update)
     * @returns Promise resolving to CartDTO with updated cart
     * 
     * @throws NotFoundException if cart item not found
     * @throws UnauthorizedCartAccessException if cart item belongs to different user/session
     * @throws InvalidQuantityException if quantity < 0 or > 99
     * @throws ValidationException if quantity exceeds available stock
     * 
     * **Validates: Requirements FR-2 (Requirement 2: Update Cart Item Quantity)**
     */
    updateCartItem(
        userId: string | null,
        sessionId: string | null,
        itemId: string,
        quantity: number
    ): Promise<CartDTO>;

    /**
     * Remove item from cart
     * 
     * Business rules enforced:
     * - Cart item must belong to the user's cart (authorization check)
     * - Empty cart record is preserved after removing last item
     * 
     * Multi-step operation:
     * 1. Find cart item by itemId
     * 2. Validate cart item exists
     * 3. Validate cart item belongs to user's cart (authorization)
     * 4. Delete cart item
     * 5. Return updated cart with calculated totals
     * 
     * @param userId - Authenticated user identifier (UUID, nullable)
     * @param sessionId - Anonymous session identifier (UUID, nullable)
     * @param itemId - Cart item UUID to remove
     * @returns Promise resolving to CartDTO with updated cart
     * 
     * @throws NotFoundException if cart item not found
     * @throws UnauthorizedCartAccessException if cart item belongs to different user/session
     * 
     * **Validates: Requirements FR-3 (Requirement 3: Remove Item from Cart)**
     */
    removeCartItem(
        userId: string | null,
        sessionId: string | null,
        itemId: string
    ): Promise<CartDTO>;

    /**
     * Clear all items from cart
     * 
     * Business rules enforced:
     * - Cart must belong to the user (authorization check)
     * - Empty cart record is preserved after clearing
     * - Operation is idempotent (no error if cart already empty)
     * 
     * Multi-step operation:
     * 1. Find cart by userId or sessionId
     * 2. If cart not found, return (idempotent)
     * 3. Validate cart belongs to user (authorization)
     * 4. Delete all cart items
     * 5. Keep cart record for future additions
     * 
     * @param userId - Authenticated user identifier (UUID, nullable)
     * @param sessionId - Anonymous session identifier (UUID, nullable)
     * @returns Promise resolving when cart is cleared
     * 
     * **Validates: Requirements FR-5 (Requirement 5: Clear Cart)**
     */
    clearCart(userId: string | null, sessionId: string | null): Promise<void>;

    /**
     * Merge guest cart into user cart on login
     * 
     * Business rules enforced:
     * - Guest cart (sessionId) is merged into user cart (userId)
     * - If same product exists in both carts, add quantities together (max 99)
     * - Merged quantities must not exceed available stock
     * - Guest cart is deleted after successful merge
     * - If user has no cart, guest cart is converted to user cart
     * - Price snapshots from guest cart are preserved
     * 
     * Multi-step operation:
     * 1. Find guest cart by sessionId
     * 2. If guest cart not found, return empty cart or user's existing cart
     * 3. Find or create user cart by userId
     * 4. For each item in guest cart:
     *    - Check if product exists in user cart
     *      - If yes: Add quantities (max 99), validate stock
     *      - If no: Create new item in user cart with guest cart's price snapshot
     * 5. Delete guest cart
     * 6. Return merged user cart with calculated totals
     * 
     * @param userId - Authenticated user identifier (UUID, required)
     * @param sessionId - Anonymous session identifier (UUID, required)
     * @returns Promise resolving to CartDTO with merged cart
     * 
     * @throws ValidationException if merged quantities exceed stock
     * @throws InvalidQuantityException if merged quantities exceed 99
     * 
     * **Validates: Requirements FR-6 (Requirement 6: Merge Guest Cart with User Cart)**
     */
    mergeCarts(userId: string, sessionId: string): Promise<CartDTO>;
}
