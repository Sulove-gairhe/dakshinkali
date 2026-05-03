/**
 * Environment Configuration
 * 
 * Centralized environment variable management with validation.
 * Ensures all required environment variables are present at startup.
 */

export interface EnvConfig {
    // Server
    port: number;
    nodeEnv: 'development' | 'production' | 'test';

    // Supabase
    supabaseUrl: string;
    supabaseAnonKey: string;
    supabaseServiceRoleKey: string;

    // JWT (for Supabase token verification)
    jwtSecret: string;

    // CORS
    corsOrigins: string[];

    // Rate Limiting
    rateLimitEnabled: boolean;
}

/**
 * Load and validate environment variables
 * 
 * @throws Error if required environment variables are missing
 */
export function loadEnvConfig(): EnvConfig {
    const requiredVars = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}\n` +
            'Please check your .env file.'
        );
    }

    return {
        port: parseInt(process.env.PORT || process.env.API_PORT || '3002', 10),
        nodeEnv: (process.env.NODE_ENV as any) || 'development',

        supabaseUrl: process.env.SUPABASE_URL!,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY!,
        supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,

        jwtSecret: process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY!,

        corsOrigins: process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',')
            : ['http://localhost:3000', 'http://localhost:3001'],

        rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    };
}

/**
 * Global environment configuration instance
 */
export const env = loadEnvConfig();
