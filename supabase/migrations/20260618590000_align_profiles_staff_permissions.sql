DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'staff_permissions'
  ) THEN
    RAISE NOTICE 'public.profiles.staff_permissions already exists; skipping';
  ELSE
    ALTER TABLE public.profiles
      ADD COLUMN staff_permissions jsonb DEFAULT '{}'::jsonb;

    COMMENT ON COLUMN public.profiles.staff_permissions
      IS 'Explicit permission strings for staff users, including HisabKitab permissions.';
  END IF;
END $$;
