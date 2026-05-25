-- =====================================================
-- Add Payment Proof Columns & Update Check Constraints
-- =====================================================

-- 1. Add proof metadata columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS proof_file_url TEXT,
  ADD COLUMN IF NOT EXISTS proof_file_name TEXT,
  ADD COLUMN IF NOT EXISTS proof_uploaded_at TIMESTAMPTZ;

-- 2. Update status check constraint to include Fonepay-specific statuses
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending', 'pending_admin_approval', 'confirmed',
    'processing', 'shipped', 'delivered', 'cancelled'
  ));

-- 3. Update payment_method check constraint to include fonepay_qr
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN (
    'cash_on_delivery', 'esewa', 'khalti', 'bank_transfer', 'fonepay_qr'
  ));

-- 4. Update payment_status check constraint to include verification statuses
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN (
    'pending', 'pending_verification', 'paid', 'failed', 'refunded'
  ));
