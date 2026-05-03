/**
 * Cart DTOs - Data Transfer Objects for API responses
 * 
 * These DTOs define the structure of cart data returned to clients.
 * They shield clients from database schema changes and include computed fields.
 * 
 * @remarks
 * - DTOs are unidirectional (Entity → DTO only)
 * - Include computed fields (subtotal, itemCount) not stored in database
 * - Use camelCase for JSON responses
 * - Timestamps are ISO 8601 strings
 * 
 * **Validates: Requirements AR-4, Requirement 10**
 */

/**
 * CartItemDTO - Response DTO for a single cart item
 * 
 * Represents a cart item with enriched product information and computed fields.
 * Used in CartDTO.items array.
 */
export interface CartItemDTO {
    /** Cart item identifier (UUID) */
    id: string;

    /** Product identifier (UUID) */
    productId: string;

    /** Product name (for display) */
    productName: string;

    /** Primary product image URL (null if no images) */
    productImage: string | null;

    /** Product availability status ('active', 'inactive', 'out_of_stock') */
    productStatus: string;

    /** Item quantity (1-99) */
    quantity: number;

    /** Product price at time of adding to cart (price snapshot) */
    priceAtAddition: number;

    /** Current product price (may differ from priceAtAddition) */
    currentPrice: number;

    /** Item subtotal (quantity × priceAtAddition) */
    subtotal: number;

    /** Whether product is currently available (not deleted, status active) */
    isAvailable: boolean;

    /** Whether product price has changed since adding to cart */
    priceChanged: boolean;
}

/**
 * CartDTO - Response DTO for a shopping cart with items
 * 
 * Represents a complete cart with all items and calculated totals.
 * Returned by all cart service methods.
 */
export interface CartDTO {
    /** Cart identifier (UUID) */
    id: string;

    /** Authenticated user identifier (UUID, null for guest carts) */
    userId: string | null;

    /** Array of cart items with enriched product information */
    items: CartItemDTO[];

    /** Cart subtotal (sum of all item subtotals) */
    subtotal: number;

    /** Cart total (same as subtotal for now, may include taxes/shipping later) */
    total: number;

    /** Total number of items in cart (sum of all item quantities) */
    itemCount: number;

    /** Timestamp when cart was created (ISO 8601 string) */
    createdAt: string;

    /** Timestamp when cart was last updated (ISO 8601 string) */
    updatedAt: string;
}
