import { describe, expect, it, vi } from 'vitest';
import { ProductEntity } from '../../products/entities/product.entity';
import { ProductService } from '../../products/services/product.service';
import { CartEntity } from '../entities/cart.entity';
import { CartItemEntity, CartWithItemsEntity } from '../entities/cart-item.entity';
import { InvalidQuantityException, UnauthorizedCartAccessException } from '../exceptions';
import { CartItemRepository } from '../repositories/cart-item.repository';
import { CartRepository } from '../repositories/cart.repository';
import { CartServiceImpl } from './cart.service.impl';

const userId = '11111111-1111-4111-8111-111111111111';
const sessionId = 'guest-session';
const cartId = '22222222-2222-4222-8222-222222222222';
const itemId = '33333333-3333-4333-8333-333333333333';
const productId = '44444444-4444-4444-8444-444444444444';

const now = new Date('2026-05-03T10:00:00.000Z');

function product(overrides: Partial<ProductEntity> = {}): ProductEntity {
    return {
        id: productId,
        name: 'Phone',
        description: null,
        price: 100,
        category: 'Electronics',
        status: 'active',
        images: [{ id: 'img-1', url: 'https://example.com/img.jpg', filename: 'img.jpg', order: 0 }],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        ...overrides,
    };
}

function cart(overrides: Partial<CartEntity> = {}): CartEntity {
    return {
        id: cartId,
        userId,
        sessionId: null,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
}

function item(overrides: Partial<CartItemEntity> = {}): CartItemEntity {
    return {
        id: itemId,
        cartId,
        productId,
        quantity: 1,
        priceAtAddition: 100,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
}

function cartWithItems(overrides: Partial<CartWithItemsEntity> = {}): CartWithItemsEntity {
    return {
        ...cart(),
        items: [{
            ...item(),
            product: {
                id: productId,
                name: 'Phone',
                price: 110,
                status: 'active',
                images: ['https://example.com/img.jpg'],
                deletedAt: null,
            },
        }],
        ...overrides,
    };
}

function setup() {
    const cartRepository: CartRepository = {
        create: vi.fn().mockResolvedValue(cart()),
        findById: vi.fn().mockResolvedValue(cart()),
        findByUserId: vi.fn().mockResolvedValue(cart()),
        findBySessionId: vi.fn().mockResolvedValue(null),
        findWithItems: vi.fn().mockResolvedValue(cartWithItems()),
        update: vi.fn().mockResolvedValue(cart()),
        delete: vi.fn().mockResolvedValue(undefined),
    };

    const cartItemRepository: CartItemRepository = {
        create: vi.fn().mockResolvedValue(item()),
        findById: vi.fn().mockResolvedValue(item()),
        findByCartId: vi.fn().mockResolvedValue([item()]),
        findByCartAndProduct: vi.fn().mockResolvedValue(null),
        updateQuantity: vi.fn().mockResolvedValue(item({ quantity: 2 })),
        delete: vi.fn().mockResolvedValue(undefined),
        deleteByCartId: vi.fn().mockResolvedValue(undefined),
    };

    const productService = {
        getActiveProductById: vi.fn().mockResolvedValue(product()),
    } as unknown as ProductService;

    return {
        cartRepository,
        cartItemRepository,
        productService,
        service: new CartServiceImpl(cartRepository, cartItemRepository, productService),
    };
}

describe('CartServiceImpl', () => {
    it('adds a new product with a price snapshot', async () => {
        const { service, cartItemRepository, productService } = setup();

        const result = await service.addToCart(userId, null, productId, 2);

        expect(productService.getActiveProductById).toHaveBeenCalledWith(productId);
        expect(cartItemRepository.create).toHaveBeenCalledWith(cartId, productId, 2, 100);
        expect(result.itemCount).toBe(1);
        expect(result.subtotal).toBe(100);
        expect(result.items[0].priceChanged).toBe(true);
    });

    it('adds quantity to an existing cart item', async () => {
        const { service, cartItemRepository } = setup();
        vi.mocked(cartItemRepository.findByCartAndProduct).mockResolvedValue(item({ quantity: 3 }));

        await service.addToCart(userId, null, productId, 4);

        expect(cartItemRepository.updateQuantity).toHaveBeenCalledWith(itemId, 7);
        expect(cartItemRepository.create).not.toHaveBeenCalled();
    });

    it('rejects invalid owner context and invalid quantities', async () => {
        const { service } = setup();

        await expect(service.getCart(null, null)).rejects.toBeInstanceOf(UnauthorizedCartAccessException);
        await expect(service.getCart(userId, sessionId)).rejects.toBeInstanceOf(UnauthorizedCartAccessException);
        await expect(service.addToCart(userId, null, productId, 0)).rejects.toBeInstanceOf(InvalidQuantityException);
    });

    it('updates quantity zero by deleting the item', async () => {
        const { service, cartItemRepository } = setup();

        await service.updateCartItem(userId, null, itemId, 0);

        expect(cartItemRepository.delete).toHaveBeenCalledWith(itemId);
        expect(cartItemRepository.updateQuantity).not.toHaveBeenCalled();
    });

    it('prevents access to another user cart', async () => {
        const { service, cartRepository } = setup();
        vi.mocked(cartRepository.findById).mockResolvedValue(cart({ userId: 'other-user' }));

        await expect(service.removeCartItem(userId, null, itemId)).rejects.toBeInstanceOf(UnauthorizedCartAccessException);
    });

    it('merges guest items into an existing user cart and deletes the guest cart', async () => {
        const { service, cartRepository, cartItemRepository } = setup();
        const guestCart = cart({ id: 'guest-cart', userId: null, sessionId });

        vi.mocked(cartRepository.findBySessionId).mockResolvedValue(guestCart);
        vi.mocked(cartRepository.findByUserId).mockResolvedValue(cart());
        vi.mocked(cartItemRepository.findByCartId).mockResolvedValue([item({ cartId: guestCart.id, quantity: 2 })]);
        vi.mocked(cartItemRepository.findByCartAndProduct).mockResolvedValue(item({ quantity: 3 }));

        await service.mergeCarts(userId, sessionId);

        expect(cartItemRepository.updateQuantity).toHaveBeenCalledWith(itemId, 5);
        expect(cartRepository.delete).toHaveBeenCalledWith(guestCart.id);
    });

    it('rejects merges above the quantity limit', async () => {
        const { service, cartRepository, cartItemRepository } = setup();
        const guestCart = cart({ id: 'guest-cart', userId: null, sessionId });

        vi.mocked(cartRepository.findBySessionId).mockResolvedValue(guestCart);
        vi.mocked(cartRepository.findByUserId).mockResolvedValue(cart());
        vi.mocked(cartItemRepository.findByCartId).mockResolvedValue([item({ cartId: guestCart.id, quantity: 50 })]);
        vi.mocked(cartItemRepository.findByCartAndProduct).mockResolvedValue(item({ quantity: 50 }));

        await expect(service.mergeCarts(userId, sessionId)).rejects.toBeInstanceOf(InvalidQuantityException);
    });
});
