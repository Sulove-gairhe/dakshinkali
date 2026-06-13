import { Express, NextFunction, Request, Response } from 'express';
import { sendAdminOrderEmail } from '@dakshinkali/admin-mail';
import { getAdminUrl, orderStatusLabel, paymentMethodLabel, paymentStatusLabel } from '../../lib/order-labels';
import { notifyAdminsOfNewOrder } from '../../services/admin-order-notifications';

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getOrderNotifySecret(): string | null {
    const secret = process.env.ORDER_NOTIFY_SECRET;
    if (secret) return secret;

    if (process.env.NODE_ENV !== 'production') {
        console.warn('[ORDER_NOTIFY_SECRET] Using development fallback secret.');
        return 'dev-order-notify-secret';
    }

    return null;
}

function validateNotifySecret(req: Request, res: Response, next: NextFunction) {
    const expected = getOrderNotifySecret();
    if (!expected) {
        res.status(503).json({ error: 'Order notify is not configured.' });
        return;
    }

    const provided = req.header('X-Order-Notify-Secret');
    if (!provided || provided !== expected) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    next();
}

export function registerInternalOrderNotifyRoutes(app: Express): void {
    app.post(
        '/api/v1/internal/orders/:orderId/notify',
        validateNotifySecret,
        async (req: Request, res: Response) => {
            const orderId = req.params.orderId;
            console.log('[NOTIFY_ROUTE_HIT]', orderId);
            if (!UUID_REGEX.test(orderId)) {
                res.status(400).json({ error: 'Invalid order ID.' });
                return;
            }

            void notifyAdminsOfNewOrder(orderId).catch((error) => {
                console.error('[INTERNAL_ORDER_NOTIFY_ERROR]', { orderId, error });
            });

            res.status(202).json({ ok: true });
        },
    );

    app.get(
        '/api/v1/internal/test-notify-email',
        validateNotifySecret,
        async (_req: Request, res: Response) => {
            try {
                await sendAdminOrderEmail(
                    {
                        id: '00000000-0000-4000-8000-000000000000',
                        orderNumber: 'DK-TEST-NOTIFY',
                        customerName: 'Test Customer',
                        customerEmail: 'test@example.com',
                        customerPhone: '+977-9800000000',
                        shippingAddressLine1: 'Test address line 1',
                        shippingAddressLine2: null,
                        shippingCity: 'Kathmandu',
                        shippingState: 'Bagmati',
                        shippingPostalCode: '44600',
                        shippingCountry: 'Nepal',
                        subtotal: 1000,
                        discountAmount: 0,
                        couponCode: null,
                        total: 1150,
                        notes: 'SMTP test email from internal test endpoint.',
                        items: [
                            {
                                productName: 'Test Product',
                                quantity: 1,
                                unitPrice: 1000,
                            },
                        ],
                    },
                    {
                        adminUrl: getAdminUrl(),
                        labels: {
                            paymentMethod: paymentMethodLabel('cash_on_delivery'),
                            orderStatus: orderStatusLabel('pending_admin_approval'),
                            paymentStatus: paymentStatusLabel('pending'),
                        },
                    },
                );

                res.json({ ok: true });
            } catch (error) {
                res.status(500).json({
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        },
    );
}
