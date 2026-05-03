/**
 * CartItemEntity - Domain model representing a cart item in the database
 * 
 * This entity maps directly to the cart_items table in Supabase PostgreSQL.
 * It includes all fields from the database schema with proper TypeScript typing.
 * 
 * @remarks
 * - priceAtAddition is a price snapshot captured when the item was added to cart
 * - This prevents price manipulation and preserves the price at time of adding
 * - updatedAt is automatically managed by database trigger
 * - Quantity is constrained to 1-99 by database CHECK constraint
 */

/**
 * CartItemEntity - Complete cart item domain model
 * 
 * Represents a single item within a shopping cart with all database fields
 * mapped to TypeScript types. This entity is used internally by the Repository
 * and Service layers.
 * 
 * @remarks
 * - API responses use CartItemDTO instead of this entity
 * - A cart can have only one entry per product (enforced by unique constraint)
 * - Deleting a cart cascades to delete all its items
 * - Deleting a product cascades to delete all cart items referencing it
 */
export interface CartItemEntity {
    /** Unique cart item identifier (UUID v4) */
    id: string;

    /** Cart identifier (UUID, foreign key to carts table) */
    cartId: string;

    /** Product identifier (UUID, foreign key to products table) */
    productId: string;

    /** Item quantity (INTEGER, must be 1-99, enforced by CHECK constraint) */
    quantity: number;

    /** Product price at time of adding to cart (NUMERIC(10,2), price snapshot) */
    priceAtAddition: number;

    /** Timestamp when item was added to cart (auto-generated) */
    createdAt: Date;

    /** Timestamp when item was last updated (auto-updated by trigger) */
    updatedAt: Date;
}

/**
 * CartWithItemsEntity - Aggregate root combining cart with its items
 * 
 * Extends CartEntity to include the full collection of cart items with
 * enriched product information. Used for efficient retrieval of complete
 * cart data in a single query.
 * 
 * @remarks
 * - This aggregate is typically returned by Repository.findWithItems()
 * - Uses JOIN queries to fetch cart + items + product data efficiently
 * - Service layer transforms this to CartDTO for API responses
 */
export interface CartWithItemsEntity {
    /** Unique cart identifier (UUID v4) */
    id: string;

    /** Authenticated user identifier (UUID, nullable, references auth.users) */
    userId: string | null;

    /** Anonymous session identifier (TEXT, nullable, client-generated UUID) */
    sessionId: string | null;

    /** Timestamp when cart was created (auto-generated) */
    createdAt: Date;

    /** Timestamp when cart was last updated (auto-updated by trigger) */
    updatedAt: Date;

    /** Array of cart items with enriched product information */
    items: CartItemWithProductEntity[];
}

/**
 * CartItemWithProductEntity - Cart item enriched with product details
 * 
 * Extends CartItemEntity to include essential product information needed
 * for displaying cart items in the UI. This avoids N+1 queries by joining
 * with the products table.
 * 
 * @remarks
 * - Product data is fetched via JOIN in Repository layer
 * - Product fields are denormalized for read performance
 * - deletedAt indicates if the product has been soft-deleted
 * - Service layer uses this to determine product availability
 */
export interface CartItemWithProductEntity extends CartItemEntity {
    /** Enriched product information from products table */
    product: {
        /** Product identifier (UUID) */
        id: string;

        /** Product name (for display in cart) */
        name: string;

        /** Current product price (may differ from priceAtAddition) */
        price: number;

        /** Product availability status ('active', 'inactive', 'out_of_stock') */
        status: string;

        /** Array of product image URLs (JSONB in DB) */
        images: string[];

        /** Soft deletion timestamp (null = active, timestamp = deleted) */
        deletedAt: Date | null;
    };
}
