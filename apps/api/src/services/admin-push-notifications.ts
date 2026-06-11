import { createSupabaseClient } from '@dakshinkali/database';
import { tryGetFirebaseMessaging } from '../lib/firebase-admin';
import { paymentMethodLabel } from '../lib/order-labels';
import type { OrderWithItemsEntity } from '../modules/orders/types';

const INVALID_TOKEN_CODES = new Set([
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token',
]);

export async function sendAdminOrderPush(order: OrderWithItemsEntity): Promise<void> {
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
    if (tokens.length === 0) {
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
}
