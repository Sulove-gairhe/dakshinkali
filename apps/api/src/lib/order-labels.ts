/**
 * Admin order notification label helpers (mirrors apps/admin/lib/admin/order-utils.ts)
 */

import type { OrderStatus, PaymentMethod, PaymentStatus } from '../modules/orders/types';

export function orderStatusLabel(status: OrderStatus): string {
    switch (status) {
        case 'pending':
            return 'Pending';
        case 'pending_admin_approval':
            return 'Waiting for Approval';
        case 'confirmed':
            return 'Confirmed';
        case 'processing':
            return 'Processing';
        case 'shipped':
            return 'Shipped';
        case 'delivered':
            return 'Delivered';
        case 'cancelled':
            return 'Cancelled';
        default:
            return 'Unknown';
    }
}

export function paymentStatusLabel(status: PaymentStatus): string {
    switch (status) {
        case 'pending':
            return 'Payment Pending';
        case 'pending_verification':
            return 'Waiting for Payment Verification';
        case 'paid':
            return 'Paid';
        case 'failed':
            return 'Payment Rejected';
        case 'refunded':
            return 'Refunded';
        default:
            return 'Unknown';
    }
}

export function paymentMethodLabel(method: PaymentMethod): string {
    switch (method) {
        case 'cash_on_delivery':
            return 'Cash on Delivery';
        case 'fonepay_qr':
            return 'Fonepay / QR Payment';
        case 'esewa':
            return 'eSewa';
        case 'khalti':
            return 'Khalti';
        case 'bank_transfer':
            return 'Fonepay / QR Payment';
        default:
            return method;
    }
}

export function getAdminUrl(): string {
    return (
        process.env.NEXT_PUBLIC_ADMIN_URL ||
        (process.env.NODE_ENV === 'development'
            ? 'http://localhost:3001'
            : 'https://admin.dakshinkali.shop')
    );
}
