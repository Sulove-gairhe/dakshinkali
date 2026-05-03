/**
 * Role-Based Authorization Middleware
 * 
 * Enforces role-based access control for protected routes.
 * Works in conjunction with authentication middleware.
 * 
 * @remarks
 * - Checks user role from authenticated user context
 * - Supports multiple role requirements
 * - Returns 403 Forbidden for insufficient permissions
 * - Must be used after authentication middleware
 * 
 * **Security**: Always verify authentication before checking roles
 */

import { ForbiddenException } from '../exceptions/forbidden.exception';
import { UnauthorizedException } from '../exceptions/unauthorized.exception';
import type { AuthUser } from './auth.middleware';

/**
 * User role types
 */
export type UserRole = 'customer' | 'admin';

/**
 * Role requirement configuration
 */
export interface RoleRequirement {
    /** Required roles (user must have at least one) */
    roles: UserRole[];

    /** Error message for forbidden access */
    message?: string;
}

/**
 * Create role-based authorization middleware
 * 
 * @param requirement - Role requirement configuration
 * @returns Authorization middleware function
 * 
 * @example
 * ```typescript
 * // Require admin role
 * const requireAdmin = createRoleMiddleware({ roles: ['admin'] });
 * 
 * // Require admin or manager role
 * const requireStaff = createRoleMiddleware({ 
 *   roles: ['admin', 'manager'],
 *   message: 'Staff access required'
 * });
 * 
 * // Usage in route handler
 * async function handler(context: RequestContext) {
 *   requireAdmin(context.user);
 *   // ... handle request
 * }
 * ```
 */
export function createRoleMiddleware(requirement: RoleRequirement) {
    return (user?: AuthUser): void => {
        // Check if user is authenticated
        if (!user) {
            throw new UnauthorizedException(
                'Authentication required to access this resource'
            );
        }

        // Check if user has required role
        const hasRequiredRole = requirement.roles.includes(user.role as UserRole);

        if (!hasRequiredRole) {
            const message = requirement.message ||
                `Access denied. Required role: ${requirement.roles.join(' or ')}`;

            throw new ForbiddenException(message);
        }
    };
}

/**
 * Require admin role middleware
 * 
 * Convenience function for admin-only routes.
 * 
 * @example
 * ```typescript
 * async function handler(context: RequestContext) {
 *   requireAdmin(context.user);
 *   // ... admin-only logic
 * }
 * ```
 */
export const requireAdmin = createRoleMiddleware({
    roles: ['admin'],
    message: 'Administrator access required',
});

/**
 * Require customer role middleware
 * 
 * Convenience function for customer-only routes.
 * 
 * @example
 * ```typescript
 * async function handler(context: RequestContext) {
 *   requireCustomer(context.user);
 *   // ... customer-only logic
 * }
 * ```
 */
export const requireCustomer = createRoleMiddleware({
    roles: ['customer'],
    message: 'Customer access required',
});

/**
 * Require any authenticated user
 * 
 * Convenience function for routes that require authentication
 * but don't care about specific roles.
 * 
 * @example
 * ```typescript
 * async function handler(context: RequestContext) {
 *   requireAuthenticated(context.user);
 *   // ... authenticated user logic
 * }
 * ```
 */
export function requireAuthenticated(user?: AuthUser): void {
    if (!user) {
        throw new UnauthorizedException(
            'Authentication required to access this resource'
        );
    }
}

/**
 * Check if user has specific role
 * 
 * Utility function for conditional logic based on roles.
 * Does not throw errors, returns boolean.
 * 
 * @param user - Authenticated user
 * @param role - Role to check
 * @returns True if user has the role
 * 
 * @example
 * ```typescript
 * if (hasRole(user, 'admin')) {
 *   // Show admin features
 * }
 * ```
 */
export function hasRole(user: AuthUser | undefined, role: UserRole): boolean {
    return user?.role === role;
}

/**
 * Check if user has any of the specified roles
 * 
 * @param user - Authenticated user
 * @param roles - Roles to check
 * @returns True if user has at least one of the roles
 * 
 * @example
 * ```typescript
 * if (hasAnyRole(user, ['admin', 'manager'])) {
 *   // Show staff features
 * }
 * ```
 */
export function hasAnyRole(user: AuthUser | undefined, roles: UserRole[]): boolean {
    return roles.some(role => user?.role === role);
}

/**
 * Get user role safely
 * 
 * @param user - Authenticated user
 * @returns User role or 'guest' if not authenticated
 * 
 * @example
 * ```typescript
 * const role = getUserRole(user);
 * console.log(`User role: ${role}`);
 * ```
 */
export function getUserRole(user: AuthUser | undefined): UserRole | 'guest' {
    return (user?.role as UserRole) || 'guest';
}
