-- =====================================================
-- HisabKitab Phase 1: settings and user preferences
-- =====================================================
-- Local migration only. Do not apply to remote until migration
-- history and profiles.staff_permissions schema are reconciled.

DO $$
BEGIN
  IF to_regclass('public.business_settings') IS NOT NULL THEN
    RAISE EXCEPTION 'public.business_settings already exists; inspect schema before applying HisabKitab Phase 1 migration';
  END IF;

  IF to_regclass('public.user_preferences') IS NOT NULL THEN
    RAISE EXCEPTION 'public.user_preferences already exists; inspect schema before applying HisabKitab Phase 1 migration';
  END IF;
END $$;

CREATE TABLE public.business_settings (
  id text PRIMARY KEY,
  business_name text,
  address text,
  logo_url text,
  pan_vat_no text,
  registration_no text,
  calendar_pref text NOT NULL DEFAULT 'BS' CHECK (calendar_pref IN ('BS', 'AD')),
  number_format text NOT NULL DEFAULT 'indian' CHECK (number_format IN ('indian', 'international')),
  currency text NOT NULL DEFAULT 'Rs.',
  currency_position text NOT NULL DEFAULT 'prefix' CHECK (currency_position IN ('prefix', 'suffix')),
  default_privacy_mode boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_settings_singleton_id CHECK (id = 'singleton')
);

CREATE TABLE public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  privacy_mode boolean NULL,
  calendar_pref text NULL CHECK (calendar_pref IN ('BS', 'AD')),
  number_format text NULL CHECK (number_format IN ('indian', 'international')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.business_settings (id, business_name)
VALUES ('singleton', 'Dakshinkali Electronics');

DROP TRIGGER IF EXISTS update_business_settings_updated_at ON public.business_settings;
CREATE TRIGGER update_business_settings_updated_at
  BEFORE UPDATE ON public.business_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny browser access to business_settings"
  ON public.business_settings
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny browser access to user_preferences"
  ON public.user_preferences
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
