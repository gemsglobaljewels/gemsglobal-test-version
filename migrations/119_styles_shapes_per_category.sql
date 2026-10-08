-- ─────────────────────────────────────────────────────────────────────────
-- 119 · Per-category styles & diamond shapes
--
-- Problem: the homepage "Rings By Style" list was ONE global list, so
-- necklace / bracelet styles ended up inside a ring-style section, and the
-- diamond-shape strip could not be limited to the categories it belongs to.
--
-- Fix: `category_ids TEXT[]` on both lookup tables (same model as
-- migration 118 for size options):
--   · NULL / empty array = every category (legacy behaviour),
--   · non-empty          = only those category UUIDs.
--
-- Backfill (family-aware — see below):
--   · a style is classified from its key/name: 'pendant-necklace' →
--     necklaces, 'studs' → earrings, 'bangle' → bracelets, everything else
--     (Solitaire, Halo, Three Stone…) → ring categories,
--   · `diamond_shapes` stay universal: a shape is a stone cut (round, oval,
--     pear…) and is equally valid on rings, necklaces and loose stones.
--     Admin can still restrict one per Admin → Diamond Shapes.
--
-- Run once in Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.ring_styles   ADD COLUMN IF NOT EXISTS category_ids TEXT[];
ALTER TABLE public.diamond_shapes ADD COLUMN IF NOT EXISTS category_ids TEXT[];

CREATE INDEX IF NOT EXISTS idx_ring_styles_cats
  ON public.ring_styles USING GIN (category_ids);
CREATE INDEX IF NOT EXISTS idx_diamond_shapes_cats
  ON public.diamond_shapes USING GIN (category_ids);

-- PostgREST schema cache — new columns visible immediately.
NOTIFY pgrst, 'reload schema';

-- ── Backfill: classify every existing style by its family ──────────────────
-- Matching runs on key + name, NOT on "everything is a ring": the live table
-- already holds `pendant-necklace` next to the ring styles, and dragging a
-- necklace style into the Rings section is exactly the bug being fixed.
-- Already-scoped rows are skipped, so re-running is safe.
--
--   1) styles that clearly belong to necklaces / bracelets / earrings → that
--      family's categories,
--   2) whatever is left (Solitaire, Halo, Three Stone…) → ring categories.
UPDATE public.ring_styles s
SET category_ids = sub.ids
FROM (
  SELECT st.key,
         CASE
           WHEN st.txt ~ 'earring|stud|hoop|huggie|climber' THEN
             (SELECT ARRAY_AGG(c.id::TEXT) FROM public.categories c
               WHERE LOWER(COALESCE(c.slug, '') || ' ' || COALESCE(c.name, '')) LIKE '%earring%')
           WHEN st.txt ~ 'necklace|pendant|lariat|choker|medallion' THEN
             (SELECT ARRAY_AGG(c.id::TEXT) FROM public.categories c
               WHERE LOWER(COALESCE(c.slug, '') || ' ' || COALESCE(c.name, '')) LIKE '%necklace%'
                  OR LOWER(COALESCE(c.slug, '') || ' ' || COALESCE(c.name, '')) LIKE '%pendant%')
           WHEN st.txt ~ 'bracelet|bangle|cuff|charm|anklet' THEN
             (SELECT ARRAY_AGG(c.id::TEXT) FROM public.categories c
               WHERE LOWER(COALESCE(c.slug, '') || ' ' || COALESCE(c.name, '')) LIKE '%bracelet%'
                  OR LOWER(COALESCE(c.slug, '') || ' ' || COALESCE(c.name, '')) LIKE '%bangle%')
           ELSE
             (SELECT ARRAY_AGG(c.id::TEXT) FROM public.categories c
               WHERE (LOWER(COALESCE(c.slug, '')) LIKE '%ring%' OR LOWER(COALESCE(c.name, '')) LIKE '%ring%')
                 AND LOWER(COALESCE(c.slug, '')) NOT LIKE '%earring%'
                 AND LOWER(COALESCE(c.name, '')) NOT LIKE '%earring%')
         END AS ids
  FROM (
    SELECT key, name, LOWER(COALESCE(key, '') || ' ' || COALESCE(name, '')) AS txt
    FROM public.ring_styles
    WHERE category_ids IS NULL
  ) st
) sub
WHERE s.key = sub.key
  AND sub.ids IS NOT NULL
  AND cardinality(sub.ids) > 0;

-- ── Seed styles for the other jewellery families ───────────────────────────
-- Without these the homepage "Styles" strip could only ever show rings (the
-- exact complaint this migration fixes). Images start empty on purpose: five
-- cards sharing one category photo looks like a bug, so each row renders the
-- lettered plate until a real photo is uploaded in Admin → Styles.
-- ON CONFLICT keeps re-runs harmless. NB: `desc` is a reserved word in
-- Postgres, so it must be quoted as "desc" everywhere it appears.
-- Categories are resolved by FAMILY PATTERN (not an exact slug match), so a
-- row is never silently dropped just because a slug reads 'necklace' instead
-- of 'necklaces'.
INSERT INTO public.ring_styles (key, name, sub, "desc", image, is_enabled, position, category_ids)
SELECT v.key, v.name, v.sub, v."desc",
       '',
       true, v.pos, cat.ids
FROM (VALUES
  -- Necklaces ('pendant-necklace' already exists in the table; 'medallion'
  -- is seeded instead so the two never collide)
  ('medallion',        'Medallion',        'A round centre of light',      'A coin-sized diamond disc on a fine chain — quietly heirloom.',                      'necklaces', 100),
  ('tennis-necklace',  'Tennis Necklace',  'A continuous line of diamonds', 'Graduated diamonds set end to end for unbroken light around the neckline.',             'necklaces', 101),
  ('lariat',           'Lariat',           'Modern Y-drop silhouette',      'A drop that falls with movement — architectural, and unmistakably contemporary.',        'necklaces', 102),
  ('choker',           'Choker',           'Close & statement-making',      'Sits high on the neck, framing the face with a concentrated line of brilliance.',        'necklaces', 103),
  ('station',          'Station Necklace', 'Diamonds on a fine chain',      'Stones spaced along a delicate chain — light picked out at intervals.',                 'necklaces', 104),
  -- Bracelets
  ('tennis-bracelet',  'Tennis Bracelet',  'Classic line bracelet',         'A flexible line of matched diamonds — the most worn fine-jewellery classic.',           'bracelets', 110),
  ('bangle',           'Bangle',           'Rigid & sculptural',            'A solid circle that holds its shape and stacks cleanly.',                               'bracelets', 111),
  ('charm',            'Charm Bracelet',   'Personal & collectible',        'A bracelet that grows with the wearer — every charm a chapter.',                        'bracelets', 112),
  ('cuff',             'Cuff',             'Open & bold',                   'An open sculptural band — worn slightly loose, always deliberate.',                     'bracelets', 113),
  ('chain-bracelet',   'Chain Bracelet',   'Everyday link',                 'Polished links with just enough weight — built for daily wear.',                        'bracelets', 114),
  -- Earrings
  ('studs',            'Studs',            'Effortless daily sparkle',      'A single stone sitting at the lobe — the piece you never take off.',                    'earrings',  120),
  ('hoops',            'Hoops',            'The forever silhouette',        'A clean circle edged in diamonds — framing the face with movement.',                    'earrings',  121),
  ('drops',            'Drops',            'Movement & length',             'Stones that swing below the lobe — made for evenings and occasion dressing.',           'earrings',  122),
  ('huggies',          'Huggies',          'Close-fitting mini hoops',      'Tiny hugging hoops with pavé — secure, subtle, made for round-the-clock wear.',         'earrings',  123),
  ('ear-climbers',     'Ear Climbers',     'Grows up the lobe',             'A single stone that traces the ear upward — the modern alternative to a stud.',         'earrings',  124)
) AS v(key, name, sub, "desc", cat_slug, pos)
CROSS JOIN LATERAL (
  SELECT ARRAY_AGG(c.id::TEXT) AS ids
  FROM public.categories c
  WHERE CASE v.cat_slug
          WHEN 'necklaces' THEN LOWER(COALESCE(c.slug, '') || ' ' || COALESCE(c.name, '')) LIKE '%necklace%'
                             OR LOWER(COALESCE(c.slug, '') || ' ' || COALESCE(c.name, '')) LIKE '%pendant%'
          WHEN 'bracelets' THEN LOWER(COALESCE(c.slug, '') || ' ' || COALESCE(c.name, '')) LIKE '%bracelet%'
                             OR LOWER(COALESCE(c.slug, '') || ' ' || COALESCE(c.name, '')) LIKE '%bangle%'
          WHEN 'earrings'  THEN LOWER(COALESCE(c.slug, '') || ' ' || COALESCE(c.name, '')) LIKE '%earring%'
          ELSE FALSE
        END
) cat
WHERE cat.ids IS NOT NULL
ON CONFLICT (key) DO NOTHING;
