/**
 * Supabase Storage Configuration
 * 
 * Provides centralized configuration for Supabase Storage (file uploads).
 * Used by ImageStorageService for product image management.
 * 
 * Requirements: 11.1, 11.4 (Image storage integration)
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Storage bucket configuration
 */
export interface StorageBucketConfig {
    /** Bucket name in Supabase Storage */
    name: string;

    /** Whether the bucket is public (files accessible without auth) */
    public: boolean;

    /** Allowed file MIME types */
    allowedMimeTypes: string[];

    /** Maximum file size in bytes */
    maxFileSizeBytes: number;

    /** File size limit in MB (for display) */
    maxFileSizeMB: number;
}

/**
 * File validation result
 */
export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Allowed image MIME types for product images
 */
export const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
] as const;

/**
 * Maximum image file size (5MB)
 */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Maximum number of images per product
 */
export const MAX_IMAGES_PER_PRODUCT = 10;

/**
 * Product images bucket configuration
 * 
 * Stores product images with public access
 */
export const PRODUCT_IMAGES_BUCKET_CONFIG: StorageBucketConfig = {
    name: 'product-images',
    public: true,
    allowedMimeTypes: [...ALLOWED_IMAGE_TYPES],
    maxFileSizeBytes: MAX_IMAGE_SIZE_BYTES,
    maxFileSizeMB: 5,
};

/**
 * All storage buckets configuration
 */
export const STORAGE_BUCKETS = {
    PRODUCT_IMAGES: PRODUCT_IMAGES_BUCKET_CONFIG,
} as const;

/**
 * Get storage bucket configuration by name
 * 
 * @param bucketName - Name of the bucket
 * @returns Bucket configuration
 * @throws {Error} If bucket name is not recognized
 */
export function getStorageBucketConfig(bucketName: string): StorageBucketConfig {
    switch (bucketName) {
        case 'product-images':
            return PRODUCT_IMAGES_BUCKET_CONFIG;
        default:
            throw new Error(`Unknown storage bucket: ${bucketName}`);
    }
}

/**
 * Validate image file for product uploads
 * 
 * @param file - File to validate (with type and size properties)
 * @param maxSizeBytes - Maximum file size in bytes (optional, defaults to MAX_IMAGE_SIZE_BYTES)
 * @returns Validation result with error message if invalid
 */
export function validateImageFile(
    file: { type: string; size: number },
    maxSizeBytes: number = MAX_IMAGE_SIZE_BYTES
): FileValidationResult {
    // Check file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
        };
    }

    // Check file size
    if (file.size > maxSizeBytes) {
        return {
            valid: false,
            error: `File size exceeds maximum allowed size of ${maxSizeBytes / 1024 / 1024}MB`,
        };
    }

    return { valid: true };
}

/**
 * Validate file against bucket configuration
 * 
 * @param file - File to validate
 * @param bucketConfig - Bucket configuration
 * @returns Validation result with error message if invalid
 */
export function validateFile(
    file: File,
    bucketConfig: StorageBucketConfig
): { valid: boolean; error?: string } {
    // Check file type
    if (!bucketConfig.allowedMimeTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed types: ${bucketConfig.allowedMimeTypes.join(', ')}`,
        };
    }

    // Check file size
    if (file.size > bucketConfig.maxFileSizeBytes) {
        return {
            valid: false,
            error: `File size exceeds maximum allowed size of ${bucketConfig.maxFileSizeMB}MB`,
        };
    }

    return { valid: true };
}

/**
 * Generate unique filename for storage
 * 
 * Prevents filename collisions by using UUID and timestamp
 * 
 * @param originalFilename - Original filename from upload
 * @returns Unique filename with preserved extension
 */
export function generateUniqueFilename(originalFilename: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalFilename.split('.').pop() || 'jpg';

    return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Get product image storage path
 * 
 * Organizes images by product ID for better file management
 * 
 * @param productId - Product UUID
 * @param filename - Image filename
 * @returns Storage path in format: products/{productId}/{filename}
 */
export function getProductImagePath(productId: string, filename: string): string {
    return `products/${productId}/${filename}`;
}

/**
 * Get public URL for a file in storage
 * 
 * @param supabase - Supabase client
 * @param bucketName - Storage bucket name
 * @param filePath - File path in bucket
 * @returns Public URL for the file
 */
export function getPublicUrl(
    supabase: SupabaseClient,
    bucketName: string,
    filePath: string
): string {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return data.publicUrl;
}

/**
 * Upload file to storage bucket
 * 
 * @param supabase - Supabase client
 * @param bucketName - Storage bucket name
 * @param filePath - Destination path in bucket
 * @param file - File to upload
 * @returns Upload result with public URL
 */
export async function uploadFile(
    supabase: SupabaseClient,
    bucketName: string,
    filePath: string,
    file: File | Buffer | Blob
): Promise<{ url: string; path: string }> {
    const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        throw new Error(`Failed to upload file: ${error.message}`);
    }

    const publicUrl = getPublicUrl(supabase, bucketName, data.path);

    return {
        url: publicUrl,
        path: data.path,
    };
}

/**
 * Delete file from storage bucket
 * 
 * @param supabase - Supabase client
 * @param bucketName - Storage bucket name
 * @param filePath - File path to delete
 */
export async function deleteFile(
    supabase: SupabaseClient,
    bucketName: string,
    filePath: string
): Promise<void> {
    const { error } = await supabase.storage.from(bucketName).remove([filePath]);

    if (error) {
        throw new Error(`Failed to delete file: ${error.message}`);
    }
}

/**
 * Delete multiple files from storage bucket
 * 
 * @param supabase - Supabase client
 * @param bucketName - Storage bucket name
 * @param filePaths - Array of file paths to delete
 */
export async function deleteFiles(
    supabase: SupabaseClient,
    bucketName: string,
    filePaths: string[]
): Promise<void> {
    if (filePaths.length === 0) {
        return;
    }

    const { error } = await supabase.storage.from(bucketName).remove(filePaths);

    if (error) {
        throw new Error(`Failed to delete files: ${error.message}`);
    }
}

/**
 * Ensure storage bucket exists
 * 
 * Creates bucket if it doesn't exist, with proper configuration
 * 
 * @param supabase - Supabase client
 * @param config - Bucket configuration
 */
export async function ensureStorageBucket(
    supabase: SupabaseClient,
    config: StorageBucketConfig
): Promise<void> {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
        throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const bucketExists = buckets?.some((b) => b.name === config.name);

    if (!bucketExists) {
        // Create bucket
        const { error: createError } = await supabase.storage.createBucket(config.name, {
            public: config.public,
            fileSizeLimit: config.maxFileSizeBytes,
            allowedMimeTypes: config.allowedMimeTypes,
        });

        if (createError) {
            throw new Error(`Failed to create bucket: ${createError.message}`);
        }
    }
}

/**
 * Product Image Storage Service
 * 
 * High-level API for managing product images in Supabase Storage
 */
export class ProductImageStorage {
    constructor(private supabase: SupabaseClient) { }

    /**
     * Upload product image
     * 
     * @param productId - Product UUID
     * @param file - Image file to upload
     * @param originalFilename - Original filename
     * @returns Upload result with public URL and storage path
     */
    async uploadImage(
        productId: string,
        file: File | Buffer | Blob,
        originalFilename: string
    ): Promise<{ url: string; path: string }> {
        // Validate file if it's a File object
        if (file instanceof File) {
            const validation = validateImageFile(file);
            if (!validation.valid) {
                throw new Error(validation.error);
            }
        }

        // Generate unique filename
        const filename = generateUniqueFilename(originalFilename);
        const filePath = getProductImagePath(productId, filename);

        // Upload to storage
        return uploadFile(
            this.supabase,
            PRODUCT_IMAGES_BUCKET_CONFIG.name,
            filePath,
            file
        );
    }

    /**
     * Delete product image
     * 
     * @param imagePath - Storage path of the image
     */
    async deleteImage(imagePath: string): Promise<void> {
        return deleteFile(this.supabase, PRODUCT_IMAGES_BUCKET_CONFIG.name, imagePath);
    }

    /**
     * Delete all images for a product
     * 
     * @param productId - Product UUID
     */
    async deleteProductImages(productId: string): Promise<void> {
        const folderPath = `products/${productId}`;

        // List all files in the product folder
        const { data: files, error } = await this.supabase.storage
            .from(PRODUCT_IMAGES_BUCKET_CONFIG.name)
            .list(folderPath);

        if (error) {
            throw new Error(`Failed to list product images: ${error.message}`);
        }

        if (!files || files.length === 0) {
            return;
        }

        // Delete all files
        const filePaths = files.map((f) => `${folderPath}/${f.name}`);
        return deleteFiles(this.supabase, PRODUCT_IMAGES_BUCKET_CONFIG.name, filePaths);
    }

    /**
     * Get public URL for an image
     * 
     * @param imagePath - Storage path of the image
     * @returns Public URL
     */
    getImageUrl(imagePath: string): string {
        return getPublicUrl(this.supabase, PRODUCT_IMAGES_BUCKET_CONFIG.name, imagePath);
    }
}
