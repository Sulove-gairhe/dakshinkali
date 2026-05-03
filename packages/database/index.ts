/**
 * Database Package - Supabase Configuration and Storage
 * 
 * Centralized database and storage configuration for the Dakshinkali Electronics platform.
 * Provides connection pooling, storage bucket management, and type-safe clients.
 */

// Supabase client configuration
export {
    type SupabaseConfig,
    type ConnectionPoolConfig,
    DEFAULT_POOL_CONFIG,
    getSupabaseConfig,
    createSupabaseClient,
    createSupabasePublicClient,
    getSupabaseClient,
    resetSupabaseClient,
} from './supabase.config';

// Storage configuration
export {
    STORAGE_BUCKETS,
    ALLOWED_IMAGE_TYPES,
    MAX_IMAGE_SIZE_BYTES,
    MAX_IMAGES_PER_PRODUCT,
    PRODUCT_IMAGES_BUCKET_CONFIG,
    type StorageBucketConfig,
    type StoredFile,
    type FileValidationResult,
    validateImageFile,
    generateUniqueFilename,
    getProductImagePath,
    getPublicUrl,
    ProductImageStorage,
    ensureStorageBucket,
} from './storage.config';
