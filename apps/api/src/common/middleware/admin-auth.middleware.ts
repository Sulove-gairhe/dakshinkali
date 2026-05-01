/**
 * Admin Authorization Middleware
 * 
 * Verifies that authenticated users have admin role.
 * Must be used after authentication middleware.
 * 
 * @remarks
 * - Checks if user has admin role
 * - Returns 403 Forbidden for non-admin users
 * - Assumes user is already authenticated (use after auth middleware)
 * - Configurable admin role names
 * 
 * **Validates: Requirements 9.5, 12.3**
 */

import { ForbiddenException } from '../exceptions/forbidden.exception';
import { UnauthorizedException } from '../exceptions/unauthorized.exception';
import { AuthUser } from './auth.middleware';

/**
 * Admin authorization options
 */
export interface AdminAuthOptions {
    /** List of role names that grant admin access (default: ['admin']) */
    adminRoles?: string[];

    /** Custom error message for non-admin users */
    errorMessage?: string;
}

/**
 * Create admin authorization middleware
 * 
 * @param options - Configuration options for admin authorization
 * @returns Admin authorization middleware function
 * 
 * @example
 * ```typescript
 * const requireAdmin = createAdminAuthMiddleware({
 *   adminRoles: ['admin', 'superadmin'],
 *   errorMessage: 'Administrator access required'
 * });
 * 
 * // In Express (after auth middleware)
 * app.use('/api/v1/admin', authMiddleware, requireAdmin);
 * 
 * // Or per-route
 * app.post('/api/v1/admin/products', authMiddleware, requireAdmin, createProduct);
 * ```
 */
export function createAdminAuthMiddleware(options: AdminAuthOptions = {}) {
    const {
        adminRoles = ['admin'],
        errorMessage = 'Admin access required for this operation.',
    } = options;

    return (user?: AuthUser): void => {
        // Verify user is authenticated
        if (!user) {
            throw new UnauthorizedException('Authentication required. Please provide a valid access token.');
        }

        // Verify user has admin role
        if (!user.role || !adminRoles.includes(user.role)) {
            throw new ForbiddenException(errorMessage);
        }

        // User is authorized as admin
        // Middleware passes control to next handler
    };
}

/**
 * Default admin authorization middleware
 * Requires 'admin' role
 */
export const requireAdmin = createAdminAuthMiddleware();

/**
 * Flexible role-based authorization middleware
 * 
 * @param allowedRoles - Array of role names that are allowed
 * @param errorMessage - Optional custom error message
 * @returns Authorization middleware function
 * 
 * @example
 * ```typescript
 * const requireEditor = requireRole(['admin', 'editor'], 'Editor access required');
 * 
 * app.put('/api/v1/products/:id', authMiddleware, requireEditor, updateProduct);
 * ```
 */
export function requireRole(allowedRoles: string[], errorMessage?: string) {
    return (user?: AuthUser): void => {
        // Verify user is authenticated
        if (!user) {
            throw new UnauthorizedException('Authentication required. Please provide a valid access token.');
        }

        // Verify user has one of the allowed roles
        if (!user.role || !allowedRoles.includes(user.role)) {
            throw new ForbiddenException(
                errorMessage || `Access denied. Required roles: ${allowedRoles.join(', ')}`
            );
        }
    };
}
