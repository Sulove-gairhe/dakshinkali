-- =====================================================
-- Admin setup Email OTP
-- =====================================================
-- Email OTP is used only for new granted-user setup.
-- Existing admin/staff login does not require OTP.

CREATE TABLE IF NOT EXISTS public.admin_email_otp_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  purpose text NOT NULL,
  otp_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz NULL,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  ip_address text NULL,
  user_agent text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_email_otp_challenges
  DROP CONSTRAINT IF EXISTS admin_email_otp_challenges_purpose_check;

ALTER TABLE public.admin_email_otp_challenges
  ADD CONSTRAINT admin_email_otp_challenges_purpose_check
  CHECK (purpose IN ('new_user_setup'))
  NOT VALID;

CREATE INDEX IF NOT EXISTS idx_admin_email_otp_email_created
  ON public.admin_email_otp_challenges(email, created_at DESC);

ALTER TABLE public.admin_email_otp_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages admin email OTP challenges"
  ON public.admin_email_otp_challenges;
CREATE POLICY "Service role manages admin email OTP challenges"
  ON public.admin_email_otp_challenges
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
