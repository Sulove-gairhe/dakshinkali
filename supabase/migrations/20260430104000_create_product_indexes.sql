-- Create database indexes for query optimization
-- Requirements: 13.4, 13.6
-- Task: 1.2 Create database indexes for query optimization

-- Partial index on category (WHERE deleted_at IS NULL)
-- Optimizes queries filtering by category on active products
CREATE INDEX idx_products_category 
ON products(category) 
WHERE deleted_at IS NULL;

-- Partial index on status (WHERE deleted_at IS NULL)
-- Optimizes queries filtering by status on active products
CREATE INDEX idx_products_status 
ON products(status) 
WHERE deleted_at IS NULL;

-- Partial index on created_at DESC (WHERE deleted_at IS NULL)
-- Optimizes queries sorting by creation date on active products
CREATE INDEX idx_products_created_at 
ON products(created_at DESC) 
WHERE deleted_at IS NULL;

-- Partial index on deleted_at (WHERE deleted_at IS NOT NULL)
-- Optimizes queries for soft-deleted products (admin view)
CREATE INDEX idx_products_deleted_at 
ON products(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- Partial index on price (WHERE deleted_at IS NULL)
-- Optimizes queries filtering by price range on active products
CREATE INDEX idx_products_price 
ON products(price) 
WHERE deleted_at IS NULL;

-- GIN index for full-text search on name and description
-- Optimizes search queries across product name and description
CREATE INDEX idx_products_search 
ON products 
USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Unique partial index on (name, category) WHERE deleted_at IS NULL
-- Enforces uniqueness constraint: product names must be unique within a category (excluding soft-deleted)
CREATE UNIQUE INDEX idx_products_unique_name_category 
ON products(name, category) 
WHERE deleted_at IS NULL;

-- Add comments to indexes
COMMENT ON INDEX idx_products_category IS 'Partial index for category filtering on non-deleted products';
COMMENT ON INDEX idx_products_status IS 'Partial index for status filtering on non-deleted products';
COMMENT ON INDEX idx_products_created_at IS 'Partial index for sorting by creation date on non-deleted products';
COMMENT ON INDEX idx_products_deleted_at IS 'Partial index for querying soft-deleted products';
COMMENT ON INDEX idx_products_price IS 'Partial index for price range filtering on non-deleted products';
COMMENT ON INDEX idx_products_search IS 'GIN index for full-text search on name and description';
COMMENT ON INDEX idx_products_unique_name_category IS 'Unique constraint for product name within category (excluding soft-deleted)';
