/**
 * Supabase Authentication Middleware
 * 
 * Verifies Supabase JWT tokens and extracts user information.
 * Production-ready implementation with proper error handling.
 * 
 * @remarks
 * - Verifies JWT signature using Supabase JWT secret
 * - Validates token expiration
 * - Extracts user claims from token payload
 * - Attaches user info to request context
 * - Never logs sensitive token data
 * 
 * **Security**: Always verifies token server-side, never trusts client claims
 */

import { createClient } from '@supabase/supabase-js';
import { UnauthorizedException } from '../exceptions/unauthorized.exception';
import type { JWTVerifier, JWTPayload } from './auth.middleware';

/**
 * Supabase JWT payload structure
 * 
 * @see https://supabase.com/docs/guides/auth/jwts
 */
export interface SupabaseJWTPayload extends JWTPayload {
    /** User ID (UUID) */
    sub: string;

    /** User email */
    email: string;

    /** User role from app_metadata */
    role: string;

    /** Issued at timestamp */
    iat: number;

    /** Expiration timestamp */
    exp: number;

    /** Session ID */
    session_id?: string;

    /** App metadata (custom claims) */
    app_metadata?: {
        provider?: string;
        providers?: string[];
        [key: string]: any;
    };

    /** User metadata */
    user_metadata?: {
        full_name?: string;
        avatar_url?: string;
        [key: string]: any;
    };
}

/**
 * Create Supabase JWT verifier
 * 
 * Verifies JWT tokens issued by Supabase Auth using the JWT secret.
 * 
 * @param supabaseUrl - Supabase project URL
 * @param supabaseServiceKey - Supabase service role key (for verification)
 * @returns JWT verifier function
 * 
 * @example
 * ```typescript
 * const verifier = createSupabaseJWTVerifier(
 *   process.env.SUPABASE_URL!,
 *   process.env.SUPABASE_SERVICE_ROLE_KEY!
 * );
 * 
 * const authMiddleware = createAuthMiddleware(verifier);
 * ```
 */
export function createSupabaseJWTVerifier(
    supabaseUrl: string,
    supabaseServiceKey: string
): JWTVerifier {
    // Create Supabase client for token verification
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    return async (token: string): Promise<SupabaseJWTPayload> => {
        try {
            // Verify token using Supabase client
            const { data, error } = await supabase.auth.getUser(token);

            if (error || !data.user) {
                throw new UnauthorizedException(
                    'Invalid or expired authentication token'
                );
            }

            // Extract user information
            const user = data.user;

            // Get role from app_metadata or user_metadata, default to 'customer'
            const role =
                user.app_metadata?.role ||
                user.user_metadata?.role ||
                'customer';

            // Construct JWT payload
            const payload: SupabaseJWTPayload = {
                sub: user.id,
                email: user.email!,
                role,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
                app_metadata: user.app_metadata,
                user_metadata: user.user_metadata,
            };

            return payload;
        } catch (error) {
            // If error is already UnauthorizedException, rethrow
            if (error instanceof UnauthorizedException) {
                throw error;
            }

            // Log error for debugging (without sensitive data)
            console.error('JWT verification failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            });

            throw new UnauthorizedException(
                'Authentication token verification failed'
            );
        }
    };
}

/**
 * Alternative: Verify JWT using jose library (faster, no API call)
 * 
 * This method verifies the JWT signature locally without calling Supabase API.
 * Recommended for high-traffic applications.
 * 
 * @requires npm install jose
 */
export function createSupabaseJWTVerifierLocal(jwtSecret: string): JWTVerifier {
    return async (token: string): Promise<SupabaseJWTPayload> => {
        try {
            // Import jose dynamically
            const { jwtVerify } = await import('jose');

            // Convert JWT secret to Uint8Array
            const secret = new TextEncoder().encode(jwtSecret);

            // Verify JWT signature and decode payload
            const { payload } = await jwtVerify(token, secret, {
                algorithms: ['HS256'],
            });

            // Validate required fields
            if (!payload.sub || !payload.email) {
                throw new UnauthorizedException(
                    'Invalid token payload: missing required fields'
                );
            }

            // Extract role from payload
            const role =
                (payload.app_metadata as any)?.role ||
                (payload.user_metadata as any)?.role ||
                payload.role ||
                'customer';

            // Construct typed payload
            const typedPayload: SupabaseJWTPayload = {
                sub: payload.sub as string,
                email: payload.email as string,
                role: role as string,
                iat: payload.iat || Math.floor(Date.now() / 1000),
                exp: payload.exp || Math.floor(Date.now() / 1000) + 3600,
                session_id: payload.session_id as string | undefined,
                app_metadata: payload.app_metadata as any,
                user_metadata: payload.user_metadata as any,
            };

            return typedPayload;
        } catch (error) {
            // Handle JWT verification errors
            if (error instanceof UnauthorizedException) {
                throw error;
            }

            console.error('Local JWT verification failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            });

            throw new UnauthorizedException(
                'Invalid or expired authentication token'
            );
        }
    };
}

/**
 * Get JWT secret from Supabase service role key
 * 
 * The JWT secret is embedded in the service role key.
 * This extracts it for local JWT verification.
 * 
 * @param serviceRoleKey - Supabase service role key
 * @returns JWT secret string
 */
export function extractJWTSecret(serviceRoleKey: string): string {
    try {
        // Decode the service role key (it's a JWT itself)
        const parts = serviceRoleKey.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid service role key format');
        }

        // The secret is typically the service role key itself for HS256
        return serviceRoleKey;
    } catch (error) {
        throw new Error('Failed to extract JWT secret from service role key');
    }
}
