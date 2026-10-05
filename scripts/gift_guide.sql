-- ════════════════════════════════════════════════════════════════
--  GIFT GUIDE — dynamic page configuration
--  Singleton JSONB config row (mirrors hero_sections).
--  Safe to run multiple times (idempotent).
--  Apply in the Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════

-- 1. Create gift_guide table
CREATE TABLE IF NOT EXISTS public.gift_guide (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Seed a single default row if none exists (the app fills sensible
--    defaults client-side, so an empty config is fine to start with)
INSERT INTO public.gift_guide (id, config)
SELECT gen_random_uuid(), '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.gift_guide);

-- 3. Enable RLS
ALTER TABLE public.gift_guide ENABLE ROW LEVEL SECURITY;

-- 4. Public can read the guide (the marketing page consumes it)
DROP POLICY IF EXISTS "Public can view gift_guide" ON public.gift_guide;
CREATE POLICY "Public can view gift_guide"
ON public.gift_guide
FOR SELECT
USING (true);

-- 5. Only admins/owners can mutate (defence-in-depth; API also calls requireAdmin.
--    Note: the API uses the service-role key which bypasses RLS — real
--    authorization is requireAdmin() in the route handler.)
DROP POLICY IF EXISTS "Admins can manage gift_guide" ON public.gift_guide;
CREATE POLICY "Admins can manage gift_guide"
ON public.gift_guide
FOR ALL
USING (auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner'))
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner'));

-- 6. Keep updated_at fresh on every write (shared helper defined in 01_init_schema.sql)
DROP TRIGGER IF EXISTS set_gift_guide_updated_at ON public.gift_guide;
CREATE TRIGGER set_gift_guide_updated_at
BEFORE UPDATE ON public.gift_guide
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Storage policies for the 'gift-guide-assets' bucket
--    (Create the bucket named 'gift-guide-assets' in the Supabase dashboard if
--     you plan to use Supabase Storage. Image uploads in this app actually go
--     to Cloudflare R2 via the API route, so these are only needed if you also
--     upload through Supabase Storage directly.)
DROP POLICY IF EXISTS "Public can view gift guide assets" ON storage.objects;
CREATE POLICY "Public can view gift guide assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'gift-guide-assets');

DROP POLICY IF EXISTS "Admins can manage gift guide assets" ON storage.objects;
CREATE POLICY "Admins can manage gift guide assets"
ON storage.objects FOR ALL
USING (bucket_id = 'gift-guide-assets' AND auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner'))
WITH CHECK (bucket_id = 'gift-guide-assets' AND auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner'));
