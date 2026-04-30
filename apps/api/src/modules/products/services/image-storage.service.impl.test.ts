/**
 * Image Storage Service Implementation Tests
 * 
 * Unit tests for ImageStorageServiceImpl
 * Tests validation, filename generation, and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageStorageServiceImpl } from './image-storage.service.impl';
import { ImageValidationError, ImageStorageError } from './image-storage.service';
import { ProductImageStorage } from '@packages/database/storage.config';

describe('ImageStorageServiceImpl', () => {
    let service: ImageStorageServiceImpl;
    let mockStorage: ProductImageStorage;

    beforeEach(() => {
        // Create mock storage
        mockStorage = {
            uploadImage: vi.fn(),
            deleteImage: vi.fn(),
            deleteImages: vi.fn(),
            getPublicUrl: vi.fn(),
        } as any;

        service = new ImageStorageServiceImpl(mockStorage);
    });

    describe('validateImageFile', () => {
        it('should accept valid JPEG file under 5MB', () => {
            expect(() => {
                service.validateImageFile({
                    mimetype: 'image/jpeg',
                    size: 1024 * 1024, // 1MB
                });
            }).not.toThrow();
        });

        it('should accept valid PNG file under 5MB', () => {
            expect(() => {
                service.validateImageFile({
                    mimetype: 'image/png',
                    size: 2 * 1024 * 1024, // 2MB
                });
            }).not.toThrow();
        });

        it('should accept valid WebP file under 5MB', () => {
            expect(() => {
                service.validateImageFile({
                    mimetype: 'image/webp',
                    size: 3 * 1024 * 1024, // 3MB
                });
            }).not.toThrow();
        });

        it('should reject file without mimetype', () => {
            expect(() => {
                service.validateImageFile({
                    size: 1024 * 1024,
                });
            }).toThrow(ImageValidationError);
        });

        it('should reject invalid file type', () => {
            expect(() => {
                service.validateImageFile({
                    mimetype: 'image/gif',
                    size: 1024 * 1024,
                });
            }).toThrow(ImageValidationError);

            expect(() => {
                service.validateImageFile({
                    mimetype: 'image/gif',
                    size: 1024 * 1024,
                });
            }).toThrow('Invalid file type');
        });

        it('should reject file exceeding 5MB', () => {
            expect(() => {
                service.validateImageFile({
                    mimetype: 'image/jpeg',
                    size: 6 * 1024 * 1024, // 6MB
                });
            }).toThrow(ImageValidationError);

            expect(() => {
                service.validateImageFile({
                    mimetype: 'image/jpeg',
                    size: 6 * 1024 * 1024,
                });
            }).toThrow('File size exceeds maximum limit');
        });

        it('should accept file exactly at 5MB limit', () => {
            expect(() => {
                service.validateImageFile({
                    mimetype: 'image/jpeg',
                    size: 5 * 1024 * 1024, // Exactly 5MB
                });
            }).not.toThrow();
        });
    });

    describe('generateUniqueFilename', () => {
        it('should generate unique filenames for same original name', () => {
            const filename1 = service.generateUniqueFilename('test.jpg');
            const filename2 = service.generateUniqueFilename('test.jpg');

            expect(filename1).not.toBe(filename2);
        });

        it('should preserve file extension', () => {
            const filename = service.generateUniqueFilename('test.jpg');
            expect(filename).toMatch(/\.jpg$/);
        });

        it('should handle different extensions', () => {
            const jpegFile = service.generateUniqueFilename('image.jpeg');
            const pngFile = service.generateUniqueFilename('image.png');
            const webpFile = service.generateUniqueFilename('image.webp');

            expect(jpegFile).toMatch(/\.jpeg$/);
            expect(pngFile).toMatch(/\.png$/);
            expect(webpFile).toMatch(/\.webp$/);
        });

        it('should include UUID and timestamp in filename', () => {
            const filename = service.generateUniqueFilename('test.jpg');

            // Format: {uuid}-{timestamp}.{extension}
            // UUID is 36 chars, timestamp is variable length
            expect(filename).toMatch(/^[a-f0-9-]+-\d+\.jpg$/);
        });
    });

    describe('uploadImage', () => {
        it('should upload valid image and return URL', async () => {
            const mockUrl = 'https://storage.supabase.co/product-images/test.jpg';
            vi.mocked(mockStorage.uploadImage).mockResolvedValue(mockUrl);

            const buffer = Buffer.from('fake-image-data');
            const result = await service.uploadImage(buffer, 'product-123', 'test.jpg');

            expect(result.url).toBe(mockUrl);
            expect(result.filename).toMatch(/\.jpg$/);
            expect(mockStorage.uploadImage).toHaveBeenCalledWith(
                'product-123',
                buffer,
                'test.jpg'
            );
        });

        it('should validate file before upload', async () => {
            const buffer = Buffer.alloc(6 * 1024 * 1024); // 6MB - too large

            await expect(
                service.uploadImage(buffer, 'product-123', 'test.jpg')
            ).rejects.toThrow(ImageValidationError);

            expect(mockStorage.uploadImage).not.toHaveBeenCalled();
        });

        it('should throw ImageStorageError on upload failure', async () => {
            vi.mocked(mockStorage.uploadImage).mockRejectedValue(
                new Error('Storage service unavailable')
            );

            const buffer = Buffer.from('fake-image-data');

            await expect(
                service.uploadImage(buffer, 'product-123', 'test.jpg')
            ).rejects.toThrow(ImageStorageError);
        });

        it('should handle Blob input', async () => {
            const mockUrl = 'https://storage.supabase.co/product-images/test.jpg';
            vi.mocked(mockStorage.uploadImage).mockResolvedValue(mockUrl);

            const blob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
            const result = await service.uploadImage(blob, 'product-123', 'test.jpg');

            expect(result.url).toBe(mockUrl);
        });
    });

    describe('deleteImage', () => {
        it('should delete image successfully', async () => {
            vi.mocked(mockStorage.deleteImage).mockResolvedValue();

            await service.deleteImage('https://storage.supabase.co/test.jpg');

            expect(mockStorage.deleteImage).toHaveBeenCalledWith(
                'https://storage.supabase.co/test.jpg'
            );
        });

        it('should handle deletion errors gracefully', async () => {
            vi.mocked(mockStorage.deleteImage).mockRejectedValue(
                new Error('File not found')
            );

            // Should not throw - graceful error handling
            await expect(
                service.deleteImage('https://storage.supabase.co/test.jpg')
            ).resolves.not.toThrow();
        });
    });

    describe('deleteImages', () => {
        it('should delete multiple images successfully', async () => {
            vi.mocked(mockStorage.deleteImages).mockResolvedValue();

            const urls = [
                'https://storage.supabase.co/test1.jpg',
                'https://storage.supabase.co/test2.jpg',
            ];

            await service.deleteImages(urls);

            expect(mockStorage.deleteImages).toHaveBeenCalledWith(urls);
        });

        it('should handle batch deletion errors gracefully', async () => {
            vi.mocked(mockStorage.deleteImages).mockRejectedValue(
                new Error('Batch delete failed')
            );

            const urls = ['https://storage.supabase.co/test1.jpg'];

            // Should not throw - graceful error handling
            await expect(service.deleteImages(urls)).resolves.not.toThrow();
        });
    });
});
