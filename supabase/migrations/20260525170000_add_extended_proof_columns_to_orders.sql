-- =====================================================
-- Add Extended Payment Proof Columns
-- =====================================================

-- 1. Add all proof metadata columns that are referenced in checkout payload
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS proof_file_type TEXT,
  ADD COLUMN IF NOT EXISTS proof_file_size BIGINT,
  ADD COLUMN IF NOT EXISTS proof_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS proof_storage_provider TEXT,
  ADD COLUMN IF NOT EXISTS proof_cleanup_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS admin_notification_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS proof_expires_at TIMESTAMPTZ;

-- 2. Update proof_cleanup_status check constraint
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_proof_cleanup_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_proof_cleanup_status_check
  CHECK (proof_cleanup_status IN ('pending', 'completed', 'failed'));

-- 3. Update admin_notification_status check constraint
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_admin_notification_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_admin_notification_status_check
  CHECK (admin_notification_status IN ('pending', 'sent', 'failed'));
