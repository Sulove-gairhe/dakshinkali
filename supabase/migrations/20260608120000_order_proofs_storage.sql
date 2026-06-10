-- =====================================================
-- Order payment proof storage
-- Idempotent bucket and policies for customer QR proofs.
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-proofs',
  'order-proofs',
  true,
git  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read order proofs" ON storage.objects;
CREATE POLICY "Public read order proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'order-proofs');

DROP POLICY IF EXISTS "Customers upload own order proofs" ON storage.objects;
CREATE POLICY "Customers upload own order proofs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'order-proofs'
    AND (storage.foldername(name))[1] = 'orders'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
