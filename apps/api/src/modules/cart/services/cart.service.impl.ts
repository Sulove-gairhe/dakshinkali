/**
 * CartServiceImpl - Service Layer Implementation
 * 
 * Implements business logic for cart management operations.
 * Orchestrates repository operations, enforces business rules, validates product availability,
 * manages price snapshots, and handles cart merging for authenticated users.
 * 
 * @remarks
 * - Validates all business rules before database operations
 * - Coordinates CartRepository, CartItemRepository, and ProductService
 * - Manages multi-step operations (validation → stock check → cart update)
 * - Translates repository errors to domain exceptions
 * - Enforces authorization rules (users can only access their own carts)
 * - Implements price snapshot strategy (captures price at time of adding)
 * - Supports both authenticated users (userId) and guest users (sessionId)
 * 
 * **Validates: Requirements FR-1 to FR-6, NFR-8**
 */

import { CartService } from './cart.service';
import { CartDTO, CartItemDTO } from '../dto/cart.dto';
import { CartRepository } from '../repositories/cart.repository';
import { CartItemRepository } from '../repositories/cart-item.repository';
import { ProductService } from '../../products/services/product.service';
import { CartWithItemsEntity } from '../entities/cart-item.entity';
import {
    CartNotFoundException,
    CartItemNotFoundException,
    InvalidQuantityException,
    ProductNotAvailableException,
    UnauthorizedCartAccessException,
} from '../exceptions';

/**
 * CartServiceImpl
 * 
 * Concrete implementation of CartService interface.
 * Coordinates CartRepository, CartItemRepository, and ProductService to implement business logic.
 */
export class CartServiceImpl implements CartService {
    constructor(
        private readonly cartRepository: CartRepository,
        private readonly cartItemRepository: CartItemRepository,
        private readonly productService: ProductService
    ) { }

    /**
     * Add a product to cart with specified quantity
     * 
     * **Validates: Requirements FR-1 (Requirement 1: Add Item to Cart)**
     */
    async addToCart(
        userId: string | null,
        sessionId: string | null,
        productId: string,
        quantity: number
    ): Promise<CartDTO> {
        this.validateCartIdentity(userId, sessionId);

        // Validate quantity
        if (quantity < 1 || quantity > 99) {
            throw new InvalidQuantityException(quantity);
        }

        // Validate product exists and is active
        const product = await this.productService.getActiveProductById(productId);
        if (!product) {
            throw new ProductNotAvailableException(
                productId,
                'Product not found or inactive'
            );
        }

        // Get current product price for snapshot
        const priceSnapshot = product.price;

        // Find or create cart for user/session
        let cart = userId
            ? await this.cartRepository.findByUserId(userId)
            : await this.cartRepository.findBySessionId(sessionId!);

        if (!cart) {
            cart = await this.cartRepository.create(userId, sessionId);
        }

        // Check if product already in cart
        const existingItem = await this.cartItemRepository.findByCartAndProduct(
            cart.id,
            productId
        );

        if (existingItem) {
            // Product already in cart, update quantity
            const newQuantity = existingItem.quantity + quantity;

            // Validate combined quantity doesn't exceed 99
            if (newQuantity > 99) {
                throw new InvalidQuantityException(newQuantity);
            }

            // Update quantity
            await this.cartItemRepository.updateQuantity(existingItem.id, newQuantity);
        } else {
            // Product not in cart, create new cart item
            await this.cartItemRepository.create(cart.id, productId, quantity, priceSnapshot);
        }

        // Return updated cart with calculated totals
        const updatedCart = await this.getCart(userId, sessionId);
        if (!updatedCart) {
            throw new CartNotFoundException(userId || sessionId || 'unknown');
        }

        return updatedCart;
    }

    /**
     * Get cart with all items and calculated totals
     * 
     * **Validates: Requirements FR-4 (Requirement 4: Get Cart with Items and Totals)**
     */
    async getCart(userId: string | null, sessionId: string | null): Promise<CartDTO | null> {
        this.validateCartIdentity(userId, sessionId);

        // Find cart by userId or sessionId
        const cart = userId
            ? await this.cartRepository.findByUserId(userId)
            : await this.cartRepository.findBySessionId(sessionId!);

        if (!cart) {
            return null;
        }

        // Retrieve cart with items (joined with products)
        const cartWithItems = await this.cartRepository.findWithItems(cart.id);

        if (!cartWithItems) {
            return null;
        }

        // Transform to CartDTO
        return this.mapToCartDTO(cartWithItems);
    }

    /**
     * Update cart item quantity
     * 
     * **Validates: Requirements FR-2 (Requirement 2: Update Cart Item Quantity)**
     */
    async updateCartItem(
        userId: string | null,
        sessionId: string | null,
        itemId: string,
        quantity: number
    ): Promise<CartDTO> {
        this.validateCartIdentity(userId, sessionId);

        // Validate quantity
        if (quantity < 0 || quantity > 99) {
            throw new InvalidQuantityException(quantity);
        }

        // Find cart item
        const cartItem = await this.cartItemRepository.findById(itemId);
        if (!cartItem) {
            throw new CartItemNotFoundException(itemId);
        }

        // Find cart to validate ownership
        const cart = await this.cartRepository.findById(cartItem.cartId);
        if (!cart) {
            throw new CartNotFoundException(itemId);
        }

        // Validate cart item belongs to user's cart (authorization)
        this.validateCartOwnership(cart, userId, sessionId);

        // If quantity is 0, remove the item
        if (quantity === 0) {
            await this.cartItemRepository.delete(itemId);
        } else {
            // Update quantity
            await this.cartItemRepository.updateQuantity(itemId, quantity);
        }

        // Return updated cart with calculated totals
        const updatedCart = await this.getCart(userId, sessionId);
        if (!updatedCart) {
            throw new CartNotFoundException(userId || sessionId || 'unknown');
        }

        return updatedCart;
    }

    /**
     * Remove item from cart
     * 
     * **Validates: Requirements FR-3 (Requirement 3: Remove Item from Cart)**
     */
    async removeCartItem(
        userId: string | null,
        sessionId: string | null,
        itemId: string
    ): Promise<CartDTO> {
        this.validateCartIdentity(userId, sessionId);

        // Find cart item
        const cartItem = await this.cartItemRepository.findById(itemId);
        if (!cartItem) {
            throw new CartItemNotFoundException(itemId);
        }

        // Find cart to validate ownership
        const cart = await this.cartRepository.findById(cartItem.cartId);
        if (!cart) {
            throw new CartNotFoundException(itemId);
        }

        // Validate cart item belongs to user's cart (authorization)
        this.validateCartOwnership(cart, userId, sessionId);

        // Delete cart item
        await this.cartItemRepository.delete(itemId);

        // Return updated cart with calculated totals
        const updatedCart = await this.getCart(userId, sessionId);
        if (!updatedCart) {
            throw new CartNotFoundException(userId || sessionId || 'unknown');
        }

        return updatedCart;
    }

    /**
     * Clear all items from cart
     * 
     * **Validates: Requirements FR-5 (Requirement 5: Clear Cart)**
     */
    async clearCart(userId: string | null, sessionId: string | null): Promise<void> {
        this.validateCartIdentity(userId, sessionId);

        // Find cart by userId or sessionId
        const cart = userId
            ? await this.cartRepository.findByUserId(userId)
            : await this.cartRepository.findBySessionId(sessionId!);

        // If cart not found, return (idempotent)
        if (!cart) {
            return;
        }

        // Validate cart belongs to user (authorization)
        this.validateCartOwnership(cart, userId, sessionId);

        // Delete all cart items
        await this.cartItemRepository.deleteByCartId(cart.id);

        // Keep cart record for future additions
    }

    /**
     * Merge guest cart into user cart on login
     * 
     * **Validates: Requirements FR-6 (Requirement 6: Merge Guest Cart with User Cart)**
     */
    async mergeCarts(userId: string, sessionId: string): Promise<CartDTO> {
        if (!userId || !sessionId) {
            throw new UnauthorizedCartAccessException(
                'Authenticated user ID and guest session ID are required to merge carts.'
            );
        }

        // Find guest cart by sessionId
        const guestCart = await this.cartRepository.findBySessionId(sessionId);

        // If guest cart not found, return user's existing cart or create empty cart
        if (!guestCart) {
            const userCart = await this.cartRepository.findByUserId(userId);
            if (userCart) {
                const cartWithItems = await this.cartRepository.findWithItems(userCart.id);
                return this.mapToCartDTO(cartWithItems!);
            } else {
                // Create new cart for user
                const newCart = await this.cartRepository.create(userId, null);
                return this.mapToCartDTO({
                    ...newCart,
                    items: [],
                });
            }
        }

        // Find or create user cart by userId
        let userCart = await this.cartRepository.findByUserId(userId);
        if (!userCart) {
            // If user has no cart, convert guest cart to user cart
            userCart = await this.cartRepository.update(guestCart.id, {
                userId,
                sessionId: null,
            });

            // Return converted cart
            const cartWithItems = await this.cartRepository.findWithItems(userCart.id);
            return this.mapToCartDTO(cartWithItems!);
        }

        // Both carts exist, merge guest cart items into user cart
        const guestCartItems = await this.cartItemRepository.findByCartId(guestCart.id);

        for (const guestItem of guestCartItems) {
            // Check if product exists in user cart
            const userItem = await this.cartItemRepository.findByCartAndProduct(
                userCart.id,
                guestItem.productId
            );

            if (userItem) {
                // Product exists in both carts, add quantities together
                const mergedQuantity = userItem.quantity + guestItem.quantity;

                if (mergedQuantity > 99) {
                    throw new InvalidQuantityException(mergedQuantity);
                }

                // Update user cart item quantity
                await this.cartItemRepository.updateQuantity(userItem.id, mergedQuantity);
            } else {
                // Product not in user cart, create new item with guest cart's price snapshot
                await this.cartItemRepository.create(
                    userCart.id,
                    guestItem.productId,
                    guestItem.quantity,
                    guestItem.priceAtAddition
                );
            }
        }

        // Delete guest cart
        await this.cartRepository.delete(guestCart.id);

        // Return merged user cart with calculated totals
        const mergedCart = await this.cartRepository.findWithItems(userCart.id);
        return this.mapToCartDTO(mergedCart!);
    }

    /**
     * Validate that an operation is scoped to exactly one cart owner.
     */
    private validateCartIdentity(userId: string | null, sessionId: string | null): void {
        if ((userId && sessionId) || (!userId && !sessionId)) {
            throw new UnauthorizedCartAccessException(
                'Cart operations require either an authenticated user ID or a guest session ID.'
            );
        }
    }

    /**
     * Validate cart ownership (authorization check)
     * 
     * Ensures that the cart belongs to the user or session making the request.
     * Throws UnauthorizedCartAccessException if ownership doesn't match.
     * 
     * @param cart - Cart entity to validate
     * @param userId - Authenticated user identifier (nullable)
     * @param sessionId - Anonymous session identifier (nullable)
     * @throws UnauthorizedCartAccessException if cart doesn't belong to user/session
     */
    private validateCartOwnership(
        cart: { userId: string | null; sessionId: string | null },
        userId: string | null,
        sessionId: string | null
    ): void {
        // Check if cart belongs to the user or session
        const isOwner = userId
            ? cart.userId === userId
            : cart.sessionId === sessionId;

        if (!isOwner) {
            throw new UnauthorizedCartAccessException(
                'You do not have permission to access this cart.'
            );
        }
    }

    /**
     * Map CartWithItemsEntity to CartDTO
     * 
     * Transforms database entities to API response DTOs with computed fields.
     * Calculates subtotals, totals, and item counts.
     * 
     * @param cartWithItems - Cart entity with items and product data
     * @returns CartDTO with computed fields
     */
    private mapToCartDTO(cartWithItems: CartWithItemsEntity): CartDTO {
        // Map cart items to DTOs
        const items: CartItemDTO[] = cartWithItems.items.map(item => {
            const subtotal = item.quantity * item.priceAtAddition;
            const isAvailable = item.product.deletedAt === null && item.product.status === 'active';
            const priceChanged = item.product.price !== item.priceAtAddition;
            const productImage = item.product.images.length > 0 ? item.product.images[0] : null;

            return {
                id: item.id,
                productId: item.productId,
                productName: item.product.name,
                productImage,
                productStatus: item.product.status,
                quantity: item.quantity,
                priceAtAddition: item.priceAtAddition,
                currentPrice: item.product.price,
                subtotal,
                isAvailable,
                priceChanged,
            };
        });

        // Calculate cart subtotal (sum of all item subtotals)
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

        // Calculate item count (sum of all item quantities)
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

        // Build CartDTO
        return {
            id: cartWithItems.id,
            userId: cartWithItems.userId,
            items,
            subtotal,
            total: subtotal, // Same as subtotal for now, may include taxes/shipping later
            itemCount,
            createdAt: cartWithItems.createdAt.toISOString(),
            updatedAt: cartWithItems.updatedAt.toISOString(),
        };
    }
}
