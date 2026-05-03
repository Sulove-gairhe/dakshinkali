-- =====================================================
-- Cart Items Table Migration
-- =====================================================
-- Creates cart items table for storing products in shopping carts
-- Implements price snapshot strategy (price_at_addition)
-- Enforces quantity constraints and uniqueness per cart
-- =====================================================
-- Requirements: BR-1, BR-10, NFR-8, NFR-9, NFR-10

-- Create cart_items table
CREATE TABLE IF NOT EXISTS public.cart_items (
  -- Primary key with UUID type
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Item details
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_addition NUMERIC(10, 2) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT cart_items_quantity_range CHECK (quantity > 0 AND quantity <= 99),
  CONSTRAINT cart_items_price_positive CHECK (price_at_addition > 0),
  CONSTRAINT cart_items_unique_product UNIQUE (cart_id, product_id)
);

-- Add comment to table
COMMENT ON TABLE public.cart_items IS 'Items within shopping carts with price snapshots at time of addition';

-- Add comments to columns
COMMENT ON COLUMN public.cart_items.id IS 'Unique cart item identifier (UUID)';
COMMENT ON COLUMN public.cart_items.cart_id IS 'Reference to parent cart (CASCADE delete when cart deleted)';
COMMENT ON COLUMN public.cart_items.product_id IS 'Reference to product (CASCADE delete when product deleted)';
COMMENT ON COLUMN public.cart_items.quantity IS 'Item quantity (1-99)';
COMMENT ON COLUMN public.cart_items.price_at_addition IS 'Product price snapshot at time of adding to cart (NUMERIC for precision)';
COMMENT ON COLUMN public.cart_items.created_at IS 'Timestamp when item was added to cart';
COMMENT ON COLUMN public.cart_items.updated_at IS 'Timestamp when item was last updated';

-- =====================================================
-- Indexes for Performance
-- =====================================================
-- Requirements: NFR-1, NFR-4

-- Index for fast cart items lookup by cart
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id 
  ON public.cart_items(cart_id);

-- Index for fast product reference checks
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id 
  ON public.cart_items(product_id);

-- Add comments to indexes
COMMENT ON INDEX idx_cart_items_cart_id IS 'Index for fast retrieval of all items in a cart';
COMMENT ON INDEX idx_cart_items_product_id IS 'Index for fast product reference checks and cascade operations';

-- =====================================================
-- Automatic Updated At Trigger
-- =====================================================
-- Requirements: NFR-12

-- Note: update_updated_at_column() function already exists from products migration

-- Create trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Verification Queries (for testing)
-- =====================================================

-- Check if table exists
-- SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cart_items');

-- Check constraints
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'public.cart_items'::regclass;

-- Check indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'cart_items';

-- Check foreign keys
-- SELECT conname, confrelid::regclass AS referenced_table FROM pg_constraint WHERE conrelid = 'public.cart_items'::regclass AND contype = 'f';
