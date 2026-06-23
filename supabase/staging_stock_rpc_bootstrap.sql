-- Staging-only bootstrap schema for HisabKitab stock RPC testing.
-- Purpose: create the minimum table structure needed by:
--   - public.hisabkitab_adjust_stock
--   - public.hisabkitab_set_stock
--   - public.hisabkitab_commit_order_stock
--   - public.hisabkitab_release_order_stock
--
-- This file intentionally omits auth triggers, RLS, carts, coupons,
-- categories, blogs, notifications, storage, and any inventory ledger tables.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  full_name text NULL,
  avatar_url text NULL,
  phone text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NULL,
  sku text NULL,
  model_name text NULL,
  description text NULL,
  status text NOT NULL DEFAULT 'active',
  publishing_status text NOT NULL DEFAULT 'live',
  deleted_at timestamptz NULL,
  stock_quantity integer NOT NULL DEFAULT 0,
  purchase_price numeric(10, 2) NULL,
  wholesale_price numeric(10, 2) NULL,
  retail_price numeric(10, 2) NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_status_check
    CHECK (status IN ('active', 'inactive', 'out_of_stock', 'low_stock')),
  CONSTRAINT products_publishing_status_check
    CHECK (publishing_status IN ('draft', 'live')),
  CONSTRAINT products_stock_quantity_non_negative
    CHECK (stock_quantity >= 0)
);

CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_publishing_status ON public.products(publishing_status);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON public.products(deleted_at);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NULL,
  user_id uuid NULL REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'pending',
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  shipping_fee numeric(12, 2) NOT NULL DEFAULT 0,
  discount_amount numeric(12, 2) NOT NULL DEFAULT 0,
  total_amount numeric(12, 2) NOT NULL DEFAULT 0,
  shipping_name text NULL,
  shipping_phone text NULL,
  shipping_address text NULL,
  shipping_city text NULL,
  shipping_state text NULL,
  shipping_postal_code text NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  CONSTRAINT orders_payment_status_check
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'))
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL,
  unit_price numeric(12, 2) NULL,
  line_total numeric(12, 2) NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_items_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
