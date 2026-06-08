-- Coupon management and order discount persistence

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  description text NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('fixed', 'percentage')),
  discount_value numeric(10, 2) NOT NULL CHECK (discount_value > 0),
  max_discount_amount numeric(10, 2) NULL CHECK (max_discount_amount IS NULL OR max_discount_amount > 0),
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  applicability_type text NOT NULL DEFAULT 'all' CHECK (applicability_type IN ('all', 'categories', 'products')),
  applicable_category_ids uuid[] NOT NULL DEFAULT '{}',
  applicable_product_ids uuid[] NOT NULL DEFAULT '{}',
  minimum_order_amount numeric(10, 2) NULL CHECK (minimum_order_amount IS NULL OR minimum_order_amount >= 0),
  usage_limit integer NULL CHECK (usage_limit IS NULL OR usage_limit > 0),
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  archived_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coupons_code_uppercase CHECK (code = upper(code)),
  CONSTRAINT coupons_percentage_value CHECK (discount_type <> 'percentage' OR discount_value <= 100),
  CONSTRAINT coupons_validity_check CHECK (ends_at > starts_at),
  CONSTRAINT coupons_all_has_no_specific_targets CHECK (
    applicability_type <> 'all'
    OR (cardinality(applicable_category_ids) = 0 AND cardinality(applicable_product_ids) = 0)
  ),
  CONSTRAINT coupons_categories_have_targets CHECK (
    applicability_type <> 'categories'
    OR cardinality(applicable_category_ids) > 0
  ),
  CONSTRAINT coupons_products_have_targets CHECK (
    applicability_type <> 'products'
    OR cardinality(applicable_product_ids) > 0
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code_live
  ON public.coupons (code)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_coupons_status_dates
  ON public.coupons (is_active, starts_at, ends_at)
  WHERE archived_at IS NULL;

CREATE OR REPLACE FUNCTION public.handle_coupons_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  NEW.code = upper(regexp_replace(NEW.code, '\s+', '', 'g'));
  IF NEW.applicability_type = 'all' THEN
    NEW.applicable_category_ids = '{}';
    NEW.applicable_product_ids = '{}';
  ELSIF NEW.applicability_type = 'categories' THEN
    NEW.applicable_product_ids = '{}';
  ELSIF NEW.applicability_type = 'products' THEN
    NEW.applicable_category_ids = '{}';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_coupon_updated ON public.coupons;
CREATE TRIGGER on_coupon_updated
  BEFORE INSERT OR UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_coupons_updated_at();

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code text NULL,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  ADD COLUMN IF NOT EXISTS original_subtotal numeric(10, 2) NULL CHECK (original_subtotal IS NULL OR original_subtotal >= 0);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read coupons for validation" ON public.coupons;
CREATE POLICY "Public read coupons for validation"
  ON public.coupons FOR SELECT
  TO public
  USING (archived_at IS NULL);

DROP POLICY IF EXISTS "Admins manage coupons" ON public.coupons;
CREATE POLICY "Admins manage coupons"
  ON public.coupons FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.increment_coupon_usage_from_order()
RETURNS trigger AS $$
DECLARE
  v_coupon_id uuid;
BEGIN
  IF NEW.coupon_code IS NOT NULL AND trim(NEW.coupon_code) <> '' THEN
    NEW.coupon_code = upper(trim(NEW.coupon_code));

    UPDATE public.coupons
    SET used_count = used_count + 1
    WHERE code = NEW.coupon_code
      AND archived_at IS NULL
      AND is_active = true
      AND starts_at <= now()
      AND ends_at >= now()
      AND (usage_limit IS NULL OR used_count < usage_limit)
    RETURNING id INTO v_coupon_id;

    IF v_coupon_id IS NULL THEN
      RAISE EXCEPTION 'Coupon is no longer valid or has reached its usage limit';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_order_coupon_usage ON public.orders;
CREATE TRIGGER on_order_coupon_usage
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_coupon_usage_from_order();

CREATE OR REPLACE FUNCTION public.create_order_from_cart(
  p_cart_id UUID,
  p_user_id UUID,
  p_order_number TEXT,
  p_customer_email TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_shipping_address_line1 TEXT,
  p_shipping_address_line2 TEXT,
  p_shipping_city TEXT,
  p_shipping_state TEXT,
  p_shipping_postal_code TEXT,
  p_shipping_country TEXT,
  p_subtotal NUMERIC,
  p_shipping_cost NUMERIC,
  p_tax NUMERIC,
  p_total NUMERIC,
  p_payment_method TEXT,
  p_payment_status TEXT,
  p_notes TEXT,
  p_items JSONB,
  p_coupon_code TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT 0,
  p_original_subtotal NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.carts
    WHERE id = p_cart_id
      AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Cart not found for user';
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cannot create order from an empty cart';
  END IF;

  INSERT INTO public.orders (
    user_id,
    order_number,
    customer_email,
    customer_name,
    customer_phone,
    shipping_address_line1,
    shipping_address_line2,
    shipping_city,
    shipping_state,
    shipping_postal_code,
    shipping_country,
    subtotal,
    shipping_cost,
    tax,
    total,
    payment_method,
    payment_status,
    notes,
    coupon_code,
    discount_amount,
    original_subtotal
  )
  VALUES (
    p_user_id,
    p_order_number,
    p_customer_email,
    p_customer_name,
    p_customer_phone,
    p_shipping_address_line1,
    p_shipping_address_line2,
    p_shipping_city,
    p_shipping_state,
    p_shipping_postal_code,
    p_shipping_country,
    p_subtotal,
    p_shipping_cost,
    p_tax,
    p_total,
    p_payment_method,
    p_payment_status,
    p_notes,
    NULLIF(upper(coalesce(p_coupon_code, '')), ''),
    greatest(coalesce(p_discount_amount, 0), 0),
    coalesce(p_original_subtotal, p_subtotal)
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (
    order_id,
    product_id,
    product_name,
    product_image_url,
    quantity,
    unit_price,
    total_price
  )
  SELECT
    v_order_id,
    (item->>'productId')::UUID,
    item->>'productName',
    item->>'productImageUrl',
    (item->>'quantity')::INTEGER,
    (item->>'unitPrice')::NUMERIC,
    (item->>'totalPrice')::NUMERIC
  FROM jsonb_array_elements(p_items) AS item;

  INSERT INTO public.order_status_history (
    order_id,
    status,
    notes,
    changed_by
  )
  VALUES (
    v_order_id,
    'pending',
    'Order created',
    p_user_id
  );

  DELETE FROM public.cart_items
  WHERE cart_id = p_cart_id;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_from_cart(
  UUID,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  TEXT,
  TEXT,
  TEXT,
  JSONB,
  TEXT,
  NUMERIC,
  NUMERIC
) TO authenticated, service_role;
