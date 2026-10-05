-- ════════════════════════════════════════════════════════════════
--  ABOUT PAGE — dynamic page configuration
--  Singleton JSONB config row (mirrors craftsmanship / gift_guide).
--  Drives the /about page: hero + an ordered list of typed sections
--  (services strip, step timeline, feature grid, story rows, value
--  cards, stats band, CTA banner, free-form image+text) — all
--  addable/removable/reorderable from the admin panel.
--  Safe to run multiple times (idempotent).
--  Apply in the Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════

-- 1. Create about_page table
CREATE TABLE IF NOT EXISTS public.about_page (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Seed a single default row if none exists (the app fills sensible
--    defaults from lib/aboutPage.ts, so an empty config is fine to start with)
INSERT INTO public.about_page (id, config)
SELECT gen_random_uuid(), '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.about_page);

-- 3. Enable RLS
ALTER TABLE public.about_page ENABLE ROW LEVEL SECURITY;

-- 4. Public can read the page config (the marketing page consumes it)
DROP POLICY IF EXISTS "Public can view about page" ON public.about_page;
CREATE POLICY "Public can view about page"
ON public.about_page
FOR SELECT
USING (true);

-- 5. Only admins/owners can mutate (defence-in-depth; API also calls requireAdmin.
--    Note: the API uses the service-role key which bypasses RLS — real
--    authorization is requireAdmin() in the route handler.)
DROP POLICY IF EXISTS "Admins can manage about page" ON public.about_page;
CREATE POLICY "Admins can manage about page"
ON public.about_page
FOR ALL
USING (auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner'))
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner'));

-- 6. Keep updated_at fresh on every write (shared helper defined in 01_init_schema.sql)
DROP TRIGGER IF EXISTS set_about_page_updated_at ON public.about_page;
CREATE TRIGGER set_about_page_updated_at
BEFORE UPDATE ON public.about_page
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
