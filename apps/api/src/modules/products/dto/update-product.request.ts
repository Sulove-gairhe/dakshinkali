/**
 * UpdateProductRequest - Request schema for updating an existing product
 * 
 * Used by PUT /api/v1/admin/products/:id endpoint.
 * All fields are optional - only provided fields will be updated.
 * 
 * @remarks
 * - All fields are optional (partial update)
 * - Images can be added via images array
 * - Images can be removed via removeImages array (image IDs)
 * - Name uniqueness is checked within category if name is being changed
 * - Price validation (> 0) applies if price is being updated
 * 
 * @see ProductDTO for the response format
 */

import { ProductStatus } from '../entities/product.entity';

/**
 * UpdateProductRequest interface
 * 
 * Validation rules:
 * - name: Optional, 1-200 characters if provided, checked for uniqueness within category
 * - description: Optional, max 2000 characters if provided
 * - price: Optional, must be > 0 if provided
 * - category: Optional, non-empty string if provided
 * - status: Optional, must be valid ProductStatus enum value if provided
 * - images: Optional, new images to add (max 5MB each, JPEG/PNG/WebP)
 * - removeImages: Optional, array of image IDs to remove from product
 */
export interface UpdateProductRequest {
    /** Product name (optional, 1-200 chars, unique within category) */
    name?: string;

    /** Product description (optional, max 2000 chars) */
    description?: string;

    /** Product price (optional, must be > 0) */
    price?: number;

    /** Product category (optional) */
    category?: string;

    /** Product availability status (optional) */
    status?: ProductStatus;

    /** New images to add (optional, 5MB each, JPEG/PNG/WebP) */
    images?: File[];

    /** Image IDs to remove (optional, array of image UUIDs) */
    removeImages?: string[];
}
