# @dakshinkali/database

Centralized Supabase database and storage configuration package for Dakshinkali Electronics platform.

## Features

- **Connection Pooling**: Optimized database connections with configurable pool settings
- **Storage Management**: Product image storage with validation and bucket configuration
- **Type Safety**: Full TypeScript support with type-safe clients
- **Environment-based Configuration**: Flexible configuration via environment variables
- **Singleton Pattern**: Efficient client reuse across the application

## Installation

This is an internal package in the monorepo. Import it in your application:

```typescript
import { getSupabaseClient, ProductImageStorage } from '@dakshinkali/database';
```

## Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Alternative naming (for Next.js compatibility)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Local Development

For local development with Supabase CLI:

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key
```

Get your local keys by running:
```bash
pnpm db:start
# Keys will be displayed in the output
```

## Usage

### Database Client

#### Server-side (API Layer, Repository Layer)

Use the singleton client for optimal connection pooling:

```typescript
import { getSupabaseClient } from '@dakshinkali/database';

// Get singleton instance (recommended)
const supabase = getSupabaseClient();

// Query database
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('status', 'active');
```

#### Custom Connection Pool Configuration

```typescript
import { createSupabaseClient } from '@dakshinkali/database';

const supabase = createSupabaseClient({
  maxConnections: 50,
  minConnections: 5,
  connectionTimeoutMillis: 60000,
  idleTimeoutMillis: 20000,
});
```

#### Client-side (Next.js Frontend)

For public access with Row Level Security:

```typescript
import { createSupabasePublicClient } from '@dakshinkali/database';

const supabase = createSupabasePublicClient();
```

### Storage Client

#### Product Image Upload

```typescript
import { ProductImageStorage, validateImageFile } from '@dakshinkali/database';

const storage = new ProductImageStorage();

// Validate file before upload
const validation = validateImageFile({
  mimetype: 'image/jpeg',
  size: 2048000, // 2MB
});

if (!validation.valid) {
  throw new Error(validation.error);
}

// Upload image
const imageUrl = await storage.uploadImage(
  productId,
  fileBuffer,
  'product-photo.jpg'
);

console.log('Image uploaded:', imageUrl);
```

#### Delete Images

```typescript
// Delete single image
await storage.deleteImage(imageUrl);

// Delete multiple images
await storage.deleteImages([url1, url2, url3]);
```

#### File Validation

```typescript
import { 
  validateImageFile, 
  ALLOWED_IMAGE_TYPES, 
  MAX_IMAGE_SIZE_BYTES 
} from '@dakshinkali/database';

const result = validateImageFile({
  mimetype: 'image/png',
  size: 1024000,
});

if (!result.valid) {
  console.error(result.error);
}
```

#### Generate Unique Filenames

```typescript
import { generateUniqueFilename } from '@dakshinkali/database';

const uniqueName = generateUniqueFilename('photo.jpg');
// Output: "550e8400-e29b-41d4-a716-446655440000-1704067200000.jpg"
```

## Configuration

### Connection Pool Settings

Default configuration (aligned with `supabase/config.toml`):

```typescript
{
  maxConnections: 20,        // Maximum connections in pool
  minConnections: 2,         // Minimum idle connections
  connectionTimeoutMillis: 30000,  // 30 seconds
  idleTimeoutMillis: 10000,  // 10 seconds
}
```

### Storage Bucket Settings

Product images bucket configuration:

```typescript
{
  name: 'product-images',
  public: true,
  fileSizeLimit: 5242880,    // 5MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ],
}
```

### Image Validation Rules

- **Allowed types**: JPEG, JPG, PNG, WebP
- **Maximum size**: 5MB per image
- **Maximum images per product**: 5

## Storage Bucket Setup

### Automatic Setup (Recommended)

Run during application initialization:

```typescript
import { getSupabaseClient, ensureStorageBucket } from '@dakshinkali/database';

const client = getSupabaseClient();
await ensureStorageBucket(client);
```

### Manual Setup via Supabase Dashboard

1. Go to Storage in Supabase Dashboard
2. Create new bucket: `product-images`
3. Set as public bucket
4. Configure policies:
   - Allow public read access
   - Allow authenticated insert/update/delete

### Manual Setup via SQL

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
```

## Architecture

### Layered Design

```
┌─────────────────────────────────────┐
│     API Layer (Controllers)         │
│  - Request validation               │
│  - Authentication                   │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│     Service Layer                   │
│  - Business logic                   │
│  - Image storage operations         │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│     Repository Layer                │
│  - Database queries                 │
│  - Uses: getSupabaseClient()        │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│     @dakshinkali/database           │
│  - Connection pooling               │
│  - Storage configuration            │
└─────────────────────────────────────┘
```

### Connection Pooling

The package implements connection pooling to optimize database performance:

1. **Singleton Pattern**: Reuses the same client instance across the application
2. **Pool Configuration**: Configurable max/min connections and timeouts
3. **Supabase Pooler**: Leverages Supabase's built-in connection pooler (transaction mode)

## Testing

### Unit Tests

```typescript
import { resetSupabaseClient } from '@dakshinkali/database';

beforeEach(() => {
  resetSupabaseClient(); // Reset singleton for isolated tests
});
```

### Integration Tests

Use a test database for integration tests:

```env
# .env.test
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=test-anon-key
SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
```

## Requirements Mapping

This package implements the following requirements from the Product Module spec:

- **Requirement 15.3**: Connection pooling for database access
- **Requirement 11.1**: Image storage integration with Supabase Storage
- **Requirement 11.2**: Unique filename generation to prevent collisions
- **Requirement 11.3**: Image file type and size validation
- **Requirement 8.1**: Repository layer database access abstraction

## Related Documentation

- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

## License

Private - Dakshinkali Electronics Center
