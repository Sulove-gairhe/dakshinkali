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
import {
    buildHisabKitabPrefillUrl,
    sendAdminOrderPush,
    sendAdminDeliveredOrderPush,
} from './admin-push-notifications';

const DELIVERED_ORDER_NOTIFICATION_TYPE = 'delivered_order';

type DeliveredBellCreationResult =
    | { created: true; notificationId: string }
    | { created: false; reason: 'already_sent' | 'already_exists' };

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

/**
 * Atomically claim a delivered order notification for processing.
 * Prevents duplicate notifications through atomic state transition.
 *
 * @param orderId - The order ID to claim
 * @returns true if notification was claimed (rows returned), false if already claimed
 */
async function claimDeliveredNotification(orderId: string): Promise<boolean> {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
        .from('orders')
        .update({ delivered_notification_status: 'sending' })
        .eq('id', orderId)
        .in('delivered_notification_status', ['pending', 'failed'])
        .select('id')
        .maybeSingle();

    if (error) {
        console.error('[DELIVERED_ORDER_NOTIFY_CLAIM_ERROR]', { orderId, message: error.message });
        return false;
    }

    // If no rows returned, notification already claimed by another process
    return data !== null;
}

export function buildDeliveredOrderBellPayload(order: OrderWithItemsEntity) {
    const items = order.items.map((item) => ({
        product_id: item.productId ?? '',
        product_name: item.productName,
        quantity: item.quantity,
        hisabkitab_url: buildHisabKitabPrefillUrl(
            item.productName,
            item.productId ?? '',
            item.quantity,
            order.orderNumber,
            order.customerName,
        ),
    }));

    return {
        type: DELIVERED_ORDER_NOTIFICATION_TYPE,
        order_id: order.id,
        title: 'Order delivered - stock deduction required',
        message: `Order ${order.orderNumber} from ${order.customerName}`,
        metadata: {
            order_id: order.id,
            order_number: order.orderNumber,
            customer_name: order.customerName,
            items,
        },
    };
}

export async function createDeliveredOrderBellNotification(
    order: OrderWithItemsEntity,
): Promise<DeliveredBellCreationResult> {
    const supabase = createSupabaseClient();

    const { data: orderState, error: orderStateError } = await supabase
        .from('orders')
        .select('delivered_notification_status')
        .eq('id', order.id)
        .maybeSingle();

    if (orderStateError) {
        throw new Error(`Unable to read delivered notification state: ${orderStateError.message}`);
    }

    if (orderState?.delivered_notification_status === 'sent') {
        return { created: false, reason: 'already_sent' };
    }

    const { data: existing, error: existingError } = await supabase
        .from('admin_bell_notifications')
        .select('id')
        .eq('order_id', order.id)
        .eq('type', DELIVERED_ORDER_NOTIFICATION_TYPE)
        .maybeSingle();

    if (existingError) {
        throw new Error(`Unable to check delivered bell notification: ${existingError.message}`);
    }

    if (existing) {
        return { created: false, reason: 'already_exists' };
    }

    const payload = buildDeliveredOrderBellPayload(order);
    const { data, error } = await supabase
        .from('admin_bell_notifications')
        .insert(payload)
        .select('id')
        .single();

    if (error) {
        if (error.code === '23505') {
            return { created: false, reason: 'already_exists' };
        }
        throw new Error(`Unable to create delivered bell notification: ${error.message}`);
    }

    return { created: true, notificationId: String(data.id) };
}

/**
 * Orchestrate delivered order notifications (FCM + bell).
 * Atomically claims notification, sends FCM push, creates bell notification,
 * then updates status to 'sent' on success or 'failed' on failure.
 *
 * @param orderId - The order ID
 * @param order - The order with items data
 */
export async function notifyAdminsOfDeliveredOrder(orderId: string, order: OrderWithItemsEntity): Promise<void> {
    try {
        console.log('[DELIVERED_NOTIFY_START]', orderId);

        // Step 1: Atomically claim the notification
        const claimed = await claimDeliveredNotification(orderId);
        if (!claimed) {
            console.log('[DELIVERED_NOTIFY_SKIP]', { orderId, reason: 'already claimed' });
            return;
        }
        console.log('[DELIVERED_NOTIFY_CLAIMED]', orderId);

        // Step 2: Send FCM push and bell notification
        const results = await Promise.allSettled([
            sendAdminDeliveredOrderPush(order),
            createDeliveredOrderBellNotification(order),
        ]);

        console.log('[DELIVERED_NOTIFY_FCM_RESULT]', results[0]);
        console.log('[DELIVERED_NOTIFY_BELL_RESULT]', results[1]);

        const failures = results.filter((r) => r.status === 'rejected');

        // Step 3: Update status based on success/failure
        if (failures.length === 0) {
            // All notifications succeeded
            const supabase = createSupabaseClient();
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    delivered_notification_status: 'sent',
                    delivered_notification_sent_at: new Date().toISOString(),
                })
                .eq('id', orderId);

            if (updateError) {
                console.error('[DELIVERED_ORDER_NOTIFY_UPDATE_ERROR]', { orderId, message: updateError.message });
                return;
            }
            console.log('[DELIVERED_NOTIFY_DONE]', orderId);
        } else {
            // Notifications failed
            failures.forEach((failure) => {
                console.error('[DELIVERED_ORDER_NOTIFY_ERROR]', {
                    orderId,
                    reason: failure.status === 'rejected' ? failure.reason : undefined,
                });
            });

            // Mark as failed for retry
            const supabase = createSupabaseClient();
            const { error: updateError } = await supabase
                .from('orders')
                .update({ delivered_notification_status: 'failed' })
                .eq('id', orderId);

            if (updateError) {
                console.error('[DELIVERED_ORDER_NOTIFY_UPDATE_ERROR]', { orderId, message: updateError.message });
            }
        }
    } catch (error) {
        console.error('[DELIVERED_ORDER_NOTIFY_ERROR]', { orderId, error });
    }
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
