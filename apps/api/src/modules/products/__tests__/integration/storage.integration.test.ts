/**
 * Storage Integration Tests
 * 
 * End-to-end tests for image storage operations with real Supabase Storage.
 * Tests upload, retrieval, deletion, and error scenarios.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
    ProductImageStorage,
    StoredFile,
    ensureStorageBucket,
    PRODUCT_IMAGES_BUCKET_CONFIG,
} from '@dakshinkali/database';
import { ImageStorageServiceImpl } from '../../services/image-storage.service.impl';
import { env } from '../../../../config/env.config';

describe('Storage Integration Tests', () => {
    let supabase: SupabaseClient;
    let storage: ProductImageStorage;
    let service: ImageStorageServiceImpl;
    const testProductId = 'test-product-' + Date.now();
    const uploadedFiles: string[] = [];

    beforeAll(async () => {
        // Initialize Supabase client
        supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);

        // Ensure storage bucket exists
        await ensureStorageBucket(supabase, PRODUCT_IMAGES_BUCKET_CONFIG);

        // Initialize storage and service
        storage = new ProductImageStorage(supabase);
        service = new ImageStorageServiceImpl(storage);
    });

    afterAll(async () => {
        // Cleanup: Delete all uploaded test files
        if (uploadedFiles.length > 0) {
            try {
                await storage.deleteProductImages(testProductId);
            } catch (error) {
                console.warn('Cleanup failed:', error);
            }
        }
    });

    beforeEach(() => {
        // Track uploaded files for cleanup
        uploadedFiles.length = 0;
    });

    describe('Image Upload', () => {
        it('should upload a valid JPEG image', async () => {
            // Create a test image buffer
            const buffer = Buffer.from('fake-jpeg-data');
            const file: StoredFile = {
                buffer,
                size: buffer.length,
                mimetype: 'image/jpeg',
                originalName: 'test-image.jpg',
            };

            const result = await service.uploadImage(file, testProductId);

            expect(result).toBeDefined();
            expect(result.url).toContain('supabase');
            expect(result.filename).toMatch(/\.jpg$/);

            uploadedFiles.push(result.url);
        });

        it('should upload a valid PNG image', async () => {
            const buffer = Buffer.from('fake-png-data');
            const file: StoredFile = {
                buffer,
                size: buffer.length,
                mimetype: 'image/png',
                originalName: 'test-image.png',
            };

            const result = await service.uploadImage(file, testProductId);

            expect(result).toBeDefined();
            expect(result.url).toContain('supabase');
            expect(result.filename).toMatch(/\.png$/);

            uploadedFiles.push(result.url);
        });

        it('should upload a valid WebP image', async () => {
            const buffer = Buffer.from('fake-webp-data');
            const file: StoredFile = {
                buffer,
                size: buffer.length,
                mimetype: 'image/webp',
                originalName: 'test-image.webp',
            };

            const result = await service.uploadImage(file, testProductId);

            expect(result).toBeDefined();
            expect(result.url).toContain('supabase');
            expect(result.filename).toMatch(/\.webp$/);

            uploadedFiles.push(result.url);
        });

        it('should generate unique filenames for multiple uploads', async () => {
            const buffer = Buffer.from('fake-image-data');
            const file: StoredFile = {
                buffer,
                size: buffer.length,
                mimetype: 'image/jpeg',
                originalName: 'test.jpg',
            };

            const result1 = await service.uploadImage(file, testProductId);
            const result2 = await service.uploadImage(file, testProductId);

            expect(result1.filename).not.toBe(result2.filename);
            expect(result1.url).not.toBe(result2.url);

            uploadedFiles.push(result1.url, result2.url);
        });

        it('should reject file exceeding 5MB', async () => {
            const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
            const file: StoredFile = {
                buffer: largeBuffer,
                size: largeBuffer.length,
                mimetype: 'image/jpeg',
                originalName: 'large-image.jpg',
            };

            await expect(service.uploadImage(file, testProductId)).rejects.toThrow(
                'File size exceeds maximum limit'
            );
        });

        it('should reject invalid file type', async () => {
            const buffer = Buffer.from('fake-gif-data');
            const file: StoredFile = {
                buffer,
                size: buffer.length,
                mimetype: 'image/gif',
                originalName: 'test.gif',
            };

            await expect(service.uploadImage(file, testProductId)).rejects.toThrow(
                'Invalid file type'
            );
        });

        it('should organize files by product ID', async () => {
            const buffer = Buffer.from('fake-image-data');
            const file: StoredFile = {
                buffer,
                size: buffer.length,
                mimetype: 'image/jpeg',
                originalName: 'test.jpg',
            };

            const result = await service.uploadImage(file, testProductId);

            // URL should contain product ID in path
            expect(result.url).toContain(`products/${testProductId}`);

            uploadedFiles.push(result.url);
        });
    });

    describe('Image Retrieval', () => {
        it('should return public URL for uploaded image', async () => {
            const buffer = Buffer.from('fake-image-data');
            const file: StoredFile = {
                buffer,
                size: buffer.length,
                mimetype: 'image/jpeg',
                originalName: 'test.jpg',
            };

            const result = await service.uploadImage(file, testProductId);

            // URL should be publicly accessible
            expect(result.url).toMatch(/^https?:\/\//);
            expect(result.url).toContain('supabase');

            uploadedFiles.push(result.url);
        });

        it('should generate consistent URLs for same file path', async () => {
            const buffer = Buffer.from('fake-image-data');
            const file: StoredFile = {
                buffer,
                size: buffer.length,
                mimetype: 'image/jpeg',
                originalName: 'test.jpg',
            };

            const result = await service.uploadImage(file, testProductId);
            const imagePath = result.url.split('/').slice(-3).join('/'); // Extract path

            const url1 = storage.getImageUrl(imagePath);
            const url2 = storage.getImageUrl(imagePath);

            expect(url1).toBe(url2);

            uploadedFiles.push(result.url);
        });
    });

    describe('Image Deletion', () => {
        it('should delete a single image', async () => {
            // Upload image
            const buffer = Buffer.from('fake-image-data');
            const file: StoredFile = {
                buffer,
                size: buffer.length,
                mimetype: 'image/jpeg',
                originalName: 'test-delete.jpg',
            };

            const result = await service.uploadImage(file, testProductId);
            const imagePath = result.url.split('/').slice(-3).join('/');

            // Delete image
            await service.deleteImage(imagePath);

            // Verify deletion (should not throw)
            await expect(service.deleteImage(imagePath)).resolves.toBeUndefined();
        });

        it('should handle deletion of non-existent file gracefully', async () => {
            const nonExistentPath = `products/${testProductId}/non-existent.jpg`;

            // Should not throw error
            await expect(service.deleteImage(nonExistentPath)).resolves.toBeUndefined();
        });

        it('should delete multiple images', async () => {
            // Upload multiple images
            const buffer = Buffer.from('fake-image-data');
            const file: StoredFile = {
                buffer,
                size: buffer.length,
                mimetype: 'image/jpeg',
                originalName: 'test.jpg',
            };

            const result1 = await service.uploadImage(file, testProductId);
            const result2 = await service.uploadImage(file, testProductId);

            const path1 = result1.url.split('/').slice(-3).join('/');
            const path2 = result2.url.split('/').slice(-3).join('/');

            // Delete both images
            await service.deleteImages([path1, path2]);

            // Verify deletion
            await expect(service.deleteImage(path1)).resolves.toBeUndefined();
            await expect(service.deleteImage(path2)).resolves.toBeUndefined();
        });

        it('should delete all images for a product', async () => {
            // Upload multiple images
            const buffer = Buffer.from('fake-image-data');
            const file: StoredFile = {
                buffer,
                size: buffer.length,
                mimetype: 'image/jpeg',
                originalName: 'test.jpg',
            };

            await service.uploadImage(file, testProductId);
            await service.uploadImage(file, testProductId);
            await service.uploadImage(file, testProductId);

            // Delete all product images
            await storage.deleteProductImages(testProductId);

            // Verify all images deleted (list should be empty)
            const { data: files } = await supabase.storage
                .from(PRODUCT_IMAGES_BUCKET_CONFIG.name)
                .list(`products/${testProductId}`);

            expect(files).toEqual([]);
        });
    });

    describe('Error Handling', () => {
        it('should handle network errors gracefully', async () => {
            // Create a client with invalid URL
            const invalidClient = createClient('https://invalid-url.supabase.co', 'invalid-key');
            const invalidStorage = new ProductImageStorage(invalidClient);
            const invalidService = new ImageStorageServiceImpl(invalidStorage);

            const buffer = Buffer.from('fake-image-data');
            const file: StoredFile = {
                buffer,
                size: buffer.length,
                mimetype: 'image/jpeg',
                originalName: 'test.jpg',
            };

            await expect(invalidService.uploadImage(file, testProductId)).rejects.toThrow();
        });

        it('should handle invalid product ID gracefully', async () => {
            const buffer = Buffer.from('fake-image-data');
            const file: StoredFile = {
                buffer,
                size: buffer.length,
                mimetype: 'image/jpeg',
                originalName: 'test.jpg',
            };

            // Should still upload (product ID is just a path component)
            const result = await service.uploadImage(file, 'invalid-product-id');

            expect(result).toBeDefined();
            expect(result.url).toContain('invalid-product-id');

            // Cleanup
            const path = result.url.split('/').slice(-3).join('/');
            await service.deleteImage(path);
        });
    });

    describe('Bucket Configuration', () => {
        it('should have product-images bucket configured', async () => {
            const { data: buckets } = await supabase.storage.listBuckets();

            const productImagesBucket = buckets?.find(
                (b) => b.name === PRODUCT_IMAGES_BUCKET_CONFIG.name
            );

            expect(productImagesBucket).toBeDefined();
            expect(productImagesBucket?.public).toBe(true);
        });

        it('should enforce file size limits at bucket level', async () => {
            // This test verifies bucket configuration
            // Actual enforcement is tested in upload tests
            expect(PRODUCT_IMAGES_BUCKET_CONFIG.maxFileSizeBytes).toBe(5 * 1024 * 1024);
        });

        it('should allow configured MIME types', async () => {
            expect(PRODUCT_IMAGES_BUCKET_CONFIG.allowedMimeTypes).toContain('image/jpeg');
            expect(PRODUCT_IMAGES_BUCKET_CONFIG.allowedMimeTypes).toContain('image/png');
            expect(PRODUCT_IMAGES_BUCKET_CONFIG.allowedMimeTypes).toContain('image/webp');
        });
    });

    describe('Performance', () => {
        it('should upload multiple images in reasonable time', async () => {
            const startTime = Date.now();

            const buffer = Buffer.from('fake-image-data');
            const file: StoredFile = {
                buffer,
                size: buffer.length,
                mimetype: 'image/jpeg',
                originalName: 'test.jpg',
            };

            // Upload 5 images
            const uploads = Array.from({ length: 5 }, () =>
                service.uploadImage(file, testProductId)
            );

            const results = await Promise.all(uploads);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(results).toHaveLength(5);
            expect(duration).toBeLessThan(10000); // Should complete within 10 seconds

            // Cleanup
            const paths = results.map((r) => r.url.split('/').slice(-3).join('/'));
            await service.deleteImages(paths);
        }, 15000); // 15 second timeout
    });
});
