-- ════════════════════════════════════════════════════════════════
--  CRAFTSMANSHIP — dynamic page configuration
--  Singleton JSONB config row (mirrors gift_guide / hero_sections).
--  Drives the /craftsmanship page: hero + reorderable alternating
--  image/text sections + closing banner, all editable from the admin.
--  Safe to run multiple times (idempotent).
--  Apply in the Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════

-- 1. Create craftsmanship table
CREATE TABLE IF NOT EXISTS public.craftsmanship (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Seed a single default row if none exists (the app fills sensible
--    defaults client-side, so an empty config is fine to start with)
INSERT INTO public.craftsmanship (id, config)
SELECT gen_random_uuid(), '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.craftsmanship);

-- 3. Enable RLS
ALTER TABLE public.craftsmanship ENABLE ROW LEVEL SECURITY;

-- 4. Public can read the page config (the marketing page consumes it)
DROP POLICY IF EXISTS "Public can view craftsmanship" ON public.craftsmanship;
CREATE POLICY "Public can view craftsmanship"
ON public.craftsmanship
FOR SELECT
USING (true);

-- 5. Only admins/owners can mutate (defence-in-depth; API also calls requireAdmin.
--    Note: the API uses the service-role key which bypasses RLS — real
--    authorization is requireAdmin() in the route handler.)
DROP POLICY IF EXISTS "Admins can manage craftsmanship" ON public.craftsmanship;
CREATE POLICY "Admins can manage craftsmanship"
ON public.craftsmanship
FOR ALL
USING (auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner'))
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner'));

-- 6. Keep updated_at fresh on every write (shared helper defined in 01_init_schema.sql)
DROP TRIGGER IF EXISTS set_craftsmanship_updated_at ON public.craftsmanship;
CREATE TRIGGER set_craftsmanship_updated_at
BEFORE UPDATE ON public.craftsmanship
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Storage policies for the 'craftsmanship-assets' bucket
--    (Image uploads in this app actually go to Cloudflare R2 via the API route,
--     so these are only needed if you also upload through Supabase Storage.)
DROP POLICY IF EXISTS "Public can view craftsmanship assets" ON storage.objects;
CREATE POLICY "Public can view craftsmanship assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'craftsmanship-assets');

DROP POLICY IF EXISTS "Admins can manage craftsmanship assets" ON storage.objects;
CREATE POLICY "Admins can manage craftsmanship assets"
ON storage.objects FOR ALL
USING (bucket_id = 'craftsmanship-assets' AND auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner'))
WITH CHECK (bucket_id = 'craftsmanship-assets' AND auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner'));
