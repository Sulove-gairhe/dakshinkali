/**
 * CartItemRepositoryImpl - Concrete implementation of CartItemRepository
 * 
 * This class implements all database operations for cart items using Supabase.
 * It handles SQL query construction, execution, and row-to-entity mapping for cart_items table.
 * 
 * @remarks
 * - Uses Supabase client for database access
 * - Maps database rows (snake_case) to CartItemEntity (camelCase)
 * - Converts numeric price to number type
 * - Converts timestamps to Date objects
 * - Translates database errors to domain exceptions
 * - Enforces quantity constraints (1-99) and uniqueness (cart_id, product_id)
 * 
 * **QUERY OPTIMIZATION & SECURITY:**
 * 
 * 1. SQL Injection Prevention:
 *    - All queries use Supabase query builder with parameterized values
 *    - Methods like .eq(), .update() automatically escape and parameterize inputs
 *    - NO string concatenation or interpolation in SQL queries
 * 
 * 2. Index Usage:
 *    - idx_cart_items_cart_id: Index on cart_id for fast cart items lookup
 *    - idx_cart_items_product_id: Index on product_id for product reference checks
 *    - Unique constraint index on (cart_id, product_id) for duplicate prevention
 * 
 * 3. Performance Optimizations:
 *    - Parameterized queries for all operations
 *    - Efficient WHERE clauses using indexed columns
 *    - Bulk delete operations for clearing cart items
 * 
 * 4. Available Indexes:
 *    - idx_cart_items_cart_id: Index on cart_id
 *    - idx_cart_items_product_id: Index on product_id
 *    - Unique constraint on (cart_id, product_id)
 * 
 * **Validates: Requirements AR-5, AR-7, AR-8, NFR-1**
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CartItemEntity } from '../entities/cart-item.entity';
import { CartItemRepository } from './cart-item.repository';

/**
 * Database row interface for cart_items table
 * Represents the raw structure returned from Supabase queries
 * Uses snake_case to match PostgreSQL naming conventions
 */
interface CartItemRow {
    id: string;
    cart_id: string;
    product_id: string;
    quantity: number;
    price_at_addition: string | number;
    created_at: string;
    updated_at: string;
}

/**
 * CartItemRepositoryImpl
 * 
 * Concrete implementation of CartItemRepository interface using Supabase.
 */
export class CartItemRepositoryImpl implements CartItemRepository {
    constructor(private readonly supabase: SupabaseClient) { }

    /**
     * Create a new cart item
     * 
     * @param cartId - Cart UUID that owns this item
     * @param productId - Product UUID being added to cart
     * @param quantity - Item quantity (must be 1-99)
     * @param price - Product price at time of adding (price snapshot)
     * @returns Promise resolving to the created CartItemEntity with generated id and timestamps
     * 
     * @throws Error if item already exists for this cart and product (unique constraint)
     * @throws Error if quantity is outside 1-99 range (check constraint)
     * @throws Error if price <= 0 (check constraint)
     * @throws Error if cart or product does not exist (foreign key violation)
     * @throws Error for database errors
     * 
     * @remarks
     * - Generates UUID for id if not provided
     * - Sets created_at and updated_at to NOW()
     * - Enforces UNIQUE constraint on (cart_id, product_id)
     * - Enforces CHECK constraint: quantity > 0 AND quantity <= 99
     * - Enforces CHECK constraint: price_at_addition > 0
     * - Price is a snapshot captured at time of adding (not a reference to product table)
     * 
     * **Validates: Requirements AR-5, AR-7, AR-8, BR-1, BR-10, NFR-8, NFR-9, NFR-10**
     */
    async create(cartId: string, productId: string, quantity: number, price: number): Promise<CartItemEntity> {
        // Convert to database row format (snake_case)
        const row = {
            cart_id: cartId,
            product_id: productId,
            quantity,
            price_at_addition: price,
        };

        // Execute INSERT query
        const { data, error } = await this.supabase
            .from('cart_items')
            .insert(row)
            .select()
            .single();

        if (error) {
            // Translate database errors to domain exceptions
            if (error.code === '23505') {
                // Unique constraint violation (cart_id, product_id)
                throw new Error(
                    `Product '${productId}' already exists in cart '${cartId}'.`
                );
            }
            if (error.code === '23514') {
                // Check constraint violation
                if (error.message.includes('quantity')) {
                    throw new Error('Quantity must be between 1 and 99.');
                }
                if (error.message.includes('price')) {
                    throw new Error('Price must be greater than 0.');
                }
                throw new Error(`Check constraint violation: ${error.message}`);
            }
            if (error.code === '23503') {
                // Foreign key violation
                if (error.message.includes('cart_id')) {
                    throw new Error(`Cart with ID '${cartId}' not found.`);
                }
                if (error.message.includes('product_id')) {
                    throw new Error(`Product with ID '${productId}' not found.`);
                }
                throw new Error(`Foreign key violation: ${error.message}`);
            }
            throw new Error(`Failed to create cart item: ${error.message}`);
        }

        if (!data) {
            throw new Error('Failed to create cart item: No data returned');
        }

        // Map database row to CartItemEntity
        return this.mapRowToEntity(data);
    }

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
     * **Validates: Requirements AR-5, AR-7, AR-8**
     */
    async findById(itemId: string): Promise<CartItemEntity | null> {
        const { data, error } = await this.supabase
            .from('cart_items')
            .select()
            .eq('id', itemId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to find cart item: ${error.message}`);
        }

        if (!data) {
            return null;
        }

        return this.mapRowToEntity(data);
    }

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
     * **Validates: Requirements AR-5, AR-7, AR-8, NFR-1**
     */
    async findByCartId(cartId: string): Promise<CartItemEntity[]> {
        const { data, error } = await this.supabase
            .from('cart_items')
            .select()
            .eq('cart_id', cartId);

        if (error) {
            throw new Error(`Failed to find cart items: ${error.message}`);
        }

        return (data || []).map(row => this.mapRowToEntity(row));
    }

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
     * **Validates: Requirements AR-5, AR-7, AR-8, NFR-1**
     */
    async findByCartAndProduct(cartId: string, productId: string): Promise<CartItemEntity | null> {
        const { data, error } = await this.supabase
            .from('cart_items')
            .select()
            .eq('cart_id', cartId)
            .eq('product_id', productId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to find cart item: ${error.message}`);
        }

        if (!data) {
            return null;
        }

        return this.mapRowToEntity(data);
    }

    /**
     * Update the quantity of a cart item
     * 
     * @param itemId - Cart item UUID to update
     * @param quantity - New quantity (must be 1-99)
     * @returns Promise resolving to the updated CartItemEntity
     * 
     * @throws Error if cart item not found
     * @throws Error if quantity is outside 1-99 range (check constraint)
     * @throws Error for database errors
     * 
     * @remarks
     * - Only updates quantity field (price snapshot remains unchanged)
     * - updated_at is automatically set by database trigger
     * - Enforces CHECK constraint: quantity > 0 AND quantity <= 99
     * - Service layer should delete item if quantity becomes 0
     * 
     * **Validates: Requirements AR-5, AR-7, AR-8, BR-10**
     */
    async updateQuantity(itemId: string, quantity: number): Promise<CartItemEntity> {
        // Execute UPDATE query
        const { data, error } = await this.supabase
            .from('cart_items')
            .update({ quantity })
            .eq('id', itemId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error(`Cart item with ID '${itemId}' not found.`);
            }
            if (error.code === '23514') {
                // Check constraint violation
                throw new Error('Quantity must be between 1 and 99.');
            }
            throw new Error(`Failed to update cart item quantity: ${error.message}`);
        }

        if (!data) {
            throw new Error(`Cart item with ID '${itemId}' not found.`);
        }

        return this.mapRowToEntity(data);
    }

    /**
     * Delete a single cart item
     * 
     * @param itemId - Cart item UUID to delete
     * @returns Promise resolving when deletion is complete
     * 
     * @throws Error if cart item not found
     * @throws Error for database errors
     * 
     * @remarks
     * - Hard delete (not soft delete)
     * - Does not cascade to cart (cart remains even if all items deleted)
     * - Used when customer removes item from cart
     * - Idempotent: calling on non-existent item throws error
     * 
     * **Validates: Requirements AR-5, AR-7, AR-8**
     */
    async delete(itemId: string): Promise<void> {
        const { data, error } = await this.supabase
            .from('cart_items')
            .delete()
            .eq('id', itemId)
            .select()
            .single();

        if (error || !data) {
            throw new Error(`Cart item with ID '${itemId}' not found or could not be deleted.`);
        }
    }

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
     * **Validates: Requirements AR-5, AR-7, AR-8**
     */
    async deleteByCartId(cartId: string): Promise<void> {
        const { error } = await this.supabase
            .from('cart_items')
            .delete()
            .eq('cart_id', cartId);

        if (error) {
            throw new Error(`Failed to delete cart items: ${error.message}`);
        }

        // Note: This operation is idempotent - no error if cart has no items
    }

    /**
     * Map database row to CartItemEntity
     * 
     * Handles all type conversions:
     * - numeric/string to number (price_at_addition)
     * - string timestamps to Date objects
     * - snake_case to camelCase
     * 
     * @param row - Raw database row
     * @returns CartItemEntity with proper types
     * 
     * @remarks
     * This is a critical method that ensures type safety between database and domain layers.
     * All database rows MUST pass through this mapping function.
     * 
     * **Validates: Requirements AR-8**
     */
    private mapRowToEntity(row: CartItemRow): CartItemEntity {
        // Parse numeric price to number
        const priceAtAddition = typeof row.price_at_addition === 'string'
            ? parseFloat(row.price_at_addition)
            : row.price_at_addition;

        // Parse timestamps to Date objects
        const createdAt = new Date(row.created_at);
        const updatedAt = new Date(row.updated_at);

        return {
            id: row.id,
            cartId: row.cart_id,
            productId: row.product_id,
            quantity: row.quantity,
            priceAtAddition,
            createdAt,
            updatedAt,
        };
    }
}
