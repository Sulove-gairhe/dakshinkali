-- =====================================================
-- Add Delivered Order Notification Tracking
-- =====================================================
-- Purpose: Track delivered-order notifications with 
-- robust state transitions (pending → sending → sent/failed)
-- to support atomic claim operations and prevent duplicates.
--
-- CRITICAL: admin_notification_status remains for 
-- new_order notifications ONLY. DO NOT use it for 
-- delivered_order notifications.
--
-- MANUAL APPLICATION REQUIRED:
-- This migration file is for repo history only.
-- DO NOT run: supabase db push
-- Apply manually in Supabase SQL Editor after review.
-- =====================================================

-- Preflight check (run this first in SQL Editor):
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'orders' 
-- AND column_name IN ('delivered_notification_status', 'delivered_notification_sent_at');
-- (Should return 0 rows if columns don't exist)

-- Add delivered notification status field
ALTER TABLE public.orders 
ADD COLUMN delivered_notification_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (delivered_notification_status IN ('pending', 'sending', 'sent', 'failed'));

-- Add delivered notification timestamp field
ALTER TABLE public.orders
ADD COLUMN delivered_notification_sent_at TIMESTAMPTZ NULL;

-- Add comments
COMMENT ON COLUMN public.orders.delivered_notification_status IS 
'Tracks delivered-order/manual stock deduction notification state independently from admin_notification_status, which is reserved for new-order notifications.';

COMMENT ON COLUMN public.orders.delivered_notification_sent_at IS 
'Timestamp when delivered-order/manual stock deduction notification was successfully sent.';

-- Verification query (run after applying):
-- SELECT delivered_notification_status, COUNT(*) 
-- FROM public.orders 
-- GROUP BY delivered_notification_status;
-- (All existing rows should show 'pending')
