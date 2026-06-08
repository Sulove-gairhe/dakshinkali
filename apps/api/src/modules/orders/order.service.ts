import {
    normalizeCouponCode,
    validateCouponForCart,
} from '@dakshinkali/database';
import { ValidationException } from '../../common/exceptions/validation.exception';
import { ForbiddenException } from '../../common/exceptions/forbidden.exception';
import { NotFoundException } from '../../common/exceptions/not-found.exception';
import { CartService } from '../cart/services/cart.service';
import { OrderRepository } from './order.repository';
import { CreateOrderRequest } from './order.dto';
import { CreateOrderRecord, OrderListQuery, OrderStatus, OrderWithItemsEntity, PaymentMethod } from './types';

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
};

export class OrderService {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly cartService: CartService
    ) { }

    async createOrder(userId: string, request: CreateOrderRequest): Promise<OrderWithItemsEntity> {
        this.validateCreateOrderRequest(request);

        const cart = await this.cartService.getCart(userId, null);
        if (!cart || cart.items.length === 0) {
            throw new ValidationException('Cannot create order from an empty cart', [
                { field: 'cart', message: 'Cart must contain at least one item' },
            ]);
        }

        const unavailable = cart.items.find(item => !item.isAvailable);
        if (unavailable) {
            throw new ValidationException('Cart contains unavailable products', [
                { field: 'cart', message: `Product '${unavailable.productName}' is not available` },
            ]);
        }

        const shippingCost = 0;
        const tax = 0;
        const subtotal = cart.subtotal;
        let discountAmount = 0;
        let couponCode: string | null = null;

        if (request.couponCode) {
            couponCode = normalizeCouponCode(request.couponCode);
            const coupon = await this.orderRepository.findCouponByCode(couponCode);
            const categoryIds = await this.orderRepository.findProductCategoryIds(
                cart.items.map(item => item.productId)
            );
            const result = validateCouponForCart({
                coupon,
                code: couponCode,
                subtotal,
                items: cart.items.map(item => ({
                    productId: item.productId,
                    categoryId: categoryIds.get(item.productId) ?? null,
                    lineTotal: item.subtotal,
                })),
            });

            if (!result.valid) {
                throw new ValidationException(result.message, [
                    { field: 'couponCode', message: result.message },
                ]);
            }
            discountAmount = result.discountAmount;
            couponCode = result.code;
        }

        const discountedSubtotal = Math.max(0, subtotal - discountAmount);
        const total = discountedSubtotal + shippingCost + tax;

        const orderRecord: CreateOrderRecord = {
            userId,
            orderNumber: this.generateOrderNumber(),
            customerEmail: request.customerEmail,
            customerName: request.customerName,
            customerPhone: request.customerPhone || null,
            shippingAddress: {
                line1: request.shippingAddress.line1,
                line2: request.shippingAddress.line2 || null,
                city: request.shippingAddress.city,
                state: request.shippingAddress.state,
                postalCode: request.shippingAddress.postalCode,
                country: request.shippingAddress.country || 'Nepal',
            },
            subtotal: discountedSubtotal,
            shippingCost,
            tax,
            total,
            couponCode,
            discountAmount,
            originalSubtotal: subtotal,
            paymentMethod: request.paymentMethod || 'cash_on_delivery',
            paymentStatus: 'pending',
            notes: request.notes || null,
            items: cart.items.map(item => ({
                productId: item.productId,
                productName: item.productName,
                productImageUrl: item.productImage,
                quantity: item.quantity,
                unitPrice: item.priceAtAddition,
                totalPrice: item.subtotal,
            })),
        };

        if (typeof this.orderRepository.createFromCart === 'function') {
            return this.orderRepository.createFromCart(orderRecord, cart.id);
        }

        const order = await this.orderRepository.create(orderRecord);
        await this.cartService.clearCart(userId, null);
        return order;
    }

    async listUserOrders(userId: string, query: Partial<OrderListQuery>) {
        return this.orderRepository.list({
            page: query.page || 1,
            pageSize: Math.min(query.pageSize || 20, 100),
            status: query.status,
            userId,
        });
    }

    async getUserOrder(userId: string, orderId: string): Promise<OrderWithItemsEntity> {
        const order = await this.orderRepository.findById(orderId);
        if (!order) throw new NotFoundException(`Order with ID '${orderId}' not found.`);
        if (order.userId !== userId) throw new ForbiddenException('You do not have permission to access this order.');
        return order;
    }

    async cancelUserOrder(userId: string, orderId: string): Promise<OrderWithItemsEntity> {
        const order = await this.getUserOrder(userId, orderId);
        if (!allowedTransitions[order.status].includes('cancelled')) {
            throw new ValidationException('Order cannot be cancelled in its current status', [
                { field: 'status', message: `Cannot cancel order with status '${order.status}'` },
            ]);
        }
        return this.orderRepository.updateStatus(orderId, 'cancelled', 'Cancelled by customer', userId);
    }

    async listAdminOrders(query: Partial<OrderListQuery>) {
        return this.orderRepository.list({
            page: query.page || 1,
            pageSize: Math.min(query.pageSize || 20, 100),
            status: query.status,
            userId: query.userId,
        });
    }

    async getAdminOrder(orderId: string): Promise<OrderWithItemsEntity> {
        const order = await this.orderRepository.findById(orderId);
        if (!order) throw new NotFoundException(`Order with ID '${orderId}' not found.`);
        return order;
    }

    async updateOrderStatus(orderId: string, status: OrderStatus, notes: string | null, adminUserId: string): Promise<OrderWithItemsEntity> {
        const order = await this.getAdminOrder(orderId);
        if (!allowedTransitions[order.status].includes(status)) {
            throw new ValidationException('Invalid order status transition', [
                { field: 'status', message: `Cannot transition from '${order.status}' to '${status}'` },
            ]);
        }
        return this.orderRepository.updateStatus(orderId, status, notes, adminUserId);
    }

    async stats() {
        return this.orderRepository.stats();
    }

    private validateCreateOrderRequest(request: CreateOrderRequest): void {
        const errors: Array<{ field: string; message: string }> = [];
        if (!request.customerEmail || !request.customerEmail.includes('@')) errors.push({ field: 'customerEmail', message: 'Valid customer email is required' });
        if (!request.customerName || request.customerName.trim() === '') errors.push({ field: 'customerName', message: 'Customer name is required' });
        if (!request.shippingAddress?.line1) errors.push({ field: 'shippingAddress.line1', message: 'Shipping address line 1 is required' });
        if (!request.shippingAddress?.city) errors.push({ field: 'shippingAddress.city', message: 'Shipping city is required' });
        if (!request.shippingAddress?.state) errors.push({ field: 'shippingAddress.state', message: 'Shipping state is required' });
        if (!request.shippingAddress?.postalCode) errors.push({ field: 'shippingAddress.postalCode', message: 'Shipping postal code is required' });
        if (request.paymentMethod && !this.isPaymentMethod(request.paymentMethod)) errors.push({ field: 'paymentMethod', message: 'Invalid payment method' });
        if (errors.length > 0) throw new ValidationException('Invalid order data', errors);
    }

    private isPaymentMethod(value: string): value is PaymentMethod {
        return ['cash_on_delivery', 'esewa', 'khalti', 'bank_transfer'].includes(value);
    }

    private generateOrderNumber(): string {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).slice(2, 8).toUpperCase();
        return `DK-${date}-${random}`;
    }
}
