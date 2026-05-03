/**
 * Supabase Database Configuration
 * 
 * Provides centralized configuration for Supabase client connection with:
 * - Connection pooling for performance optimization
 * - Environment-based configuration
 * - Type-safe configuration interface
 * 
 * Requirements: 15.3 (Connection pooling for database access)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase configuration interface
 */
export interface SupabaseConfig {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
    options?: {
        db?: {
            schema?: string;
        };
        auth?: {
            persistSession?: boolean;
            autoRefreshToken?: boolean;
        };
        global?: {
            headers?: Record<string, string>;
        };
    };
}

/**
 * Connection pool configuration
 * Optimizes database performance by reusing connections
 */
export interface ConnectionPoolConfig {
    /**
     * Maximum number of connections in the pool
     * Default: 20 (matches Supabase pooler default_pool_size)
     */
    maxConnections: number;

    /**
     * Minimum number of idle connections to maintain
     * Default: 2
     */
    minConnections: number;

    /**
     * Maximum time (ms) to wait for a connection from the pool
     * Default: 30000 (30 seconds)
     */
    connectionTimeoutMillis: number;

    /**
     * Maximum time (ms) a connection can remain idle before being closed
     * Default: 10000 (10 seconds)
     */
    idleTimeoutMillis: number;
}

/**
 * Default connection pool configuration
 * Aligned with Supabase config.toml pooler settings
 */
export const DEFAULT_POOL_CONFIG: ConnectionPoolConfig = {
    maxConnections: 20,
    minConnections: 2,
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 10000,
};

/**
 * Get Supabase configuration from environment variables
 * 
 * @throws {Error} If required environment variables are missing
 */
export function getSupabaseConfig(): SupabaseConfig {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) {
        throw new Error(
            'Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable'
        );
    }

    if (!anonKey) {
        throw new Error(
            'Missing SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable'
        );
    }

    return {
        url,
        anonKey,
        serviceRoleKey,
        options: {
            db: {
                schema: 'public',
            },
            auth: {
                persistSession: false, // Server-side: don't persist sessions
                autoRefreshToken: false, // Server-side: manual token management
            },
            global: {
                headers: {
                    'x-application-name': 'dakshinkali-electronics',
                },
            },
        },
    };
}

/**
 * Create a Supabase client with connection pooling
 * 
 * For server-side use (API layer, repository layer)
 * Uses service role key for admin operations
 * 
 * @param poolConfig - Optional connection pool configuration
 * @returns Configured Supabase client
 */
export function createSupabaseClient(
    poolConfig: Partial<ConnectionPoolConfig> = {}
): SupabaseClient<any, 'public', any> {
    const config = getSupabaseConfig();
    const pool = { ...DEFAULT_POOL_CONFIG, ...poolConfig };

    // Use service role key for server-side operations if available
    const key = config.serviceRoleKey || config.anonKey;

    const client = createClient(config.url, key, {
        ...config.options,
        db: {
            ...config.options?.db,
        },
        global: {
            ...config.options?.global,
            headers: {
                ...config.options?.global?.headers,
                'x-connection-pool-max': pool.maxConnections.toString(),
                'x-connection-pool-min': pool.minConnections.toString(),
            },
        },
    });

    return client;
}

/**
 * Create a Supabase client for public/anonymous access
 * 
 * For client-side use or public API endpoints
 * Uses anon key with Row Level Security (RLS) enforcement
 * 
 * @returns Configured Supabase client with anon key
 */
export function createSupabasePublicClient(): SupabaseClient<any, 'public', any> {
    const config = getSupabaseConfig();

    return createClient(config.url, config.anonKey, {
        ...config.options,
        auth: {
            persistSession: true, // Client-side: persist sessions
            autoRefreshToken: true, // Client-side: auto-refresh tokens
        },
    });
}

/**
 * Singleton instance for server-side operations
 * Reuses the same client instance across the application
 */
let supabaseInstance: SupabaseClient<any, 'public', any> | null = null;

/**
 * Get or create the singleton Supabase client instance
 * 
 * Recommended for server-side API and repository layers
 * Ensures connection pooling is properly utilized
 * 
 * @returns Singleton Supabase client
 */
export function getSupabaseClient(): SupabaseClient<any, 'public', any> {
    if (!supabaseInstance) {
        supabaseInstance = createSupabaseClient();
    }
    return supabaseInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetSupabaseClient(): void {
    supabaseInstance = null;
}
