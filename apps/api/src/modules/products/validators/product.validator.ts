/**
 * ProductValidator - Validation Logic Module
 * 
 * Extracts validation logic from ProductService to provide reusable validation methods.
 * Throws ValidationException with descriptive messages for all validation failures.
 * 
 * @remarks
 * - Validates business rules for product data
 * - Validates price constraints (must be > 0)
 * - Validates image count constraints (max 5 images)
 * - Validates product name constraints (required, non-empty)
 * - Provides comprehensive validation for CreateProductData and UpdateProductData
 * 
 * **Validates: Requirements 1.2, 1.7, 9.2, 9.3, 12.1**
 */

import { ValidationException } from '../../../common/exceptions/validation.exception';
import { CreateProductData, UpdateProductData } from '../services/product.service';

/**
 * Maximum number of images allowed per product
 */
const MAX_IMAGES_PER_PRODUCT = 5;

/**
 * ProductValidator
 * 
 * Provides static validation methods for product-related business rules.
 * All validation methods throw ValidationException on failure.
 */
export class ProductValidator {
    /**
     * Validate price is greater than 0
     * 
     * @param price - Price to validate
     * @throws ValidationException if price is invalid
     * 
     * **Validates: Requirements 1.2, 9.2**
     */
    static validatePrice(price: number): void {
        if (price <= 0) {
            throw new ValidationException('Price must be greater than 0.', [
                {
                    field: 'price',
                    message: 'Price must be greater than 0.'
                }
            ]);
        }
    }

    /**
     * Validate image count does not exceed maximum
     * 
     * @param count - Number of images
     * @throws ValidationException if count exceeds maximum
     * 
     * **Validates: Requirements 1.7, 9.2**
     */
    static validateImageCount(count: number): void {
        if (count > MAX_IMAGES_PER_PRODUCT) {
            throw new ValidationException(
                `Maximum ${MAX_IMAGES_PER_PRODUCT} images allowed per product. Provided: ${count}`,
                [
                    {
                        field: 'images',
                        message: `Maximum ${MAX_IMAGES_PER_PRODUCT} images allowed per product. Provided: ${count}`
                    }
                ]
            );
        }
    }

    /**
     * Validate product name is non-empty and meets requirements
     * 
     * @param name - Product name to validate
     * @throws ValidationException if name is invalid
     * 
     * **Validates: Requirements 1.1, 9.2**
     */
    static validateProductName(name: string): void {
        if (!name || name.trim().length === 0) {
            throw new ValidationException('Product name is required and cannot be empty.', [
                {
                    field: 'name',
                    message: 'Product name is required and cannot be empty.'
                }
            ]);
        }

        if (name.length > 200) {
            throw new ValidationException('Product name cannot exceed 200 characters.', [
                {
                    field: 'name',
                    message: 'Product name cannot exceed 200 characters.'
                }
            ]);
        }
    }

    /**
     * Validate product data for creation
     * 
     * Validates all required fields and business rules for CreateProductData.
     * All fields (name, price, category) are required.
     * 
     * @param data - CreateProductData to validate
     * @throws ValidationException if any validation fails
     * 
     * **Validates: Requirements 1.1, 1.2, 9.2, 9.3**
     */
    static validateCreateProduct(data: CreateProductData): void {
        const errors: Array<{ field: string; message: string }> = [];

        // Name is required and must be valid
        if (data.name === undefined) {
            errors.push({
                field: 'name',
                message: 'Product name is required.'
            });
        } else {
            // Validate name format (handles empty string case)
            try {
                this.validateProductName(data.name);
            } catch (error) {
                if (error instanceof ValidationException && error.fields) {
                    errors.push(...error.fields);
                }
            }
        }

        // Price is required
        if (data.price === undefined) {
            errors.push({
                field: 'price',
                message: 'Product price is required.'
            });
        } else {
            // Validate price value
            try {
                this.validatePrice(data.price);
            } catch (error) {
                if (error instanceof ValidationException && error.fields) {
                    errors.push(...error.fields);
                }
            }
        }

        // Category is required
        if (!data.category || data.category === undefined) {
            errors.push({
                field: 'category',
                message: 'Product category is required.'
            });
        }

        // Validate description length if provided
        if (data.description !== undefined && data.description !== null && data.description.length > 2000) {
            errors.push({
                field: 'description',
                message: 'Product description cannot exceed 2000 characters.'
            });
        }

        // Validate status if provided
        if (data.status !== undefined) {
            const validStatuses = ['active', 'inactive', 'out_of_stock'];
            if (!validStatuses.includes(data.status)) {
                errors.push({
                    field: 'status',
                    message: `Product status must be one of: ${validStatuses.join(', ')}.`
                });
            }
        }

        if (errors.length > 0) {
            throw new ValidationException('Invalid product data.', errors);
        }
    }

    /**
     * Validate product data for update
     * 
     * Validates only the fields that are present (partial updates allowed).
     * No fields are required - empty updates are valid.
     * 
     * @param data - UpdateProductData to validate
     * @throws ValidationException if any validation fails
     * 
     * **Validates: Requirements 1.1, 1.2, 9.2, 9.3**
     */
    static validateUpdateProduct(data: UpdateProductData): void {
        const errors: Array<{ field: string; message: string }> = [];

        // Validate name if provided
        if (data.name !== undefined) {
            try {
                this.validateProductName(data.name);
            } catch (error) {
                if (error instanceof ValidationException && error.fields) {
                    errors.push(...error.fields);
                }
            }
        }

        // Validate price if provided
        if (data.price !== undefined) {
            try {
                this.validatePrice(data.price);
            } catch (error) {
                if (error instanceof ValidationException && error.fields) {
                    errors.push(...error.fields);
                }
            }
        }

        // Validate description length if provided
        if (data.description !== undefined && data.description !== null && data.description.length > 2000) {
            errors.push({
                field: 'description',
                message: 'Product description cannot exceed 2000 characters.'
            });
        }

        // Validate status if provided
        if (data.status !== undefined) {
            const validStatuses = ['active', 'inactive', 'out_of_stock'];
            if (!validStatuses.includes(data.status)) {
                errors.push({
                    field: 'status',
                    message: `Product status must be one of: ${validStatuses.join(', ')}.`
                });
            }
        }

        if (errors.length > 0) {
            throw new ValidationException('Invalid product data.', errors);
        }
    }

    /**
     * Validate product data (legacy method for backward compatibility)
     * 
     * @deprecated Use validateCreateProduct() or validateUpdateProduct() instead
     * @param data - CreateProductData or UpdateProductData to validate
     * @throws ValidationException if any validation fails
     */
    static validateProductData(data: CreateProductData | UpdateProductData): void {
        // Heuristic: Check if this looks like a create operation
        // If it has at least 2 of the 3 core fields (name, price, category), treat as create
        const hasName = 'name' in data;
        const hasPrice = 'price' in data;
        const hasCategory = 'category' in data;
        const coreFieldCount = (hasName ? 1 : 0) + (hasPrice ? 1 : 0) + (hasCategory ? 1 : 0);

        if (coreFieldCount >= 2) {
            this.validateCreateProduct(data as CreateProductData);
        } else {
            this.validateUpdateProduct(data as UpdateProductData);
        }
    }
}
