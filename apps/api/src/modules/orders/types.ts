export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash_on_delivery' | 'esewa' | 'khalti' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface ShippingAddress {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
}

export interface CreateOrderInput {
    userId: string;
    customerEmail: string;
    customerName: string;
    customerPhone?: string | null;
    shippingAddress: ShippingAddress;
    paymentMethod: PaymentMethod;
    notes?: string | null;
}

export interface OrderEntity {
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
    total: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderItemEntity {
    id: string;
    orderId: string;
    productId: string | null;
    productName: string;
    productImageUrl: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    createdAt: Date;
}

export interface OrderStatusHistoryEntity {
    id: string;
    orderId: string;
    status: string;
    notes: string | null;
    changedBy: string | null;
    createdAt: Date;
}

export interface OrderWithItemsEntity extends OrderEntity {
    items: OrderItemEntity[];
    statusHistory: OrderStatusHistoryEntity[];
}

export interface CreateOrderRecord {
    userId: string;
    orderNumber: string;
    customerEmail: string;
    customerName: string;
    customerPhone?: string | null;
    shippingAddress: Required<ShippingAddress>;
    subtotal: number;
    shippingCost: number;
    tax: number;
    total: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    notes?: string | null;
    items: Array<{
        productId: string;
        productName: string;
        productImageUrl: string | null;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }>;
}

export interface OrderListQuery {
    page: number;
    pageSize: number;
    status?: OrderStatus;
    userId?: string;
}

export interface PaginatedOrders {
    data: OrderWithItemsEntity[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
