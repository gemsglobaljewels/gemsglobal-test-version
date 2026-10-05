-- ════════════════════════════════════════════════════════════════
--  LEGAL / POLICY PAGES — dynamic page configuration
--  Four singleton JSONB config tables (mirror sustainability / repairs):
--    privacy, terms, shipping, returns
--  Each drives its public /<slug> page: eyebrow + title + subtitle +
--  "last updated" line + rich-text (HTML) body, all editable from admin.
--  Safe to run multiple times (idempotent).
--  Apply in the Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
    slug TEXT;
    slugs TEXT[] := ARRAY['privacy', 'terms', 'shipping', 'returns'];
BEGIN
    FOREACH slug IN ARRAY slugs LOOP
        -- 1. Create table
        EXECUTE format($f$
            CREATE TABLE IF NOT EXISTS public.%I (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                is_active BOOLEAN DEFAULT true,
                config JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
            );
        $f$, slug);

        -- 2. Seed a single default row if none exists (app fills defaults client-side)
        EXECUTE format($f$
            INSERT INTO public.%I (id, config)
            SELECT gen_random_uuid(), '{}'::jsonb
            WHERE NOT EXISTS (SELECT 1 FROM public.%I);
        $f$, slug, slug);

        -- 3. Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', slug);

        -- 4. Public can read the page config (the marketing page consumes it)
        EXECUTE format('DROP POLICY IF EXISTS "Public can view %I" ON public.%I;', slug, slug);
        EXECUTE format($f$
            CREATE POLICY "Public can view %I"
            ON public.%I FOR SELECT USING (true);
        $f$, slug, slug);

        -- 5. Only admins/owners can mutate (defence-in-depth; API also calls
        --    requireAdmin. The API uses the service-role key which bypasses RLS —
        --    real authorization is requireAdmin() in the route handler.)
        EXECUTE format('DROP POLICY IF EXISTS "Admins can manage %I" ON public.%I;', slug, slug);
        EXECUTE format($f$
            CREATE POLICY "Admins can manage %I"
            ON public.%I FOR ALL
            USING (auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner'))
            WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner'));
        $f$, slug, slug);

        -- 6. Keep updated_at fresh on every write (helper defined in 01_init_schema.sql)
        EXECUTE format('DROP TRIGGER IF EXISTS set_%I_updated_at ON public.%I;', slug, slug);
        EXECUTE format($f$
            CREATE TRIGGER set_%I_updated_at
            BEFORE UPDATE ON public.%I
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
        $f$, slug, slug);
    END LOOP;
END $$;
