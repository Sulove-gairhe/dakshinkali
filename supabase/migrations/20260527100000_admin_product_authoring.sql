-- Admin product authoring: categories, storefront_data, publishing_status, RLS

-- ── Step 1: is_admin() helper (must exist before any RLS policy references it) ──
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- ── Step 2: Categories table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active_sort ON public.categories(is_active, sort_order);

CREATE OR REPLACE FUNCTION public.handle_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_category_updated ON public.categories;
CREATE TRIGGER on_category_updated
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_categories_updated_at();

INSERT INTO public.categories (name, slug, description, sort_order)
VALUES
  ('Televisions', 'televisions', NULL, 1),
  ('Refrigerators', 'refrigerators', NULL, 2),
  ('Washing Machines', 'washing-machines', NULL, 3),
  ('Air Conditioners', 'air-conditioners', NULL, 4),
  ('Kitchen Appliances', 'kitchen-appliances', NULL, 5)
ON CONFLICT (slug) DO NOTHING;

-- ── Step 3: Products — new columns ──────────────────────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS storefront_data jsonb NULL;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS publishing_status text NOT NULL DEFAULT 'draft';

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_publishing_status_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_publishing_status_check
  CHECK (publishing_status IN ('draft', 'live'));

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id uuid NULL REFERENCES public.categories(id);

CREATE INDEX IF NOT EXISTS idx_products_category_id
  ON public.products(category_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_publishing_status
  ON public.products(publishing_status)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_storefront_slug
  ON public.products ((storefront_data->>'slug'))
  WHERE deleted_at IS NULL AND (storefront_data->>'slug') IS NOT NULL;

-- low_stock status
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_enum;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_status_check
  CHECK (status IN ('active', 'inactive', 'out_of_stock', 'low_stock'));

-- ── Step 4: RLS — categories ─────────────────────────────────────────────────
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active categories" ON public.categories;
CREATE POLICY "Anyone can read active categories"
  ON public.categories FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories"
  ON public.categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── Step 5: RLS — products ───────────────────────────────────────────────────
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage products" ON public.products;
CREATE POLICY "Admins manage products"
  ON public.products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── Step 6: Storage policies for product-images ──────────────────────────────
DROP POLICY IF EXISTS "Admins upload product images" ON storage.objects;
CREATE POLICY "Admins upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins update product images" ON storage.objects;
CREATE POLICY "Admins update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admins delete product images" ON storage.objects;
CREATE POLICY "Admins delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');
