-- =====================================================
-- Wishlists Table Migration
-- =====================================================
-- Creates a wishlists table for authenticated users.
-- Each row represents one product saved by one user.
-- RLS ensures users can only access their own rows.
-- =====================================================

-- Create wishlists table
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Saved product
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One entry per user+product pair
  CONSTRAINT wishlists_unique_user_product UNIQUE (user_id, product_id)
);

-- Comments
COMMENT ON TABLE public.wishlists IS 'User wishlists — each row is one saved product for one user';
COMMENT ON COLUMN public.wishlists.user_id IS 'Reference to the authenticated user who saved the product';
COMMENT ON COLUMN public.wishlists.product_id IS 'Reference to the saved product';

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id
  ON public.wishlists(user_id);

CREATE INDEX IF NOT EXISTS idx_wishlists_product_id
  ON public.wishlists(product_id);

-- =====================================================
-- Row Level Security
-- =====================================================

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own wishlist rows
CREATE POLICY "Users manage own wishlist"
  ON public.wishlists
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role bypass for admin/server operations
CREATE POLICY "Service role full access wishlists"
  ON public.wishlists
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
