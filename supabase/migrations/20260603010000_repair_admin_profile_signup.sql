-- =====================================================
-- Repair admin/staff signup profile trigger
-- =====================================================
-- Supabase Auth returns "Database error creating new user" when the
-- auth.users trigger raises inside public.handle_new_user().

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('customer', 'staff', 'admin'));

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username text NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role text;
BEGIN
  requested_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');

  IF requested_role NOT IN ('customer', 'staff', 'admin') THEN
    requested_role := 'customer';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    requested_role,
    NULLIF(lower(trim(NEW.raw_user_meta_data->>'username')), '')
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        username = EXCLUDED.username,
        updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

NOTIFY pgrst, 'reload schema';
