-- Move previously imported CSV stock products back to draft without deleting rows
-- or changing inventory quantities/prices. This only targets products stamped by
-- the CSV importer.

UPDATE public.products
SET
  publishing_status = 'draft',
  storefront_data = jsonb_set(
    COALESCE(storefront_data, '{}'::jsonb),
    '{publishingStatus}',
    '"draft"'::jsonb,
    true
  )
WHERE
  deleted_at IS NULL
  AND publishing_status = 'live'
  AND storefront_data->>'source' = 'csv-stock-import';
