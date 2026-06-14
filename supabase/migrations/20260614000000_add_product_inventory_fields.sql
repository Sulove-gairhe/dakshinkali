-- Add draft stock import inventory fields to products.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS model_name text NULL,
  ADD COLUMN IF NOT EXISTS sku text NULL,
  ADD COLUMN IF NOT EXISTS purchase_price numeric(10, 2) NULL,
  ADD COLUMN IF NOT EXISTS wholesale_price numeric(10, 2) NULL,
  ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_stock_quantity_non_negative;

ALTER TABLE public.products
  ADD CONSTRAINT products_stock_quantity_non_negative
  CHECK (stock_quantity >= 0);

CREATE INDEX IF NOT EXISTS idx_products_model_name
  ON public.products(model_name)
  WHERE deleted_at IS NULL AND model_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_sku
  ON public.products(sku)
  WHERE deleted_at IS NULL AND sku IS NOT NULL;
