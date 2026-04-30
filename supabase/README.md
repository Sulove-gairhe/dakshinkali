# Database Migrations

This directory contains Supabase database migrations for the Shop Platform.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start local Supabase instance:
   ```bash
   npm run db:start
   ```

3. Apply migrations:
   ```bash
   npm run db:migrate
   ```

## Migrations

### 20260430103821_create_products_table.sql

Creates the `products` table with the following schema:

**Columns:**
- `id` (UUID) - Primary key with auto-generated UUID
- `name` (TEXT) - Product name (required)
- `description` (TEXT) - Product description (optional)
- `price` (NUMERIC) - Product price (required, must be > 0)
- `category` (TEXT) - Product category (required)
- `status` (TEXT) - Product status (required, default: 'active')
- `images` (JSONB) - Array of product images (default: empty array)
- `created_at` (TIMESTAMPTZ) - Creation timestamp (auto-generated)
- `updated_at` (TIMESTAMPTZ) - Last update timestamp (auto-generated)
- `deleted_at` (TIMESTAMPTZ) - Soft delete timestamp (nullable)

**Constraints:**
- `products_price_positive` - Ensures price > 0
- `products_status_enum` - Ensures status is one of: 'active', 'inactive', 'out_of_stock'

**Default Values:**
- `id`: `gen_random_uuid()`
- `status`: `'active'`
- `images`: `'[]'::jsonb`
- `created_at`: `NOW()`
- `updated_at`: `NOW()`

**Triggers:**
- `update_products_updated_at` - Automatically updates `updated_at` to current timestamp on any UPDATE operation
  - Uses the `update_updated_at_column()` PL/pgSQL function
  - Fires BEFORE UPDATE for each row

## Creating New Migrations

To create a new migration:

```bash
npm run db:migration:new <migration_name>
```

Example:
```bash
npm run db:migration:new add_products_indexes
```

## Managing Local Database

- **Start**: `npm run db:start`
- **Stop**: `npm run db:stop`
- **Reset**: `npm run db:reset` (drops all data and reapplies migrations)
- **Apply migrations**: `npm run db:migrate`

## Requirements Validation

This migration satisfies the following requirements from the Product Module spec:

- **Requirement 13.1**: Product entity includes all required fields with proper types
- **Requirement 13.5**: NOT NULL constraints on required fields (name, price, status)
- **Requirement 13.7**: Price stored as NUMERIC type for precision

### 20260430104000_create_product_indexes.sql

Creates database indexes for query optimization on the `products` table.

**Indexes Created:**

1. **idx_products_category** - Partial index on `category` (WHERE deleted_at IS NULL)
   - Optimizes queries filtering by category on active products

2. **idx_products_status** - Partial index on `status` (WHERE deleted_at IS NULL)
   - Optimizes queries filtering by status on active products

3. **idx_products_created_at** - Partial index on `created_at DESC` (WHERE deleted_at IS NULL)
   - Optimizes queries sorting by creation date on active products

4. **idx_products_deleted_at** - Partial index on `deleted_at` (WHERE deleted_at IS NOT NULL)
   - Optimizes queries for soft-deleted products (admin view)

5. **idx_products_price** - Partial index on `price` (WHERE deleted_at IS NULL)
   - Optimizes queries filtering by price range on active products

6. **idx_products_search** - GIN index for full-text search
   - Optimizes search queries across product name and description
   - Uses PostgreSQL's `to_tsvector` for English language text search

7. **idx_products_unique_name_category** - Unique partial index on `(name, category)` (WHERE deleted_at IS NULL)
   - Enforces uniqueness constraint: product names must be unique within a category
   - Excludes soft-deleted products from uniqueness check

**Requirements Validation:**

This migration satisfies the following requirements from the Product Module spec:

- **Requirement 13.4**: Indexes on frequently queried fields (category, status, created_at, deleted_at, price)
- **Requirement 13.6**: Unique constraint enforcement using partial index

**Performance Benefits:**

- All indexes are **partial indexes** that exclude soft-deleted products, reducing index size and improving query performance
- GIN index enables fast full-text search across product names and descriptions
- Unique partial index enforces business rule (unique name per category) at database level

## Next Steps

After these migrations, the following tasks should be completed:

1. ✅ Task 1.1: Create products table schema
2. ✅ Task 1.2: Create database indexes for query optimization
3. ✅ Task 1.3: Create database trigger for auto-updating updated_at timestamp
4. Task 1.4: Set up Supabase configuration and connection
