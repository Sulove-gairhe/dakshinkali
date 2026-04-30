# Image Storage Service Usage Examples

## Overview

The `ImageStorageServiceImpl` provides a complete implementation for managing product images with Supabase Storage. It handles validation, upload, deletion, and filename generation.

## Basic Usage

### 1. Initialize the Service

```typescript
import { ImageStorageServiceImpl } from './services';

// Use default configuration (connects to Supabase automatically)
const imageService = new ImageStorageServiceImpl();

// Or provide custom storage instance
import { ProductImageStorage } from '@packages/database/storage.config';
const customStorage = new ProductImageStorage();
const imageService = new ImageStorageServiceImpl(customStorage);
```

### 2. Upload an Image

```typescript
import { ImageValidationError, ImageStorageError } from './services';

async function uploadProductImage(
    file: Buffer,
    productId: string,
    filename: string
) {
    try {
        const result = await imageService.uploadImage(file, productId, filename);
        
        console.log('Image uploaded successfully!');
        console.log('Public URL:', result.url);
        console.log('Generated filename:', result.filename);
        
        return result;
    } catch (error) {
        if (error instanceof ImageValidationError) {
            console.error('Validation failed:', error.message);
            // Handle validation error (e.g., return 400 to client)
        } else if (error instanceof ImageStorageError) {
            console.error('Upload failed:', error.message);
            // Handle storage error (e.g., return 500 to client)
        }
        throw error;
    }
}
```

### 3. Validate Image Before Upload

```typescript
function validateBeforeUpload(file: Express.Multer.File) {
    try {
        imageService.validateImageFile({
            mimetype: file.mimetype,
            size: file.size,
        });
        
        console.log('File is valid!');
        return true;
    } catch (error) {
        if (error instanceof ImageValidationError) {
            console.error('Invalid file:', error.message);
            // Possible errors:
            // - "File type is required"
            // - "Invalid file type. Allowed types: JPEG, PNG, WebP"
            // - "File size exceeds maximum limit of 5MB"
        }
        return false;
    }
}
```

### 4. Delete an Image

```typescript
async function deleteProductImage(imageUrl: string) {
    // Graceful deletion - won't throw if file doesn't exist
    await imageService.deleteImage(imageUrl);
    console.log('Image deleted (or already removed)');
}
```

### 5. Delete Multiple Images

```typescript
async function deleteProductImages(imageUrls: string[]) {
    // Batch deletion for efficiency
    await imageService.deleteImages(imageUrls);
    console.log('Images deleted');
}
```

### 6. Generate Unique Filename

```typescript
function generateFilename(originalName: string) {
    const uniqueFilename = imageService.generateUniqueFilename(originalName);
    
    // Format: {uuid}-{timestamp}.{extension}
    // Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890-1704067200000.jpg"
    
    console.log('Original:', originalName);
    console.log('Generated:', uniqueFilename);
    
    return uniqueFilename;
}
```

## Integration with Product Service

### Example: Create Product with Images

```typescript
import { ImageStorageServiceImpl } from './services';
import { ProductRepository } from '../repositories';

class ProductService {
    constructor(
        private imageService: ImageStorageServiceImpl,
        private productRepo: ProductRepository
    ) {}

    async createProduct(data: CreateProductData, imageFiles: Express.Multer.File[]) {
        // 1. Validate all images first
        for (const file of imageFiles) {
            this.imageService.validateImageFile({
                mimetype: file.mimetype,
                size: file.size,
            });
        }

        // 2. Create product entity (to get product ID)
        const product = await this.productRepo.insert({
            name: data.name,
            description: data.description,
            price: data.price,
            category: data.category,
            status: data.status || 'active',
            images: [], // Empty initially
        });

        // 3. Upload images
        const uploadedImages = [];
        for (const file of imageFiles) {
            const result = await this.imageService.uploadImage(
                file.buffer,
                product.id,
                file.originalname
            );
            
            uploadedImages.push({
                id: crypto.randomUUID(),
                url: result.url,
                filename: result.filename,
                order: uploadedImages.length,
            });
        }

        // 4. Update product with image references
        const updatedProduct = await this.productRepo.update(product.id, {
            images: uploadedImages,
        });

        return updatedProduct;
    }

    async updateProduct(
        productId: string,
        data: UpdateProductData,
        newImageFiles?: Express.Multer.File[],
        removeImageUrls?: string[]
    ) {
        // 1. Get existing product
        const product = await this.productRepo.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }

        // 2. Delete removed images
        if (removeImageUrls && removeImageUrls.length > 0) {
            await this.imageService.deleteImages(removeImageUrls);
        }

        // 3. Upload new images
        const newImages = [];
        if (newImageFiles && newImageFiles.length > 0) {
            for (const file of newImageFiles) {
                this.imageService.validateImageFile({
                    mimetype: file.mimetype,
                    size: file.size,
                });

                const result = await this.imageService.uploadImage(
                    file.buffer,
                    productId,
                    file.originalname
                );

                newImages.push({
                    id: crypto.randomUUID(),
                    url: result.url,
                    filename: result.filename,
                    order: product.images.length + newImages.length,
                });
            }
        }

        // 4. Update product
        const updatedImages = [
            ...product.images.filter(img => !removeImageUrls?.includes(img.url)),
            ...newImages,
        ];

        return await this.productRepo.update(productId, {
            ...data,
            images: updatedImages,
        });
    }

    async deleteProduct(productId: string, deleteImages: boolean = false) {
        const product = await this.productRepo.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }

        // Soft delete product
        await this.productRepo.softDelete(productId);

        // Optionally delete images
        if (deleteImages && product.images.length > 0) {
            const imageUrls = product.images.map(img => img.url);
            await this.imageService.deleteImages(imageUrls);
        }
    }
}
```

## Error Handling

### Validation Errors (400 Bad Request)

```typescript
try {
    await imageService.uploadImage(file, productId, filename);
} catch (error) {
    if (error instanceof ImageValidationError) {
        // Return 400 to client with error message
        return res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: error.message,
                fields: [{ field: 'image', message: error.message }],
            },
        });
    }
}
```

### Storage Errors (500 Internal Server Error)

```typescript
try {
    await imageService.uploadImage(file, productId, filename);
} catch (error) {
    if (error instanceof ImageStorageError) {
        // Log error and return 500 to client
        console.error('Storage error:', error.cause);
        return res.status(500).json({
            error: {
                code: 'STORAGE_ERROR',
                message: 'Failed to upload image. Please try again.',
            },
        });
    }
}
```

## Validation Rules

### Allowed File Types
- JPEG (`image/jpeg`, `image/jpg`)
- PNG (`image/png`)
- WebP (`image/webp`)

### File Size Limit
- Maximum: 5MB per image
- Validation occurs before upload to save bandwidth

### Filename Format
- Generated format: `{uuid}-{timestamp}.{extension}`
- Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890-1704067200000.jpg`
- Guarantees uniqueness across all uploads

## Requirements Mapping

- **Requirement 11.1**: Upload images to Supabase Storage ✓
- **Requirement 11.2**: Generate UUID-based unique filenames ✓
- **Requirement 11.3**: Validate JPEG/PNG/WebP, max 5MB ✓
- **Requirement 11.4**: Return full public URLs ✓
- **Requirement 11.5**: Delete images with graceful error handling ✓
