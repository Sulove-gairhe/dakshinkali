-- =====================================================
-- Task 18: persistent delivered-order admin bell rows
-- =====================================================

CREATE TABLE public.admin_bell_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_bell_notifications_type_check
    CHECK (type IN ('delivered_order')),
  CONSTRAINT admin_bell_notifications_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT admin_bell_notifications_order_type_key
    UNIQUE (order_id, type)
);

CREATE INDEX idx_admin_bell_notifications_created_at
  ON public.admin_bell_notifications(created_at DESC);

ALTER TABLE public.admin_bell_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read bell notifications"
  ON public.admin_bell_notifications
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Service role manages bell notifications"
  ON public.admin_bell_notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON public.admin_bell_notifications TO authenticated;
GRANT ALL ON public.admin_bell_notifications TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'admin_bell_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE public.admin_bell_notifications;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
