-- Migration: Add product_slug to public.order_items table
-- Enforces storage of product slug snapshots for both static and database products.

ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS product_slug TEXT;

-- Add comment to the new column
COMMENT ON COLUMN public.order_items.product_slug IS 'The URL slug of the product at the time the order was placed (enables links/routing for static or deleted products).';
