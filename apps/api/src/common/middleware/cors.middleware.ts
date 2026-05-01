/**
 * CORS (Cross-Origin Resource Sharing) Middleware
 * 
 * Configures CORS headers to allow web client access from different origins.
 * Essential for browser-based applications accessing the API.
 * 
 * @remarks
 * - Configures Access-Control-Allow-Origin header
 * - Supports credentials (cookies, authorization headers)
 * - Handles preflight OPTIONS requests
 * - Configurable allowed origins, methods, and headers
 * 
 * **Validates: Requirements 14.2**
 */

/**
 * CORS configuration options
 */
export interface CORSConfig {
    /** Allowed origins (URLs or '*' for all) */
    allowedOrigins: string[] | '*';

    /** Allowed HTTP methods */
    allowedMethods?: string[];

    /** Allowed request headers */
    allowedHeaders?: string[];

    /** Exposed response headers */
    exposedHeaders?: string[];

    /** Allow credentials (cookies, authorization headers) */
    allowCredentials?: boolean;

    /** Max age for preflight cache (seconds) */
    maxAge?: number;
}

/**
 * CORS headers to be added to response
 */
export interface CORSHeaders {
    'Access-Control-Allow-Origin'?: string;
    'Access-Control-Allow-Methods'?: string;
    'Access-Control-Allow-Headers'?: string;
    'Access-Control-Expose-Headers'?: string;
    'Access-Control-Allow-Credentials'?: string;
    'Access-Control-Max-Age'?: string;
}

/**
 * Create CORS middleware
 * 
 * @param config - CORS configuration
 * @returns CORS middleware function
 * 
 * @example
 * ```typescript
 * const corsMiddleware = createCORSMiddleware({
 *   allowedOrigins: ['https://example.com', 'https://app.example.com'],
 *   allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
 *   allowedHeaders: ['Content-Type', 'Authorization'],
 *   allowCredentials: true,
 *   maxAge: 86400 // 24 hours
 * });
 * 
 * // In Express
 * app.use(corsMiddleware);
 * 
 * // Or per-route
 * app.get('/api/v1/products', corsMiddleware, listProducts);
 * ```
 */
export function createCORSMiddleware(config: CORSConfig) {
    const {
        allowedOrigins,
        allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders = ['X-Total-Count', 'X-Page', 'X-Page-Size'],
        allowCredentials = true,
        maxAge = 86400, // 24 hours
    } = config;

    return (origin?: string, method?: string): CORSHeaders => {
        const headers: CORSHeaders = {};

        // Determine if origin is allowed
        let allowOrigin = false;
        if (allowedOrigins === '*') {
            allowOrigin = true;
            headers['Access-Control-Allow-Origin'] = '*';
        } else if (origin && allowedOrigins.includes(origin)) {
            allowOrigin = true;
            headers['Access-Control-Allow-Origin'] = origin;
        }

        // Only add other headers if origin is allowed
        if (allowOrigin) {
            // Allowed methods
            headers['Access-Control-Allow-Methods'] = allowedMethods.join(', ');

            // Allowed headers
            headers['Access-Control-Allow-Headers'] = allowedHeaders.join(', ');

            // Exposed headers
            if (exposedHeaders.length > 0) {
                headers['Access-Control-Expose-Headers'] = exposedHeaders.join(', ');
            }

            // Allow credentials
            if (allowCredentials) {
                headers['Access-Control-Allow-Credentials'] = 'true';
            }

            // Preflight cache duration
            if (method === 'OPTIONS') {
                headers['Access-Control-Max-Age'] = maxAge.toString();
            }
        }

        return headers;
    };
}

/**
 * Predefined CORS configurations
 */
export const CORSConfigs = {
    /**
     * Development CORS - Allow all origins
     * WARNING: Do not use in production
     */
    development: createCORSMiddleware({
        allowedOrigins: '*',
        allowCredentials: false,
    }),

    /**
     * Production CORS - Restrict to specific origins
     * Configure with your actual frontend URLs
     */
    production: (frontendUrls: string[]) =>
        createCORSMiddleware({
            allowedOrigins: frontendUrls,
            allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            allowCredentials: true,
            maxAge: 86400,
        }),

    /**
     * Public API CORS - Allow all origins, no credentials
     */
    publicAPI: createCORSMiddleware({
        allowedOrigins: '*',
        allowedMethods: ['GET', 'OPTIONS'],
        allowCredentials: false,
        maxAge: 3600,
    }),
};

/**
 * Helper to check if request is a preflight request
 */
export function isPreflightRequest(method: string): boolean {
    return method === 'OPTIONS';
}
