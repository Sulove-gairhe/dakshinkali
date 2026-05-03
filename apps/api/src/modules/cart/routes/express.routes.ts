import { Express, NextFunction, Request, Response } from 'express';
import { createSupabaseClient, ProductImageStorage } from '@dakshinkali/database';
import { optionalAuthMiddleware, authMiddleware, rateLimitMiddleware } from '../../../common/middleware/express-adapters';
import { ProductRepositoryImpl } from '../../products/repositories/product.repository.impl';
import { ProductServiceImpl } from '../../products/services/product.service.impl';
import { ImageStorageServiceImpl } from '../../products/services/image-storage.service.impl';
import { CartRepositoryImpl } from '../repositories/cart.repository.impl';
import { CartItemRepositoryImpl } from '../repositories/cart-item.repository.impl';
import { CartServiceImpl } from '../services/cart.service.impl';
import { CartController } from '../controllers/cart.controller';

export function registerCartRoutes(app: Express): void {
    const supabase = createSupabaseClient();

    const productRepository = new ProductRepositoryImpl(supabase);
    const productImageStorage = new ProductImageStorage(supabase);
    const imageStorage = new ImageStorageServiceImpl(productImageStorage);
    const productService = new ProductServiceImpl(productRepository, imageStorage);

    const cartRepository = new CartRepositoryImpl(supabase);
    const cartItemRepository = new CartItemRepositoryImpl(supabase);
    const cartService = new CartServiceImpl(cartRepository, cartItemRepository, productService);
    const controller = new CartController(cartService);

    const cartRateLimit = rateLimitMiddleware({ maxRequests: 60, windowSeconds: 60 });

    app.post('/api/v1/cart/items', optionalAuthMiddleware, cartRateLimit, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await controller.addItem(req.user, req.header('X-Session-ID'), req.body);
            res.status(result.status).json(result.data);
        } catch (error) {
            next(error);
        }
    });

    app.get('/api/v1/cart', optionalAuthMiddleware, cartRateLimit, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await controller.getCart(req.user, req.header('X-Session-ID'));
            res.set('Cache-Control', 'private, no-store');
            res.status(result.status).json(result.data);
        } catch (error) {
            next(error);
        }
    });

    app.put('/api/v1/cart/items/:id', optionalAuthMiddleware, cartRateLimit, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await controller.updateItem(req.user, req.header('X-Session-ID'), req.params.id, req.body);
            res.status(result.status).json(result.data);
        } catch (error) {
            next(error);
        }
    });

    app.delete('/api/v1/cart/items/:id', optionalAuthMiddleware, cartRateLimit, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await controller.removeItem(req.user, req.header('X-Session-ID'), req.params.id);
            res.status(result.status).json(result.data);
        } catch (error) {
            next(error);
        }
    });

    app.delete('/api/v1/cart', optionalAuthMiddleware, cartRateLimit, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await controller.clearCart(req.user, req.header('X-Session-ID'));
            res.status(result.status).send();
        } catch (error) {
            next(error);
        }
    });

    app.post('/api/v1/cart/merge', authMiddleware, cartRateLimit, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await controller.mergeCart(req.user, req.body);
            res.status(result.status).json(result.data);
        } catch (error) {
            next(error);
        }
    });
}
