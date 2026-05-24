-- =====================================================
-- Cart & Cart Items — Row Level Security
-- =====================================================
-- Adds RLS policies so each user can only read/write
-- their own cart and cart items.
-- =====================================================

-- Enable RLS on carts
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on cart_items
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Carts Policies
-- =====================================================

-- Authenticated users can only see/manage their own cart
CREATE POLICY "Users manage own cart"
  ON public.carts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role bypass for admin/server operations
CREATE POLICY "Service role full access carts"
  ON public.carts
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- Cart Items Policies
-- =====================================================

-- Users can manage items only in their own cart
CREATE POLICY "Users manage own cart items"
  ON public.cart_items
  FOR ALL
  USING (
    cart_id IN (
      SELECT id FROM public.carts WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    cart_id IN (
      SELECT id FROM public.carts WHERE user_id = auth.uid()
    )
  );

-- Service role bypass for admin/server operations
CREATE POLICY "Service role full access cart_items"
  ON public.cart_items
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
