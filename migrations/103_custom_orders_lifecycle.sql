-- ════════════════════════════════════════════════════════════════════════════
-- CUSTOM ORDERS — 6-STAGE FORWARD-ONLY LIFECYCLE
--
-- Replaces the original 5-status set (new/in_progress/replied/closed/archived)
-- with the bespoke fulfilment funnel:
--
--   new → replied → processing → payment_done → process_complete → place_order
--
-- The application enforces "forward-only" (a request never reverts to an earlier
-- stage); this migration just widens the CHECK constraint and remaps any legacy
-- rows onto the new vocabulary.
--
-- Idempotent: safe to run multiple times. Run in the Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Drop the old CHECK constraint (name is auto-generated; find + drop) ──
DO $$
DECLARE
  con_name TEXT;
BEGIN
  SELECT c.conname INTO con_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'custom_orders'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%status%';

  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.custom_orders DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

-- ── 2. Remap legacy status values onto the new funnel ───────────────────────
--   in_progress → processing
--   closed      → process_complete
--   archived    → place_order
UPDATE public.custom_orders SET status = 'processing'       WHERE status = 'in_progress';
UPDATE public.custom_orders SET status = 'process_complete' WHERE status = 'closed';
UPDATE public.custom_orders SET status = 'place_order'      WHERE status = 'archived';

-- ── 3. Default → 'new', then add the widened CHECK constraint ───────────────
ALTER TABLE public.custom_orders ALTER COLUMN status SET DEFAULT 'new';

ALTER TABLE public.custom_orders
  ADD CONSTRAINT custom_orders_status_check
  CHECK (status IN (
    'new', 'replied', 'processing', 'payment_done', 'process_complete', 'place_order'
  ));

-- ════════════════════════════════════════════════════════════════════════════
-- Done. custom_orders.status now uses the 6-stage forward-only funnel.
-- ════════════════════════════════════════════════════════════════════════════
