import { sendAdminOrderEmail, type AdminOrderEmailInput } from '@dakshinkali/admin-mail';
import { createSupabaseClient } from '@dakshinkali/database';
import { getAdminUrl, orderStatusLabel, paymentMethodLabel, paymentStatusLabel } from '../lib/order-labels';
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
        const emailInput = mapOrderToEmailInput(order);

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
        ]);

        console.log('[NOTIFY_EMAIL_RESULT]', results[0]);
        console.log('[NOTIFY_PUSH_RESULT]', results[1]);

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
