-- ─────────────────────────────────────────────────────────────────────────
-- 121 · Per-product estimated delivery window
--
-- Problem: the PDP could only say a generic "Custom Made — 2–3 Weeks"; the
-- brief asks for a real window the admin controls per product ("1-7 to 7-7"),
-- and a 2–3 week default when the admin hasn't set one.
--
-- Fix: two nullable DATE columns on `products`:
--   · both empty  → storefront falls back to today+14 … today+21,
--   · one empty   → the other side is extended by 7 days,
--   · both set    → used as-is (swapped if reversed).
--
-- Null is the "use the default" signal, so NO backfill is needed — every
-- existing product automatically shows 2–3 weeks from today.
--
-- Shipping method days/prices (standard 10–20 days $30, express 5–8 days
-- $50) live in `site_settings`, which needs no migration.
--
-- Run once in Supabase SQL Editor. Re-running is safe.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS delivery_from DATE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS delivery_to   DATE;

-- PostgREST schema cache — new columns visible immediately.
NOTIFY pgrst, 'reload schema';
