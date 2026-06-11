import { Express, NextFunction, Request, Response } from 'express';
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
}
