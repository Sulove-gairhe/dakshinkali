-- Fix RLS Policies for Profiles Table
-- This fixes the infinite recursion issue

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- Add service role policy (for API operations)
CREATE POLICY "Service role full access"
    ON public.profiles
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Verify policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
