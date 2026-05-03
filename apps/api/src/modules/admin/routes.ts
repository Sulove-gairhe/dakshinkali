import { Express, NextFunction, Request, Response } from 'express';
import { createSupabaseClient } from '@dakshinkali/database';
import { adminAuthMiddleware, authMiddleware, rateLimitMiddleware } from '../../common/middleware/express-adapters';
import { ProductRepositoryImpl } from '../products/repositories/product.repository.impl';
import { OrderRepository } from '../orders/order.repository';
import { ProfileRepository } from '../profiles/profile.repository';
import { ProfileController } from '../profiles/profile.controller';
import { AdminDashboardController } from './admin.controller';
import { AdminUserRoleController } from './user-role.controller';

export function registerAdminSupportRoutes(app: Express): void {
    const supabase = createSupabaseClient();
    const profileRepository = new ProfileRepository(supabase);
    const profileController = new ProfileController(profileRepository);
    const adminUserRoleController = new AdminUserRoleController(supabase, profileRepository);
    const dashboardController = new AdminDashboardController(
        new ProductRepositoryImpl(supabase),
        new OrderRepository(supabase),
        profileRepository
    );
    const limiter = rateLimitMiddleware({ maxRequests: 100, windowSeconds: 60 });

    app.get('/api/v1/profile', authMiddleware, limiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await profileController.getMe(req.user);
            res.status(result.status).json(result.data);
        } catch (error) {
            next(error);
        }
    });

    app.put('/api/v1/profile', authMiddleware, limiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await profileController.updateMe(req.user, req.body);
            res.status(result.status).json(result.data);
        } catch (error) {
            next(error);
        }
    });

    app.get('/api/v1/admin/dashboard/stats', authMiddleware, adminAuthMiddleware, limiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await dashboardController.stats();
            res.status(result.status).json(result.data);
        } catch (error) {
            next(error);
        }
    });

    app.get('/api/v1/admin/users', authMiddleware, adminAuthMiddleware, limiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await profileController.listUsers(req.query);
            res.status(result.status).json(result.data);
        } catch (error) {
            next(error);
        }
    });

    app.put('/api/v1/admin/users/:id/role', authMiddleware, adminAuthMiddleware, limiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await profileController.updateUserRole(req.params.id, req.body);
            res.status(result.status).json(result.data);
        } catch (error) {
            next(error);
        }
    });

    app.patch('/api/v1/admin/users/:userId/role', authMiddleware, adminAuthMiddleware, limiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await adminUserRoleController.updateAuthUserRole(req.params.userId, req.body);
            res.status(result.status).json(result.data);
        } catch (error) {
            next(error);
        }
    });
}
