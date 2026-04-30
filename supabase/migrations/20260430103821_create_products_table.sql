-- Create products table with all required fields
-- Requirements: 13.1, 13.5, 13.7

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

-- Add comment to table
COMMENT ON TABLE products IS 'Product inventory table with soft delete support';

-- Add comments to columns
COMMENT ON COLUMN products.id IS 'Unique product identifier (UUID)';
COMMENT ON COLUMN products.name IS 'Product name';
COMMENT ON COLUMN products.description IS 'Product description (optional)';
COMMENT ON COLUMN products.price IS 'Product price (must be greater than 0)';
COMMENT ON COLUMN products.category IS 'Product category';
COMMENT ON COLUMN products.status IS 'Product status: active, inactive, or out_of_stock';
COMMENT ON COLUMN products.images IS 'Array of product images stored as JSONB';
COMMENT ON COLUMN products.created_at IS 'Timestamp when product was created';
COMMENT ON COLUMN products.updated_at IS 'Timestamp when product was last updated';
COMMENT ON COLUMN products.deleted_at IS 'Timestamp when product was soft deleted (NULL if not deleted)';

-- Create function to auto-update updated_at timestamp
-- Requirements: 13.1
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

-- Add comment to function
COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at column to the current timestamp on row updates';
