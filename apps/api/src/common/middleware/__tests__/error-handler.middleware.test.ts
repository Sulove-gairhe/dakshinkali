/**
 * Error Handler Middleware Unit Tests
 * 
 * Tests error handling logic:
 * - Exception type to HTTP status code mapping
 * - Error response format consistency
 * - Logging behavior
 * - Internal error details protection
 * 
 * **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    createErrorHandler,
    ErrorHandler,
    ErrorResponse,
    RequestContext,
} from '../error-handler.middleware';
import { ValidationException } from '../../exceptions/validation.exception';
import { UnauthorizedException } from '../../exceptions/unauthorized.exception';
import { ForbiddenException } from '../../exceptions/forbidden.exception';
import { NotFoundException } from '../../exceptions/not-found.exception';
import { ConflictException } from '../../exceptions/conflict.exception';
import { ProductNotFoundException } from '../../../modules/products/exceptions/product-not-found.exception';

describe('Error Handler Middleware', () => {
    let errorHandler: ErrorHandler;
    let mockLogger: ReturnType<typeof vi.fn>;
    let mockContext: RequestContext;

    beforeEach(() => {
        mockLogger = vi.fn();
        errorHandler = createErrorHandler(mockLogger);
        mockContext = {
            method: 'POST',
            url: '/api/v1/admin/products',
            requestId: 'req-123',
            userId: 'user-456',
            timestamp: '2024-01-01T00:00:00.000Z',
        };
    });

    describe('ValidationException → 400 Bad Request', () => {
        it('should return 400 with field errors for ValidationException', () => {
            // Arrange
            const fields = [
                { field: 'price', message: 'Price must be greater than 0' },
                { field: 'name', message: 'Name is required' },
            ];
            const error = new ValidationException('Invalid product data', fields);

            // Act
            const result = errorHandler(error, mockContext);

            // Assert
            expect(result.statusCode).toBe(400);
            expect(result.body).toEqual({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid product data',
                    fields,
                },
            });
        });

        it('should return 400 without fields array when no field errors provided', () => {
            // Arrange
            const error = new ValidationException('Invalid request');

            // Act
            const result = errorHandler(error, mockContext);

            // Assert
            expect(result.statusCode).toBe(400);
            expect(result.body).toEqual({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request',
                    fields: undefined,
                },
            });
        });

        it('should log validation errors at info level', () => {
            // Arrange
            const fields = [{ field: 'price', message: 'Price must be greater than 0' }];
            const error = new ValidationException('Invalid product data', fields);

            // Act
            errorHandler(error, mockContext);

            // Assert
            expect(mockLogger).toHaveBeenCalledWith('info', 'Validation error', {
                ...mockContext,
                errorCode: 'VALIDATION_ERROR',
                fields,
            });
        });
    });

    describe('UnauthorizedException → 401 Unauthorized', () => {
        it('should return 401 for UnauthorizedException', () => {
            // Arrange
            const error = new UnauthorizedException();

            // Act
            const result = errorHandler(error, mockContext);

            // Assert
            expect(result.statusCode).toBe(401);
            expect(result.body).toEqual({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required. Please provide a valid access token.',
                },
            });
        });

        it('should return 401 with custom message', () => {
            // Arrange
            const error = new UnauthorizedException('Invalid JWT token');

            // Act
            const result = errorHandler(error, mockContext);

            // Assert
            expect(result.statusCode).toBe(401);
            expect(result.body.error.message).toBe('Invalid JWT token');
        });

        it('should log authentication failures at warn level', () => {
            // Arrange
            const error = new UnauthorizedException();

            // Act
            errorHandler(error, mockContext);

            // Assert
            expect(mockLogger).toHaveBeenCalledWith('warn', 'Authentication failure', {
                ...mockContext,
                errorCode: 'UNAUTHORIZED',
            });
        });
    });

    describe('ForbiddenException → 403 Forbidden', () => {
        it('should return 403 for ForbiddenException', () => {
            // Arrange
            const error = new ForbiddenException();

            // Act
            const result = errorHandler(error, mockContext);

            // Assert
            expect(result.statusCode).toBe(403);
            expect(result.body).toEqual({
                error: {
                    code: 'FORBIDDEN',
                    message: 'Admin access required for this operation.',
                },
            });
        });

        it('should return 403 with custom message', () => {
            // Arrange
            const error = new ForbiddenException('Insufficient permissions');

            // Act
            const result = errorHandler(error, mockContext);

            // Assert
            expect(result.statusCode).toBe(403);
            expect(result.body.error.message).toBe('Insufficient permissions');
        });

        it('should log authorization failures at warn level', () => {
            // Arrange
            const error = new ForbiddenException();

            // Act
            errorHandler(error, mockContext);

            // Assert
            expect(mockLogger).toHaveBeenCalledWith('warn', 'Authorization failure', {
                ...mockContext,
                errorCode: 'FORBIDDEN',
            });
        });
    });

    describe('NotFoundException → 404 Not Found', () => {
        it('should return 404 for generic NotFoundException', () => {
            // Arrange
            const error = new NotFoundException('Resource not found');

            // Act
            const result = errorHandler(error, mockContext);

            // Assert
            expect(result.statusCode).toBe(404);
            expect(result.body).toEqual({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Resource not found',
                },
            });
        });

        it('should return 404 for ProductNotFoundException with specific code', () => {
            // Arrange
            const productId = '123e4567-e89b-12d3-a456-426614174000';
            const error = new ProductNotFoundException(productId);

            // Act
            const result = errorHandler(error, mockContext);

            // Assert
            expect(result.statusCode).toBe(404);
            expect(result.body).toEqual({
                error: {
                    code: 'PRODUCT_NOT_FOUND',
                    message: `Product with ID '${productId}' not found.`,
                },
            });
        });

        it('should log not found errors at info level', () => {
            // Arrange
            const error = new NotFoundException('Resource not found');

            // Act
            errorHandler(error, mockContext);

            // Assert
            expect(mockLogger).toHaveBeenCalledWith('info', 'Resource not found', {
                ...mockContext,
                errorCode: 'NOT_FOUND',
            });
        });

        it('should log product not found errors at info level', () => {
            // Arrange
            const error = new ProductNotFoundException('123e4567-e89b-12d3-a456-426614174000');

            // Act
            errorHandler(error, mockContext);

            // Assert
            expect(mockLogger).toHaveBeenCalledWith('info', 'Product not found', {
                ...mockContext,
                errorCode: 'PRODUCT_NOT_FOUND',
            });
        });
    });

    describe('ConflictException → 409 Conflict', () => {
        it('should return 409 for ConflictException', () => {
            // Arrange
            const error = new ConflictException(
                "A product with name 'iPhone 15' already exists in category 'Electronics'."
            );

            // Act
            const result = errorHandler(error, mockContext);

            // Assert
            expect(result.statusCode).toBe(409);
            expect(result.body).toEqual({
                error: {
                    code: 'CONFLICT',
                    message: "A product with name 'iPhone 15' already exists in category 'Electronics'.",
                },
            });
        });

        it('should log conflict errors at warn level', () => {
            // Arrange
            const error = new ConflictException('Duplicate resource');

            // Act
            errorHandler(error, mockContext);

            // Assert
            expect(mockLogger).toHaveBeenCalledWith('warn', 'Conflict error', {
                ...mockContext,
                errorCode: 'CONFLICT',
            });
        });
    });

    describe('Unexpected Errors → 500 Internal Server Error', () => {
        it('should return 500 for unexpected errors', () => {
            // Arrange
            const error = new Error('Database connection failed');

            // Act
            const result = errorHandler(error, mockContext);

            // Assert
            expect(result.statusCode).toBe(500);
            expect(result.body).toEqual({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occurred. Please try again later.',
                },
            });
        });

        it('should not expose internal error details in response', () => {
            // Arrange
            const error = new Error('SELECT * FROM products WHERE secret_key = "abc123"');

            // Act
            const result = errorHandler(error, mockContext);

            // Assert
            expect(result.body.error.message).toBe('An unexpected error occurred. Please try again later.');
            expect(result.body.error.message).not.toContain('SELECT');
            expect(result.body.error.message).not.toContain('secret_key');
        });

        it('should log unexpected errors at error level with stack trace', () => {
            // Arrange
            const error = new Error('Database connection failed');
            error.stack = 'Error: Database connection failed\n    at Object.<anonymous> (/app/db.ts:10:15)';

            // Act
            errorHandler(error, mockContext);

            // Assert
            expect(mockLogger).toHaveBeenCalledWith('error', 'Unexpected error', {
                ...mockContext,
                errorCode: 'INTERNAL_SERVER_ERROR',
                errorName: 'Error',
                errorMessage: 'Database connection failed',
                stack: error.stack,
            });
        });

        it('should handle TypeError as 500', () => {
            // Arrange
            const error = new TypeError('Cannot read property "id" of undefined');

            // Act
            const result = errorHandler(error, mockContext);

            // Assert
            expect(result.statusCode).toBe(500);
            expect(result.body.error.code).toBe('INTERNAL_SERVER_ERROR');
        });

        it('should handle ReferenceError as 500', () => {
            // Arrange
            const error = new ReferenceError('productService is not defined');

            // Act
            const result = errorHandler(error, mockContext);

            // Assert
            expect(result.statusCode).toBe(500);
            expect(result.body.error.code).toBe('INTERNAL_SERVER_ERROR');
        });
    });

    describe('Error Response Format Consistency', () => {
        it('should always include error.code field', () => {
            // Arrange
            const errors = [
                new ValidationException('Invalid data'),
                new UnauthorizedException(),
                new ForbiddenException(),
                new NotFoundException('Not found'),
                new ConflictException('Conflict'),
                new Error('Unexpected'),
            ];

            // Act & Assert
            errors.forEach((error) => {
                const result = errorHandler(error, mockContext);
                expect(result.body.error).toHaveProperty('code');
                expect(typeof result.body.error.code).toBe('string');
            });
        });

        it('should always include error.message field', () => {
            // Arrange
            const errors = [
                new ValidationException('Invalid data'),
                new UnauthorizedException(),
                new ForbiddenException(),
                new NotFoundException('Not found'),
                new ConflictException('Conflict'),
                new Error('Unexpected'),
            ];

            // Act & Assert
            errors.forEach((error) => {
                const result = errorHandler(error, mockContext);
                expect(result.body.error).toHaveProperty('message');
                expect(typeof result.body.error.message).toBe('string');
                expect(result.body.error.message.length).toBeGreaterThan(0);
            });
        });

        it('should only include fields array for ValidationException', () => {
            // Arrange
            const validationError = new ValidationException('Invalid', [
                { field: 'name', message: 'Required' },
            ]);
            const otherErrors = [
                new UnauthorizedException(),
                new ForbiddenException(),
                new NotFoundException('Not found'),
                new ConflictException('Conflict'),
                new Error('Unexpected'),
            ];

            // Act & Assert - ValidationException should have fields
            const validationResult = errorHandler(validationError, mockContext);
            expect(validationResult.body.error.fields).toBeDefined();

            // Act & Assert - Other errors should not have fields
            otherErrors.forEach((error) => {
                const result = errorHandler(error, mockContext);
                expect(result.body.error.fields).toBeUndefined();
            });
        });

        it('should return consistent error structure shape', () => {
            // Arrange
            const errors = [
                new ValidationException('Invalid data'),
                new UnauthorizedException(),
                new ForbiddenException(),
                new NotFoundException('Not found'),
                new ConflictException('Conflict'),
                new Error('Unexpected'),
            ];

            // Act & Assert
            errors.forEach((error) => {
                const result = errorHandler(error, mockContext);

                // Check top-level structure
                expect(result.body).toHaveProperty('error');
                expect(Object.keys(result.body)).toEqual(['error']);

                // Check error object has required fields
                expect(result.body.error).toHaveProperty('code');
                expect(result.body.error).toHaveProperty('message');

                // Check no extra fields (except fields for ValidationException)
                const allowedKeys = error instanceof ValidationException
                    ? ['code', 'message', 'fields']
                    : ['code', 'message'];
                const actualKeys = Object.keys(result.body.error);
                actualKeys.forEach(key => {
                    expect(allowedKeys).toContain(key);
                });
            });
        });
    });

    describe('Logger Integration', () => {
        it('should work without logger (no errors thrown)', () => {
            // Arrange
            const errorHandlerNoLogger = createErrorHandler();
            const error = new ValidationException('Invalid data');

            // Act & Assert - Should not throw
            expect(() => errorHandlerNoLogger(error, mockContext)).not.toThrow();
        });

        it('should not call logger when logger is undefined', () => {
            // Arrange
            const errorHandlerNoLogger = createErrorHandler();
            const error = new ValidationException('Invalid data');

            // Act
            errorHandlerNoLogger(error, mockContext);

            // Assert - mockLogger should not be called (it's a different instance)
            expect(mockLogger).not.toHaveBeenCalled();
        });

        it('should include request context in all log calls', () => {
            // Arrange
            const errors = [
                new ValidationException('Invalid'),
                new UnauthorizedException(),
                new ForbiddenException(),
                new NotFoundException('Not found'),
                new ConflictException('Conflict'),
                new Error('Unexpected'),
            ];

            // Act
            errors.forEach((error) => {
                errorHandler(error, mockContext);
            });

            // Assert
            expect(mockLogger).toHaveBeenCalledTimes(errors.length);
            mockLogger.mock.calls.forEach((call) => {
                const [, , meta] = call;
                expect(meta).toMatchObject({
                    method: mockContext.method,
                    url: mockContext.url,
                    requestId: mockContext.requestId,
                    userId: mockContext.userId,
                    timestamp: mockContext.timestamp,
                });
            });
        });
    });

    describe('HTTP Status Code Mapping', () => {
        it('should map all exception types to correct status codes', () => {
            // Arrange & Act & Assert
            const testCases = [
                { error: new ValidationException('Invalid'), expectedStatus: 400 },
                { error: new UnauthorizedException(), expectedStatus: 401 },
                { error: new ForbiddenException(), expectedStatus: 403 },
                { error: new NotFoundException('Not found'), expectedStatus: 404 },
                { error: new ProductNotFoundException('123'), expectedStatus: 404 },
                { error: new ConflictException('Conflict'), expectedStatus: 409 },
                { error: new Error('Unexpected'), expectedStatus: 500 },
                { error: new TypeError('Type error'), expectedStatus: 500 },
                { error: new ReferenceError('Reference error'), expectedStatus: 500 },
            ];

            testCases.forEach(({ error, expectedStatus }) => {
                const result = errorHandler(error, mockContext);
                expect(result.statusCode).toBe(expectedStatus);
            });
        });
    });

    describe('Security - No Sensitive Data Exposure', () => {
        it('should not expose database connection strings in error messages', () => {
            // Arrange
            const error = new Error('Connection failed: postgresql://user:password@localhost:5432/db');

            // Act
            const result = errorHandler(error, mockContext);

            // Assert
            expect(result.body.error.message).not.toContain('postgresql://');
            expect(result.body.error.message).not.toContain('password');
        });

        it('should not expose file paths in error messages', () => {
            // Arrange
            const error = new Error('ENOENT: no such file or directory, open "/var/secrets/api-key.txt"');

            // Act
            const result = errorHandler(error, mockContext);

            // Assert
            expect(result.body.error.message).not.toContain('/var/secrets');
            expect(result.body.error.message).not.toContain('api-key.txt');
        });

        it('should not expose stack traces in error messages', () => {
            // Arrange
            const error = new Error('Internal error');
            error.stack = 'Error: Internal error\n    at secretFunction (/app/secret.ts:42:10)';

            // Act
            const result = errorHandler(error, mockContext);

            // Assert
            expect(result.body.error.message).not.toContain('at secretFunction');
            expect(result.body.error.message).not.toContain('/app/secret.ts');
        });

        it('should not include error.stack in response body', () => {
            // Arrange
            const error = new Error('Internal error');
            error.stack = 'Error: Internal error\n    at Object.<anonymous> (/app/index.ts:10:15)';

            // Act
            const result = errorHandler(error, mockContext);

            // Assert
            expect(result.body.error).not.toHaveProperty('stack');
            expect(JSON.stringify(result.body)).not.toContain('stack');
        });
    });
});
