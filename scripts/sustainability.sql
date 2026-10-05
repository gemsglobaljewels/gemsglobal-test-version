-- ════════════════════════════════════════════════════════════════
--  SUSTAINABILITY — dynamic page configuration
--  Singleton JSONB config row (mirrors craftsmanship / gift_guide).
--  Drives the /sustainability page: hero + trust stats + reorderable
--  content sections (each with its own reorderable points) + closing
--  banner, all editable from the admin.
--  Safe to run multiple times (idempotent).
--  Apply in the Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════

-- 1. Create sustainability table
CREATE TABLE IF NOT EXISTS public.sustainability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Seed a single default row if none exists (the app fills sensible
--    defaults client-side, so an empty config is fine to start with)
INSERT INTO public.sustainability (id, config)
SELECT gen_random_uuid(), '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.sustainability);

-- 3. Enable RLS
ALTER TABLE public.sustainability ENABLE ROW LEVEL SECURITY;

-- 4. Public can read the page config (the marketing page consumes it)
DROP POLICY IF EXISTS "Public can view sustainability" ON public.sustainability;
CREATE POLICY "Public can view sustainability"
ON public.sustainability
FOR SELECT
USING (true);

-- 5. Only admins/owners can mutate (defence-in-depth; API also calls requireAdmin.
--    Note: the API uses the service-role key which bypasses RLS — real
--    authorization is requireAdmin() in the route handler.)
DROP POLICY IF EXISTS "Admins can manage sustainability" ON public.sustainability;
CREATE POLICY "Admins can manage sustainability"
ON public.sustainability
FOR ALL
USING (auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner'))
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner'));

-- 6. Keep updated_at fresh on every write (shared helper defined in 01_init_schema.sql)
DROP TRIGGER IF EXISTS set_sustainability_updated_at ON public.sustainability;
CREATE TRIGGER set_sustainability_updated_at
BEFORE UPDATE ON public.sustainability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Storage policies for the 'sustainability-assets' bucket
--    (Image uploads in this app actually go to Cloudflare R2 via the API route,
--     so these are only needed if you also upload through Supabase Storage.)
DROP POLICY IF EXISTS "Public can view sustainability assets" ON storage.objects;
CREATE POLICY "Public can view sustainability assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'sustainability-assets');

DROP POLICY IF EXISTS "Admins can manage sustainability assets" ON storage.objects;
CREATE POLICY "Admins can manage sustainability assets"
ON storage.objects FOR ALL
USING (bucket_id = 'sustainability-assets' AND auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner'))
WITH CHECK (bucket_id = 'sustainability-assets' AND auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner'));
