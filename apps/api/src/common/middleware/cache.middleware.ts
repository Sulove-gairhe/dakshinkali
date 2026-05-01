/**
 * Cache Headers Middleware
 * 
 * Adds appropriate caching headers to API responses for performance optimization.
 * Configures browser and CDN caching behavior.
 * 
 * @remarks
 * - Adds Cache-Control headers to GET endpoints
 * - Supports ETag generation for conditional requests
 * - Configurable cache duration per endpoint type
 * - Prevents caching of sensitive or dynamic data
 * 
 * **Validates: Requirements 15.2**
 */

/**
 * Cache configuration options
 */
export interface CacheConfig {
    /** Cache duration in seconds (0 = no cache) */
    maxAge: number;

    /** Whether response can be cached by shared caches (CDN, proxy) */
    public?: boolean;

    /** Whether response can be cached by private caches (browser) */
    private?: boolean;

    /** Whether cache must revalidate with server before use */
    mustRevalidate?: boolean;

    /** Whether to include ETag header */
    includeETag?: boolean;

    /** Whether to include Last-Modified header */
    includeLastModified?: boolean;
}

/**
 * Cache headers to be added to response
 */
export interface CacheHeaders {
    'Cache-Control'?: string;
    'ETag'?: string;
    'Last-Modified'?: string;
    'Expires'?: string;
}

/**
 * Create cache headers middleware
 * 
 * @param config - Cache configuration
 * @returns Cache headers middleware function
 * 
 * @example
 * ```typescript
 * // Public product listing - cache for 5 minutes
 * const publicCache = createCacheMiddleware({
 *   maxAge: 300,
 *   public: true,
 *   includeETag: true
 * });
 * 
 * // Product detail - cache for 1 hour with revalidation
 * const detailCache = createCacheMiddleware({
 *   maxAge: 3600,
 *   public: true,
 *   mustRevalidate: true,
 *   includeETag: true
 * });
 * 
 * // No cache for admin endpoints
 * const noCache = createCacheMiddleware({
 *   maxAge: 0,
 *   private: true
 * });
 * 
 * // In Express
 * app.get('/api/v1/products', publicCache, listProducts);
 * app.get('/api/v1/products/:id', detailCache, getProduct);
 * app.use('/api/v1/admin', noCache);
 * ```
 */
export function createCacheMiddleware(config: CacheConfig) {
    const {
        maxAge,
        public: isPublic = false,
        private: isPrivate = false,
        mustRevalidate = false,
        includeETag = false,
        includeLastModified = false,
    } = config;

    return (data?: any, lastModified?: Date): CacheHeaders => {
        const headers: CacheHeaders = {};

        // Build Cache-Control header
        const cacheControlParts: string[] = [];

        if (maxAge === 0) {
            // No caching
            cacheControlParts.push('no-cache', 'no-store', 'must-revalidate');
        } else {
            // Caching enabled
            if (isPublic) {
                cacheControlParts.push('public');
            } else if (isPrivate) {
                cacheControlParts.push('private');
            }

            cacheControlParts.push(`max-age=${maxAge}`);

            if (mustRevalidate) {
                cacheControlParts.push('must-revalidate');
            }
        }

        headers['Cache-Control'] = cacheControlParts.join(', ');

        // Add Expires header (for HTTP/1.0 compatibility)
        if (maxAge > 0) {
            const expiresDate = new Date(Date.now() + maxAge * 1000);
            headers['Expires'] = expiresDate.toUTCString();
        }

        // Add ETag header if requested
        if (includeETag && data) {
            headers['ETag'] = generateETag(data);
        }

        // Add Last-Modified header if requested
        if (includeLastModified && lastModified) {
            headers['Last-Modified'] = lastModified.toUTCString();
        }

        return headers;
    };
}

/**
 * Generate ETag from data
 * 
 * @param data - Data to generate ETag from
 * @returns ETag string
 * 
 * @remarks
 * - Uses simple hash of JSON stringified data
 * - For production, consider using crypto.createHash for better performance
 */
export function generateETag(data: any): string {
    const content = typeof data === 'string' ? data : JSON.stringify(data);

    // Simple hash function (for production, use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    return `"${Math.abs(hash).toString(36)}"`;
}

/**
 * Check if request has matching ETag
 * 
 * @param requestETag - ETag from If-None-Match header
 * @param currentETag - Current ETag of the resource
 * @returns True if ETags match (304 Not Modified should be returned)
 */
export function isETagMatch(requestETag?: string, currentETag?: string): boolean {
    if (!requestETag || !currentETag) {
        return false;
    }

    // Handle multiple ETags in If-None-Match header
    const requestETags = requestETag.split(',').map(tag => tag.trim());
    return requestETags.includes(currentETag) || requestETags.includes('*');
}

/**
 * Predefined cache configurations
 */
export const CacheConfigs = {
    /**
     * No cache - For dynamic or sensitive data
     */
    noCache: createCacheMiddleware({
        maxAge: 0,
        private: true,
    }),

    /**
     * Short cache - 5 minutes for frequently changing data
     */
    shortCache: createCacheMiddleware({
        maxAge: 300, // 5 minutes
        public: true,
        includeETag: true,
    }),

    /**
     * Medium cache - 1 hour for moderately stable data
     */
    mediumCache: createCacheMiddleware({
        maxAge: 3600, // 1 hour
        public: true,
        mustRevalidate: true,
        includeETag: true,
    }),

    /**
     * Long cache - 24 hours for stable data
     */
    longCache: createCacheMiddleware({
        maxAge: 86400, // 24 hours
        public: true,
        includeETag: true,
        includeLastModified: true,
    }),

    /**
     * Public product listing - 5 minutes
     */
    publicProducts: createCacheMiddleware({
        maxAge: 300,
        public: true,
        includeETag: true,
    }),

    /**
     * Product detail - 1 hour with revalidation
     */
    productDetail: createCacheMiddleware({
        maxAge: 3600,
        public: true,
        mustRevalidate: true,
        includeETag: true,
        includeLastModified: true,
    }),

    /**
     * Admin endpoints - No cache
     */
    adminEndpoints: createCacheMiddleware({
        maxAge: 0,
        private: true,
    }),
};
