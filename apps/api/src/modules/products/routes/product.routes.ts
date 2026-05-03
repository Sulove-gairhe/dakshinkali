/**
 * Product Routes - Route Registration and Middleware Composition
 * 
 * Wires together controllers, middleware, and routing for the Product Module.
 * Provides production-ready Express/Fastify-style route configuration.
 * 
 * @remarks
 * - Registers all product endpoints (admin and public)
 * - Applies appropriate middleware to each route
 * - Handles request/response transformation
 * - Implements error handling
 * - Supports both Express and Fastify frameworks
 * 
 * **Validates: Requirements 10.1, 13.1**
 */

import { AdminProductController } from '../controllers/admin-product.controller';
import { PublicProductController } from '../controllers/public-product.controller';
import { ProductService } from '../services/product.service';
import {
    createAuthMiddleware,
    createAdminAuthMiddleware,
    createRateLimitMiddleware,
    createCORSMiddleware,
    createCacheMiddleware,
    createAPIVersionMiddleware,
    createErrorHandler,
    AuthUser,
    JWTVerifier,
} from '../../../common/middleware';

/**
 * Route configuration options
 */
export interface RouteConfig {
    /** Product service instance */
    productService: ProductService;

    /** JWT token verifier function */
    jwtVerifier: JWTVerifier;

    /** Allowed CORS origins */
    corsOrigins: string[] | '*';

    /** Enable rate limiting */
    enableRateLimiting?: boolean;

    /** Enable caching for public endpoints */
    enableCaching?: boolean;

    /** Custom logger function */
    logger?: (level: 'error' | 'warn' | 'info', message: string, meta?: Record<string, any>) => void;
}

/**
 * Request handler context
 */
export interface RequestContext {
    method: string;
    url: string;
    headers: Record<string, string | string[] | undefined>;
    params: Record<string, string>;
    query: Record<string, any>;
    body?: any;
    user?: AuthUser;
    ip?: string;
}

/**
 * Response object
 */
export interface Response {
    statusCode: number;
    headers: Record<string, string>;
    body: any;
}

/**
 * Route handler function type
 */
export type RouteHandler = (context: RequestContext) => Promise<Response>;

/**
 * Route definition
 */
export interface Route {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
    path: string;
    handler: RouteHandler;
    middleware?: RouteHandler[];
}

/**
 * Create product routes with all middleware
 * 
 * @param config - Route configuration
 * @returns Array of route definitions
 * 
 * @example
 * ```typescript
 * const routes = createProductRoutes({
 *   productService: productServiceInstance,
 *   jwtVerifier: async (token) => jwt.verify(token, process.env.JWT_SECRET),
 *   corsOrigins: ['https://example.com'],
 *   enableRateLimiting: true,
 *   enableCaching: true,
 *   logger: console.log
 * });
 * 
 * // Register routes with Express
 * routes.forEach(route => {
 *   app[route.method.toLowerCase()](route.path, async (req, res) => {
 *     const context = {
 *       method: req.method,
 *       url: req.url,
 *       headers: req.headers,
 *       params: req.params,
 *       query: req.query,
 *       body: req.body,
 *       ip: req.ip
 *     };
 *     const response = await route.handler(context);
 *     res.status(response.statusCode).set(response.headers).json(response.body);
 *   });
 * });
 * ```
 */
export function createProductRoutes(config: RouteConfig): Route[] {
    const {
        productService,
        jwtVerifier,
        corsOrigins,
        enableRateLimiting = true,
        enableCaching = true,
        logger,
    } = config;

    // Initialize controllers
    const adminController = new AdminProductController(productService);
    const publicController = new PublicProductController(productService);

    // Initialize middleware
    const authMiddleware = createAuthMiddleware(jwtVerifier);
    const adminAuthMiddleware = createAdminAuthMiddleware();
    const errorHandler = createErrorHandler();
    const apiVersionMiddleware = createAPIVersionMiddleware({
        currentVersion: 'v1',
        supportedVersions: ['v1'],
        includeVersionHeader: true,
    });
    const corsMiddleware = createCORSMiddleware({
        allowedOrigins: corsOrigins,
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        allowCredentials: true,
    });

    // Rate limiters
    const adminRateLimit = enableRateLimiting
        ? createRateLimitMiddleware({
            maxRequests: 100,
            windowSeconds: 60,
            keyGenerator: (userId) => `admin:${userId}`,
        })
        : null;

    const publicRateLimit = enableRateLimiting
        ? createRateLimitMiddleware({
            maxRequests: 1000,
            windowSeconds: 3600,
            keyGenerator: (ip) => `public:${ip}`,
        })
        : null;

    // Cache configurations
    const listCache = enableCaching
        ? createCacheMiddleware({
            maxAge: 300, // 5 minutes
            public: true,
            includeETag: true,
        })
        : null;

    const detailCache = enableCaching
        ? createCacheMiddleware({
            maxAge: 3600, // 1 hour
            public: true,
            mustRevalidate: true,
            includeETag: true,
        })
        : null;

    const noCache = createCacheMiddleware({
        maxAge: 0,
        private: true,
    });

    /**
     * Compose middleware and controller into route handler
     */
    const composeHandler = (
        controllerMethod: (...args: any[]) => Promise<any>,
        options: {
            requireAuth?: boolean;
            requireAdmin?: boolean;
            rateLimit?: ReturnType<typeof createRateLimitMiddleware> | null;
            cache?: ReturnType<typeof createCacheMiddleware> | null;
        } = {}
    ): RouteHandler => {
        return async (context: RequestContext): Promise<Response> => {
            try {
                const headers: Record<string, string> = {};

                // 1. API Versioning
                const versionHeaders = apiVersionMiddleware('v1');
                Object.assign(headers, versionHeaders);

                // 2. CORS
                const origin = Array.isArray(context.headers.origin)
                    ? context.headers.origin[0]
                    : context.headers.origin;
                const corsHeaders = corsMiddleware(origin, context.method);
                Object.assign(headers, corsHeaders);

                // Handle preflight requests
                if (context.method === 'OPTIONS') {
                    return {
                        statusCode: 204,
                        headers,
                        body: null,
                    };
                }

                // 3. Authentication
                if (options.requireAuth) {
                    const authHeader = Array.isArray(context.headers.authorization)
                        ? context.headers.authorization[0]
                        : context.headers.authorization;
                    context.user = await authMiddleware(authHeader);
                }

                // 4. Authorization
                if (options.requireAdmin) {
                    adminAuthMiddleware(context.user);
                }

                // 5. Rate Limiting
                if (options.rateLimit) {
                    const identifier = context.user?.id || context.ip || 'unknown';
                    const rateLimitResult = options.rateLimit(identifier);
                    headers['X-RateLimit-Limit'] = rateLimitResult.limit.toString();
                    headers['X-RateLimit-Remaining'] = rateLimitResult.remaining.toString();
                    headers['X-RateLimit-Reset'] = rateLimitResult.resetIn.toString();
                }

                // 6. Call controller
                // Determine what to pass based on HTTP method and route
                let controllerArg;
                if (context.method === 'POST') {
                    // For POST, pass body
                    controllerArg = context.body;
                } else if (context.method === 'PUT') {
                    // For PUT, merge params and body
                    controllerArg = { ...context.params, ...context.body };
                } else if (context.params && context.params.id) {
                    // For GET/DELETE with ID, pass params
                    controllerArg = context.params;
                } else {
                    // For GET list, pass query
                    controllerArg = context.query;
                }

                const result = await controllerMethod(controllerArg);

                // 7. Caching
                if (options.cache && context.method === 'GET') {
                    const cacheHeaders = options.cache(result.data);
                    Object.assign(headers, cacheHeaders);
                }

                return {
                    statusCode: result.status,
                    headers,
                    body: result.data,
                };
            } catch (error) {
                // Error handling
                console.error('ERROR CAUGHT IN ROUTE HANDLER:', error);
                console.error('Error name:', (error as Error).name);
                console.error('Error message:', (error as Error).message);
                console.error('Error stack:', (error as Error).stack);

                const requestContext = {
                    method: context.method,
                    url: context.url,
                    userId: context.user?.id,
                    timestamp: new Date().toISOString(),
                };

                const { statusCode, body } = errorHandler(error as Error, requestContext);

                return {
                    statusCode,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body,
                };
            }
        };
    };

    // Define routes
    const routes: Route[] = [
        // ===== ADMIN ROUTES =====

        // POST /api/v1/admin/products - Create product
        {
            method: 'POST',
            path: '/api/v1/admin/products',
            handler: composeHandler(
                (body) => adminController.createProduct(body),
                {
                    requireAuth: true,
                    requireAdmin: true,
                    rateLimit: adminRateLimit,
                    cache: noCache,
                }
            ),
        },

        // GET /api/v1/admin/products - List products
        {
            method: 'GET',
            path: '/api/v1/admin/products',
            handler: composeHandler(
                (query) => adminController.listProducts(query),
                {
                    requireAuth: true,
                    requireAdmin: true,
                    rateLimit: adminRateLimit,
                    cache: noCache,
                }
            ),
        },

        // GET /api/v1/admin/products/:id - Get product by ID
        {
            method: 'GET',
            path: '/api/v1/admin/products/:id',
            handler: composeHandler(
                (params) => adminController.getProductById(params.id, params.includeDeleted),
                {
                    requireAuth: true,
                    requireAdmin: true,
                    rateLimit: adminRateLimit,
                    cache: noCache,
                }
            ),
        },

        // PUT /api/v1/admin/products/:id - Update product
        {
            method: 'PUT',
            path: '/api/v1/admin/products/:id',
            handler: composeHandler(
                (data) => adminController.updateProduct(data.id, data),
                {
                    requireAuth: true,
                    requireAdmin: true,
                    rateLimit: adminRateLimit,
                    cache: noCache,
                }
            ),
        },

        // DELETE /api/v1/admin/products/:id - Delete product
        {
            method: 'DELETE',
            path: '/api/v1/admin/products/:id',
            handler: composeHandler(
                (params) => adminController.deleteProduct(params.id),
                {
                    requireAuth: true,
                    requireAdmin: true,
                    rateLimit: adminRateLimit,
                    cache: noCache,
                }
            ),
        },

        // ===== PUBLIC ROUTES =====

        // GET /api/v1/products - List active products
        {
            method: 'GET',
            path: '/api/v1/products',
            handler: composeHandler(
                (query) => publicController.listProducts(query),
                {
                    requireAuth: false,
                    rateLimit: publicRateLimit,
                    cache: listCache,
                }
            ),
        },

        // GET /api/v1/products/:id - Get active product by ID
        {
            method: 'GET',
            path: '/api/v1/products/:id',
            handler: composeHandler(
                (params) => publicController.getProductById(params.id),
                {
                    requireAuth: false,
                    rateLimit: publicRateLimit,
                    cache: detailCache,
                }
            ),
        },

        // OPTIONS for CORS preflight
        {
            method: 'OPTIONS',
            path: '/api/v1/admin/products',
            handler: composeHandler(() => Promise.resolve({ status: 204, data: null })),
        },
        {
            method: 'OPTIONS',
            path: '/api/v1/admin/products/:id',
            handler: composeHandler(() => Promise.resolve({ status: 204, data: null })),
        },
        {
            method: 'OPTIONS',
            path: '/api/v1/products',
            handler: composeHandler(() => Promise.resolve({ status: 204, data: null })),
        },
        {
            method: 'OPTIONS',
            path: '/api/v1/products/:id',
            handler: composeHandler(() => Promise.resolve({ status: 204, data: null })),
        },
    ];

    return routes;
}

/**
 * Express adapter for product routes
 * 
 * @param routes - Array of route definitions
 * @param app - Express application instance
 * 
 * @example
 * ```typescript
 * import express from 'express';
 * 
 * const app = express();
 * app.use(express.json());
 * 
 * const routes = createProductRoutes(config);
 * registerExpressRoutes(routes, app);
 * 
 * app.listen(3000);
 * ```
 */
export function registerExpressRoutes(routes: Route[], app: any): void {
    routes.forEach((route) => {
        const method = route.method.toLowerCase();
        app[method](route.path, async (req: any, res: any) => {
            const context: RequestContext = {
                method: req.method,
                url: req.url,
                headers: req.headers,
                params: req.params,
                query: req.query,
                body: req.body,
                ip: req.ip,
            };

            const response = await route.handler(context);
            res.status(response.statusCode).set(response.headers).json(response.body);
        });
    });
}

/**
 * Fastify adapter for product routes
 * 
 * @param routes - Array of route definitions
 * @param fastify - Fastify instance
 * 
 * @example
 * ```typescript
 * import Fastify from 'fastify';
 * 
 * const fastify = Fastify();
 * 
 * const routes = createProductRoutes(config);
 * registerFastifyRoutes(routes, fastify);
 * 
 * fastify.listen({ port: 3000 });
 * ```
 */
export function registerFastifyRoutes(routes: Route[], fastify: any): void {
    routes.forEach((route) => {
        fastify.route({
            method: route.method,
            url: route.path,
            handler: async (request: any, reply: any) => {
                const context: RequestContext = {
                    method: request.method,
                    url: request.url,
                    headers: request.headers,
                    params: request.params,
                    query: request.query,
                    body: request.body,
                    ip: request.ip,
                };

                const response = await route.handler(context);
                reply.code(response.statusCode).headers(response.headers).send(response.body);
            },
        });
    });
}
