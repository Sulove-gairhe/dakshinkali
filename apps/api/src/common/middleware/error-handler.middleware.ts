/**
 * Error Handler Middleware
 * 
 * Catches all exceptions and formats them into consistent HTTP error responses.
 * Maps domain exceptions to appropriate HTTP status codes.
 * 
 * @remarks
 * - Handles ValidationException → 400 Bad Request
 * - Handles UnauthorizedException → 401 Unauthorized
 * - Handles ForbiddenException → 403 Forbidden
 * - Handles NotFoundException → 404 Not Found
 * - Handles ConflictException → 409 Conflict
 * - Handles all other errors → 500 Internal Server Error
 * - Logs errors with request context (never logs sensitive data)
 * - Never exposes internal implementation details
 * 
 * **Validates: Requirements 12.5, 12.6**
 */

import { ValidationException } from '../exceptions/validation.exception';
import { UnauthorizedException } from '../exceptions/unauthorized.exception';
import { ForbiddenException } from '../exceptions/forbidden.exception';
import { NotFoundException } from '../exceptions/not-found.exception';
import { ConflictException } from '../exceptions/conflict.exception';

/**
 * Standard error response format
 */
export interface ErrorResponse {
    error: {
        code: string;
        message: string;
        fields?: Array<{ field: string; message: string }>;
    };
}

/**
 * Request context for logging
 */
export interface RequestContext {
    method: string;
    url: string;
    requestId?: string;
    userId?: string;
    timestamp: string;
}

/**
 * Error handler function type
 * Compatible with Express, Fastify, and other frameworks
 */
export type ErrorHandler = (
    error: Error,
    context: RequestContext
) => {
    statusCode: number;
    body: ErrorResponse;
};

/**
 * Create error handler middleware
 * 
 * @param logger - Optional logger function for error logging
 * @returns Error handler function
 * 
 * @example
 * ```typescript
 * const errorHandler = createErrorHandler((level, message, meta) => {
 *   console.log(`[${level}] ${message}`, meta);
 * });
 * 
 * // In Express
 * app.use((err, req, res, next) => {
 *   const context = {
 *     method: req.method,
 *     url: req.url,
 *     requestId: req.id,
 *     userId: req.user?.id,
 *     timestamp: new Date().toISOString()
 *   };
 *   const { statusCode, body } = errorHandler(err, context);
 *   res.status(statusCode).json(body);
 * });
 * ```
 */
export function createErrorHandler(
    logger?: (level: 'error' | 'warn' | 'info', message: string, meta?: Record<string, any>) => void
): ErrorHandler {
    return (error: Error, context: RequestContext) => {
        // Determine status code and error response based on exception type
        let statusCode: number;
        let errorResponse: ErrorResponse;

        if (error instanceof ValidationException) {
            // 400 Bad Request - Invalid input data
            statusCode = 400;
            errorResponse = {
                error: {
                    code: 'VALIDATION_ERROR',
                    message: error.message,
                    fields: error.fields,
                },
            };

            // Log validation errors at info level (not critical)
            logger?.('info', 'Validation error', {
                ...context,
                errorCode: 'VALIDATION_ERROR',
                fields: error.fields,
            });
        } else if (error instanceof UnauthorizedException) {
            // 401 Unauthorized - Authentication failure
            statusCode = 401;
            errorResponse = {
                error: {
                    code: 'UNAUTHORIZED',
                    message: error.message,
                },
            };

            // Log auth failures at warn level
            logger?.('warn', 'Authentication failure', {
                ...context,
                errorCode: 'UNAUTHORIZED',
            });
        } else if (error instanceof ForbiddenException) {
            // 403 Forbidden - Authorization failure
            statusCode = 403;
            errorResponse = {
                error: {
                    code: 'FORBIDDEN',
                    message: error.message,
                },
            };

            // Log authorization failures at warn level
            logger?.('warn', 'Authorization failure', {
                ...context,
                errorCode: 'FORBIDDEN',
            });
        } else if (error instanceof NotFoundException) {
            // 404 Not Found - Resource not found
            statusCode = 404;
            errorResponse = {
                error: {
                    code: 'NOT_FOUND',
                    message: error.message,
                },
            };

            // Log not found at info level (expected behavior)
            logger?.('info', 'Resource not found', {
                ...context,
                errorCode: 'NOT_FOUND',
            });
        } else if (error instanceof ConflictException) {
            // 409 Conflict - Business rule violation
            statusCode = 409;
            errorResponse = {
                error: {
                    code: 'CONFLICT',
                    message: error.message,
                },
            };

            // Log conflicts at warn level
            logger?.('warn', 'Conflict error', {
                ...context,
                errorCode: 'CONFLICT',
            });
        } else {
            // 500 Internal Server Error - Unexpected errors
            statusCode = 500;
            errorResponse = {
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occurred. Please try again later.',
                },
            };

            // Log unexpected errors at error level with stack trace
            logger?.('error', 'Unexpected error', {
                ...context,
                errorCode: 'INTERNAL_SERVER_ERROR',
                errorName: error.name,
                errorMessage: error.message,
                stack: error.stack,
            });
        }

        return {
            statusCode,
            body: errorResponse,
        };
    };
}

/**
 * Default error handler instance with console logging
 */
export const defaultErrorHandler = createErrorHandler((level, message, meta) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (level === 'error') {
        console.error(logMessage, meta);
    } else if (level === 'warn') {
        console.warn(logMessage, meta);
    } else {
        console.log(logMessage, meta);
    }
});
