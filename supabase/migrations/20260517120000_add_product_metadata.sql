-- Add product metadata columns for frontend catalog/detail support

ALTER TABLE products
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS specs JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Backfill slug for existing rows using the product name
UPDATE products
SET slug = lower(regexp_replace(trim(category || ' ' || name), '[^a-z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Keep slug available for public URLs
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug
ON products(slug)
WHERE deleted_at IS NULL;

-- Add helpful column comments
COMMENT ON COLUMN products.slug IS 'Public URL slug generated from product name';
COMMENT ON COLUMN products.brand IS 'Product brand or manufacturer';
COMMENT ON COLUMN products.specs IS 'Flexible product specifications and metadata';
