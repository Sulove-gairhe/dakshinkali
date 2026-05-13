/**
 * CartItemRepository Implementation
 * 
 * Implements cart item data access using Supabase PostgreSQL.
 * Uses parameterized queries to prevent SQL injection.
 * 
 * Requirements: AR-5, AR-7, AR-8, NFR-1 (Supabase integration, connection pooling, security, performance)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CartItemRepository } from './cart-item.repository';
import { CartItemEntity, CartItemRow, mapRowToCartItemEntity } from '../entities';

/**
 * Supabase implementation of CartItemRepository
 */
export class CartItemRepositoryImpl implements CartItemRepository {
    constructor(private readonly supabase: SupabaseClient) { }

    /**
     * Create a new cart item
     */
    async create(
        cartId: string,
        productId: string,
        quantity: number,
        priceSnapshot: number
    ): Promise<CartItemEntity> {
        const { data, error } = await this.supabase
            .from('cart_items')
            .insert({
                cart_id: cartId,
                product_id: productId,
                quantity,
                price_at_addition: priceSnapshot,
            })
            .select()
            .single();

        if (error) {
            // Check for unique constraint violation
            if (error.code === '23505') {
                throw new Error(`Product '${productId}' already exists in cart '${cartId}'.`);
            }
            // Check for quantity constraint violation
            if (error.code === '23514') {
                if (error.message.includes('cart_items_quantity_range')) {
                    throw new Error('Quantity must be between 1 and 99.');
                }
                if (error.message.includes('cart_items_price_positive')) {
                    throw new Error('Price must be greater than 0.');
                }
                throw new Error('Quantity must be between 1 and 99.');
            }
            // Check for foreign key violations
            if (error.code === '23503') {
                if (error.message.includes('cart_items_cart_id_fkey')) {
                    throw new Error(`Cart with ID '${cartId}' not found.`);
                }
                if (error.message.includes('cart_items_product_id_fkey')) {
                    throw new Error(`Product with ID '${productId}' not found.`);
                }
            }
            throw new Error(`Failed to create cart item: ${error.message}`);
        }

        if (!data) {
            throw new Error('Failed to create cart item: No data returned');
        }

        const mapped = mapRowToCartItemEntity(data as CartItemRow);
        if (!mapped) {
            throw new Error('Failed to create cart item: Mapping returned null');
        }
        return mapped;
    }

    /**
     * Find cart item by ID
     */
    async findById(itemId: string): Promise<CartItemEntity | null> {
        const { data, error } = await this.supabase
            .from('cart_items')
            .select()
            .eq('id', itemId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found
                return null;
            }
            throw new Error(`Failed to find cart item: ${error.message}`);
        }

        return mapRowToCartItemEntity(data as CartItemRow);
    }

    /**
     * Find all cart items by cart ID
     */
    async findByCartId(cartId: string): Promise<CartItemEntity[]> {
        const { data, error } = await this.supabase
            .from('cart_items')
            .select()
            .eq('cart_id', cartId);

        if (error) {
            throw new Error(`Failed to find cart items: ${error.message}`);
        }

        if (!data) {
            return [];
        }

        return data.map((row) => mapRowToCartItemEntity(row as CartItemRow)).filter((item): item is CartItemEntity => item !== null);
    }

    /**
     * Find cart item by cart and product
     */
    async findByCartAndProduct(
        cartId: string,
        productId: string
    ): Promise<CartItemEntity | null> {
        const { data, error } = await this.supabase
            .from('cart_items')
            .select()
            .eq('cart_id', cartId)
            .eq('product_id', productId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found
                return null;
            }
            throw new Error(`Failed to find cart item: ${error.message}`);
        }

        return mapRowToCartItemEntity(data as CartItemRow);
    }

    /**
     * Update cart item quantity
     */
    async updateQuantity(itemId: string, quantity: number): Promise<CartItemEntity> {
        const { data, error } = await this.supabase
            .from('cart_items')
            .update({ quantity })
            .eq('id', itemId)
            .select()
            .single();

        if (error) {
            // Check for not found error
            if (error.code === 'PGRST116') {
                throw new Error(`Cart item with ID '${itemId}' not found.`);
            }
            // Check for quantity constraint violation
            if (error.code === '23514') {
                throw new Error('Quantity must be between 1 and 99.');
            }
            throw new Error(`Failed to update cart item quantity: ${error.message}`);
        }

        if (!data) {
            throw new Error(`Cart item with ID '${itemId}' not found.`);
        }

        const mapped = mapRowToCartItemEntity(data as CartItemRow);
        if (!mapped) {
            throw new Error(`Cart item with ID '${itemId}' not found.`);
        }
        return mapped;
    }

    /**
     * Delete cart item
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
     * Delete all cart items by cart ID
     */
    async deleteByCartId(cartId: string): Promise<void> {
        const { error } = await this.supabase
            .from('cart_items')
            .delete()
            .eq('cart_id', cartId);

        if (error) {
            throw new Error(`Failed to delete cart items: ${error.message}`);
        }
    }
}
