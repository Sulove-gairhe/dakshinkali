-- Create storefront_sections table for curated homepage sections

CREATE TABLE IF NOT EXISTS public.storefront_sections (
  key text PRIMARY KEY,
  slugs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_storefront_sections_key ON public.storefront_sections(key);

CREATE OR REPLACE FUNCTION public.handle_storefront_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_storefront_sections_updated ON public.storefront_sections;
CREATE TRIGGER on_storefront_sections_updated
  BEFORE UPDATE ON public.storefront_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_storefront_sections_updated_at();

-- RLS: Allow public read, admins full control
ALTER TABLE public.storefront_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read storefront sections" ON public.storefront_sections;
CREATE POLICY "Public can read storefront sections"
  ON public.storefront_sections FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage storefront sections" ON public.storefront_sections;
CREATE POLICY "Admins manage storefront sections"
  ON public.storefront_sections FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
