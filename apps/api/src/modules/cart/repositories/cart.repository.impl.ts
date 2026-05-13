/**
 * CartRepository Implementation
 * 
 * Implements cart data access using Supabase PostgreSQL.
 * Uses parameterized queries to prevent SQL injection.
 * 
 * Requirements: AR-5, AR-7, AR-8, NFR-1 (Supabase integration, connection pooling, security, performance)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CartRepository } from './cart.repository';
import {
    CartEntity,
    CartWithItemsEntity,
    CartRow,
    mapRowToCartEntity,
    CartItemWithProductRow,
    mapRowToCartItemWithProductEntity,
} from '../entities';

/**
 * Supabase implementation of CartRepository
 */
export class CartRepositoryImpl implements CartRepository {
    constructor(private readonly supabase: SupabaseClient) { }

    /**
     * Create a new cart
     */
    async create(userId: string | null, sessionId: string | null): Promise<CartEntity> {
        // Validate: either userId OR sessionId must be set
        if ((userId === null && sessionId === null) || (userId !== null && sessionId !== null)) {
            throw new Error('Either userId or sessionId must be provided, but not both.');
        }

        const { data, error } = await this.supabase
            .from('carts')
            .insert({
                user_id: userId,
                session_id: sessionId,
            })
            .select()
            .single();

        if (error) {
            // Check for unique constraint violation
            if (error.code === '23505') {
                if (userId) {
                    throw new Error(`A cart already exists for user '${userId}'.`);
                } else {
                    throw new Error(`A cart already exists for session '${sessionId}'.`);
                }
            }
            // Check for check constraint violation
            if (error.code === '23514') {
                throw new Error('Either userId or sessionId must be provided, but not both.');
            }
            throw new Error(`Failed to create cart: ${error.message}`);
        }

        return mapRowToCartEntity(data as CartRow);
    }

    /**
     * Find cart by ID
     */
    async findById(cartId: string): Promise<CartEntity | null> {
        const { data, error } = await this.supabase
            .from('carts')
            .select()
            .eq('id', cartId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found
                return null;
            }
            throw new Error(`Failed to find cart: ${error.message}`);
        }

        return mapRowToCartEntity(data as CartRow);
    }

    /**
     * Find cart by user ID
     */
    async findByUserId(userId: string): Promise<CartEntity | null> {
        const { data, error } = await this.supabase
            .from('carts')
            .select()
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found
                return null;
            }
            throw new Error(`Failed to find cart by user: ${error.message}`);
        }

        return mapRowToCartEntity(data as CartRow);
    }

    /**
     * Find cart by session ID
     */
    async findBySessionId(sessionId: string): Promise<CartEntity | null> {
        const { data, error } = await this.supabase
            .from('carts')
            .select()
            .eq('session_id', sessionId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found
                return null;
            }
            throw new Error(`Failed to find cart by session: ${error.message}`);
        }

        return mapRowToCartEntity(data as CartRow);
    }

    /**
     * Find cart with all items and product details
     * 
     * Performs efficient JOIN query to retrieve cart with items
     * and associated product information in a single query.
     */
    async findWithItems(cartId: string): Promise<CartWithItemsEntity | null> {
        // First, get the cart
        const cart = await this.findById(cartId);
        if (!cart) {
            return null;
        }

        // Then, get cart items with product details using JOIN
        const { data, error } = await this.supabase
            .from('cart_items')
            .select(`
        id,
        cart_id,
        product_id,
        quantity,
        price_at_addition,
        created_at,
        updated_at,
        products:product_id (
          id,
          name,
          price,
          status,
          images,
          deleted_at
        )
      `)
            .eq('cart_id', cartId);

        if (error) {
            throw new Error(`Failed to find cart items: ${error.message}`);
        }

        // Map items with product details
        const items = (data || []).map((row: any) => {
            const product = row.products;
            return mapRowToCartItemWithProductEntity({
                id: row.id,
                cart_id: row.cart_id,
                product_id: row.product_id,
                quantity: row.quantity,
                price_at_addition: row.price_at_addition,
                created_at: row.created_at,
                updated_at: row.updated_at,
                product_name: product?.name || '',
                product_price: product?.price || '0',
                product_status: product?.status || 'inactive',
                product_images: product?.images || [],
                product_deleted_at: product?.deleted_at || null,
            } as CartItemWithProductRow);
        });

        return {
            ...cart,
            items,
        };
    }

    /**
     * Update cart
     */
    async update(cartId: string, data: Partial<CartEntity>): Promise<CartEntity> {
        const updateData: any = {};

        if (data.userId !== undefined) {
            updateData.user_id = data.userId;
        }
        if (data.sessionId !== undefined) {
            updateData.session_id = data.sessionId;
        }

        const { data: updated, error } = await this.supabase
            .from('carts')
            .update(updateData)
            .eq('id', cartId)
            .select()
            .single();

        if (error) {
            // Check for not found error
            if (error.code === 'PGRST116') {
                throw new Error(`Cart with ID '${cartId}' not found.`);
            }
            // Check for unique constraint violation
            if (error.code === '23505') {
                const userId = data.userId;
                throw new Error(`A cart already exists for user '${userId}'.`);
            }
            // Check for check constraint violation
            if (error.code === '23514') {
                throw new Error('Either userId or sessionId must be provided, but not both.');
            }
            throw new Error(`Failed to update cart: ${error.message}`);
        }

        return mapRowToCartEntity(updated as CartRow);
    }

    /**
     * Delete cart
     * 
     * Deletes cart and all associated items (CASCADE DELETE).
     */
    async delete(cartId: string): Promise<void> {
        const { data, error } = await this.supabase
            .from('carts')
            .delete()
            .eq('id', cartId)
            .select()
            .single();

        if (error || !data) {
            throw new Error(`Cart with ID '${cartId}' not found or could not be deleted.`);
        }
    }
}
