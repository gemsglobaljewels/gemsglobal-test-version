-- ════════════════════════════════════════════════════════════════
--  CONTACT US PAGE — dynamic page configuration
--  Singleton JSONB config table (mirrors repairs / privacy / gift_guide).
--  Drives the public /contact-us page: hero, contact channels, enquiry
--  form settings, support hours and reorderable info sections — all
--  editable from /admin/contact-us.
--  Safe to run multiple times (idempotent).
--  Apply in the Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.contact_us (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Seed a single default row if none exists (app fills defaults client-side)
INSERT INTO public.contact_us (id, config)
SELECT gen_random_uuid(), '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.contact_us);

-- 3. Enable RLS
ALTER TABLE public.contact_us ENABLE ROW LEVEL SECURITY;

-- 4. Public can read the page config (the marketing page consumes it)
DROP POLICY IF EXISTS "Public can view contact_us" ON public.contact_us;
CREATE POLICY "Public can view contact_us"
ON public.contact_us FOR SELECT USING (true);

-- 5. Only admins/owners can mutate (defence-in-depth; API also calls
--    requireAdmin. The API uses the service-role key which bypasses RLS —
--    real authorization is requireAdmin() in the route handler.)
DROP POLICY IF EXISTS "Admins can manage contact_us" ON public.contact_us;
CREATE POLICY "Admins can manage contact_us"
ON public.contact_us FOR ALL
USING (auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner'))
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner'));

-- 6. Keep updated_at fresh on every write (helper defined in 01_init_schema.sql)
DROP TRIGGER IF EXISTS set_contact_us_updated_at ON public.contact_us;
CREATE TRIGGER set_contact_us_updated_at
BEFORE UPDATE ON public.contact_us
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
