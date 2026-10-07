-- ─────────────────────────────────────────────────────────────────────────
-- 117 · Fix reviews RLS infinite recursion
--
-- Symptom (production): anon SELECT on public.reviews 500s with
--   "infinite recursion detected in policy for relation admin_users".
-- Some older reviews policy queries admin_users, whose own policies loop
-- back — every policy on the table becomes unusable.
--
-- Fix: drop EVERY policy on reviews and recreate a minimal, recursion-free
-- set. Writes from the app go through service-role API routes (which bypass
-- RLS); these policies only cover direct client access.
-- Run once in Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  p text;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reviews'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.reviews', p);
  END LOOP;
END $$;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public read: storefront rating aggregation + review lists.
CREATE POLICY reviews_public_read ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (true);

-- Authenticated customers manage ONLY their own rows.
CREATE POLICY reviews_insert_own ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY reviews_update_own ON public.reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY reviews_delete_own ON public.reviews
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT ON TABLE public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reviews TO authenticated;
GRANT ALL ON TABLE public.reviews TO service_role;
