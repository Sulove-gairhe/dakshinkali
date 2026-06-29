import { createSupabaseClient } from '@dakshinkali/database';
import { tryGetFirebaseMessaging } from '../lib/firebase-admin';
import { paymentMethodLabel } from '../lib/order-labels';
import type { OrderWithItemsEntity } from '../modules/orders/types';

const INVALID_TOKEN_CODES = new Set([
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token',
]);

export async function sendAdminOrderPush(order: OrderWithItemsEntity): Promise<void> {
    try {
        const messaging = tryGetFirebaseMessaging();
        if (!messaging) {
            return;
        }

        const supabase = createSupabaseClient();
        const { data: tokenRows, error } = await supabase
            .from('admin_fcm_tokens')
            .select('id, token');

        if (error) {
            console.error('[ADMIN_ORDER_PUSH_TOKEN_FETCH_ERROR]', error.message);
            return;
        }

        const tokens = (tokenRows ?? []).map((row) => row.token as string).filter(Boolean);
        console.log('[FCM_TOKENS_COUNT]', tokens.length);
        if (tokens.length === 0) {
            console.log('[FCM_NO_TOKENS]');
            return;
        }

        const paymentLabel = paymentMethodLabel(order.paymentMethod);
        const totalFormatted = `NPR ${Math.round(order.total).toLocaleString('en-NP')}`;
        const body = `Order #${order.orderNumber} from ${order.customerName} • ${totalFormatted} • ${paymentLabel}`;

        const response = await messaging.sendEachForMulticast({
            tokens,
            notification: {
                title: 'New order received',
                body,
            },
            data: {
                type: 'new_order',
                orderId: order.id,
                url: `/admin/orders/${order.id}`,
                approvalUrl: '/admin/orders/approval',
            },
            webpush: {
                fcmOptions: {
                    link: `/admin/orders/${order.id}`,
                },
            },
        });

        const invalidTokens: string[] = [];
        response.responses.forEach((result, index: number) => {
            console.log('[FCM_SEND_RESULT]', {
                token: tokens[index]?.slice(0, 12),
                success: result.success,
                code: result.error?.code,
                message: result.error?.message,
            });
            if (result.success) return;
            const code = result.error?.code;
            if (code && INVALID_TOKEN_CODES.has(code)) {
                invalidTokens.push(tokens[index]);
            } else if (result.error) {
                console.warn('[ADMIN_ORDER_PUSH_SEND_ERROR]', {
                    token: tokens[index]?.slice(0, 12),
                    code: result.error.code,
                    message: result.error.message,
                });
            }
        });

        if (invalidTokens.length > 0) {
            const { error: deleteError } = await supabase
                .from('admin_fcm_tokens')
                .delete()
                .in('token', invalidTokens);

            if (deleteError) {
                console.error('[ADMIN_ORDER_PUSH_TOKEN_CLEANUP_ERROR]', deleteError.message);
            }
        }
    } catch (error) {
        console.error('[FCM_ERROR]', error);
    }
}

/**
 * Build HisabKitab prefill URL for manual stock deduction.
 * Sub-task 6.2: Construct deep link with EXACT format and URL encoding.
 *
 * @param productName - Product name to prefill in search
 * @param productId - Product UUID
 * @param quantity - Quantity to deduct
 * @param orderNumber - Source order number
 * @param customerName - Customer name
 * @returns Fully constructed HisabKitab inventory URL
 */
export function buildHisabKitabPrefillUrl(
    productName: string,
    productId: string,
    quantity: number,
    orderNumber: string,
    customerName: string
): string {
    const baseUrl = 'https://hisabkitab.dakshinkali.shop/inventory';

    // URL encode dynamic values (Requirement 9.3)
    const encodedProductName = encodeURIComponent(productName);
    const encodedOrderNumber = encodeURIComponent(orderNumber);
    const encodedCustomerName = encodeURIComponent(customerName);

    // Construct URL with EXACT format (Requirement 9.1, 9.2)
    const url = `${baseUrl}?q=${encodedProductName}&status=all&stock_view=all&product_id=${productId}&deduct_qty=${quantity}&source_order=${encodedOrderNumber}&customer=${encodedCustomerName}`;

    return url;
}

/**
 * Send FCM push notification for delivered orders.
 * Sub-task 6.1, 6.3, 6.4: Full implementation with error handling.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 19.1-19.5, 20.1-20.5
 */
export async function sendAdminDeliveredOrderPush(order: OrderWithItemsEntity): Promise<void> {
    const messaging = tryGetFirebaseMessaging();
    if (!messaging) {
        throw new Error('Firebase messaging is not configured.');
    }

    // Sub-task 6.1: Fetch admin FCM tokens (Requirement 5.1)
    const supabase = createSupabaseClient();
    const { data: tokenRows, error } = await supabase
        .from('admin_fcm_tokens')
        .select('id, token');

    if (error) {
        console.error('[DELIVERED_ORDER_NOTIFY_TOKEN_FETCH_ERROR]', error.message);
        throw new Error(`Unable to load admin FCM tokens: ${error.message}`);
    }

    const tokens = (tokenRows ?? []).map((row) => row.token as string).filter(Boolean);
    console.log('[FCM_DELIVERED_TOKENS_COUNT]', tokens.length);

    if (tokens.length === 0) {
        console.log('[FCM_DELIVERED_NO_TOKENS]');
        throw new Error('No admin FCM tokens are registered.');
    }

    // Sub-task 6.1: Format notification body (Requirement 5.2, 5.5, 19.2)
    const itemCount = order.items.length;
    const itemLabel = itemCount === 1 ? 'product' : 'products';
    const body = `Order #${order.orderNumber} from ${order.customerName} · ${itemCount} ${itemLabel}`;

    // Sub-task 6.2, 6.3: Build items array with HisabKitab URLs (Requirement 5.3, 5.4, 19.5)
    const items = order.items.map((item) => ({
        product_id: item.productId ?? '',
        product_name: item.productName,
        quantity: item.quantity,
        hisabkitab_url: buildHisabKitabPrefillUrl(
            item.productName,
            item.productId ?? '',
            item.quantity,
            order.orderNumber,
            order.customerName
        ),
    }));
    const primaryHisabKitabUrl = items[0]?.hisabkitab_url;
    if (!primaryHisabKitabUrl) {
        throw new Error('Delivered order has no product available for stock deduction.');
    }

    // Sub-task 6.3: Send FCM notification with data payload (Requirement 5.4, 19.1-19.5)
    const response = await messaging.sendEachForMulticast({
        tokens,
        notification: {
            title: 'Order delivered - stock deduction required',
            body,
        },
        data: {
            type: 'delivered_order',
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            items: JSON.stringify(items),
            url: primaryHisabKitabUrl,
        },
        webpush: {
            fcmOptions: {
                link: primaryHisabKitabUrl,
            },
        },
    });

    // Sub-task 6.4: Error handling and invalid token cleanup (Requirement 20.2, 20.3)
    const invalidTokens: string[] = [];
    response.responses.forEach((result, index: number) => {
        console.log('[FCM_SEND_RESULT]', {
            token: tokens[index]?.slice(0, 12),
            success: result.success,
            code: result.error?.code,
            message: result.error?.message,
        });

        if (result.success) return;

        const code = result.error?.code;
        if (code && INVALID_TOKEN_CODES.has(code)) {
            invalidTokens.push(tokens[index]);
        } else if (result.error) {
            console.warn('[DELIVERED_ORDER_PUSH_SEND_ERROR]', {
                token: tokens[index]?.slice(0, 12),
                code: result.error.code,
                message: result.error.message,
            });
        }
    });

    // Sub-task 6.4: Delete invalid FCM tokens (Requirement 20.3)
    if (invalidTokens.length > 0) {
        const { error: deleteError } = await supabase
            .from('admin_fcm_tokens')
            .delete()
            .in('token', invalidTokens);

        if (deleteError) {
            console.error('[DELIVERED_ORDER_PUSH_TOKEN_CLEANUP_ERROR]', deleteError.message);
        }
    }

    if (response.successCount === 0) {
        throw new Error(`Delivered-order push failed for all ${tokens.length} registered token(s).`);
    }
}
