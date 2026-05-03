-- MIGRATION SCRIPT: Apply All Product Module Migrations
-- This script safely applies all migrations for the products table

-- MIGRATION 1: Create Products Table

-- Drop existing trigger if it exists (to avoid duplicate error)
DROP TRIGGER IF EXISTS update_products_updated_at ON products;

-- Create products table with all required fields
CREATE TABLE IF NOT EXISTS products (
  -- Primary key with UUID type
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product information
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  
  -- Images stored as JSONB array
  images JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT products_price_positive CHECK (price > 0),
  CONSTRAINT products_status_enum CHECK (status IN ('active', 'inactive', 'out_of_stock'))
);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before updates
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- MIGRATION 2: Create Product Indexes

-- Drop existing indexes if they exist (to make script idempotent)
DROP INDEX IF EXISTS idx_products_category;
DROP INDEX IF EXISTS idx_products_status;
DROP INDEX IF EXISTS idx_products_created_at;
DROP INDEX IF EXISTS idx_products_deleted_at;
DROP INDEX IF EXISTS idx_products_price;
DROP INDEX IF EXISTS idx_products_search;
DROP INDEX IF EXISTS idx_products_unique_name_category;

-- Partial index on category (WHERE deleted_at IS NULL)
CREATE INDEX idx_products_category 
ON products(category) 
WHERE deleted_at IS NULL;

-- Partial index on status (WHERE deleted_at IS NULL)
CREATE INDEX idx_products_status 
ON products(status) 
WHERE deleted_at IS NULL;

-- Partial index on created_at DESC (WHERE deleted_at IS NULL)
CREATE INDEX idx_products_created_at 
ON products(created_at DESC) 
WHERE deleted_at IS NULL;

-- Partial index on deleted_at (WHERE deleted_at IS NOT NULL)
CREATE INDEX idx_products_deleted_at 
ON products(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- Partial index on price (WHERE deleted_at IS NULL)
CREATE INDEX idx_products_price 
ON products(price) 
WHERE deleted_at IS NULL;

-- GIN index for full-text search on name and description
CREATE INDEX idx_products_search 
ON products 
USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Unique partial index on (name, category) WHERE deleted_at IS NULL
CREATE UNIQUE INDEX idx_products_unique_name_category 
ON products(name, category) 
WHERE deleted_at IS NULL;

-- VERIFICATION

-- Verify table exists
SELECT 'Table created successfully' AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'products';

-- Verify indexes exist
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'products'
ORDER BY indexname;

-- SUCCESS MESSAGE
SELECT 'All migrations applied successfully!' AS result;
