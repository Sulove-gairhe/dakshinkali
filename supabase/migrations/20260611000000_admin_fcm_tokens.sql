  -- =====================================================
  -- Admin FCM tokens for web push notifications
  -- =====================================================

  CREATE TABLE IF NOT EXISTS public.admin_fcm_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT admin_fcm_tokens_token_key UNIQUE (token)
  );

  CREATE INDEX IF NOT EXISTS idx_admin_fcm_tokens_admin_user_id
    ON public.admin_fcm_tokens(admin_user_id);

  DROP TRIGGER IF EXISTS update_admin_fcm_tokens_updated_at ON public.admin_fcm_tokens;
  CREATE TRIGGER update_admin_fcm_tokens_updated_at
    BEFORE UPDATE ON public.admin_fcm_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  ALTER TABLE public.admin_fcm_tokens ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Admins manage own FCM tokens" ON public.admin_fcm_tokens;
  CREATE POLICY "Admins manage own FCM tokens"
    ON public.admin_fcm_tokens
    FOR ALL
    TO authenticated
    USING (admin_user_id = auth.uid() AND public.is_admin())
    WITH CHECK (admin_user_id = auth.uid() AND public.is_admin());

  DROP POLICY IF EXISTS "Service role manages admin FCM tokens" ON public.admin_fcm_tokens;
  CREATE POLICY "Service role manages admin FCM tokens"
    ON public.admin_fcm_tokens
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

  NOTIFY pgrst, 'reload schema';

  -- Enable Supabase Realtime for notification bell subscriptions
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'products'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    END IF;
  END $$;
