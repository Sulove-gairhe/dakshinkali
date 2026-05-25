-- =====================================================
-- Add Complete Payment Proof Columns to Orders
-- Idempotent — safe to run even if partial columns exist
-- =====================================================

-- 1. Add all proof metadata columns (IF NOT EXISTS is safe)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS proof_file_url          TEXT,
  ADD COLUMN IF NOT EXISTS proof_file_name         TEXT,
  ADD COLUMN IF NOT EXISTS proof_file_type         TEXT,
  ADD COLUMN IF NOT EXISTS proof_file_size         BIGINT,
  ADD COLUMN IF NOT EXISTS proof_uploaded_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proof_expires_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proof_cleanup_status    TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS proof_storage_provider  TEXT,
  ADD COLUMN IF NOT EXISTS proof_storage_path      TEXT,
  ADD COLUMN IF NOT EXISTS admin_notification_status TEXT DEFAULT 'pending';

-- 2. Update status check constraint to include Fonepay-specific statuses
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'pending_admin_approval',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
  ));

-- 3. Update payment_method check constraint to include fonepay_qr
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN (
    'cash_on_delivery',
    'esewa',
    'khalti',
    'bank_transfer',
    'fonepay_qr'
  ));

-- 4. Update payment_status check constraint to include verification statuses
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN (
    'pending',
    'pending_verification',
    'paid',
    'failed',
    'refunded'
  ));

-- 5. Add check constraint for proof_cleanup_status
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_proof_cleanup_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_proof_cleanup_status_check
  CHECK (proof_cleanup_status IN ('pending', 'cleaned', 'failed', 'skipped'));

-- 6. Add check constraint for admin_notification_status
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_admin_notification_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_admin_notification_status_check
  CHECK (admin_notification_status IN ('pending', 'sent', 'failed'));
