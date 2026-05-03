/**
 * Image Storage Service Interface
 * 
 * Provides abstraction for product image storage operations using Supabase Storage.
 * Handles image upload, deletion, validation, and filename generation.
 * 
 * Requirements: 11.1 (Image Storage Integration)
 */

import type { StoredFile } from '@dakshinkali/database';

/**
 * Image upload result containing the public URL
 */
export interface ImageUploadResult {
    url: string;
    filename: string;
}

/**
 * Image file validation error
 */
export class ImageValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ImageValidationError';
    }
}

/**
 * Image storage operation error
 */
export class ImageStorageError extends Error {
    constructor(message: string, public readonly cause?: Error) {
        super(message);
        this.name = 'ImageStorageError';
    }
}

/**
 * ImageStorageService interface
 * 
 * Defines the contract for image storage operations.
 * Implementations should handle Supabase Storage integration.
 */
export interface ImageStorageService {
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
    uploadImage(
        file: StoredFile,
        productId: string
    ): Promise<ImageUploadResult>;

    /**
     * Delete an image file from storage
     * 
     * Requirements: 11.5 (Delete files from Supabase Storage)
     * 
     * @param imageUrl - Full public URL or storage path of the image
     * @throws ImageStorageError if deletion fails (handles gracefully if file not found)
     */
    deleteImage(imageUrl: string): Promise<void>;

    /**
     * Delete multiple image files from storage
     * 
     * Requirements: 11.5 (Batch deletion for efficiency)
     * 
     * @param imageUrls - Array of full public URLs or storage paths
     * @throws ImageStorageError if deletion fails
     */
    deleteImages(imageUrls: string[]): Promise<void>;

    /**
     * Generate a unique filename to prevent collisions
     * 
     * Requirements: 11.2 (Generate UUID-based filenames)
     * Format: {uuid}-{timestamp}.{extension}
     * 
     * @param originalFilename - Original filename with extension
     * @returns Unique filename with preserved extension
     */
    generateUniqueFilename(originalFilename: string): string;

    /**
     * Validate image file
     * 
     * Requirements: 11.3 (Validate JPEG/PNG/WebP, max 5MB)
     * 
     * @param file - Standardized backend file object
     * @throws ImageValidationError if validation fails with descriptive message
     */
    validateImageFile(file: StoredFile): void;
}
