import { Express, NextFunction, Request, Response } from 'express';
import { createSupabaseClient, ProductImageStorage } from '@dakshinkali/database';
import { authMiddleware, adminAuthMiddleware, rateLimitMiddleware } from '../../common/middleware/express-adapters';
import { ProductRepositoryImpl } from '../products/repositories/product.repository.impl';
import { ProductServiceImpl } from '../products/services/product.service.impl';
import { ImageStorageServiceImpl } from '../products/services/image-storage.service.impl';
import { CartRepositoryImpl } from '../cart/repositories/cart.repository.impl';
import { CartItemRepositoryImpl } from '../cart/repositories/cart-item.repository.impl';
import { CartServiceImpl } from '../cart/services/cart.service.impl';
import { OrderRepository } from './order.repository';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';

export function registerOrderRoutes(app: Express): void {
    const supabase = createSupabaseClient();
    const productRepository = new ProductRepositoryImpl(supabase);
    const imageStorage = new ImageStorageServiceImpl(new ProductImageStorage(supabase));
    const productService = new ProductServiceImpl(productRepository, imageStorage);
    const cartService = new CartServiceImpl(
        new CartRepositoryImpl(supabase),
        new CartItemRepositoryImpl(supabase),
        productService
    );
    const orderService = new OrderService(new OrderRepository(supabase), cartService);
    const controller = new OrderController(orderService);
    const limiter = rateLimitMiddleware({ maxRequests: 60, windowSeconds: 60 });
    const adminLimiter = rateLimitMiddleware({ maxRequests: 100, windowSeconds: 60 });

    app.post('/api/v1/orders', authMiddleware, limiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await controller.createOrder(req.user, req.body);
            res.status(result.status).json(result.data);
        } catch (error) {
            next(error);
        }
    });

    app.get('/api/v1/orders', authMiddleware, limiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await controller.listMyOrders(req.user, req.query);
            res.status(result.status).json(result.data);
        } catch (error) {
            next(error);
        }
    });

    app.get('/api/v1/orders/:id', authMiddleware, limiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await controller.getMyOrder(req.user, req.params.id);
            res.status(result.status).json(result.data);
        } catch (error) {
            next(error);
        }
    });

    app.put('/api/v1/orders/:id/cancel', authMiddleware, limiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await controller.cancelMyOrder(req.user, req.params.id);
            res.status(result.status).json(result.data);
        } catch (error) {
            next(error);
        }
    });

    app.get('/api/v1/admin/orders/stats', authMiddleware, adminAuthMiddleware, adminLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await controller.adminStats();
            res.status(result.status).json(result.data);
        } catch (error) {
            next(error);
        }
    });

    app.get('/api/v1/admin/orders', authMiddleware, adminAuthMiddleware, adminLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await controller.listAdminOrders(req.query);
            res.status(result.status).json(result.data);
        } catch (error) {
            next(error);
        }
    });

    app.get('/api/v1/admin/orders/:id', authMiddleware, adminAuthMiddleware, adminLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await controller.getAdminOrder(req.params.id);
            res.status(result.status).json(result.data);
        } catch (error) {
            next(error);
        }
    });

    app.put('/api/v1/admin/orders/:id/status', authMiddleware, adminAuthMiddleware, adminLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await controller.updateAdminOrderStatus(req.user, req.params.id, req.body);
            res.status(result.status).json(result.data);
        } catch (error) {
            next(error);
        }
    });
}
