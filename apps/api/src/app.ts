/**
 * Express Application Setup
 * 
 * Configures Express app with middleware stack and route registration.
 * Does not start the server - that's handled by server.ts.
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { env } from './config/env.config';
import { errorHandlerMiddleware } from './common/middleware/express-adapters';
import { registerProductRoutes } from './modules/products/routes/express.routes';
import { registerCartRoutes } from './modules/cart/routes/express.routes';
import { registerOrderRoutes } from './modules/orders';
import { registerAdminSupportRoutes } from './modules/admin';
import { registerInternalOrderNotifyRoutes } from './modules/internal/order-notify.routes';
import { checkDatabaseHealth, isDatabaseConnected } from './lib/database';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
    const app = express();

    // ===== Global Middleware =====

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // CORS
    app.use(cors({
        origin: env.corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID'],
    }));

    // API Versioning header
    app.use((req: Request, res: Response, next: NextFunction) => {
        res.set('API-Version', 'v1');
        res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
        next();
    });

    // ===== Swagger Documentation =====

    try {
        const swaggerDocument = YAML.load(path.join(__dirname, '../docs/openapi.yaml'));

        // Swagger UI options
        const swaggerOptions = {
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'Dakshinkali Electronics API',
            swaggerOptions: {
                persistAuthorization: true,
                displayRequestDuration: true,
                filter: true,
                tryItOutEnabled: true,
            },
        };

        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

        // Redirect root to API docs
        app.get('/', (req: Request, res: Response) => {
            res.redirect('/api-docs');
        });
    } catch (error) {
        console.error('Failed to load Swagger documentation:', error);
    }

    // ===== Health Check =====

    app.get('/health', async (req: Request, res: Response) => {
        const dbHealthy = await checkDatabaseHealth();
        const status = dbHealthy ? 'ok' : 'degraded';
        const statusCode = dbHealthy ? 200 : 503;

        res.status(statusCode).json({
            status,
            db: isDatabaseConnected() ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString(),
            environment: env.nodeEnv,
            version: 'v1',
        });
    });

    app.get('/api/health', async (req: Request, res: Response) => {
        const dbHealthy = await checkDatabaseHealth();
        const status = dbHealthy ? 'ok' : 'degraded';
        const statusCode = dbHealthy ? 200 : 503;

        res.status(statusCode).json({
            status,
            db: isDatabaseConnected() ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString(),
            environment: env.nodeEnv,
            version: 'v1',
        });
    });

    // ===== API Routes =====

    // Product routes
    registerProductRoutes(app);

    // Cart routes
    registerCartRoutes(app);

    // Order routes
    registerOrderRoutes(app);

    // Internal routes (order notifications)
    registerInternalOrderNotifyRoutes(app);

    // Profile and admin dashboard/user routes
    registerAdminSupportRoutes(app);

    // ===== 404 Handler =====

    app.use((req: Request, res: Response) => {
        res.status(404).json({
            error: {
                code: 'NOT_FOUND',
                message: `Route ${req.method} ${req.path} not found`,
            },
        });
    });

    // ===== Error Handler (must be last) =====

    app.use(errorHandlerMiddleware);

    return app;
}
