-- =====================================================
-- Carts Table Migration
-- =====================================================
-- Creates shopping carts table for authenticated and guest users
-- Supports both user_id (authenticated) and session_id (guest)
-- Implements automatic updated_at trigger
-- =====================================================
-- Requirements: BR-6, BR-8, BR-13, NFR-12

-- Create carts table
CREATE TABLE IF NOT EXISTS public.carts (
  -- Primary key with UUID type
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification (one of these must be set, not both)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT carts_user_or_session CHECK (
    (user_id IS NOT NULL AND session_id IS NULL) OR
    (user_id IS NULL AND session_id IS NOT NULL)
  )
);

-- Add comment to table
COMMENT ON TABLE public.carts IS 'Shopping carts for authenticated users (user_id) and guest users (session_id)';

-- Add comments to columns
COMMENT ON COLUMN public.carts.id IS 'Unique cart identifier (UUID)';
COMMENT ON COLUMN public.carts.user_id IS 'Reference to authenticated user (NULL for guest carts)';
COMMENT ON COLUMN public.carts.session_id IS 'Session identifier for guest users (NULL for authenticated carts)';
COMMENT ON COLUMN public.carts.created_at IS 'Timestamp when cart was created';
COMMENT ON COLUMN public.carts.updated_at IS 'Timestamp when cart was last updated';

-- =====================================================
-- Indexes for Performance
-- =====================================================
-- Requirements: NFR-1, NFR-4, NFR-13

-- Partial unique index for one cart per authenticated user and fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_carts_user_id 
  ON public.carts(user_id) 
  WHERE user_id IS NOT NULL;

-- Partial unique index for one cart per guest session and fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_carts_session_id 
  ON public.carts(session_id) 
  WHERE session_id IS NOT NULL;

-- Add comments to indexes
COMMENT ON INDEX idx_carts_user_id IS 'Partial unique index enforcing one cart per authenticated user';
COMMENT ON INDEX idx_carts_session_id IS 'Partial unique index enforcing one cart per guest session';

-- =====================================================
-- Automatic Updated At Trigger
-- =====================================================
-- Requirements: NFR-12

-- Note: update_updated_at_column() function already exists from products migration

-- Create trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_carts_updated_at ON public.carts;
CREATE TRIGGER update_carts_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Verification Queries (for testing)
-- =====================================================

-- Check if table exists
-- SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'carts');

-- Check constraints
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'public.carts'::regclass;

-- Check indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'carts';
