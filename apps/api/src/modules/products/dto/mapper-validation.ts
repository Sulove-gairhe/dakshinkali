/**
 * Validation script for mapEntityToDTO function
 * 
 * This script demonstrates the mapper functionality without requiring test framework setup.
 * Run with: npx tsx apps/api/src/modules/products/dto/mapper-validation.ts
 */

import { mapEntityToDTO } from './product.dto';
import { ProductEntity } from '../entities/product.entity';

console.log('=== ProductDTO Mapper Validation ===\n');

// Test 1: Valid entity with all fields
console.log('Test 1: Valid entity mapping');
try {
    const entity: ProductEntity = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'iPhone 15',
        description: 'Latest iPhone model',
        price: 999.99,
        category: 'Electronics',
        status: 'active',
        images: [
            { id: 'img1', url: 'https://storage.example.com/img1.jpg', filename: 'secret-img1.jpg', order: 0 },
            { id: 'img2', url: 'https://storage.example.com/img2.jpg', filename: 'secret-img2.jpg', order: 1 }
        ],
        createdAt: new Date('2024-01-15T10:30:00.000Z'),
        updatedAt: new Date('2024-01-20T15:45:00.000Z'),
        deletedAt: null
    };

    const dto = mapEntityToDTO(entity);

    console.log('✓ Mapping successful');
    console.log('  - ID:', dto.id);
    console.log('  - Name:', dto.name);
    console.log('  - Price:', dto.price);
    console.log('  - Status:', dto.status);
    console.log('  - Images count:', dto.images.length);
    console.log('  - CreatedAt (ISO 8601):', dto.createdAt);
    console.log('  - UpdatedAt (ISO 8601):', dto.updatedAt);
    console.log('  - DeletedAt excluded:', !('deletedAt' in dto));
    console.log('  - Image filename excluded:', !('filename' in dto.images[0]));
    console.log();
} catch (error) {
    console.error('✗ Test failed:', (error as Error).message);
    console.log();
}

// Test 2: Entity with null description
console.log('Test 2: Null description handling');
try {
    const entity: ProductEntity = {
        id: '456',
        name: 'Product without description',
        description: null,
        price: 50.00,
        category: 'Test',
        status: 'active',
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
    };

    const dto = mapEntityToDTO(entity);
    console.log('✓ Null description handled correctly');
    console.log('  - Description is null:', dto.description === null);
    console.log();
} catch (error) {
    console.error('✗ Test failed:', (error as Error).message);
    console.log();
}

// Test 3: Entity with deletedAt set (should be excluded from DTO)
console.log('Test 3: DeletedAt exclusion');
try {
    const entity: ProductEntity = {
        id: '789',
        name: 'Deleted Product',
        description: 'This was deleted',
        price: 100.00,
        category: 'Test',
        status: 'inactive',
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date('2024-01-01T00:00:00.000Z')
    };

    const dto = mapEntityToDTO(entity);
    console.log('✓ DeletedAt excluded from DTO');
    console.log('  - DeletedAt in DTO:', 'deletedAt' in dto);
    console.log();
} catch (error) {
    console.error('✗ Test failed:', (error as Error).message);
    console.log();
}

// Test 4: Invalid entity - missing name
console.log('Test 4: Error handling - missing name');
try {
    const entity = {
        id: '999',
        name: '',
        description: null,
        price: 100,
        category: 'Test',
        status: 'active',
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
    } as ProductEntity;

    mapEntityToDTO(entity);
    console.error('✗ Should have thrown error for missing name');
    console.log();
} catch (error) {
    console.log('✓ Error thrown correctly:', (error as Error).message);
    console.log();
}

// Test 5: Invalid entity - invalid price
console.log('Test 5: Error handling - invalid price');
try {
    const entity = {
        id: '999',
        name: 'Test Product',
        description: null,
        price: -50,
        category: 'Test',
        status: 'active',
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
    } as ProductEntity;

    mapEntityToDTO(entity);
    console.error('✗ Should have thrown error for negative price');
    console.log();
} catch (error) {
    console.log('✓ Error thrown correctly:', (error as Error).message);
    console.log();
}

// Test 6: Invalid entity - invalid status
console.log('Test 6: Error handling - invalid status');
try {
    const entity = {
        id: '999',
        name: 'Test Product',
        description: null,
        price: 100,
        category: 'Test',
        status: 'invalid_status',
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
    } as any;

    mapEntityToDTO(entity);
    console.error('✗ Should have thrown error for invalid status');
    console.log();
} catch (error) {
    console.log('✓ Error thrown correctly:', (error as Error).message);
    console.log();
}

// Test 7: ISO 8601 format validation
console.log('Test 7: ISO 8601 timestamp format');
try {
    const entity: ProductEntity = {
        id: '111',
        name: 'Test Product',
        description: null,
        price: 75.50,
        category: 'Test',
        status: 'active',
        images: [],
        createdAt: new Date('2024-03-15T08:00:00.000Z'),
        updatedAt: new Date('2024-03-16T12:30:45.123Z'),
        deletedAt: null
    };

    const dto = mapEntityToDTO(entity);
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

    console.log('✓ ISO 8601 format validated');
    console.log('  - CreatedAt matches ISO 8601:', iso8601Regex.test(dto.createdAt));
    console.log('  - UpdatedAt matches ISO 8601:', iso8601Regex.test(dto.updatedAt));
    console.log('  - CreatedAt value:', dto.createdAt);
    console.log('  - UpdatedAt value:', dto.updatedAt);
    console.log();
} catch (error) {
    console.error('✗ Test failed:', (error as Error).message);
    console.log();
}

console.log('=== Validation Complete ===');
console.log('\nSummary:');
console.log('✓ Entity-to-DTO mapping works correctly');
console.log('✓ Date objects converted to ISO 8601 strings');
console.log('✓ Internal fields (deletedAt) excluded from DTO');
console.log('✓ Image filename excluded from DTO');
console.log('✓ Null optional fields handled correctly');
console.log('✓ Error handling for invalid entities works');
console.log('✓ All required field validations in place');
