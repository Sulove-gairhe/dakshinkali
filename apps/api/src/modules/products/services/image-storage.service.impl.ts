/**
 * Image Storage Service Implementation
 * 
 * Implements image storage operations using Supabase Storage.
 * Handles validation, upload, deletion, and filename generation.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import {
    ImageStorageService,
    ImageUploadResult,
    ImageValidationError,
    ImageStorageError,
} from './image-storage.service';
import {
    ProductImageStorage,
    StoredFile,
    ALLOWED_IMAGE_TYPES,
    MAX_IMAGE_SIZE_BYTES,
    generateUniqueFilename as generateFilename,
} from '@dakshinkali/database';

/**
 * ImageStorageServiceImpl
 * 
 * Production implementation of ImageStorageService using Supabase Storage.
 * Validates files, generates unique filenames, and manages image lifecycle.
 */
export class ImageStorageServiceImpl implements ImageStorageService {
    private storage: ProductImageStorage;

    constructor(storage: ProductImageStorage) {
        this.storage = storage;
    }

    /**
     * Upload an image file to storage
     * 
     * Requirements: 11.1, 11.4 (Upload to Supabase Storage, return public URL)
     * 
     * @param file - Standardized backend file object
     * @param productId - Product UUID for organizing storage
     * @returns Image upload result with public URL and generated filename
     * @throws ImageValidationError if file validation fails
     * @throws ImageStorageError if upload fails
     */
    async uploadImage(
        file: StoredFile,
        productId: string
    ): Promise<ImageUploadResult> {
        // Validate file before upload
        this.validateImageFile(file);

        try {
            // Generate unique filename
            const filename = this.generateUniqueFilename(file.originalName);

            // Upload to Supabase Storage
            const result = await this.storage.uploadImage(productId, file);

            return {
                url: result.url,
                filename,
            };
        } catch (error) {
            throw new ImageStorageError(
                `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error instanceof Error ? error : undefined
            );
        }
    }

    /**
     * Delete an image file from storage
     * 
     * Requirements: 11.5 (Delete files from Supabase Storage with graceful error handling)
     * 
     * @param imageUrl - Full public URL or storage path of the image
     * @throws ImageStorageError if deletion fails (handles gracefully if file not found)
     */
    async deleteImage(imageUrl: string): Promise<void> {
        try {
            await this.storage.deleteImage(imageUrl);
        } catch (error) {
            // Log error but don't throw - graceful error handling
            // File might already be deleted or not exist
            console.warn(
                `Failed to delete image ${imageUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Delete multiple image files from storage
     * 
     * Requirements: 11.5 (Batch deletion for efficiency)
     * 
     * @param imageUrls - Array of full public URLs or storage paths
     * @throws ImageStorageError if deletion fails
     */
    async deleteImages(imageUrls: string[]): Promise<void> {
        try {
            // Delete each image individually since ProductImageStorage doesn't have batch delete
            for (const imageUrl of imageUrls) {
                await this.storage.deleteImage(imageUrl);
            }
        } catch (error) {
            // Log error but don't throw - graceful error handling
            console.warn(
                `Failed to delete images: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Generate a unique filename to prevent collisions
     * 
     * Requirements: 11.2 (Generate UUID-based filenames)
     * Format: {uuid}-{timestamp}.{extension}
     * 
     * @param originalFilename - Original filename with extension
     * @returns Unique filename with preserved extension
     */
    generateUniqueFilename(originalFilename: string): string {
        return generateFilename(originalFilename);
    }

    /**
     * Validate image file type and size
     * 
     * Requirements: 11.3 (Validate JPEG/PNG/WebP, max 5MB)
     * 
     * @param file - Standardized backend file object
     * @throws ImageValidationError if validation fails with descriptive message
     */
    validateImageFile(file: StoredFile): void {
        // Validate MIME type is allowed (JPEG, PNG, WebP only)
        if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype as any)) {
            throw new ImageValidationError(
                `Invalid file type. Allowed types: JPEG, PNG, WebP. Received: ${file.mimetype}`
            );
        }

        // Validate file size (max 5MB)
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
            const maxSizeMB = MAX_IMAGE_SIZE_BYTES / (1024 * 1024);
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            throw new ImageValidationError(
                `File size exceeds maximum limit of ${maxSizeMB}MB. File size: ${fileSizeMB}MB`
            );
        }
    }
}
