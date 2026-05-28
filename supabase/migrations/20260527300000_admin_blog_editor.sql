-- Admin blog editor: posts table + blog-images storage policies

CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text NOT NULL,
  category text NOT NULL,
  read_time text,
  cover_image_url text,
  cover_image_filename text,
  author text NOT NULL DEFAULT 'Dakshinkali Electronics',
  published_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),
  featured boolean NOT NULL DEFAULT false,
  tags text[] NOT NULL DEFAULT '{}',
  seo_title text,
  seo_description text,
  content jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured) WHERE featured = true;

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_blogs" ON blog_posts;
CREATE POLICY "public_read_published_blogs" ON blog_posts
  FOR SELECT USING (status = 'published' AND deleted_at IS NULL);

DROP POLICY IF EXISTS "admin_all_blogs" ON blog_posts;
CREATE POLICY "admin_all_blogs" ON blog_posts
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Storage bucket for blog cover images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Admins upload blog images" ON storage.objects;
CREATE POLICY "Admins upload blog images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'blog-images'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins update blog images" ON storage.objects;
CREATE POLICY "Admins update blog images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'blog-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admins delete blog images" ON storage.objects;
CREATE POLICY "Admins delete blog images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'blog-images' AND public.is_admin());

DROP POLICY IF EXISTS "Public read blog images" ON storage.objects;
CREATE POLICY "Public read blog images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'blog-images');
