-- Admin order management: admin_notes, indexes, RLS, order-proofs storage

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS admin_notes text NULL;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- idx_orders_status and idx_orders_created_at may already exist from initial migration

-- ── Admin RLS on orders (authenticated admin users) ─────────────────────────
DROP POLICY IF EXISTS "Admins manage orders" ON public.orders;
CREATE POLICY "Admins manage orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins read order items" ON public.order_items;
CREATE POLICY "Admins read order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage order items" ON public.order_items;
CREATE POLICY "Admins manage order items"
  ON public.order_items FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage order status history" ON public.order_status_history;
CREATE POLICY "Admins manage order status history"
  ON public.order_status_history FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── Storage: order-proofs bucket policies ───────────────────────────────────
DROP POLICY IF EXISTS "Admins upload order proofs" ON storage.objects;
CREATE POLICY "Admins upload order proofs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'order-proofs'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins read order proofs" ON storage.objects;
CREATE POLICY "Admins read order proofs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'order-proofs' AND public.is_admin());

DROP POLICY IF EXISTS "Public read order proofs" ON storage.objects;
CREATE POLICY "Public read order proofs"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'order-proofs');
