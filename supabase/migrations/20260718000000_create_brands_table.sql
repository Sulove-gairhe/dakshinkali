-- Brand data integrity foundation
-- Creates a canonical brands table while retaining products.storefront_data->>'brand'
-- for backward compatibility.

CREATE OR REPLACE FUNCTION public.normalize_brand_name(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(regexp_replace(btrim(coalesce(value, '')), '\s+', ' ', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.is_rejected_brand_candidate(value text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT public.normalize_brand_name(value) = ANY (ARRAY[
    'button', 'ceiling', 'cooler', 'electric', 'exhaust', 'filter', 'food',
    'grill', 'heater', 'humidifier', 'induction', 'iron', 'mixer', 'remote',
    'rice', 'solo', 'table', 'top', 'vacuum', 'w/m', 'washing',
    'sensor/touch/autoclean', 'sensor/touch/flat', 'generic'
  ]);
$$;

CREATE TABLE IF NOT EXISTS public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  normalized_name text NOT NULL,
  sort_priority integer NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brands_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT brands_normalized_name_not_blank CHECK (btrim(normalized_name) <> ''),
  CONSTRAINT brands_normalized_name_matches_name
    CHECK (normalized_name = public.normalize_brand_name(name))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_normalized_name
  ON public.brands (normalized_name);

CREATE INDEX IF NOT EXISTS idx_brands_active_order
  ON public.brands (is_active, sort_priority NULLS LAST, name);

CREATE OR REPLACE FUNCTION public.handle_brands_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.name = regexp_replace(btrim(NEW.name), '\s+', ' ', 'g');
  IF public.is_rejected_brand_candidate(NEW.name)
    AND NOT (public.normalize_brand_name(NEW.name) = 'generic' AND NEW.is_active = false) THEN
    IF TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'This value is not a valid public brand' USING ERRCODE = '22023';
    ELSIF NEW.name IS DISTINCT FROM OLD.name THEN
      RAISE EXCEPTION 'This value is not a valid public brand' USING ERRCODE = '22023';
    END IF;
  END IF;
  NEW.normalized_name = public.normalize_brand_name(NEW.name);
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_brand_updated ON public.brands;
CREATE TRIGGER on_brand_updated
  BEFORE INSERT OR UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_brands_updated_at();

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand_id uuid NULL REFERENCES public.brands(id);

CREATE INDEX IF NOT EXISTS idx_products_brand_id
  ON public.products (brand_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_legacy_brand_normalized
  ON public.products (public.normalize_brand_name(storefront_data->>'brand'))
  WHERE deleted_at IS NULL AND public.normalize_brand_name(storefront_data->>'brand') <> '';

INSERT INTO public.brands (name, normalized_name, sort_priority, is_active)
VALUES
  ('Samsung', public.normalize_brand_name('Samsung'), 1, true),
  ('Himstar', public.normalize_brand_name('Himstar'), 2, true),
  ('Godrej', public.normalize_brand_name('Godrej'), 3, true),
  ('TCL', public.normalize_brand_name('TCL'), 4, true),
  ('Whirlpool', public.normalize_brand_name('Whirlpool'), 5, true),
  ('CG', public.normalize_brand_name('CG'), 6, true)
ON CONFLICT (normalized_name) DO UPDATE
SET
  name = EXCLUDED.name,
  sort_priority = EXCLUDED.sort_priority,
  is_active = true;

CREATE OR REPLACE VIEW public.product_brand_backfill_audit AS
WITH legacy AS (
  SELECT
    storefront_data->>'brand' AS raw_brand,
    regexp_replace(btrim(storefront_data->>'brand'), '\s+', ' ', 'g') AS trimmed_brand,
    public.normalize_brand_name(storefront_data->>'brand') AS normalized_key,
    count(*) AS product_count
  FROM public.products
  WHERE deleted_at IS NULL
    AND public.normalize_brand_name(storefront_data->>'brand') <> ''
  GROUP BY 1, 2, 3
),
canonical AS (
  SELECT DISTINCT ON (normalized_key)
    normalized_key,
    CASE normalized_key
      WHEN 'samsung' THEN 'Samsung'
      WHEN 'himstar' THEN 'Himstar'
      WHEN 'godrej' THEN 'Godrej'
      WHEN 'tcl' THEN 'TCL'
      WHEN 'whirlpool' THEN 'Whirlpool'
      WHEN 'cg' THEN 'CG'
      ELSE trimmed_brand
    END AS proposed_canonical_display_name
  FROM legacy
  ORDER BY normalized_key, product_count DESC, trimmed_brand
)
SELECT
  legacy.raw_brand,
  legacy.trimmed_brand,
  legacy.normalized_key,
  legacy.product_count,
  canonical.proposed_canonical_display_name,
  canonical.proposed_canonical_display_name <> legacy.trimmed_brand AS merges_into_another_value
FROM legacy
JOIN canonical USING (normalized_key);

WITH legacy_brands AS (
  SELECT DISTINCT ON (normalized_key)
    normalized_key,
    CASE normalized_key
      WHEN 'samsung' THEN 'Samsung'
      WHEN 'himstar' THEN 'Himstar'
      WHEN 'godrej' THEN 'Godrej'
      WHEN 'tcl' THEN 'TCL'
      WHEN 'whirlpool' THEN 'Whirlpool'
      WHEN 'cg' THEN 'CG'
      ELSE trimmed_brand
    END AS canonical_name
  FROM (
    SELECT
      regexp_replace(btrim(storefront_data->>'brand'), '\s+', ' ', 'g') AS trimmed_brand,
      public.normalize_brand_name(storefront_data->>'brand') AS normalized_key,
      count(*) AS product_count
    FROM public.products
    WHERE deleted_at IS NULL
      AND public.normalize_brand_name(storefront_data->>'brand') <> ''
      AND (
        NOT public.is_rejected_brand_candidate(storefront_data->>'brand')
        OR public.normalize_brand_name(storefront_data->>'brand') = 'generic'
      )
      GROUP BY 1, 2
  ) grouped
  ORDER BY normalized_key, product_count DESC, trimmed_brand
)
INSERT INTO public.brands (name, normalized_name, sort_priority, is_active)
SELECT canonical_name, normalized_key, NULL, normalized_key <> 'generic'
FROM legacy_brands
ON CONFLICT (normalized_name) DO NOTHING;

UPDATE public.products product
SET
  brand_id = brand.id,
  storefront_data = jsonb_set(
    coalesce(product.storefront_data, '{}'::jsonb),
    '{brand}',
    to_jsonb(brand.name),
    true
  )
FROM public.brands brand
WHERE product.deleted_at IS NULL
  AND public.normalize_brand_name(product.storefront_data->>'brand') <> ''
  AND public.normalize_brand_name(product.storefront_data->>'brand') = brand.normalized_name
  AND (
    product.brand_id IS DISTINCT FROM brand.id
    OR product.storefront_data->>'brand' IS DISTINCT FROM brand.name
  );

-- Import fragments and Generic are retained for review, but never public.
-- Product rows and their brand_id relationships are deliberately preserved.
UPDATE public.brands
SET is_active = false
WHERE normalized_name = ANY (ARRAY[
  'button', 'ceiling', 'cooler', 'electric', 'exhaust', 'filter', 'food',
  'grill', 'heater', 'humidifier', 'induction', 'iron', 'mixer', 'remote',
  'rice', 'solo', 'table', 'top', 'vacuum', 'w/m', 'washing',
  'sensor/touch/autoclean', 'sensor/touch/flat', 'generic'
]);

CREATE OR REPLACE FUNCTION public.rename_brand(p_brand_id uuid, p_name text)
RETURNS public.brands
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleaned_name text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  normalized text := public.normalize_brand_name(p_name);
  result public.brands;
BEGIN
  IF NOT public.is_admin_or_staff() THEN
    RAISE EXCEPTION 'Brand management requires admin or staff access' USING ERRCODE = '42501';
  END IF;
  IF public.is_rejected_brand_candidate(p_name) OR normalized = '' THEN
    RAISE EXCEPTION 'This value is not a valid public brand' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.brands
    WHERE normalized_name = normalized AND id <> p_brand_id
  ) THEN
    UPDATE public.products
    SET brand_id = target.id,
        storefront_data = jsonb_set(
          coalesce(storefront_data, '{}'::jsonb), '{brand}', to_jsonb(target.name), true
        )
    FROM public.brands target
    WHERE target.normalized_name = normalized
      AND public.products.brand_id = p_brand_id;
    DELETE FROM public.brands WHERE id = p_brand_id;
    SELECT * INTO result FROM public.brands WHERE normalized_name = normalized;
    RETURN result;
  END IF;

  UPDATE public.brands
  SET name = cleaned_name, normalized_name = normalized
  WHERE id = p_brand_id
  RETURNING * INTO result;
  IF result.id IS NULL THEN
    RAISE EXCEPTION 'Brand not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.products
  SET storefront_data = jsonb_set(
    coalesce(storefront_data, '{}'::jsonb), '{brand}', to_jsonb(result.name), true
  )
  WHERE brand_id = p_brand_id;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_brand_if_unused(p_brand_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_staff() THEN
    RAISE EXCEPTION 'Brand management requires admin or staff access' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (SELECT 1 FROM public.products WHERE brand_id = p_brand_id) THEN
    RAISE EXCEPTION 'brand_referenced: linked products must be reassigned first' USING ERRCODE = '23001';
  END IF;
  DELETE FROM public.brands WHERE id = p_brand_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Brand not found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_rejected_brand_candidate(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rename_brand(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_brand_if_unused(uuid) TO authenticated;

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active brands" ON public.brands;
DROP POLICY IF EXISTS "Public can read active brands" ON public.brands;
CREATE POLICY "Public can read active brands"
  ON public.brands FOR SELECT
  TO public
  USING (is_active = true OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Admins manage brands" ON public.brands;
DROP POLICY IF EXISTS "Admin and staff manage brands" ON public.brands;
CREATE POLICY "Admin and staff manage brands"
  ON public.brands FOR ALL
  TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());
