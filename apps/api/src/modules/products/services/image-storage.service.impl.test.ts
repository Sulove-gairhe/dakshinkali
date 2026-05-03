/**
 * Image Storage Service Implementation Tests
 * 
 * Unit tests for ImageStorageServiceImpl
 * Tests validation, filename generation, upload, and deletion
 * 
 * Requirements: 11.1, 11.2, 11.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageStorageServiceImpl } from './image-storage.service.impl';
import { ImageValidationError, ImageStorageError } from './image-storage.service';
import { ProductImageStorage } from '@packages/database/storage.config';

describe('ImageStorageServiceImpl', () => {
    let service: ImageStorageServiceImpl;
    let mockStorage: jest.Mocked<ProductImageStorage>;

    beforeEach(() => {
        // Create mock storage with all required methods
        mockStorage = {
            uploadImage: vi.fn(),
            deleteImage: vi.fn(),
            deleteImages: vi.fn(),
            deleteProductImages: vi.fn(),
            getImageUrl: vi.fn(),
        } as any;

        service = new ImageStorageServiceImpl(mockStorage);
    });

    describe('validateImageFile', () => {
        describe('valid files', () => {
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

            it('should accept file exactly at 5MB limit', () => {
                expect(() => {
                    service.validateImageFile({
                        mimetype: 'image/jpeg',
                        size: 5 * 1024 * 1024, // Exactly 5MB
                    });
                }).not.toThrow();
            });

            it('should accept very small files (1KB)', () => {
                expect(() => {
                    service.validateImageFile({
                        mimetype: 'image/jpeg',
                        size: 1024, // 1KB
                    });
                }).not.toThrow();
            });

            it('should accept file with type property instead of mimetype', () => {
                expect(() => {
                    service.validateImageFile({
                        type: 'image/jpeg',
                        size: 1024 * 1024,
                    });
                }).not.toThrow();
            });
        });

        describe('invalid files', () => {
            it('should reject file without mimetype or type', () => {
                expect(() => {
                    service.validateImageFile({
                        size: 1024 * 1024,
                    });
                }).toThrow(ImageValidationError);

                expect(() => {
                    service.validateImageFile({
                        size: 1024 * 1024,
                    });
                }).toThrow('File type is required');
            });

            it('should reject GIF files', () => {
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

            it('should reject SVG files', () => {
                expect(() => {
                    service.validateImageFile({
                        mimetype: 'image/svg+xml',
                        size: 1024 * 1024,
                    });
                }).toThrow(ImageValidationError);
            });

            it('should reject non-image files', () => {
                expect(() => {
                    service.validateImageFile({
                        mimetype: 'application/pdf',
                        size: 1024 * 1024,
                    });
                }).toThrow(ImageValidationError);

                expect(() => {
                    service.validateImageFile({
                        mimetype: 'text/plain',
                        size: 1024 * 1024,
                    });
                }).toThrow(ImageValidationError);
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

            it('should reject file just over 5MB limit', () => {
                expect(() => {
                    service.validateImageFile({
                        mimetype: 'image/jpeg',
                        size: 5 * 1024 * 1024 + 1, // 5MB + 1 byte
                    });
                }).toThrow(ImageValidationError);
            });

            it('should include file size in error message', () => {
                try {
                    service.validateImageFile({
                        mimetype: 'image/jpeg',
                        size: 10 * 1024 * 1024, // 10MB
                    });
                    expect.fail('Should have thrown');
                } catch (error) {
                    expect(error).toBeInstanceOf(ImageValidationError);
                    expect((error as Error).message).toContain('10.00MB');
                }
            });

            it('should include allowed types in error message', () => {
                try {
                    service.validateImageFile({
                        mimetype: 'image/gif',
                        size: 1024 * 1024,
                    });
                    expect.fail('Should have thrown');
                } catch (error) {
                    expect(error).toBeInstanceOf(ImageValidationError);
                    expect((error as Error).message).toContain('JPEG');
                    expect((error as Error).message).toContain('PNG');
                    expect((error as Error).message).toContain('WebP');
                }
            });
        });
    });

    describe('generateUniqueFilename', () => {
        it('should generate unique filenames for same original name', () => {
            const filename1 = service.generateUniqueFilename('test.jpg');
            const filename2 = service.generateUniqueFilename('test.jpg');

            expect(filename1).not.toBe(filename2);
        });

        it('should generate unique filenames across multiple calls', () => {
            const filenames = new Set<string>();

            for (let i = 0; i < 100; i++) {
                filenames.add(service.generateUniqueFilename('test.jpg'));
            }

            // All 100 filenames should be unique
            expect(filenames.size).toBe(100);
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

        it('should handle uppercase extensions', () => {
            const filename = service.generateUniqueFilename('test.JPG');
            expect(filename).toMatch(/\.JPG$/);
        });

        it('should handle filenames with multiple dots', () => {
            const filename = service.generateUniqueFilename('my.test.image.jpg');
            expect(filename).toMatch(/\.jpg$/);
        });

        it('should handle filenames without extension', () => {
            const filename = service.generateUniqueFilename('test');
            // Should still generate a valid filename
            expect(filename).toBeTruthy();
            expect(filename.length).toBeGreaterThan(0);
        });

        it('should include timestamp and random component in filename', () => {
            const filename = service.generateUniqueFilename('test.jpg');

            // Format: {timestamp}-{randomString}.{extension}
            // Timestamp is numeric, randomString is alphanumeric
            expect(filename).toMatch(/^\d+-[a-z0-9]+\.jpg$/);
        });

        it('should generate different filenames when called in quick succession', () => {
            const filename1 = service.generateUniqueFilename('test.jpg');
            const filename2 = service.generateUniqueFilename('test.jpg');
            const filename3 = service.generateUniqueFilename('test.jpg');

            expect(filename1).not.toBe(filename2);
            expect(filename2).not.toBe(filename3);
            expect(filename1).not.toBe(filename3);
        });
    });

    describe('uploadImage', () => {
        describe('successful uploads', () => {
            it('should upload valid image and return URL with filename', async () => {
                const mockUrl = 'https://storage.supabase.co/product-images/test.jpg';
                const mockPath = 'products/product-123/12345-abc.jpg';
                vi.mocked(mockStorage.uploadImage).mockResolvedValue({
                    url: mockUrl,
                    path: mockPath,
                });

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

            it('should handle Buffer input', async () => {
                const mockUrl = 'https://storage.supabase.co/product-images/test.jpg';
                vi.mocked(mockStorage.uploadImage).mockResolvedValue({
                    url: mockUrl,
                    path: 'products/product-123/test.jpg',
                });

                const buffer = Buffer.from('fake-image-data');
                const result = await service.uploadImage(buffer, 'product-123', 'test.jpg');

                expect(result.url).toBe(mockUrl);
                expect(mockStorage.uploadImage).toHaveBeenCalledWith(
                    'product-123',
                    buffer,
                    'test.jpg'
                );
            });

            it('should handle Blob input', async () => {
                const mockUrl = 'https://storage.supabase.co/product-images/test.jpg';
                vi.mocked(mockStorage.uploadImage).mockResolvedValue({
                    url: mockUrl,
                    path: 'products/product-123/test.jpg',
                });

                const blob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
                const result = await service.uploadImage(blob, 'product-123', 'test.jpg');

                expect(result.url).toBe(mockUrl);
                expect(mockStorage.uploadImage).toHaveBeenCalledWith(
                    'product-123',
                    blob,
                    'test.jpg'
                );
            });

            it('should upload PNG files', async () => {
                const mockUrl = 'https://storage.supabase.co/product-images/test.png';
                vi.mocked(mockStorage.uploadImage).mockResolvedValue({
                    url: mockUrl,
                    path: 'products/product-123/test.png',
                });

                const buffer = Buffer.from('fake-png-data');
                const result = await service.uploadImage(buffer, 'product-123', 'test.png');

                expect(result.url).toBe(mockUrl);
                expect(result.filename).toMatch(/\.png$/);
            });

            it('should upload WebP files', async () => {
                const mockUrl = 'https://storage.supabase.co/product-images/test.webp';
                vi.mocked(mockStorage.uploadImage).mockResolvedValue({
                    url: mockUrl,
                    path: 'products/product-123/test.webp',
                });

                const buffer = Buffer.from('fake-webp-data');
                const result = await service.uploadImage(buffer, 'product-123', 'test.webp');

                expect(result.url).toBe(mockUrl);
                expect(result.filename).toMatch(/\.webp$/);
            });

            it('should generate unique filename for each upload', async () => {
                const mockUrl = 'https://storage.supabase.co/product-images/test.jpg';
                vi.mocked(mockStorage.uploadImage).mockResolvedValue({
                    url: mockUrl,
                    path: 'products/product-123/test.jpg',
                });

                const buffer = Buffer.from('fake-image-data');
                const result1 = await service.uploadImage(buffer, 'product-123', 'test.jpg');
                const result2 = await service.uploadImage(buffer, 'product-123', 'test.jpg');

                expect(result1.filename).not.toBe(result2.filename);
            });
        });

        describe('validation before upload', () => {
            it('should validate file before upload', async () => {
                const buffer = Buffer.alloc(6 * 1024 * 1024); // 6MB - too large

                await expect(
                    service.uploadImage(buffer, 'product-123', 'test.jpg')
                ).rejects.toThrow(ImageValidationError);

                expect(mockStorage.uploadImage).not.toHaveBeenCalled();
            });

            it('should reject invalid file type before upload', async () => {
                const buffer = Buffer.from('fake-gif-data');

                await expect(
                    service.uploadImage(buffer, 'product-123', 'test.gif')
                ).rejects.toThrow(ImageValidationError);

                expect(mockStorage.uploadImage).not.toHaveBeenCalled();
            });

            it('should validate Blob size', async () => {
                const largeBlob = new Blob([new ArrayBuffer(6 * 1024 * 1024)], {
                    type: 'image/jpeg',
                });

                await expect(
                    service.uploadImage(largeBlob, 'product-123', 'test.jpg')
                ).rejects.toThrow(ImageValidationError);

                expect(mockStorage.uploadImage).not.toHaveBeenCalled();
            });
        });

        describe('error handling', () => {
            it('should throw ImageStorageError on upload failure', async () => {
                vi.mocked(mockStorage.uploadImage).mockRejectedValue(
                    new Error('Storage service unavailable')
                );

                const buffer = Buffer.from('fake-image-data');

                await expect(
                    service.uploadImage(buffer, 'product-123', 'test.jpg')
                ).rejects.toThrow(ImageStorageError);

                await expect(
                    service.uploadImage(buffer, 'product-123', 'test.jpg')
                ).rejects.toThrow('Failed to upload image');
            });

            it('should include original error message in ImageStorageError', async () => {
                vi.mocked(mockStorage.uploadImage).mockRejectedValue(
                    new Error('Network timeout')
                );

                const buffer = Buffer.from('fake-image-data');

                try {
                    await service.uploadImage(buffer, 'product-123', 'test.jpg');
                    expect.fail('Should have thrown');
                } catch (error) {
                    expect(error).toBeInstanceOf(ImageStorageError);
                    expect((error as Error).message).toContain('Network timeout');
                }
            });

            it('should handle non-Error exceptions', async () => {
                vi.mocked(mockStorage.uploadImage).mockRejectedValue('String error');

                const buffer = Buffer.from('fake-image-data');

                await expect(
                    service.uploadImage(buffer, 'product-123', 'test.jpg')
                ).rejects.toThrow(ImageStorageError);
            });

            it('should wrap storage errors in ImageStorageError', async () => {
                vi.mocked(mockStorage.uploadImage).mockRejectedValue(
                    new Error('Bucket not found')
                );

                const buffer = Buffer.from('fake-image-data');

                try {
                    await service.uploadImage(buffer, 'product-123', 'test.jpg');
                    expect.fail('Should have thrown');
                } catch (error) {
                    expect(error).toBeInstanceOf(ImageStorageError);
                    expect((error as ImageStorageError).cause).toBeDefined();
                }
            });
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

        it('should handle deletion errors gracefully without throwing', async () => {
            vi.mocked(mockStorage.deleteImage).mockRejectedValue(
                new Error('File not found')
            );

            // Should not throw - graceful error handling
            await expect(
                service.deleteImage('https://storage.supabase.co/test.jpg')
            ).resolves.toBeUndefined();
        });

        it('should handle network errors gracefully', async () => {
            vi.mocked(mockStorage.deleteImage).mockRejectedValue(
                new Error('Network timeout')
            );

            await expect(
                service.deleteImage('https://storage.supabase.co/test.jpg')
            ).resolves.toBeUndefined();
        });

        it('should handle non-existent file gracefully', async () => {
            vi.mocked(mockStorage.deleteImage).mockRejectedValue(
                new Error('Object not found')
            );

            await expect(
                service.deleteImage('https://storage.supabase.co/nonexistent.jpg')
            ).resolves.toBeUndefined();
        });

        it('should handle permission errors gracefully', async () => {
            vi.mocked(mockStorage.deleteImage).mockRejectedValue(
                new Error('Permission denied')
            );

            await expect(
                service.deleteImage('https://storage.supabase.co/test.jpg')
            ).resolves.toBeUndefined();
        });

        it('should call storage deleteImage with correct URL', async () => {
            vi.mocked(mockStorage.deleteImage).mockResolvedValue();

            const imageUrl = 'https://storage.supabase.co/products/123/image.jpg';
            await service.deleteImage(imageUrl);

            expect(mockStorage.deleteImage).toHaveBeenCalledTimes(1);
            expect(mockStorage.deleteImage).toHaveBeenCalledWith(imageUrl);
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
            await expect(service.deleteImages(urls)).resolves.toBeUndefined();
        });

        it('should handle empty array', async () => {
            vi.mocked(mockStorage.deleteImages).mockResolvedValue();

            await service.deleteImages([]);

            expect(mockStorage.deleteImages).toHaveBeenCalledWith([]);
        });

        it('should handle large batch of images', async () => {
            vi.mocked(mockStorage.deleteImages).mockResolvedValue();

            const urls = Array.from({ length: 50 }, (_, i) =>
                `https://storage.supabase.co/test${i}.jpg`
            );

            await service.deleteImages(urls);

            expect(mockStorage.deleteImages).toHaveBeenCalledWith(urls);
        });

        it('should handle partial deletion failures gracefully', async () => {
            vi.mocked(mockStorage.deleteImages).mockRejectedValue(
                new Error('Some files could not be deleted')
            );

            const urls = [
                'https://storage.supabase.co/test1.jpg',
                'https://storage.supabase.co/test2.jpg',
                'https://storage.supabase.co/test3.jpg',
            ];

            await expect(service.deleteImages(urls)).resolves.toBeUndefined();
        });

        it('should call storage deleteImages once with all URLs', async () => {
            vi.mocked(mockStorage.deleteImages).mockResolvedValue();

            const urls = [
                'https://storage.supabase.co/test1.jpg',
                'https://storage.supabase.co/test2.jpg',
            ];

            await service.deleteImages(urls);

            expect(mockStorage.deleteImages).toHaveBeenCalledTimes(1);
            expect(mockStorage.deleteImages).toHaveBeenCalledWith(urls);
        });
    });
});
