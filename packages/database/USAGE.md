# Usage Guide: Supabase Configuration

## Quick Start

### 1. Set Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

For local development:
```bash
# Start Supabase locally
pnpm db:start

# Copy the displayed keys to your .env file
```

### 2. Import and Use

```typescript
import { getSupabaseClient } from '@dakshinkali/database';

const supabase = getSupabaseClient();
```

## Common Use Cases

### Repository Layer - Database Queries

```typescript
// products.repository.ts
import { getSupabaseClient } from '@dakshinkali/database';

export class ProductRepository {
  private supabase = getSupabaseClient();

  async findAll() {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .is('deleted_at', null);

    if (error) throw error;
    return data;
  }

  async insert(product: ProductEntity) {
    const { data, error } = await this.supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
```

### Service Layer - Image Upload

```typescript
// image-storage.service.ts
import { 
  ProductImageStorage, 
  validateImageFile,
  MAX_IMAGES_PER_PRODUCT 
} from '@dakshinkali/database';

export class ImageStorageService {
  private storage = new ProductImageStorage();

  async uploadProductImages(
    productId: string,
    files: Express.Multer.File[]
  ): Promise<string[]> {
    // Validate count
    if (files.length > MAX_IMAGES_PER_PRODUCT) {
      throw new Error(`Maximum ${MAX_IMAGES_PER_PRODUCT} images allowed`);
    }

    // Validate each file
    for (const file of files) {
      const validation = validateImageFile({
        mimetype: file.mimetype,
        size: file.size,
      });

      if (!validation.valid) {
        throw new Error(validation.error);
      }
    }

    // Upload all images
    const urls = await Promise.all(
      files.map(file =>
        this.storage.uploadImage(
          productId,
          file.buffer,
          file.originalname
        )
      )
    );

    return urls;
  }

  async deleteProductImages(imageUrls: string[]): Promise<void> {
    await this.storage.deleteImages(imageUrls);
  }
}
```

### API Layer - Controller

```typescript
// admin-product.controller.ts
import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';
import { ImageStorageService } from '../services/image-storage.service';

export class AdminProductController {
  constructor(
    private productService: ProductService,
    private imageService: ImageStorageService
  ) {}

  async createProduct(req: Request, res: Response) {
    try {
      const files = req.files as Express.Multer.File[];
      
      // Upload images
      const imageUrls = await this.imageService.uploadProductImages(
        req.body.productId,
        files
      );

      // Create product with image URLs
      const product = await this.productService.createProduct({
        ...req.body,
        images: imageUrls,
      });

      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

## Connection Pooling

### Default Configuration

The package uses optimized connection pooling by default:

```typescript
{
  maxConnections: 20,
  minConnections: 2,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 10000,
}
```

### Custom Pool Configuration

For high-traffic scenarios:

```typescript
import { createSupabaseClient } from '@dakshinkali/database';

const supabase = createSupabaseClient({
  maxConnections: 50,
  minConnections: 10,
  connectionTimeoutMillis: 60000,
  idleTimeoutMillis: 20000,
});
```

## Storage Bucket Setup

### Option 1: Automatic (Recommended)

Add to your application startup:

```typescript
// app.ts or main.ts
import { getSupabaseClient, ensureStorageBucket } from '@dakshinkali/database';

async function initializeApp() {
  const supabase = getSupabaseClient();
  await ensureStorageBucket(supabase);
  
  // Start server...
}

initializeApp();
```

### Option 2: Manual via Supabase Dashboard

1. Navigate to Storage in Supabase Dashboard
2. Click "New bucket"
3. Name: `product-images`
4. Public: ✓ Enabled
5. File size limit: 5MB
6. Allowed MIME types: `image/jpeg, image/png, image/webp`

### Option 3: Manual via Migration

Create a migration file:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_storage_bucket.sql

-- Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Public read policy
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Authenticated upload policy
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Authenticated delete policy
CREATE POLICY "Authenticated delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
```

## Testing

### Unit Tests with Mock Client

```typescript
import { resetSupabaseClient } from '@dakshinkali/database';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');

describe('ProductRepository', () => {
  beforeEach(() => {
    resetSupabaseClient();
    jest.clearAllMocks();
  });

  it('should fetch products', async () => {
    const mockClient = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          is: jest.fn().mockResolvedValue({
            data: [{ id: '1', name: 'Test' }],
            error: null,
          }),
        }),
      }),
    };

    (createClient as jest.Mock).mockReturnValue(mockClient);

    const repo = new ProductRepository();
    const products = await repo.findAll();

    expect(products).toHaveLength(1);
  });
});
```

### Integration Tests with Test Database

```typescript
// test/setup.ts
import { getSupabaseClient } from '@dakshinkali/database';

beforeAll(async () => {
  // Use test database
  process.env.SUPABASE_URL = 'http://127.0.0.1:54321';
  process.env.SUPABASE_ANON_KEY = 'test-key';
  
  const supabase = getSupabaseClient();
  
  // Clean up test data
  await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
});
```

## Troubleshooting

### Connection Issues

**Problem**: `Missing SUPABASE_URL environment variable`

**Solution**: Ensure `.env` file exists and contains required variables:
```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your-key-here
```

### Storage Upload Failures

**Problem**: `Failed to upload image: new row violates row-level security policy`

**Solution**: Ensure storage policies are configured correctly:
```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'objects';

-- Grant authenticated users upload access
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
```

### Type Errors

**Problem**: TypeScript errors with Supabase client types

**Solution**: Ensure you're using the correct return type:
```typescript
import { SupabaseClient } from '@supabase/supabase-js';

// Correct
const client: SupabaseClient<any, 'public', any> = getSupabaseClient();

// Or just use type inference
const client = getSupabaseClient();
```

## Performance Tips

1. **Use Singleton Client**: Always use `getSupabaseClient()` instead of creating new clients
2. **Enable Connection Pooling**: Already enabled by default
3. **Batch Operations**: Use `Promise.all()` for multiple uploads
4. **Cache Public URLs**: Store image URLs in database instead of regenerating
5. **Use Indexes**: Ensure database indexes exist for frequently queried fields

## Security Best Practices

1. **Never expose service role key** in client-side code
2. **Use Row Level Security (RLS)** policies for all tables
3. **Validate file uploads** before storage operations
4. **Sanitize user inputs** before database queries
5. **Use parameterized queries** (Supabase client handles this automatically)

## Next Steps

- Review [Product Module Design](../../.kiro/specs/product-module/design.md)
- Implement [Repository Layer](../../.kiro/specs/product-module/tasks.md#3-repository-layer-implementation)
- Set up [Storage Bucket](../../.kiro/specs/product-module/tasks.md#14-database-schema-and-infrastructure-setup)
