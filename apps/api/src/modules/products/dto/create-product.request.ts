/**
 * CreateProductRequest - Request schema for creating a new product
 * 
 * Used by POST /api/v1/admin/products endpoint.
 * Defines validation rules for product creation.
 * 
 * @remarks
 * - All required fields must be provided
 * - Optional fields: description, status, images
 * - Status defaults to "active" if not provided
 * - Images are handled as multipart/form-data File objects
 * - Maximum 5 images allowed, each max 5MB
 * - Supported image types: JPEG, PNG, WebP
 * 
 * @see ProductDTO for the response format
 */

import { ProductStatus } from '../entities/product.entity';

/**
 * CreateProductRequest interface
 * 
 * Validation rules:
 * - name: Required, 1-200 characters, will be checked for uniqueness within category
 * - description: Optional, max 2000 characters
 * - price: Required, must be > 0
 * - category: Required, non-empty string
 * - status: Optional, must be valid ProductStatus enum value, defaults to "active"
 * - images: Optional, max 5 files, each max 5MB, types: JPEG/PNG/WebP
 */
export interface CreateProductRequest {
    /** Product name (required, 1-200 chars, unique within category) */
    name: string;

    /** Product description (optional, max 2000 chars) */
    description?: string;

    /** Product price (required, must be > 0) */
    price: number;

    /** Product category (required) */
    category: string;

    /** Product availability status (optional, defaults to "active") */
    status?: ProductStatus;

    /** Product images (optional, max 5 files, 5MB each, JPEG/PNG/WebP) */
    images?: Express.Multer.File[];
}
