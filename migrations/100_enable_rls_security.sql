-- ============================================================================
-- 100_enable_rls_security.sql
-- Enable Row Level Security (RLS) on every application table.
--
-- WHY THIS MATTERS
--   The anon key is public (it ships to the browser as NEXT_PUBLIC_SUPABASE_ANON_KEY).
--   Anyone can call https://<project-ref>.supabase.co/rest/v1/<table> with it.
--   Without RLS, that REST endpoint exposes//mutates every table DIRECTLY,
--   completely bypassing the Next.js /api routes and their auth checks.
--
--   RLS is the real enforcement boundary for client (anon) access.
--
-- HOW THE APP KEEPS WORKING
--   All server /api routes use the SERVICE ROLE key (lib/supabaseServer.ts),
--   which BYPASSES RLS. So every admin/API operation keeps working unchanged.
--   Only DIRECT anon-key access from the browser is now restricted:
--     * public catalog/marketing tables  -> SELECT allowed for everyone
--     * users                            -> each user sees/edits only their own row
--     * everything else                  -> no anon access (service role only)
--
-- SAFE TO RUN MULTIPLE TIMES (idempotent). Run it in the Supabase SQL editor,
-- then smoke-test the storefront + admin panel.
-- ============================================================================

-- 1) Enable RLS on ALL known tables (skips any that don't exist) --------------
DO $$
DECLARE
  t text;
  all_tables text[] := ARRAY[
    'users','admin_users','admin_profiles',
    'products','categories','product_metal_options','product_size_options',
    'metal_options','size_options','ring_styles','diamond_shapes',
    'blogs','saved_blogs','reviews','review_likes','testimonials',
    'hero_sections','img_gallery','instagram_settings','instagram_reels',
    'mega_menu_sections','header_config','site_settings',
    'appointment_services','appointments',
    'orders','order_items','carts','wishlist',
    'custom_payment_requests','custom_payment_events','custom_orders',
    'offline_sales','offline_sale_items','ledger_entries','inventory_movements',
    'messages','conversations','chat_sessions',
    'newsletter_subscribers','analytics_events','page_sessions',
    'stripe_webhook_events'
  ];
BEGIN
  FOREACH t IN ARRAY all_tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;

-- 2) Public READ-ONLY tables (storefront reads these with the anon key) -------
--    These are non-sensitive catalog / marketing / site-config tables.
DO $$
DECLARE
  t text;
  public_read text[] := ARRAY[
    'products','categories','product_metal_options','product_size_options',
    'metal_options','size_options','ring_styles','diamond_shapes',
    'blogs','reviews','review_likes','testimonials',
    'hero_sections','img_gallery','instagram_settings','instagram_reels',
    'mega_menu_sections','header_config','site_settings',
    'appointment_services'
  ];
BEGIN
  FOREACH t IN ARRAY public_read LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_public_read', t);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)',
        t || '_public_read', t
      );
    END IF;
  END LOOP;
END $$;

-- 3) users: each authenticated user may see & edit ONLY their own row ---------
--    (Writes still primarily go through service-role API routes; these policies
--     cover the direct client calls in lib/auth.ts.)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    DROP POLICY IF EXISTS users_select_own ON public.users;
    DROP POLICY IF EXISTS users_update_own ON public.users;
    DROP POLICY IF EXISTS users_insert_own ON public.users;

    CREATE POLICY users_select_own ON public.users
      FOR SELECT TO authenticated USING (auth.uid() = id);
    CREATE POLICY users_update_own ON public.users
      FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    CREATE POLICY users_insert_own ON public.users
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 4) Everything else -----------------------------------------------------------
--    Tables NOT listed in section 2/3 now have RLS enabled with NO anon policy,
--    which means the anon/authenticated roles get ZERO direct access. All reads
--    and writes for those tables must go through the service-role /api routes.
--    This intentionally covers: orders, order_items, carts, wishlist, saved_blogs,
--    appointments, custom_payment_*, offline_sales*, ledger_entries,
--    inventory_movements, messages, conversations, chat_sessions,
--    newsletter_subscribers, analytics_events, page_sessions,
--    stripe_webhook_events, admin_users, admin_profiles.
--
-- NOTE: If you later add direct client (anon) access to any of these, add a
--       scoped policy here rather than disabling RLS.

-- Optional hardening: revoke blanket table grants from anon so that even a
-- future accidental "enable read" via PostgREST needs an explicit policy.
-- (Supabase default grants SELECT to anon on new tables via the "anon" role.)
-- Uncomment only after verifying the storefront still loads:
-- REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;  -- policies still gate rows
