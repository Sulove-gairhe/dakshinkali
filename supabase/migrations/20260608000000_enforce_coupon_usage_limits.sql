-- Enforce coupon usage limits atomically at order creation time.

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
