-- =====================================================
-- Add Staff Role Support
-- =====================================================
-- 1. Extend role CHECK constraint to allow 'staff'
-- 2. Add nullable staff_permissions JSONB column for future use
-- =====================================================

-- Drop the existing CHECK constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Re-add with 'staff' included
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('customer', 'staff', 'admin'));

-- Add future-safe staff_permissions column (nullable, not used yet)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS staff_permissions jsonb DEFAULT '{}'::jsonb;