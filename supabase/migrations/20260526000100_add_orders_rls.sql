-- =====================================================
-- Orders, Order Items & Order Status History — RLS
-- =====================================================
-- Authenticated users can create and read their own
-- orders. Only service_role (admin/API) can update
-- or delete orders.
-- =====================================================

-- ── Enable RLS ──────────────────────────────────────
ALTER TABLE public.orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- orders policies
-- =====================================================

-- Authenticated users can insert their own orders
CREATE POLICY "Users can insert own orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can read their own orders
CREATE POLICY "Users can read own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role has full access (admin dashboard / API layer)
CREATE POLICY "Service role full access orders"
  ON public.orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- order_items policies
-- =====================================================

-- Users can insert items that belong to their own orders
CREATE POLICY "Users can insert own order items"
  ON public.order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Users can read items that belong to their own orders
CREATE POLICY "Users can read own order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Service role full access
CREATE POLICY "Service role full access order_items"
  ON public.order_items
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- order_status_history policies
-- =====================================================

-- Users can insert history entries for their own orders
CREATE POLICY "Users can insert own order status history"
  ON public.order_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Users can read history for their own orders
CREATE POLICY "Users can read own order status history"
  ON public.order_status_history
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Service role full access
CREATE POLICY "Service role full access order_status_history"
  ON public.order_status_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
