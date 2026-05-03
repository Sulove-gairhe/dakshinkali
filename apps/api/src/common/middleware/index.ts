/**
 * Middleware barrel export
 * 
 * Exports all middleware functions and utilities for the API.
 */

// Error handling
export {
    createErrorHandler,
    defaultErrorHandler,
    ErrorHandler,
    ErrorResponse,
    RequestContext,
} from './error-handler.middleware';

// Authentication
export {
    createAuthMiddleware,
    mockJWTVerifier,
    AuthUser,
    JWTPayload,
    JWTVerifier,
} from './auth.middleware';

// Supabase Authentication
export {
    createSupabaseJWTVerifier,
    createSupabaseJWTVerifierLocal,
    extractJWTSecret,
    SupabaseJWTPayload,
} from './supabase-auth.middleware';

// Role-Based Authorization
export {
    createRoleMiddleware,
    requireAdmin as requireAdminRole,
    requireCustomer,
    requireAuthenticated,
    hasRole,
    hasAnyRole,
    getUserRole,
    UserRole,
    RoleRequirement,
} from './role.middleware';

// Authorization
export {
    createAdminAuthMiddleware,
    requireAdmin,
    requireRole,
    AdminAuthOptions,
} from './admin-auth.middleware';

// Rate limiting
export {
    createRateLimitMiddleware,
    RateLimiters,
    RateLimitStore,
    globalStore,
    RateLimitExceededError,
    RateLimitConfig,
    RateLimitResult,
} from './rate-limit.middleware';

// CORS
export {
    createCORSMiddleware,
    CORSConfigs,
    isPreflightRequest,
    CORSConfig,
    CORSHeaders,
} from './cors.middleware';

// API versioning
export {
    createAPIVersionMiddleware,
    APIVersionConfigs,
    extractVersionFromPath,
    getDeprecationWarning,
    APIVersionConfig,
    APIVersionHeaders,
} from './api-version.middleware';

// Caching
export {
    createCacheMiddleware,
    CacheConfigs,
    generateETag,
    isETagMatch,
    CacheConfig,
    CacheHeaders,
} from './cache.middleware';
