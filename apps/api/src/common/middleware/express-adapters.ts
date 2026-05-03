/**
 * Express Middleware Adapters
 * 
 * Converts framework-agnostic middleware to Express-compatible middleware.
 */

import { Request, Response, NextFunction } from 'express';
import { createAuthMiddleware, JWTVerifier, AuthUser } from './auth.middleware';
import { createSupabaseJWTVerifier } from './supabase-auth.middleware';
import { createAdminAuthMiddleware } from './admin-auth.middleware';
import { createRateLimitMiddleware, RateLimitConfig, RateLimitExceededError } from './rate-limit.middleware';
import { defaultErrorHandler } from './error-handler.middleware';
import { env } from '../../config/env.config';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

/**
 * Supabase JWT verifier instance (singleton)
 */
let supabaseVerifier: JWTVerifier | null = null;

/**
 * Get or create Supabase JWT verifier
 */
function getSupabaseVerifier(): JWTVerifier {
    if (!supabaseVerifier) {
        supabaseVerifier = createSupabaseJWTVerifier(
            env.supabaseUrl,
            env.supabaseServiceRoleKey
        );
    }
    return supabaseVerifier;
}

/**
 * Express authentication middleware
 * 
 * Verifies Supabase JWT tokens and attaches user to request.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const verifier = getSupabaseVerifier();
    const auth = createAuthMiddleware(verifier);

    auth(req.headers.authorization)
        .then(user => {
            req.user = user;
            next();
        })
        .catch(error => {
            next(error);
        });
}

/**
 * Express optional authentication middleware.
 *
 * If a bearer token is present, it is verified and attached to the request.
 * If no token is present, the request continues as a guest request.
 */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (!req.headers.authorization) {
        next();
        return;
    }

    authMiddleware(req, res, next);
}

/**
 * Express admin authorization middleware
 */
export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
    try {
        const adminAuth = createAdminAuthMiddleware();
        adminAuth(req.user);
        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Express rate limiting middleware factory
 */
export function rateLimitMiddleware(config: RateLimitConfig) {
    const limiter = createRateLimitMiddleware(config);

    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const identifier = req.user?.id || req.ip || 'unknown';
            const result = limiter(identifier);

            // Add rate limit headers
            res.set('X-RateLimit-Limit', result.limit.toString());
            res.set('X-RateLimit-Remaining', result.remaining.toString());
            res.set('X-RateLimit-Reset', result.resetIn.toString());

            next();
        } catch (error) {
            if (error instanceof RateLimitExceededError) {
                res.set('Retry-After', error.retryAfter.toString());
                res.status(429).json({
                    error: {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: error.message,
                        retryAfter: error.retryAfter,
                    },
                });
            } else {
                next(error);
            }
        }
    };
}


/**
 * Express error handler middleware
 */
export function errorHandlerMiddleware(err: Error, req: Request, res: Response, next: NextFunction): void {
    const context = {
        method: req.method,
        url: req.url,
        userId: req.user?.id,
        timestamp: new Date().toISOString(),
    };

    const { statusCode, body } = defaultErrorHandler(err, context);
    res.status(statusCode).json(body);
}
