/**
 * Rate Limiting Middleware
 * 
 * Implements token bucket algorithm for rate limiting API requests.
 * Prevents abuse and ensures fair resource usage.
 * 
 * @remarks
 * - Uses in-memory storage (suitable for single-instance deployments)
 * - For distributed systems, use Redis-backed rate limiter
 * - Returns 429 Too Many Requests when limit exceeded
 * - Includes rate limit headers in responses
 * - Configurable per endpoint or globally
 * 
 * **Validates: Requirements 15.5**
 */

/**
 * Rate limit exceeded error
 */
export class RateLimitExceededError extends Error {
    public readonly retryAfter: number; // Seconds until next request allowed

    constructor(retryAfter: number) {
        super('Too many requests. Please try again later.');
        this.name = 'RateLimitExceededError';
        this.retryAfter = retryAfter;
    }
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
    /** Maximum number of requests allowed in the time window */
    maxRequests: number;

    /** Time window in seconds */
    windowSeconds: number;

    /** Optional custom key generator (default: uses IP or user ID) */
    keyGenerator?: (identifier: string) => string;

    /** Optional custom error message */
    errorMessage?: string;
}

/**
 * Rate limit bucket for tracking requests
 */
interface RateLimitBucket {
    tokens: number;
    lastRefill: number;
}

/**
 * In-memory rate limit store
 */
class RateLimitStore {
    private buckets: Map<string, RateLimitBucket> = new Map();
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Clean up expired buckets every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }

    /**
     * Get or create bucket for key
     */
    getBucket(key: string, maxTokens: number): RateLimitBucket {
        let bucket = this.buckets.get(key);

        if (!bucket) {
            bucket = {
                tokens: maxTokens,
                lastRefill: Date.now(),
            };
            this.buckets.set(key, bucket);
        }

        return bucket;
    }

    /**
     * Clean up old buckets
     */
    private cleanup(): void {
        const now = Date.now();
        const maxAge = 60 * 60 * 1000; // 1 hour

        for (const [key, bucket] of this.buckets.entries()) {
            if (now - bucket.lastRefill > maxAge) {
                this.buckets.delete(key);
            }
        }
    }

    /**
     * Clear all buckets (for testing)
     */
    clear(): void {
        this.buckets.clear();
    }

    /**
     * Destroy store and cleanup interval
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.buckets.clear();
    }
}

/**
 * Global rate limit store instance
 */
const globalStore = new RateLimitStore();

/**
 * Rate limit result
 */
export interface RateLimitResult {
    /** Whether the request is allowed */
    allowed: boolean;

    /** Remaining requests in current window */
    remaining: number;

    /** Time until window resets (seconds) */
    resetIn: number;

    /** Total requests allowed per window */
    limit: number;
}

/**
 * Create rate limiting middleware
 * 
 * @param config - Rate limit configuration
 * @param store - Optional custom store (default: in-memory)
 * @returns Rate limiting middleware function
 * 
 * @example
 * ```typescript
 * // 100 requests per minute for admin endpoints
 * const adminRateLimit = createRateLimitMiddleware({
 *   maxRequests: 100,
 *   windowSeconds: 60,
 *   keyGenerator: (userId) => `admin:${userId}`
 * });
 * 
 * // 1000 requests per hour for public endpoints
 * const publicRateLimit = createRateLimitMiddleware({
 *   maxRequests: 1000,
 *   windowSeconds: 3600,
 *   keyGenerator: (ip) => `public:${ip}`
 * });
 * 
 * // In Express
 * app.use('/api/v1/admin', authMiddleware, adminRateLimit);
 * app.use('/api/v1/products', publicRateLimit);
 * ```
 */
export function createRateLimitMiddleware(
    config: RateLimitConfig,
    store: RateLimitStore = globalStore
) {
    const {
        maxRequests,
        windowSeconds,
        keyGenerator = (id) => id,
        errorMessage = 'Too many requests. Please try again later.',
    } = config;

    return (identifier: string): RateLimitResult => {
        const key = keyGenerator(identifier);
        const now = Date.now();

        // Get or create bucket
        const bucket = store.getBucket(key, maxRequests);

        // Calculate tokens to add based on time elapsed
        const elapsedSeconds = (now - bucket.lastRefill) / 1000;
        const tokensToAdd = (elapsedSeconds / windowSeconds) * maxRequests;

        // Refill bucket (capped at maxRequests)
        bucket.tokens = Math.min(maxRequests, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;

        // Calculate reset time
        const resetIn = Math.ceil(windowSeconds - elapsedSeconds);

        // Check if request is allowed
        if (bucket.tokens >= 1) {
            // Consume one token
            bucket.tokens -= 1;

            return {
                allowed: true,
                remaining: Math.floor(bucket.tokens),
                resetIn: Math.max(0, resetIn),
                limit: maxRequests,
            };
        } else {
            // Rate limit exceeded
            throw new RateLimitExceededError(Math.max(1, resetIn));
        }
    };
}

/**
 * Predefined rate limiters for common use cases
 */
export const RateLimiters = {
    /**
     * Admin endpoints: 100 requests per minute per user
     */
    admin: createRateLimitMiddleware({
        maxRequests: 100,
        windowSeconds: 60,
        keyGenerator: (userId) => `admin:${userId}`,
    }),

    /**
     * Public endpoints: 1000 requests per hour per IP
     */
    public: createRateLimitMiddleware({
        maxRequests: 1000,
        windowSeconds: 3600,
        keyGenerator: (ip) => `public:${ip}`,
    }),

    /**
     * Strict rate limit: 10 requests per minute per IP
     */
    strict: createRateLimitMiddleware({
        maxRequests: 10,
        windowSeconds: 60,
        keyGenerator: (ip) => `strict:${ip}`,
    }),
};

/**
 * Export store for testing
 */
export { RateLimitStore, globalStore };
