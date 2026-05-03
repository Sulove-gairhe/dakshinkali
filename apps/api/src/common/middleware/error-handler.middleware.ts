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
import { ProductNotFoundException } from '../../modules/products/exceptions/product-not-found.exception';
import { logger } from '../../lib/logger';

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
 * @returns Error handler function
 */
export function createErrorHandler(): ErrorHandler {
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

            logger.info('Validation error', {
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

            logger.warn('Authentication failure', {
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

            logger.warn('Authorization failure', {
                ...context,
                errorCode: 'FORBIDDEN',
            });
        } else if (error instanceof ProductNotFoundException) {
            // 404 Not Found - Product not found (specific)
            statusCode = 404;
            errorResponse = {
                error: {
                    code: 'PRODUCT_NOT_FOUND',
                    message: error.message,
                },
            };

            logger.info('Product not found', {
                ...context,
                errorCode: 'PRODUCT_NOT_FOUND',
            });
        } else if (error instanceof NotFoundException) {
            // 404 Not Found - Resource not found (generic)
            statusCode = 404;
            errorResponse = {
                error: {
                    code: 'NOT_FOUND',
                    message: error.message,
                },
            };

            logger.info('Resource not found', {
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

            logger.warn('Conflict error', {
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

            logger.error('Unexpected error', error, {
                ...context,
                errorCode: 'INTERNAL_SERVER_ERROR',
            });
        }

        return {
            statusCode,
            body: errorResponse,
        };
    };
}

/**
 * Default error handler instance with structured logging
 */
export const defaultErrorHandler = createErrorHandler();
