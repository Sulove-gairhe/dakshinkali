-- =====================================================
-- HisabKitab Phase 2B: stock movement ledger and RPC draft
-- =====================================================
-- Draft migration only. Review against the live Supabase schema before applying.
--
-- Safety notes:
-- - Do not run through `supabase db push` while migration ledger drift exists.
-- - Do not apply before manually inspecting products/order constraints in SQL Editor.
-- - This migration does not create inventory_items.
-- - This migration does not rewrite checkout or admin order actions.
-- - This migration does not backfill stock from order history.
-- - products.stock_quantity remains the current stock snapshot.

DO $$
BEGIN
  IF to_regclass('public.products') IS NULL THEN
    RAISE EXCEPTION 'public.products does not exist; inspect schema before applying HisabKitab Phase 2 stock migration';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'stock_quantity'
  ) THEN
    RAISE EXCEPTION 'public.products.stock_quantity is missing; apply/reconcile product inventory fields before this migration';
  END IF;

  IF to_regclass('public.orders') IS NULL THEN
    RAISE EXCEPTION 'public.orders does not exist; inspect schema before applying HisabKitab Phase 2 stock migration';
  END IF;

  IF to_regclass('public.order_items') IS NULL THEN
    RAISE EXCEPTION 'public.order_items does not exist; inspect schema before applying HisabKitab Phase 2 stock migration';
  END IF;

  IF to_regclass('public.stock_movements') IS NOT NULL THEN
    RAISE EXCEPTION 'public.stock_movements already exists; inspect schema before applying HisabKitab Phase 2 stock migration';
  END IF;
END $$;

CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id),
  movement_type text NOT NULL,
  quantity_delta integer NOT NULL,
  quantity_before integer NOT NULL,
  quantity_after integer NOT NULL,
  reason text NULL,
  reference_type text NULL,
  reference_id uuid NULL,
  idempotency_key text NULL,
  created_by uuid NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT stock_movements_quantity_delta_not_zero
    CHECK (quantity_delta <> 0),
  CONSTRAINT stock_movements_quantities_non_negative
    CHECK (quantity_before >= 0 AND quantity_after >= 0),
  CONSTRAINT stock_movements_quantity_math
    CHECK (quantity_after = quantity_before + quantity_delta),
  CONSTRAINT stock_movements_movement_type_check
    CHECK (
      movement_type IN (
        'manual_adjustment',
        'order_commit',
        'order_release',
        'correction'
      )
    ),
  CONSTRAINT stock_movements_reference_pair_check
    CHECK (
      (reference_type IS NULL AND reference_id IS NULL)
      OR (reference_type IS NOT NULL AND reference_id IS NOT NULL)
    ),
  CONSTRAINT stock_movements_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_stock_movements_product_created_at
  ON public.stock_movements(product_id, created_at DESC);

CREATE INDEX idx_stock_movements_created_at
  ON public.stock_movements(created_at DESC);

CREATE INDEX idx_stock_movements_reference
  ON public.stock_movements(reference_type, reference_id)
  WHERE reference_type IS NOT NULL AND reference_id IS NOT NULL;

CREATE UNIQUE INDEX idx_stock_movements_idempotency_key
  ON public.stock_movements(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

COMMENT ON TABLE public.stock_movements
  IS 'Append-only HisabKitab stock movement ledger. Current stock remains products.stock_quantity.';

COMMENT ON COLUMN public.stock_movements.idempotency_key
  IS 'Stable operation key used to avoid duplicate stock commits/releases or repeated manual adjustments.';

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HisabKitab users read stock movements"
  ON public.stock_movements
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Service role manages stock movements"
  ON public.stock_movements
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;

CREATE OR REPLACE FUNCTION public.hisabkitab_status_supports_low_stock()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.products'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%low_stock%'
  );
$$;

CREATE OR REPLACE FUNCTION public.hisabkitab_derive_product_status(
  p_current_status text,
  p_quantity_after integer,
  p_low_stock_threshold integer DEFAULT 5
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_current_status = 'inactive' THEN
    RETURN 'inactive';
  END IF;

  IF p_quantity_after <= 0 THEN
    RETURN 'out_of_stock';
  END IF;

  IF p_quantity_after <= p_low_stock_threshold
     AND public.hisabkitab_status_supports_low_stock() THEN
    RETURN 'low_stock';
  END IF;

  RETURN 'active';
END;
$$;

CREATE OR REPLACE FUNCTION public.hisabkitab_adjust_stock(
  p_product_id uuid,
  p_quantity_delta integer,
  p_movement_type text DEFAULT 'manual_adjustment',
  p_reason text DEFAULT NULL,
  p_reference_type text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL,
  p_created_by uuid DEFAULT auth.uid(),
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_low_stock_threshold integer DEFAULT 5
)
RETURNS TABLE (
  product_id uuid,
  quantity_before integer,
  quantity_after integer,
  movement_id uuid,
  updated_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product record;
  v_existing record;
  v_quantity_after integer;
  v_updated_status text;
  v_movement_id uuid;
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized to adjust stock' USING ERRCODE = '42501';
  END IF;

  IF p_quantity_delta IS NULL OR p_quantity_delta = 0 THEN
    RAISE EXCEPTION 'quantity_delta must be non-zero';
  END IF;

  IF p_movement_type NOT IN ('manual_adjustment', 'order_commit', 'order_release', 'correction') THEN
    RAISE EXCEPTION 'Invalid movement_type: %', p_movement_type;
  END IF;

  IF (p_reference_type IS NULL) <> (p_reference_id IS NULL) THEN
    RAISE EXCEPTION 'reference_type and reference_id must both be null or both be present';
  END IF;

  IF p_low_stock_threshold IS NULL OR p_low_stock_threshold < 0 THEN
    RAISE EXCEPTION 'low stock threshold must be zero or greater';
  END IF;

  IF p_metadata IS NULL OR jsonb_typeof(p_metadata) <> 'object' THEN
    RAISE EXCEPTION 'metadata must be a JSON object';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT sm.*
    INTO v_existing
    FROM public.stock_movements sm
    WHERE sm.idempotency_key = p_idempotency_key;

    IF FOUND THEN
      IF v_existing.product_id <> p_product_id THEN
        RAISE EXCEPTION 'idempotency_key % belongs to a different product', p_idempotency_key;
      END IF;

      RETURN QUERY
      SELECT
        v_existing.product_id,
        v_existing.quantity_before,
        v_existing.quantity_after,
        v_existing.id,
        p.status
      FROM public.products p
      WHERE p.id = v_existing.product_id;
      RETURN;
    END IF;
  END IF;

  SELECT p.id, p.status, p.deleted_at, p.stock_quantity
  INTO v_product
  FROM public.products p
  WHERE p.id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
  END IF;

  IF v_product.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot adjust deleted product: %', p_product_id;
  END IF;

  IF v_product.status = 'inactive'
     AND p_quantity_delta < 0
     AND (
       p_movement_type <> 'correction'
       OR NULLIF(BTRIM(COALESCE(p_reason, '')), '') IS NULL
     ) THEN
    RAISE EXCEPTION 'Inactive product stock decreases require correction movement type and reason: %', p_product_id;
  END IF;

  v_quantity_after := v_product.stock_quantity + p_quantity_delta;
  IF v_quantity_after < 0 THEN
    RAISE EXCEPTION 'Insufficient stock for product %. Current %, delta %',
      p_product_id,
      v_product.stock_quantity,
      p_quantity_delta;
  END IF;

  v_updated_status := public.hisabkitab_derive_product_status(
    v_product.status,
    v_quantity_after,
    p_low_stock_threshold
  );

  UPDATE public.products p
  SET
    stock_quantity = v_quantity_after,
    status = v_updated_status
  WHERE p.id = p_product_id
  RETURNING p.status INTO v_updated_status;

  INSERT INTO public.stock_movements (
    product_id,
    movement_type,
    quantity_delta,
    quantity_before,
    quantity_after,
    reason,
    reference_type,
    reference_id,
    idempotency_key,
    created_by,
    metadata
  )
  VALUES (
    p_product_id,
    p_movement_type,
    p_quantity_delta,
    v_product.stock_quantity,
    v_quantity_after,
    p_reason,
    p_reference_type,
    p_reference_id,
    p_idempotency_key,
    p_created_by,
    p_metadata
  )
  RETURNING id INTO v_movement_id;

  RETURN QUERY
  SELECT
    p_product_id,
    v_product.stock_quantity,
    v_quantity_after,
    v_movement_id,
    v_updated_status;
END;
$$;

CREATE OR REPLACE FUNCTION public.hisabkitab_set_stock(
  p_product_id uuid,
  p_quantity_after integer,
  p_reason text,
  p_idempotency_key text DEFAULT NULL,
  p_created_by uuid DEFAULT auth.uid(),
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_low_stock_threshold integer DEFAULT 5
)
RETURNS TABLE (
  product_id uuid,
  quantity_before integer,
  quantity_after integer,
  movement_id uuid,
  updated_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product record;
  v_quantity_delta integer;
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized to set stock' USING ERRCODE = '42501';
  END IF;

  IF p_quantity_after IS NULL OR p_quantity_after < 0 THEN
    RAISE EXCEPTION 'quantity_after must be zero or greater';
  END IF;

  SELECT p.id, p.deleted_at, p.stock_quantity
  INTO v_product
  FROM public.products p
  WHERE p.id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
  END IF;

  IF v_product.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot set stock for deleted product: %', p_product_id;
  END IF;

  v_quantity_delta := p_quantity_after - v_product.stock_quantity;
  IF v_quantity_delta = 0 THEN
    RAISE EXCEPTION 'No stock change for product %; zero-delta movement was not created', p_product_id;
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.hisabkitab_adjust_stock(
    p_product_id,
    v_quantity_delta,
    'manual_adjustment',
    p_reason,
    NULL,
    NULL,
    p_idempotency_key,
    p_created_by,
    p_metadata,
    p_low_stock_threshold
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.hisabkitab_commit_order_stock(
  p_order_id uuid,
  p_actor_id uuid DEFAULT auth.uid(),
  p_low_stock_threshold integer DEFAULT 5
)
RETURNS TABLE (
  product_id uuid,
  quantity_before integer,
  quantity_after integer,
  movement_id uuid,
  updated_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_line record;
  v_product record;
  v_expected_count integer;
  v_existing_count integer;
  v_quantity_after integer;
  v_updated_status text;
  v_movement_id uuid;
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Not authorized to commit order stock' USING ERRCODE = '42501';
  END IF;

  PERFORM 1
  FROM public.orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
      AND oi.product_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Order % contains item rows without product_id; cannot commit stock', p_order_id;
  END IF;

  SELECT count(*)::integer
  INTO v_expected_count
  FROM (
    SELECT oi.product_id
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
    GROUP BY oi.product_id
  ) grouped;

  IF v_expected_count = 0 THEN
    RAISE EXCEPTION 'Order % has no stock-trackable items', p_order_id;
  END IF;

  SELECT count(*)::integer
  INTO v_existing_count
  FROM public.stock_movements sm
  WHERE sm.idempotency_key IN (
    SELECT 'order_commit:' || p_order_id::text || ':' || oi.product_id::text
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
    GROUP BY oi.product_id
  );

  IF v_existing_count = v_expected_count THEN
    RETURN QUERY
    SELECT
      sm.product_id,
      sm.quantity_before,
      sm.quantity_after,
      sm.id,
      p.status
    FROM public.stock_movements sm
    JOIN public.products p ON p.id = sm.product_id
    WHERE sm.idempotency_key IN (
      SELECT 'order_commit:' || p_order_id::text || ':' || oi.product_id::text
      FROM public.order_items oi
      WHERE oi.order_id = p_order_id
      GROUP BY oi.product_id
    )
    ORDER BY sm.product_id;
    RETURN;
  END IF;

  IF v_existing_count > 0 THEN
    RAISE EXCEPTION 'Partial stock commit already exists for order %; inspect stock_movements before retrying', p_order_id;
  END IF;

  -- Lock and validate every product first, in deterministic order, before mutating any stock.
  FOR v_line IN
    SELECT oi.product_id, sum(oi.quantity)::integer AS quantity
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
    GROUP BY oi.product_id
    ORDER BY oi.product_id
  LOOP
    IF v_line.quantity IS NULL OR v_line.quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid order quantity for product % on order %', v_line.product_id, p_order_id;
    END IF;

    SELECT p.id, p.status, p.deleted_at, p.stock_quantity
    INTO v_product
    FROM public.products p
    WHERE p.id = v_line.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found for order item: %', v_line.product_id;
    END IF;

    IF v_product.deleted_at IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot commit stock for deleted product: %', v_line.product_id;
    END IF;

    IF v_product.status = 'inactive' THEN
      RAISE EXCEPTION 'Cannot commit stock for inactive product: %', v_line.product_id;
    END IF;

    IF v_product.stock_quantity < v_line.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %. Current %, required %',
        v_line.product_id,
        v_product.stock_quantity,
        v_line.quantity;
    END IF;
  END LOOP;

  FOR v_line IN
    SELECT oi.product_id, sum(oi.quantity)::integer AS quantity
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
    GROUP BY oi.product_id
    ORDER BY oi.product_id
  LOOP
    SELECT p.id, p.status, p.stock_quantity
    INTO v_product
    FROM public.products p
    WHERE p.id = v_line.product_id;

    v_quantity_after := v_product.stock_quantity - v_line.quantity;
    v_updated_status := public.hisabkitab_derive_product_status(
      v_product.status,
      v_quantity_after,
      p_low_stock_threshold
    );

    UPDATE public.products p
    SET
      stock_quantity = v_quantity_after,
      status = v_updated_status
    WHERE p.id = v_line.product_id
    RETURNING p.status INTO v_updated_status;

    INSERT INTO public.stock_movements (
      product_id,
      movement_type,
      quantity_delta,
      quantity_before,
      quantity_after,
      reason,
      reference_type,
      reference_id,
      idempotency_key,
      created_by,
      metadata
    )
    VALUES (
      v_line.product_id,
      'order_commit',
      -v_line.quantity,
      v_product.stock_quantity,
      v_quantity_after,
      'Order stock committed',
      'order',
      p_order_id,
      'order_commit:' || p_order_id::text || ':' || v_line.product_id::text,
      p_actor_id,
      jsonb_build_object('order_id', p_order_id, 'quantity', v_line.quantity)
    )
    RETURNING id INTO v_movement_id;

    RETURN QUERY
    SELECT
      v_line.product_id,
      v_product.stock_quantity,
      v_quantity_after,
      v_movement_id,
      v_updated_status;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.hisabkitab_release_order_stock(
  p_order_id uuid,
  p_actor_id uuid DEFAULT auth.uid(),
  p_low_stock_threshold integer DEFAULT 5
)
RETURNS TABLE (
  product_id uuid,
  quantity_before integer,
  quantity_after integer,
  movement_id uuid,
  updated_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_line record;
  v_product record;
  v_expected_count integer;
  v_commit_count integer;
  v_existing_release_count integer;
  v_quantity_after integer;
  v_updated_status text;
  v_movement_id uuid;
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Not authorized to release order stock' USING ERRCODE = '42501';
  END IF;

  PERFORM 1
  FROM public.orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
      AND oi.product_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Order % contains item rows without product_id; cannot release stock', p_order_id;
  END IF;

  SELECT count(*)::integer
  INTO v_expected_count
  FROM (
    SELECT oi.product_id
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
    GROUP BY oi.product_id
  ) grouped;

  IF v_expected_count = 0 THEN
    RAISE EXCEPTION 'Order % has no stock-trackable items', p_order_id;
  END IF;

  SELECT count(*)::integer
  INTO v_commit_count
  FROM public.stock_movements sm
  WHERE sm.idempotency_key IN (
    SELECT 'order_commit:' || p_order_id::text || ':' || oi.product_id::text
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
    GROUP BY oi.product_id
  );

  IF v_commit_count <> v_expected_count THEN
    RAISE EXCEPTION 'Order % does not have a complete stock commit to release', p_order_id;
  END IF;

  SELECT count(*)::integer
  INTO v_existing_release_count
  FROM public.stock_movements sm
  WHERE sm.idempotency_key IN (
    SELECT 'order_release:' || p_order_id::text || ':' || oi.product_id::text
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
    GROUP BY oi.product_id
  );

  IF v_existing_release_count = v_expected_count THEN
    RETURN QUERY
    SELECT
      sm.product_id,
      sm.quantity_before,
      sm.quantity_after,
      sm.id,
      p.status
    FROM public.stock_movements sm
    JOIN public.products p ON p.id = sm.product_id
    WHERE sm.idempotency_key IN (
      SELECT 'order_release:' || p_order_id::text || ':' || oi.product_id::text
      FROM public.order_items oi
      WHERE oi.order_id = p_order_id
      GROUP BY oi.product_id
    )
    ORDER BY sm.product_id;
    RETURN;
  END IF;

  IF v_existing_release_count > 0 THEN
    RAISE EXCEPTION 'Partial stock release already exists for order %; inspect stock_movements before retrying', p_order_id;
  END IF;

  -- Lock and validate every product first, in deterministic order, before mutating any stock.
  FOR v_line IN
    SELECT oi.product_id, sum(oi.quantity)::integer AS quantity
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
    GROUP BY oi.product_id
    ORDER BY oi.product_id
  LOOP
    IF v_line.quantity IS NULL OR v_line.quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid order quantity for product % on order %', v_line.product_id, p_order_id;
    END IF;

    SELECT p.id, p.status, p.deleted_at, p.stock_quantity
    INTO v_product
    FROM public.products p
    WHERE p.id = v_line.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found for order item: %', v_line.product_id;
    END IF;

    IF v_product.deleted_at IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot release stock for deleted product: %', v_line.product_id;
    END IF;
  END LOOP;

  FOR v_line IN
    SELECT oi.product_id, sum(oi.quantity)::integer AS quantity
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
    GROUP BY oi.product_id
    ORDER BY oi.product_id
  LOOP
    SELECT p.id, p.status, p.stock_quantity
    INTO v_product
    FROM public.products p
    WHERE p.id = v_line.product_id;

    v_quantity_after := v_product.stock_quantity + v_line.quantity;
    v_updated_status := public.hisabkitab_derive_product_status(
      v_product.status,
      v_quantity_after,
      p_low_stock_threshold
    );

    UPDATE public.products p
    SET
      stock_quantity = v_quantity_after,
      status = v_updated_status
    WHERE p.id = v_line.product_id
    RETURNING p.status INTO v_updated_status;

    INSERT INTO public.stock_movements (
      product_id,
      movement_type,
      quantity_delta,
      quantity_before,
      quantity_after,
      reason,
      reference_type,
      reference_id,
      idempotency_key,
      created_by,
      metadata
    )
    VALUES (
      v_line.product_id,
      'order_release',
      v_line.quantity,
      v_product.stock_quantity,
      v_quantity_after,
      'Order stock released',
      'order',
      p_order_id,
      'order_release:' || p_order_id::text || ':' || v_line.product_id::text,
      p_actor_id,
      jsonb_build_object('order_id', p_order_id, 'quantity', v_line.quantity)
    )
    RETURNING id INTO v_movement_id;

    RETURN QUERY
    SELECT
      v_line.product_id,
      v_product.stock_quantity,
      v_quantity_after,
      v_movement_id,
      v_updated_status;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.hisabkitab_status_supports_low_stock() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.hisabkitab_derive_product_status(text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.hisabkitab_adjust_stock(uuid, integer, text, text, text, uuid, text, uuid, jsonb, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.hisabkitab_set_stock(uuid, integer, text, text, uuid, jsonb, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.hisabkitab_commit_order_stock(uuid, uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.hisabkitab_release_order_stock(uuid, uuid, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.hisabkitab_status_supports_low_stock() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.hisabkitab_derive_product_status(text, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.hisabkitab_adjust_stock(uuid, integer, text, text, text, uuid, text, uuid, jsonb, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.hisabkitab_set_stock(uuid, integer, text, text, uuid, jsonb, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.hisabkitab_commit_order_stock(uuid, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.hisabkitab_release_order_stock(uuid, uuid, integer) TO service_role;
