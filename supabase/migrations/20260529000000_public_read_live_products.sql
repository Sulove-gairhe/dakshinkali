-- Allow anyone (including anonymous visitors) to read live, non-deleted products.
-- This is required for the web storefront to fetch products from Supabase.

DROP POLICY IF EXISTS "Public can read live products" ON public.products;
CREATE POLICY "Public can read live products"
  ON public.products FOR SELECT
  USING (
    publishing_status = 'live'
    AND deleted_at IS NULL
    AND status IN ('active', 'low_stock')
  );
