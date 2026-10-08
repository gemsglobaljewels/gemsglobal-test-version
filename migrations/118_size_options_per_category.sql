-- ─────────────────────────────────────────────────────────────────────────
-- 118 · Per-category size options (rings ≠ necklaces ≠ bracelets)
--
-- Problem: `size_options` was one global list (US ring sizes 3–9), so EVERY
-- product — necklaces, bracelets, earrings — offered ring sizes.
-- Fix: each size option may belong to specific categories via `category_ids`
-- (TEXT[] of category UUIDs). NULL or empty array = universal (legacy
-- behaviour, used by "One Size" style options).
--
-- Steps:
--   1. add the column + GIN index,
--   2. tag the EXISTING US ring sizes (keys like `5-us`) to ring categories,
--   3. seed the missing ring sizes 9.5 / 10,
--   4. seed necklace lengths (inch) + bracelet sizes (inch),
--   5. drop per-product size rows that contradict the new scoping.
--
-- Every seed is guarded by "target categories exist", so nothing can land
-- universal by accident. Run once in Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.size_options
  ADD COLUMN IF NOT EXISTS category_ids TEXT[] NULL;

CREATE INDEX IF NOT EXISTS idx_size_options_cats
  ON public.size_options USING GIN (category_ids);

-- Reload the PostgREST schema cache so the new column is visible immediately.
NOTIFY pgrst, 'reload schema';

-- ── 1. Tag the existing US ring sizes to ring categories ───────────────────
-- Current rows are keys like `5-us` / `5-1-2-us` with names like "5 US".
-- Only ring-looking rows are touched; already-tagged rows and anything else
-- (future "One Size" rows) are left alone. Earrings are excluded.
WITH ring_ids AS (
  SELECT ARRAY_AGG(id::TEXT) AS ids
  FROM public.categories
  WHERE (slug ILIKE '%ring%' OR name ILIKE '%ring%')
    AND slug NOT ILIKE '%earring%' AND name NOT ILIKE '%earring%'
)
UPDATE public.size_options s
SET category_ids = r.ids
FROM ring_ids r
WHERE s.category_ids IS NULL
  AND r.ids IS NOT NULL
  AND (
        s.key LIKE '%-us'
     OR s.key ~ '^[0-9]+(-[0-9]+)?(-[0-9]+)?$'
     OR s.name ~ '^[0-9]+(\.[0-9]+)? ?US$'
  );

-- ── 2. Missing ring sizes (9.5 / 10), existing key convention ──────────────
INSERT INTO public.size_options (key, name, price_modifier, is_enabled, position, category_ids)
SELECT v.key, v.name, 0, true, v.pos, r.ids
FROM (VALUES
  ('9-1-2-us', '9 1/2 US', 25),
  ('10-us',    '10 US',    26)
) AS v(key, name, pos)
CROSS JOIN (
  SELECT ARRAY_AGG(id::TEXT) AS ids FROM public.categories
  WHERE (slug ILIKE '%ring%' OR name ILIKE '%ring%')
    AND slug NOT ILIKE '%earring%' AND name NOT ILIKE '%earring%'
) r
WHERE r.ids IS NOT NULL
ON CONFLICT (key) DO NOTHING;

-- ── 3. Necklace lengths (inch) ─────────────────────────────────────────────
INSERT INTO public.size_options (key, name, price_modifier, is_enabled, position, category_ids)
SELECT v.key, v.name, 0, true, 200 + v.pos, n.ids
FROM (VALUES
  ('14-inch', '14 inch', 0), ('15-inch', '15 inch', 1), ('16-inch', '16 inch', 2),
  ('18-inch', '18 inch', 3), ('20-inch', '20 inch', 4), ('22-inch', '22 inch', 5),
  ('24-inch', '24 inch', 6)
) AS v(key, name, pos)
CROSS JOIN (
  SELECT ARRAY_AGG(id::TEXT) AS ids FROM public.categories
  WHERE slug ILIKE '%necklace%' OR name ILIKE '%necklace%'
     OR slug ILIKE '%pendant%' OR name ILIKE '%pendant%'
) n
WHERE n.ids IS NOT NULL
ON CONFLICT (key) DO NOTHING;

-- ── 4. Bracelet sizes (inch) ───────────────────────────────────────────────
INSERT INTO public.size_options (key, name, price_modifier, is_enabled, position, category_ids)
SELECT v.key, v.name, 0, true, 300 + v.pos, b.ids
FROM (VALUES
  ('br-6-inch', '6 inch', 0), ('br-6-5-inch', '6.5 inch', 1), ('br-7-inch', '7 inch', 2),
  ('br-7-5-inch', '7.5 inch', 3), ('br-8-inch', '8 inch', 4), ('br-8-5-inch', '8.5 inch', 5)
) AS v(key, name, pos)
CROSS JOIN (
  SELECT ARRAY_AGG(id::TEXT) AS ids FROM public.categories
  WHERE slug ILIKE '%bracelet%' OR name ILIKE '%bracelet%'
     OR slug ILIKE '%bangle%'   OR name ILIKE '%bangle%'
) b
WHERE b.ids IS NOT NULL
ON CONFLICT (key) DO NOTHING;

-- ── 5. Clean up per-product selections that contradict the new scoping ─────
-- The PDP reads product_size_options, so a necklace that once had ring sizes
-- ticked would still offer them. Drop only rows whose GLOBAL size is scoped
-- to categories this product does not belong to. Products without a
-- category_id and universal (empty) sizes are left untouched.
DELETE FROM public.product_size_options pso
USING public.products p, public.size_options so
WHERE so.key = pso.key
  AND p.id = pso.product_id
  AND p.category_id IS NOT NULL
  AND so.category_ids IS NOT NULL
  AND so.category_ids <> '{}'
  AND NOT (p.category_id::text = ANY (so.category_ids));
