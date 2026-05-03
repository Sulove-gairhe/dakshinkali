/**
 * Request Validation Utilities
 * 
 * Simple validation helpers for request data
 */

import { ValidationException } from '../exceptions/validation.exception';

/**
 * Validation result
 */
interface ValidationResult {
    valid: boolean;
    errors?: Array<{ field: string; message: string }>;
}

/**
 * Validate required fields
 */
export function validateRequired(
    data: Record<string, any>,
    requiredFields: string[]
): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    for (const field of requiredFields) {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
            errors.push({
                field,
                message: `${field} is required`,
            });
        }
    }

    return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
    };
}

/**
 * Validate string length
 */
export function validateStringLength(
    value: string,
    field: string,
    min?: number,
    max?: number
): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    if (min !== undefined && value.length < min) {
        errors.push({
            field,
            message: `${field} must be at least ${min} characters`,
        });
    }

    if (max !== undefined && value.length > max) {
        errors.push({
            field,
            message: `${field} must be at most ${max} characters`,
        });
    }

    return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
    };
}

/**
 * Validate number range
 */
export function validateNumberRange(
    value: number,
    field: string,
    min?: number,
    max?: number
): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    if (min !== undefined && value < min) {
        errors.push({
            field,
            message: `${field} must be at least ${min}`,
        });
    }

    if (max !== undefined && value > max) {
        errors.push({
            field,
            message: `${field} must be at most ${max}`,
        });
    }

    return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
    };
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
    value: string,
    field: string,
    allowedValues: readonly T[]
): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    if (!allowedValues.includes(value as T)) {
        errors.push({
            field,
            message: `${field} must be one of: ${allowedValues.join(', ')}`,
        });
    }

    return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
    };
}

/**
 * Combine multiple validation results
 */
export function combineValidationResults(
    ...results: ValidationResult[]
): ValidationResult {
    const allErrors: Array<{ field: string; message: string }> = [];

    for (const result of results) {
        if (result.errors) {
            allErrors.push(...result.errors);
        }
    }

    return {
        valid: allErrors.length === 0,
        errors: allErrors.length > 0 ? allErrors : undefined,
    };
}

/**
 * Throw validation exception if invalid
 */
export function throwIfInvalid(result: ValidationResult): void {
    if (!result.valid && result.errors) {
        throw new ValidationException('Validation failed', result.errors);
    }
}
