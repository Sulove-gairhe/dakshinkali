import { Express, NextFunction, Request, Response } from 'express';
import { sendAdminOrderEmail, sendCustomerOrderEmail } from '@dakshinkali/admin-mail';
import { getAdminUrl, getStorefrontUrl, orderStatusLabel, paymentMethodLabel, paymentStatusLabel } from '../../lib/order-labels';
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

            void notifyAdminsOfNewOrder(orderId).catch(() => undefined);

            res.status(202).json({ ok: true });
        },
    );

    // Delivered order notification endpoint
    app.post(
        '/api/v1/internal/orders/:orderId/notify-delivered',
        validateNotifySecret,
        async (req: Request, res: Response) => {
            const orderId = req.params.orderId;
            console.log('[NOTIFY_DELIVERED_ROUTE_HIT]', orderId);
            if (!UUID_REGEX.test(orderId)) {
                res.status(400).json({ error: 'Invalid order ID.' });
                return;
            }

            // Dynamically import the notification function
            const { notifyAdminsOfDeliveredOrder } = await import('../../services/admin-order-notifications');

            // Fetch order with items
            const { OrderRepository } = await import('../orders/order.repository');
            const { createSupabaseClient } = await import('@dakshinkali/database');
            const supabase = createSupabaseClient();
            const repository = new OrderRepository(supabase);

            const order = await repository.findById(orderId);
            if (!order) {
                res.status(404).json({ error: 'Order not found.' });
                return;
            }

            // Trigger notification asynchronously
            void notifyAdminsOfDeliveredOrder(orderId, order).catch(() => undefined);

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

    app.get(
        '/api/v1/internal/test-customer-email',
        validateNotifySecret,
        async (_req: Request, res: Response) => {
            try {
                const recipient = process.env.ADMIN_EMAIL_TO;
                if (!recipient) {
                    res.status(500).json({ error: 'ADMIN_EMAIL_TO is not configured.' });
                    return;
                }

                await sendCustomerOrderEmail(
                    {
                        id: '00000000-0000-4000-8000-000000000001',
                        order_number: 'DK-TEST-CUSTOMER',
                        customer_name: 'Test Customer',
                        customer_email: recipient,
                        shipping_address_line1: 'street no 12, Newroad/Pokhara',
                        shipping_address_line2: null,
                        shipping_city: 'Pokhara',
                        shipping_state: 'Gandaki',
                        shipping_country: 'Nepal',
                        payment_method: 'cash_on_delivery',
                        total: 92149,
                        subtotal: 91999,
                        shipping_cost: 150,
                        discount_amount: 0,
                        coupon_code: null,
                        notes: null,
                        created_at: new Date().toISOString(),
                        items: [
                            {
                                product_name: 'Samsung 55 inch Smart TV',
                                quantity: 1,
                                unit_price: 91999,
                                product_image_url: null,
                            },
                        ],
                    },
                    { storefrontUrl: getStorefrontUrl() },
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
