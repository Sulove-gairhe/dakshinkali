/**
 * Authentication Middleware
 * 
 * Verifies JWT tokens and extracts user information from requests.
 * Protects endpoints that require authentication.
 * 
 * @remarks
 * - Verifies JWT token from Authorization header (Bearer token)
 * - Extracts user information from token payload
 * - Returns 401 Unauthorized for missing or invalid tokens
 * - Attaches user info to request context for downstream use
 * - Never logs sensitive token data
 * 
 * **Validates: Requirements 1.4, 12.2**
 */

import { UnauthorizedException } from '../exceptions/unauthorized.exception';

/**
 * User information extracted from JWT token
 */
export interface AuthUser {
    /** User ID (UUID) */
    id: string;

    /** User email */
    email: string;

    /** User role (e.g., 'admin', 'user') */
    role: string;

    /** Additional user metadata */
    [key: string]: any;
}

/**
 * JWT token payload structure
 */
export interface JWTPayload {
    sub: string;        // User ID
    email: string;      // User email
    role: string;       // User role
    iat?: number;       // Issued at
    exp?: number;       // Expiration time
    [key: string]: any; // Additional claims
}

/**
 * JWT verification function type
 * Implementations should verify token signature and return payload
 */
export type JWTVerifier = (token: string) => Promise<JWTPayload> | JWTPayload;

/**
 * Create authentication middleware
 * 
 * @param verifyToken - Function to verify JWT token and return payload
 * @returns Authentication middleware function
 * 
 * @example
 * ```typescript
 * import jwt from 'jsonwebtoken';
 * 
 * const authMiddleware = createAuthMiddleware(async (token) => {
 *   try {
 *     const payload = jwt.verify(token, process.env.JWT_SECRET);
 *     return payload as JWTPayload;
 *   } catch (error) {
 *     throw new UnauthorizedException('Invalid or expired token');
 *   }
 * });
 * 
 * // In Express
 * app.use('/api/v1/admin', authMiddleware);
 * 
 * // Access user in route handler
 * app.get('/api/v1/admin/products', (req, res) => {
 *   const user = req.user; // AuthUser object
 *   // ...
 * });
 * ```
 */
export function createAuthMiddleware(verifyToken: JWTVerifier) {
    return async (authHeader?: string): Promise<AuthUser> => {
        // Check if Authorization header is present
        if (!authHeader) {
            throw new UnauthorizedException('Authentication required. Please provide a valid access token.');
        }

        // Extract token from "Bearer <token>" format
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new UnauthorizedException('Invalid authorization header format. Expected: Bearer <token>');
        }

        const token = parts[1];

        // Verify token is not empty
        if (!token || token.trim() === '') {
            throw new UnauthorizedException('Authentication token is missing.');
        }

        try {
            // Verify token and extract payload
            const payload = await verifyToken(token);

            // Validate required fields in payload
            if (!payload.sub || !payload.email || !payload.role) {
                throw new UnauthorizedException('Invalid token payload. Missing required fields.');
            }

            // Create AuthUser object
            const user: AuthUser = {
                ...payload, // Include additional claims first
                id: payload.sub,
                email: payload.email,
                role: payload.role,
            };

            return user;
        } catch (error) {
            // If error is already UnauthorizedException, rethrow it
            if (error instanceof UnauthorizedException) {
                throw error;
            }

            // Otherwise, wrap in UnauthorizedException
            throw new UnauthorizedException('Invalid or expired authentication token.');
        }
    };
}

/**
 * Mock JWT verifier for development/testing
 * 
 * @remarks
 * - DO NOT use in production
 * - Accepts any token and returns mock user data
 * - Useful for local development without auth server
 * 
 * @example
 * ```typescript
 * const authMiddleware = createAuthMiddleware(mockJWTVerifier);
 * ```
 */
export const mockJWTVerifier: JWTVerifier = (token: string): JWTPayload => {
    // Parse token as JSON if possible (for testing)
    try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString());
        return {
            sub: payload.sub || 'mock-user-id',
            email: payload.email || 'mock@example.com',
            role: payload.role || 'user',
            ...payload,
        };
    } catch {
        // Return default mock user
        return {
            sub: 'mock-user-id',
            email: 'mock@example.com',
            role: 'user',
        };
    }
};
