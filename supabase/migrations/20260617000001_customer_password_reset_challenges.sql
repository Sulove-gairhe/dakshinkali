-- =====================================================
-- Storefront customer password reset challenge purpose
-- =====================================================

ALTER TABLE public.admin_email_otp_challenges
  DROP CONSTRAINT IF EXISTS admin_email_otp_challenges_purpose_check;

ALTER TABLE public.admin_email_otp_challenges
  ADD CONSTRAINT admin_email_otp_challenges_purpose_check
  CHECK (purpose IN ('new_user_setup', 'password_reset', 'customer_password_reset'))
  NOT VALID;

NOTIFY pgrst, 'reload schema';
