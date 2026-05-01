/**
 * API Versioning Middleware
 * 
 * Adds API version headers to responses and validates version in requests.
 * Supports future API versioning strategy.
 * 
 * @remarks
 * - Adds API-Version header to all responses
 * - Validates API version from URL path (/api/v1, /api/v2, etc.)
 * - Returns 404 for unsupported API versions
 * - Prepares for future v2, v3 implementations
 * 
 * **Validates: Requirements 10.1, 10.2, 10.4**
 */

import { NotFoundException } from '../exceptions/not-found.exception';

/**
 * API version configuration
 */
export interface APIVersionConfig {
    /** Current API version */
    currentVersion: string;

    /** List of supported API versions */
    supportedVersions: string[];

    /** Whether to include version in response headers */
    includeVersionHeader?: boolean;

    /** Custom version header name */
    versionHeaderName?: string;
}

/**
 * API version headers
 */
export interface APIVersionHeaders {
    [key: string]: string;
}

/**
 * Create API versioning middleware
 * 
 * @param config - API version configuration
 * @returns API versioning middleware function
 * 
 * @example
 * ```typescript
 * const apiVersionMiddleware = createAPIVersionMiddleware({
 *   currentVersion: 'v1',
 *   supportedVersions: ['v1'],
 *   includeVersionHeader: true,
 *   versionHeaderName: 'API-Version'
 * });
 * 
 * // In Express
 * app.use('/api/:version', (req, res, next) => {
 *   const version = req.params.version;
 *   const headers = apiVersionMiddleware(version);
 *   res.set(headers);
 *   next();
 * });
 * ```
 */
export function createAPIVersionMiddleware(config: APIVersionConfig) {
    const {
        currentVersion,
        supportedVersions,
        includeVersionHeader = true,
        versionHeaderName = 'API-Version',
    } = config;

    return (requestedVersion?: string): APIVersionHeaders => {
        const headers: APIVersionHeaders = {};

        // Validate requested version if provided
        if (requestedVersion) {
            if (!supportedVersions.includes(requestedVersion)) {
                throw new NotFoundException(
                    `API version '${requestedVersion}' is not supported. Supported versions: ${supportedVersions.join(', ')}`
                );
            }
        }

        // Add version header to response
        if (includeVersionHeader) {
            headers[versionHeaderName] = requestedVersion || currentVersion;
        }

        return headers;
    };
}

/**
 * Extract API version from URL path
 * 
 * @param path - Request URL path (e.g., '/api/v1/products')
 * @returns API version (e.g., 'v1') or null if not found
 * 
 * @example
 * ```typescript
 * const version = extractVersionFromPath('/api/v1/products'); // 'v1'
 * const version = extractVersionFromPath('/api/v2/users');    // 'v2'
 * const version = extractVersionFromPath('/health');          // null
 * ```
 */
export function extractVersionFromPath(path: string): string | null {
    const match = path.match(/^\/api\/(v\d+)/);
    return match ? match[1] : null;
}

/**
 * Predefined API version configurations
 */
export const APIVersionConfigs = {
    /**
     * Current production configuration (v1 only)
     */
    v1Only: createAPIVersionMiddleware({
        currentVersion: 'v1',
        supportedVersions: ['v1'],
        includeVersionHeader: true,
    }),

    /**
     * Future configuration supporting v1 and v2
     */
    v1AndV2: createAPIVersionMiddleware({
        currentVersion: 'v2',
        supportedVersions: ['v1', 'v2'],
        includeVersionHeader: true,
    }),
};

/**
 * API version deprecation warning
 * 
 * @param version - API version to check
 * @param deprecatedVersions - List of deprecated versions
 * @returns Deprecation warning header or null
 * 
 * @example
 * ```typescript
 * const warning = getDeprecationWarning('v1', ['v1']);
 * // Returns: 'API version v1 is deprecated. Please migrate to v2.'
 * ```
 */
export function getDeprecationWarning(
    version: string,
    deprecatedVersions: string[]
): string | null {
    if (deprecatedVersions.includes(version)) {
        return `API version ${version} is deprecated. Please migrate to the latest version.`;
    }
    return null;
}
