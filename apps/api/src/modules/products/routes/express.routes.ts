/**
 * Express Product Routes - Simplified Registration
 * 
 * Direct Express route registration for integration testing and production use.
 */

import { Express, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { createSupabaseClient, ProductImageStorage } from '@dakshinkali/database';
import { ProductRepositoryImpl } from '../repositories/product.repository.impl';
import { ProductServiceImpl } from '../services/product.service.impl';
import { ImageStorageServiceImpl } from '../services/image-storage.service.impl';
import { AdminProductController } from '../controllers/admin-product.controller';
import { PublicProductController } from '../controllers/public-product.controller';
import { authMiddleware, adminAuthMiddleware, rateLimitMiddleware } from '../../../common/middleware/express-adapters';

function parseJsonObject(value: unknown): Record<string, unknown> | null | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (value === null || value === '') {
        return null;
    }

    if (typeof value === 'object') {
        return Array.isArray(value) ? undefined : (value as Record<string, unknown>);
    }

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (parsed === null) {
                return null;
            }

            if (typeof parsed !== 'object' || Array.isArray(parsed)) {
                throw new Error('Invalid JSON object');
            }

            return parsed;
        } catch {
            throw new Error('Product specs must be a valid JSON object');
        }
    }

    return null;
}

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
        files: 5, // Max 5 files
    },
    fileFilter: (req, file, cb) => {
        // Only allow image files
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
        }
    },
});

/**
 * Register product routes with Express app
 */
export function registerProductRoutes(app: Express): void {
    // Initialize dependencies
    const supabase = createSupabaseClient();
    const repository = new ProductRepositoryImpl(supabase);
    const productImageStorage = new ProductImageStorage(supabase);
    const imageStorage = new ImageStorageServiceImpl(productImageStorage);
    const service = new ProductServiceImpl(repository, imageStorage);

    const adminController = new AdminProductController(service);
    const publicController = new PublicProductController(service);

    // ===== ADMIN ROUTES =====

    // POST /api/v1/admin/products - Create product
    app.post(
        '/api/v1/admin/products',
        authMiddleware,
        adminAuthMiddleware,
        rateLimitMiddleware({ maxRequests: 100, windowSeconds: 60 }),
        upload.array('images', 5), // Handle up to 5 image files
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                // Parse JSON fields from multipart form data
                const productData = {
                    name: req.body.name,
                    description: req.body.description,
                    brand: req.body.brand,
                    specs: parseJsonObject(req.body.specs),
                    price: parseFloat(req.body.price),
                    category: req.body.category,
                    status: req.body.status,
                    images: req.files as Express.Multer.File[], // Multer files
                };

                const result = await adminController.createProduct(productData);
                res.status(result.status).json(result.data);
            } catch (error) {
                next(error);
            }
        }
    );

    // GET /api/v1/admin/products - List products
    app.get(
        '/api/v1/admin/products',
        authMiddleware,
        adminAuthMiddleware,
        rateLimitMiddleware({ maxRequests: 100, windowSeconds: 60 }),
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const result = await adminController.listProducts(req.query);
                res.status(result.status).json(result.data);
            } catch (error) {
                next(error);
            }
        }
    );

    // GET /api/v1/admin/products/:id - Get product by ID
    app.get(
        '/api/v1/admin/products/:id',
        authMiddleware,
        adminAuthMiddleware,
        rateLimitMiddleware({ maxRequests: 100, windowSeconds: 60 }),
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const includeDeleted = req.query.includeDeleted === 'true';
                const result = await adminController.getProductById(req.params.id, includeDeleted);
                res.status(result.status).json(result.data);
            } catch (error) {
                next(error);
            }
        }
    );

    // PUT /api/v1/admin/products/:id - Update product
    app.put(
        '/api/v1/admin/products/:id',
        authMiddleware,
        adminAuthMiddleware,
        rateLimitMiddleware({ maxRequests: 100, windowSeconds: 60 }),
        upload.array('images', 5), // Handle up to 5 image files
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                // Parse JSON fields from multipart form data
                const updateData = {
                    name: req.body.name,
                    description: req.body.description,
                    brand: req.body.brand,
                    specs: parseJsonObject(req.body.specs),
                    price: req.body.price ? parseFloat(req.body.price) : undefined,
                    category: req.body.category,
                    status: req.body.status,
                    images: req.files as Express.Multer.File[], // Multer files
                    removeImages: req.body.removeImages ? JSON.parse(req.body.removeImages) : undefined,
                };

                const result = await adminController.updateProduct(req.params.id, updateData);
                res.status(result.status).json(result.data);
            } catch (error) {
                next(error);
            }
        }
    );

    // DELETE /api/v1/admin/products/:id - Delete product
    app.delete(
        '/api/v1/admin/products/:id',
        authMiddleware,
        adminAuthMiddleware,
        rateLimitMiddleware({ maxRequests: 100, windowSeconds: 60 }),
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const result = await adminController.deleteProduct(req.params.id);
                res.status(result.status).send();
            } catch (error) {
                next(error);
            }
        }
    );

    // ===== PUBLIC ROUTES =====

    // GET /api/v1/products - List active products
    app.get(
        '/api/v1/products',
        rateLimitMiddleware({ maxRequests: 1000, windowSeconds: 3600 }),
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const result = await publicController.listProducts(req.query);

                // Add caching headers
                res.set('Cache-Control', 'public, max-age=300');
                res.set('ETag', `"${Date.now()}"`);

                res.status(result.status).json(result.data);
            } catch (error) {
                next(error);
            }
        }
    );

    // GET /api/v1/products/:id - Get active product by ID
    app.get(
        '/api/v1/products/:id',
        rateLimitMiddleware({ maxRequests: 1000, windowSeconds: 3600 }),
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const result = await publicController.getProductById(req.params.id);

                // Add caching headers
                res.set('Cache-Control', 'public, max-age=3600, must-revalidate');
                res.set('ETag', `"${Date.now()}"`);

                res.status(result.status).json(result.data);
            } catch (error) {
                next(error);
            }
        }
    );
}
