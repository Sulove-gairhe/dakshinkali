import { describe, expect, it, vi } from 'vitest';
import { ValidationException } from '../../../common/exceptions/validation.exception';
import { UnauthorizedException } from '../../../common/exceptions/unauthorized.exception';
import { AuthUser } from '../../../common/middleware/auth.middleware';
import { CartService } from '../services/cart.service';
import { CartController } from './cart.controller';

const productId = '123e4567-e89b-12d3-a456-426614174000';
const itemId = '223e4567-e89b-12d3-a456-426614174000';
const userId = '323e4567-e89b-12d3-a456-426614174000';
const sessionId = 'guest-session-1';

const cartDto = {
    id: '423e4567-e89b-12d3-a456-426614174000',
    userId: null,
    items: [],
    subtotal: 0,
    total: 0,
    itemCount: 0,
    createdAt: '2026-05-03T00:00:00.000Z',
    updatedAt: '2026-05-03T00:00:00.000Z',
};

function createServiceMock(): CartService {
    return {
        addToCart: vi.fn().mockResolvedValue(cartDto),
        getCart: vi.fn().mockResolvedValue(cartDto),
        updateCartItem: vi.fn().mockResolvedValue(cartDto),
        removeCartItem: vi.fn().mockResolvedValue(cartDto),
        clearCart: vi.fn().mockResolvedValue(undefined),
        mergeCarts: vi.fn().mockResolvedValue({ ...cartDto, userId }),
    };
}

function authUser(): AuthUser {
    return {
        id: userId,
        email: 'customer@example.com',
        role: 'customer',
    };
}

describe('CartController', () => {
    it('adds an item for a guest session', async () => {
        const service = createServiceMock();
        const controller = new CartController(service);

        const result = await controller.addItem(undefined, sessionId, {
            productId,
            quantity: 2,
        });

        expect(result.status).toBe(201);
        expect(service.addToCart).toHaveBeenCalledWith(null, sessionId, productId, 2);
    });

    it('returns an empty cart response when no cart exists', async () => {
        const service = createServiceMock();
        vi.mocked(service.getCart).mockResolvedValue(null);
        const controller = new CartController(service);

        const result = await controller.getCart(undefined, sessionId);

        expect(result.status).toBe(200);
        expect(result.data).toMatchObject({
            id: null,
            userId: null,
            items: [],
            subtotal: 0,
            itemCount: 0,
        });
    });

    it('rejects guest requests without a session ID', async () => {
        const controller = new CartController(createServiceMock());

        await expect(controller.getCart(undefined, undefined)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects invalid product IDs before calling the service', async () => {
        const service = createServiceMock();
        const controller = new CartController(service);

        await expect(controller.addItem(undefined, sessionId, {
            productId: 'not-a-uuid',
            quantity: 1,
        })).rejects.toBeInstanceOf(ValidationException);

        expect(service.addToCart).not.toHaveBeenCalled();
    });

    it('allows quantity zero for update but not add', async () => {
        const service = createServiceMock();
        const controller = new CartController(service);

        await expect(controller.addItem(undefined, sessionId, {
            productId,
            quantity: 0,
        })).rejects.toBeInstanceOf(ValidationException);

        await controller.updateItem(undefined, sessionId, itemId, { quantity: 0 });
        expect(service.updateCartItem).toHaveBeenCalledWith(null, sessionId, itemId, 0);
    });

    it('requires authentication for cart merge', async () => {
        const service = createServiceMock();
        const controller = new CartController(service);

        await expect(controller.mergeCart(undefined, { sessionId })).rejects.toBeInstanceOf(UnauthorizedException);

        const result = await controller.mergeCart(authUser(), { sessionId });
        expect(result.status).toBe(200);
        expect(service.mergeCarts).toHaveBeenCalledWith(userId, sessionId);
    });
});
