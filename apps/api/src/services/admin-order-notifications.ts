import {
    sendAdminOrderEmail,
    sendCustomerOrderEmail,
    type AdminOrderEmailInput,
    type CustomerOrderEmailData,
} from '@dakshinkali/admin-mail';
import { createSupabaseClient } from '@dakshinkali/database';
import { getAdminUrl, getStorefrontUrl, orderStatusLabel, paymentMethodLabel, paymentStatusLabel } from '../lib/order-labels';
import { OrderRepository } from '../modules/orders/order.repository';
import type { OrderWithItemsEntity } from '../modules/orders/types';
import { sendAdminOrderPush } from './admin-push-notifications';

async function claimOrderNotification(orderId: string): Promise<Record<string, unknown> | null> {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
        .from('orders')
        .update({ admin_notification_status: 'sent' })
        .eq('id', orderId)
        .eq('admin_notification_status', 'pending')
        .select('*')
        .maybeSingle();

    if (error) {
        console.error('[ADMIN_ORDER_NOTIFY_CLAIM_ERROR]', { orderId, message: error.message });
        return null;
    }

    return (data as Record<string, unknown> | null) ?? null;
}

async function markNotificationFailed(orderId: string): Promise<void> {
    const supabase = createSupabaseClient();
    await supabase
        .from('orders')
        .update({ admin_notification_status: 'failed' })
        .eq('id', orderId)
        .eq('admin_notification_status', 'sent');
}

function mapOrderToEmailInput(order: OrderWithItemsEntity): AdminOrderEmailInput {
    return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        shippingAddressLine1: order.shippingAddress.line1,
        shippingAddressLine2: order.shippingAddress.line2 ?? null,
        shippingCity: order.shippingAddress.city,
        shippingState: order.shippingAddress.state,
        shippingPostalCode: order.shippingAddress.postalCode,
        shippingCountry: order.shippingAddress.country ?? 'Nepal',
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        couponCode: order.couponCode,
        total: order.total,
        notes: order.notes,
        items: order.items.map((item) => ({
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
        })),
    };
}

function mapOrderToCustomerEmailInput(order: OrderWithItemsEntity): CustomerOrderEmailData {
    return {
        id: order.id,
        order_number: order.orderNumber,
        customer_name: order.customerName,
        customer_email: order.customerEmail,
        shipping_address_line1: order.shippingAddress.line1,
        shipping_address_line2: order.shippingAddress.line2 ?? null,
        shipping_city: order.shippingAddress.city,
        shipping_state: order.shippingAddress.state,
        shipping_country: order.shippingAddress.country ?? 'Nepal',
        payment_method: order.paymentMethod,
        total: order.total,
        subtotal: order.subtotal,
        shipping_cost: order.shippingCost,
        discount_amount: order.discountAmount,
        coupon_code: order.couponCode,
        notes: order.notes,
        created_at: order.createdAt.toISOString(),
        items: order.items.map((item) => ({
            product_name: item.productName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            product_image_url: item.productImageUrl,
        })),
    };
}

async function loadOrderWithItems(orderId: string): Promise<OrderWithItemsEntity | null> {
    const supabase = createSupabaseClient();
    const repository = new OrderRepository(supabase);
    return repository.findById(orderId);
}

export async function notifyAdminsOfNewOrder(orderId: string): Promise<void> {
    try {
        console.log('[NOTIFY_START]', orderId);
        const claimed = await claimOrderNotification(orderId);
        if (!claimed) {
            console.log('[NOTIFY_SKIP]', { orderId, reason: 'already notified' });
            return;
        }
        console.log('[NOTIFY_CLAIMED]', claimed);

        const order = await loadOrderWithItems(orderId);
        if (!order) {
            console.error('[ADMIN_ORDER_NOTIFY_ERROR]', { orderId, message: 'Order not found after claim' });
            await markNotificationFailed(orderId);
            return;
        }

        const adminUrl = getAdminUrl();
        const storefrontUrl = getStorefrontUrl();
        const emailInput = mapOrderToEmailInput(order);
        const customerEmailInput = mapOrderToCustomerEmailInput(order);

        const results = await Promise.allSettled([
            sendAdminOrderEmail(emailInput, {
                adminUrl,
                labels: {
                    paymentMethod: paymentMethodLabel(order.paymentMethod),
                    orderStatus: orderStatusLabel(order.status),
                    paymentStatus: paymentStatusLabel(order.paymentStatus),
                },
            }),
            sendAdminOrderPush(order),
            sendCustomerOrderEmail(customerEmailInput, { storefrontUrl }),
        ]);

        console.log('[NOTIFY_EMAIL_RESULT]', results[0]);
        console.log('[NOTIFY_PUSH_RESULT]', results[1]);
        console.log('[CUSTOMER_EMAIL_RESULT]', results[2]);

        const failures = results.filter((r) => r.status === 'rejected');
        if (failures.length > 0) {
            failures.forEach((failure) => {
                console.error('[ADMIN_ORDER_NOTIFY_ERROR]', {
                    orderId,
                    reason: failure.status === 'rejected' ? failure.reason : undefined,
                });
            });
        }
        console.log('[NOTIFY_DONE]', orderId);
    } catch (error) {
        console.error('[ADMIN_ORDER_NOTIFY_ERROR]', { orderId, error });
    }
}
