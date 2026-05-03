import { describe, expect, it, vi } from 'vitest';
import { ValidationException } from '../../common/exceptions/validation.exception';
import { OrderService } from './order.service';
import { CreateOrderRequest } from './order.dto';
import { CreateOrderRecord, OrderStatus, OrderWithItemsEntity } from './types';
import { CartDTO } from '../cart/dto/cart.dto';

const userId = '11111111-1111-4111-8111-111111111111';
const orderId = '22222222-2222-4222-8222-222222222222';
const cartId = '33333333-3333-4333-8333-333333333333';

function createCart(overrides: Partial<CartDTO> = {}): CartDTO {
    return {
        id: cartId,
        userId,
        items: [
            {
                id: '44444444-4444-4444-8444-444444444444',
                productId: '55555555-5555-4555-8555-555555555555',
                productName: 'Test Product',
                productImage: 'https://example.com/product.jpg',
                productStatus: 'active',
                quantity: 2,
                priceAtAddition: 100,
                currentPrice: 100,
                subtotal: 200,
                isAvailable: true,
                priceChanged: false,
            },
        ],
        subtotal: 200,
        total: 200,
        itemCount: 2,
        createdAt: '2026-05-03T00:00:00.000Z',
        updatedAt: '2026-05-03T00:00:00.000Z',
        ...overrides,
    };
}

function createOrder(overrides: Partial<OrderWithItemsEntity> = {}): OrderWithItemsEntity {
    return {
        id: orderId,
        userId,
        orderNumber: 'DK-20260503-ABC123',
        status: 'pending',
        customerEmail: 'customer@example.com',
        customerName: 'Customer',
        customerPhone: null,
        shippingAddress: {
            line1: 'Street 1',
            line2: null,
            city: 'Kathmandu',
            state: 'Bagmati',
            postalCode: '44600',
            country: 'Nepal',
        },
        subtotal: 200,
        shippingCost: 0,
        tax: 0,
        total: 200,
        paymentMethod: 'cash_on_delivery',
        paymentStatus: 'pending',
        notes: null,
        items: [],
        statusHistory: [],
        createdAt: new Date('2026-05-03T00:00:00.000Z'),
        updatedAt: new Date('2026-05-03T00:00:00.000Z'),
        ...overrides,
    };
}

function createRequest(overrides: Partial<CreateOrderRequest> = {}): CreateOrderRequest {
    return {
        customerEmail: 'customer@example.com',
        customerName: 'Customer',
        shippingAddress: {
            line1: 'Street 1',
            city: 'Kathmandu',
            state: 'Bagmati',
            postalCode: '44600',
            country: 'Nepal',
        },
        ...overrides,
    };
}

function createService(cart: CartDTO | null = createCart()) {
    const order = createOrder();
    const repository = {
        createFromCart: vi.fn(async (_record: CreateOrderRecord, _cartId: string) => order),
        create: vi.fn(async (_record: CreateOrderRecord) => order),
        findById: vi.fn(async (_id: string) => order),
        list: vi.fn(async () => ({ data: [order], total: 1, page: 1, pageSize: 20, totalPages: 1 })),
        updateStatus: vi.fn(async (_id: string, status: OrderStatus) => createOrder({ status })),
        stats: vi.fn(async () => ({ totalOrders: 1, revenue: 200, pendingOrders: 1, recentOrders: [order] })),
    };
    const cartService = {
        getCart: vi.fn(async () => cart),
        clearCart: vi.fn(async () => undefined),
    };
    return {
        service: new OrderService(repository as any, cartService as any),
        repository,
        cartService,
    };
}

describe('OrderService', () => {
    it('creates an order through the atomic cart repository path', async () => {
        const { service, repository, cartService } = createService();

        const order = await service.createOrder(userId, createRequest());

        expect(order.id).toBe(orderId);
        expect(repository.createFromCart).toHaveBeenCalledWith(
            expect.objectContaining({
                userId,
                subtotal: 200,
                total: 200,
                paymentMethod: 'cash_on_delivery',
                items: [
                    expect.objectContaining({
                        productName: 'Test Product',
                        quantity: 2,
                        unitPrice: 100,
                        totalPrice: 200,
                    }),
                ],
            }),
            cartId
        );
        expect(repository.create).not.toHaveBeenCalled();
        expect(cartService.clearCart).not.toHaveBeenCalled();
    });

    it('falls back to create plus clearCart when the repository has no atomic method', async () => {
        const order = createOrder();
        const repository = {
            create: vi.fn(async (_record: CreateOrderRecord) => order),
        };
        const cartService = {
            getCart: vi.fn(async () => createCart()),
            clearCart: vi.fn(async () => undefined),
        };
        const service = new OrderService(repository as any, cartService as any);

        await service.createOrder(userId, createRequest());

        expect(repository.create).toHaveBeenCalledOnce();
        expect(cartService.clearCart).toHaveBeenCalledWith(userId, null);
    });

    it('rejects empty carts', async () => {
        const { service } = createService(createCart({ items: [], subtotal: 0, total: 0, itemCount: 0 }));

        await expect(service.createOrder(userId, createRequest())).rejects.toBeInstanceOf(ValidationException);
    });

    it('rejects unavailable products in cart', async () => {
        const cart = createCart({
            items: [
                {
                    ...createCart().items[0],
                    isAvailable: false,
                },
            ],
        });
        const { service } = createService(cart);

        await expect(service.createOrder(userId, createRequest())).rejects.toBeInstanceOf(ValidationException);
    });

    it('rejects invalid customer and shipping data', async () => {
        const { service } = createService();

        await expect(
            service.createOrder(userId, createRequest({ customerEmail: 'bad', customerName: '', shippingAddress: {} as any }))
        ).rejects.toBeInstanceOf(ValidationException);
    });

    it('allows customer cancellation only from cancellable statuses', async () => {
        const { service, repository } = createService();

        await service.cancelUserOrder(userId, orderId);
        expect(repository.updateStatus).toHaveBeenCalledWith(orderId, 'cancelled', 'Cancelled by customer', userId);
    });

    it('rejects invalid admin status transitions', async () => {
        const { service, repository } = createService();
        repository.findById.mockResolvedValueOnce(createOrder({ status: 'delivered' }));

        await expect(service.updateOrderStatus(orderId, 'cancelled', null, userId)).rejects.toBeInstanceOf(ValidationException);
    });
});
