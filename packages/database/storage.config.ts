/**
 * Supabase Storage Configuration
 * 
 * Provides centralized configuration for Supabase Storage buckets with:
 * - Product image storage bucket configuration
 * - File upload validation rules
 * - Public URL generation
 * - Storage client initialization
 * 
 * Requirements: 11.1, 11.3 (Image storage integration and validation)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase.config';

/**
 * Storage bucket names
 */
export const STORAGE_BUCKETS = {
    PRODUCTS: 'products',
    PRODUCT_IMAGES: 'product-images',
} as const;

/**
 * Allowed image MIME types for product images
 * Requirements: 11.3 (Validate image file types)
 */
export const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
] as const;

/**
 * Maximum file size for product images (5MB)
 * Requirements: 11.3 (Validate image size limits)
 */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Maximum number of images per product
 * Requirements: 1.2 (Business rule validation)
 */
export const MAX_IMAGES_PER_PRODUCT = 5;

/**
 * Storage bucket configuration interface
 */
export interface StorageBucketConfig {
    name: string;
    public: boolean;
    fileSizeLimit: number;
    allowedMimeTypes: readonly string[];
}

/**
 * Product images bucket configuration
 */
export const PRODUCT_IMAGES_BUCKET_CONFIG: StorageBucketConfig = {
    name: STORAGE_BUCKETS.PRODUCT_IMAGES,
    public: true, // Public access for product images
    fileSizeLimit: MAX_IMAGE_SIZE_BYTES,
    allowedMimeTypes: ALLOWED_IMAGE_TYPES,
};

/**
 * File validation result
 */
export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Validate image file type and size
 * 
 * @param file - File to validate (with mimetype and size properties)
 * @param config - Bucket configuration with validation rules
 * @returns Validation result with error message if invalid
 */
export function validateImageFile(
    file: { mimetype?: string; size: number; type?: string },
    config: StorageBucketConfig = PRODUCT_IMAGES_BUCKET_CONFIG
): FileValidationResult {
    const mimeType = file.mimetype || file.type;

    // Validate MIME type
    if (!mimeType) {
        return {
            valid: false,
            error: 'File type is required',
        };
    }

    if (!config.allowedMimeTypes.includes(mimeType as any)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed types: ${config.allowedMimeTypes.join(', ')}`,
        };
    }

    // Validate file size
    if (file.size > config.fileSizeLimit) {
        const maxSizeMB = config.fileSizeLimit / (1024 * 1024);
        return {
            valid: false,
            error: `File size exceeds maximum limit of ${maxSizeMB}MB`,
        };
    }

    return { valid: true };
}

/**
 * Generate unique filename for storage
 * Format: {uuid}-{timestamp}.{extension}
 * 
 * Requirements: 11.2 (Generate unique filenames to prevent collisions)
 * 
 * @param originalFilename - Original filename with extension
 * @returns Unique filename
 */
export function generateUniqueFilename(originalFilename: string): string {
    const timestamp = Date.now();
    const randomId = crypto.randomUUID();
    const extension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';

    return `${randomId}-${timestamp}.${extension}`;
}

/**
 * Get storage path for product image
 * 
 * @param productId - Product UUID
 * @param filename - Image filename
 * @returns Storage path
 */
export function getProductImagePath(productId: string, filename: string): string {
    return `${productId}/${filename}`;
}

/**
 * Get public URL for stored image
 * 
 * @param client - Supabase client
 * @param bucketName - Storage bucket name
 * @param path - File path in bucket
 * @returns Public URL
 */
export function getPublicUrl(
    client: SupabaseClient,
    bucketName: string,
    path: string
): string {
    const { data } = client.storage.from(bucketName).getPublicUrl(path);
    return data.publicUrl;
}

/**
 * Storage client wrapper for product images
 */
export class ProductImageStorage {
    private client: SupabaseClient;
    private bucketName: string;

    constructor(client?: SupabaseClient, bucketName: string = STORAGE_BUCKETS.PRODUCT_IMAGES) {
        this.client = client || getSupabaseClient();
        this.bucketName = bucketName;
    }

    /**
     * Upload image file to storage
     * 
     * @param productId - Product UUID
     * @param file - File buffer or blob
     * @param originalFilename - Original filename
     * @returns Public URL of uploaded image
     */
    async uploadImage(
        productId: string,
        file: Buffer | Blob,
        originalFilename: string
    ): Promise<string> {
        const filename = generateUniqueFilename(originalFilename);
        const path = getProductImagePath(productId, filename);

        const { data, error } = await this.client.storage
            .from(this.bucketName)
            .upload(path, file, {
                contentType: this.getContentType(originalFilename),
                cacheControl: '3600', // Cache for 1 hour
                upsert: false, // Don't overwrite existing files
            });

        if (error) {
            throw new Error(`Failed to upload image: ${error.message}`);
        }

        return getPublicUrl(this.client, this.bucketName, data.path);
    }

    /**
     * Delete image from storage
     * 
     * @param path - File path in bucket (can be full URL or path)
     */
    async deleteImage(path: string): Promise<void> {
        // Extract path from URL if full URL is provided
        const filePath = this.extractPathFromUrl(path);

        const { error } = await this.client.storage
            .from(this.bucketName)
            .remove([filePath]);

        if (error) {
            // Log error but don't throw - file might already be deleted
            console.warn(`Failed to delete image: ${error.message}`);
        }
    }

    /**
     * Delete multiple images from storage
     * 
     * @param paths - Array of file paths or URLs
     */
    async deleteImages(paths: string[]): Promise<void> {
        const filePaths = paths.map(p => this.extractPathFromUrl(p));

        const { error } = await this.client.storage
            .from(this.bucketName)
            .remove(filePaths);

        if (error) {
            console.warn(`Failed to delete images: ${error.message}`);
        }
    }

    /**
     * Get public URL for image
     * 
     * @param path - File path in bucket
     * @returns Public URL
     */
    getPublicUrl(path: string): string {
        return getPublicUrl(this.client, this.bucketName, path);
    }

    /**
     * Extract file path from full URL
     * 
     * @param urlOrPath - Full URL or path
     * @returns File path
     */
    private extractPathFromUrl(urlOrPath: string): string {
        // If it's already a path (no protocol), return as-is
        if (!urlOrPath.startsWith('http')) {
            return urlOrPath;
        }

        // Extract path from URL
        // Format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
        const match = urlOrPath.match(/\/object\/public\/[^/]+\/(.+)$/);
        return match ? match[1] : urlOrPath;
    }

    /**
     * Get content type from filename
     * 
     * @param filename - Filename with extension
     * @returns MIME type
     */
    private getContentType(filename: string): string {
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
                return 'image/jpeg';
        }
    }
}

/**
 * Create storage bucket if it doesn't exist
 * 
 * This should be run during application initialization or deployment
 * Requires service role key
 * 
 * @param client - Supabase client with admin privileges
 * @param config - Bucket configuration
 */
export async function ensureStorageBucket(
    client: SupabaseClient,
    config: StorageBucketConfig = PRODUCT_IMAGES_BUCKET_CONFIG
): Promise<void> {
    // Check if bucket exists
    const { data: buckets, error: listError } = await client.storage.listBuckets();

    if (listError) {
        throw new Error(`Failed to list storage buckets: ${listError.message}`);
    }

    const bucketExists = buckets?.some(b => b.name === config.name);

    if (!bucketExists) {
        // Create bucket
        const { error: createError } = await client.storage.createBucket(config.name, {
            public: config.public,
            fileSizeLimit: config.fileSizeLimit,
            allowedMimeTypes: config.allowedMimeTypes as string[],
        });

        if (createError) {
            throw new Error(`Failed to create storage bucket: ${createError.message}`);
        }

        console.log(`Storage bucket '${config.name}' created successfully`);
    } else {
        console.log(`Storage bucket '${config.name}' already exists`);
    }
}
