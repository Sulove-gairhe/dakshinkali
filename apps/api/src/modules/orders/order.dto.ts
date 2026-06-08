import { OrderStatus, PaymentMethod, PaymentStatus, ShippingAddress, OrderWithItemsEntity } from './types';

export interface CreateOrderRequest {
    customerEmail: string;
    customerName: string;
    customerPhone?: string | null;
    shippingAddress: ShippingAddress;
    paymentMethod?: PaymentMethod;
    couponCode?: string | null;
    notes?: string | null;
}

export interface UpdateOrderStatusRequest {
    status: OrderStatus;
    notes?: string | null;
}

export interface OrderItemDTO {
    id: string;
    productId: string | null;
    productName: string;
    productImageUrl: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface OrderDTO {
    id: string;
    userId: string | null;
    orderNumber: string;
    status: OrderStatus;
    customerEmail: string;
    customerName: string;
    customerPhone: string | null;
    shippingAddress: ShippingAddress;
    subtotal: number;
    shippingCost: number;
    tax: number;
    couponCode: string | null;
    discountAmount: number;
    originalSubtotal: number | null;
    total: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    notes: string | null;
    items: OrderItemDTO[];
    statusHistory: Array<{
        status: string;
        notes: string | null;
        changedBy: string | null;
        createdAt: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

export function mapOrderToDTO(order: OrderWithItemsEntity): OrderDTO {
    return {
        id: order.id,
        userId: order.userId,
        orderNumber: order.orderNumber,
        status: order.status,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        shippingAddress: order.shippingAddress,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        tax: order.tax,
        couponCode: order.couponCode,
        discountAmount: order.discountAmount,
        originalSubtotal: order.originalSubtotal,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        notes: order.notes,
        items: order.items.map(item => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            productImageUrl: item.productImageUrl,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
        })),
        statusHistory: order.statusHistory.map(history => ({
            status: history.status,
            notes: history.notes,
            changedBy: history.changedBy,
            createdAt: history.createdAt.toISOString(),
        })),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
    };
}
