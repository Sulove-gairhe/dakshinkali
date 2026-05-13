/**
 * CartItemEntity - Domain model representing an item in a shopping cart
 * 
 * This entity maps directly to the cart_items table in Supabase PostgreSQL.
 * Includes price snapshot for historical pricing and product reference.
 * 
 * Requirements: AR-1 (Repository layer for data access)
 */

import { CartEntity } from './cart.entity';

/**
 * Cart item entity representing a product in a cart
 * 
 * @property id - Unique cart item identifier (UUID)
 * @property cartId - Reference to parent cart
 * @property productId - Reference to product
 * @property quantity - Quantity of product (1-99)
 * @property priceAtAddition - Product price at time of adding to cart (alias for priceSnapshot)
 * @property priceSnapshot - Product price at time of adding to cart
 * @property createdAt - Timestamp when item was added to cart
 * @property updatedAt - Timestamp when item was last updated
 */
export interface CartItemEntity {
    /**
     * Unique cart item identifier (UUID)
     */
    id: string;

    /**
     * Reference to parent cart (foreign key)
     */
    cartId: string;

    /**
     * Reference to product (foreign key)
     */
    productId: string;

    /**
     * Quantity of product (1-99)
     * Enforced by database CHECK constraint
     */
    quantity: number;

    /**
     * Product price at time of adding to cart
     * Prevents price manipulation and shows price changes
     */
    priceSnapshot: number;

    /**
     * Alias for priceSnapshot - Product price at time of adding to cart
     * Prevents price manipulation and shows price changes
     */
    priceAtAddition: number;

    /**
     * Timestamp when item was added to cart
     */
    createdAt: Date;

    /**
     * Timestamp when item was last updated
     * Automatically updated by database trigger
     */
    updatedAt: Date;
}

/**
 * Cart item with product details (for joined queries)
 * Used when retrieving cart with full product information
 */
export interface CartItemWithProductEntity extends CartItemEntity {
    /**
     * Product details joined from products table
     */
    product: {
        id: string;
        name: string;
        price: number;
        status: string;
        images: string[];
        deletedAt: Date | null;
    };
}

/**
 * Cart with all items (aggregate root)
 * Used when retrieving complete cart with items
 */
export interface CartWithItemsEntity extends CartEntity {
    /**
     * All items in the cart with product details
     */
    items: CartItemWithProductEntity[];
}

/**
 * Database row type from cart_items table
 * Used for mapping database results to CartItemEntity
 */
export interface CartItemRow {
    id: string;
    cart_id: string;
    product_id: string;
    quantity: number;
    price_at_addition: string | number; // NUMERIC comes as string from PostgreSQL, but can also be number
    created_at: string;
    updated_at: string;
}

/**
 * Database row type for cart items with product details (joined query)
 */
export interface CartItemWithProductRow extends CartItemRow {
    product_id: string;
    product_name: string;
    product_price: string | number;
    product_status: string;
    product_images: any; // JSONB
    product_deleted_at: string | null;
}

/**
 * Map database row to CartItemEntity
 * 
 * @param row - Database row from cart_items table
 * @returns CartItemEntity with properly typed and parsed fields
 */
export function mapRowToCartItemEntity(row: CartItemRow | null): CartItemEntity | null {
    if (!row) {
        return null;
    }

    const price = typeof row.price_at_addition === 'string'
        ? parseFloat(row.price_at_addition)
        : row.price_at_addition;

    return {
        id: row.id,
        cartId: row.cart_id,
        productId: row.product_id,
        quantity: row.quantity,
        priceSnapshot: price,
        priceAtAddition: price,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

/**
 * Map database row to CartItemWithProductEntity
 * 
 * @param row - Database row from joined query (cart_items + products)
 * @returns CartItemWithProductEntity with product details
 */
export function mapRowToCartItemWithProductEntity(
    row: CartItemWithProductRow
): CartItemWithProductEntity {
    // Parse images from JSONB
    let images: string[] = [];
    if (row.product_images) {
        try {
            images = typeof row.product_images === 'string'
                ? JSON.parse(row.product_images)
                : row.product_images;
        } catch {
            images = [];
        }
    }

    const price = typeof row.price_at_addition === 'string'
        ? parseFloat(row.price_at_addition)
        : row.price_at_addition;

    return {
        id: row.id,
        cartId: row.cart_id,
        productId: row.product_id,
        quantity: row.quantity,
        priceSnapshot: price,
        priceAtAddition: price,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        product: {
            id: row.product_id,
            name: row.product_name,
            price: typeof row.product_price === 'string'
                ? parseFloat(row.product_price)
                : row.product_price,
            status: row.product_status,
            images,
            deletedAt: row.product_deleted_at ? new Date(row.product_deleted_at) : null,
        },
    };
}
