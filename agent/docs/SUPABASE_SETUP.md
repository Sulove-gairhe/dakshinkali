# Supabase Integration Setup

✅ **Setup Complete** - Your Supabase integration is now configured and ready to use.

## What Was Configured

### 1. Packages Installed
- `@supabase/supabase-js` - Core Supabase client library
- `@supabase/ssr` - Server-side rendering support for Next.js
- `dotenv` - Environment variable management

### 2. Environment Variables
Updated `.env` and `.env.example` with your Supabase credentials:

```env
SUPABASE_URL=https://txpfjmnxifwiwqxwtxlf.supabase.co
SUPABASE_ANON_KEY=sb_publishable_0rsBxrI7_vss4cqixFeoTw_JLwtj3tM
NEXT_PUBLIC_SUPABASE_URL=https://txpfjmnxifwiwqxwtxlf.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_0rsBxrI7_vss4cqixFeoTw_JLwtj3tM
```

### 3. Database Package Configuration
The `packages/database` package is already configured with:
- ✅ Connection pooling for performance optimization
- ✅ Environment-based configuration
- ✅ Type-safe Supabase client creation
- ✅ Singleton pattern for server-side operations
- ✅ Separate public/admin client configurations

## How to Use

### Server-Side (API Layer)
```typescript
import { getSupabaseClient } from '@dakshinkali/database';

// Get singleton instance with connection pooling
const supabase = getSupabaseClient();

// Query data
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('active', true);
```

### Client-Side (Next.js)
```typescript
import { createSupabasePublicClient } from '@dakshinkali/database';

// Create public client with RLS enforcement
const supabase = createSupabasePublicClient();

// Query data (respects Row Level Security)
const { data, error } = await supabase
  .from('products')
  .select('*');
```

### Repository Layer (Recommended Pattern)
```typescript
import { getSupabaseClient } from '@dakshinkali/database';

export class ProductRepository {
  private supabase = getSupabaseClient();

  async findAll() {
    const { data, error } = await this.supabase
      .from('products')
      .select('*');
    
    if (error) throw error;
    return data;
  }
}
```

## Connection Test

Run the test script to verify your connection:
```bash
node test-supabase-connection.js
```

## Next Steps

### 1. Set Up Database Schema
Visit your Supabase dashboard to create tables:
- https://txpfjmnxifwiwqxwtxlf.supabase.co

### 2. Configure Row Level Security (RLS)
Enable RLS policies for your tables to secure data access:
```sql
-- Example: Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active products
CREATE POLICY "Public products are viewable by everyone"
  ON products FOR SELECT
  USING (active = true);

-- Allow authenticated users to manage their products
CREATE POLICY "Users can manage their own products"
  ON products FOR ALL
  USING (auth.uid() = user_id);
```

### 3. Set Up Storage Buckets
The storage configuration is already available in `packages/database/storage.config.ts`:
```typescript
import { ProductImageStorage } from '@dakshinkali/database';

// Upload product image
const storage = new ProductImageStorage();
await storage.uploadImage(productId, file);
```

### 4. Add Supabase UI Components (Optional)
For Next.js apps with authentication:
```bash
npx shadcn@latest add @supabase/supabase-client-nextjs
```

### 5. Install Agent Skills (Optional)
Get AI-powered assistance for Supabase development:
```bash
npx skills add supabase/agent-skills
```

## Architecture Notes

Following your steering rules, the integration maintains:
- ✅ **Layered Architecture**: Repository → Service → API
- ✅ **No Direct DB Access**: Frontend uses API layer only
- ✅ **Connection Pooling**: Optimized for production scale
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Web-Only Focus**: No mobile-specific abstractions

## Configuration Files

- `packages/database/supabase.config.ts` - Client configuration
- `packages/database/storage.config.ts` - Storage bucket management
- `packages/database/index.ts` - Public exports
- `.env` - Environment variables (not committed)
- `.env.example` - Template for environment variables

## Troubleshooting

### Connection Issues
1. Verify environment variables are loaded: `node test-supabase-connection.js`
2. Check Supabase project status in dashboard
3. Ensure API keys are correct and not expired

### RLS Errors
If you get "permission denied" errors:
1. Check RLS policies in Supabase dashboard
2. Verify you're using the correct client (public vs admin)
3. Test queries in Supabase SQL editor

### Type Errors
Generate TypeScript types from your schema:
```bash
npx supabase gen types typescript --project-id txpfjmnxifwiwqxwtxlf > packages/database/types.ts
```

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
