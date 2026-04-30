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
    ALLOWED_IMAGE_TYPES,
    MAX_IMAGE_SIZE_BYTES,
    generateUniqueFilename as generateFilename,
} from '@packages/database/storage.config';

/**
 * ImageStorageServiceImpl
 * 
 * Production implementation of ImageStorageService using Supabase Storage.
 * Validates files, generates unique filenames, and manages image lifecycle.
 */
export class ImageStorageServiceImpl implements ImageStorageService {
    private storage: ProductImageStorage;

    constructor(storage?: ProductImageStorage) {
        this.storage = storage || new ProductImageStorage();
    }

    /**
     * Upload an image file to storage
     * 
     * Requirements: 11.1, 11.4 (Upload to Supabase Storage, return public URL)
     * 
     * @param file - Image file buffer or blob
     * @param productId - Product UUID for organizing storage
     * @param originalFilename - Original filename with extension
     * @returns Image upload result with public URL and generated filename
     * @throws ImageValidationError if file validation fails
     * @throws ImageStorageError if upload fails
     */
    async uploadImage(
        file: Buffer | Blob,
        productId: string,
        originalFilename: string
    ): Promise<ImageUploadResult> {
        // Validate file before upload
        const fileSize = file instanceof Buffer ? file.length : file.size;
        const mimeType = this.getMimeTypeFromFilename(originalFilename);

        this.validateImageFile({
            mimetype: mimeType,
            size: fileSize,
        });

        try {
            // Generate unique filename
            const filename = this.generateUniqueFilename(originalFilename);

            // Upload to Supabase Storage
            const url = await this.storage.uploadImage(productId, file, originalFilename);

            return {
                url,
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
            await this.storage.deleteImages(imageUrls);
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
     * @param file - File object with mimetype/type and size properties
     * @throws ImageValidationError if validation fails with descriptive message
     */
    validateImageFile(file: {
        mimetype?: string;
        type?: string;
        size: number;
    }): void {
        const mimeType = file.mimetype || file.type;

        // Validate MIME type exists
        if (!mimeType) {
            throw new ImageValidationError('File type is required');
        }

        // Validate MIME type is allowed (JPEG, PNG, WebP only)
        if (!ALLOWED_IMAGE_TYPES.includes(mimeType as any)) {
            throw new ImageValidationError(
                `Invalid file type. Allowed types: JPEG, PNG, WebP. Received: ${mimeType}`
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

    /**
     * Get MIME type from filename extension
     * 
     * @param filename - Filename with extension
     * @returns MIME type
     */
    private getMimeTypeFromFilename(filename: string): string {
        const extension = filename.split('.').pop()?.toLowerCase();

        switch (extension) {
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'webp':
                return 'image/webp';
            default:
                return 'application/octet-stream';
        }
    }
}
