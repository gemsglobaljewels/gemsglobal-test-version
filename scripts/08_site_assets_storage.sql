-- 1. Add favicon_url to site_settings table if not exists
INSERT INTO public.site_settings (key, value) 
VALUES ('favicon_url', '')
ON CONFLICT (key) DO NOTHING;

-- 2. Storage Bucket for Site Assets (Logo, Favicon, etc.)
-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies for site-assets bucket
-- Allow public read access to site-assets
CREATE POLICY "Public read site-assets"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'site-assets');

-- Allow service role full access to site-assets (used by our API routes)
CREATE POLICY "Service role full access site-assets"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'site-assets')
WITH CHECK (bucket_id = 'site-assets');

-- Allow authenticated admins to manage site-assets (optional, but good for direct Supabase access)
CREATE POLICY "Admins can manage site-assets"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'site-assets' AND
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.role IN ('owner', 'admin')
  )
);
