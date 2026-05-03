-- Create cart_items table
-- Requirements: BR-1, BR-10, NFR-8, NFR-9, NFR-10, NFR-11

CREATE TABLE IF NOT EXISTS cart_items (
  -- Primary key with UUID type
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Cart item details
  quantity INTEGER NOT NULL DEFAULT 1,
  price_snapshot NUMERIC(10, 2) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT cart_items_quantity_range CHECK (quantity >= 1 AND quantity <= 99),
  CONSTRAINT cart_items_price_positive CHECK (price_snapshot > 0),
  
  -- Unique constraint: one product per cart
  CONSTRAINT cart_items_unique_cart_product UNIQUE(cart_id, product_id)
);

-- Add comment to table
COMMENT ON TABLE cart_items IS 'Items in shopping carts with price snapshots';

-- Add comments to columns
COMMENT ON COLUMN cart_items.id IS 'Unique cart item identifier (UUID)';
COMMENT ON COLUMN cart_items.cart_id IS 'Reference to parent cart (CASCADE DELETE)';
COMMENT ON COLUMN cart_items.product_id IS 'Reference to product (CASCADE DELETE)';
COMMENT ON COLUMN cart_items.quantity IS 'Quantity of product (1-99)';
COMMENT ON COLUMN cart_items.price_snapshot IS 'Product price at time of adding to cart';
COMMENT ON COLUMN cart_items.created_at IS 'Timestamp when item was added to cart';
COMMENT ON COLUMN cart_items.updated_at IS 'Timestamp when item was last updated';

-- Create index on cart_id for fast cart items retrieval
CREATE INDEX idx_cart_items_cart_id 
ON cart_items(cart_id);

-- Create index on product_id for fast product reference checks
CREATE INDEX idx_cart_items_product_id 
ON cart_items(product_id);

-- Create trigger to call the function before updates
-- Reuses the update_updated_at_column() function from products migration
CREATE TRIGGER update_cart_items_updated_at
BEFORE UPDATE ON cart_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments to indexes
COMMENT ON INDEX idx_cart_items_cart_id IS 'Index for fast cart items retrieval by cart';
COMMENT ON INDEX idx_cart_items_product_id IS 'Index for fast product reference checks';
