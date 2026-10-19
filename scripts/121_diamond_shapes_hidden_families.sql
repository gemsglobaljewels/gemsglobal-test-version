-- Migration 121: per-box (family) visibility for diamond shapes
--
-- Problem: a single shape can be scoped to several categories, so it shows in
-- MANY homepage boxes (Necklaces AND Diamonds AND …). `is_enabled` is one
-- global switch, so hiding a row from the Necklaces box hid it everywhere.
--
-- Fix: new `hidden_families` TEXT[] column stores WHICH homepage boxes
-- (jewellery families: 'Necklaces', 'Earrings', 'Featured' …) this shape is
-- hidden from. The shape still shows in every other box. The global
-- `is_enabled` switch keeps meaning "off on the homepage everywhere".

ALTER TABLE public.diamond_shapes
  ADD COLUMN IF NOT EXISTS hidden_families TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.diamond_shapes.hidden_families IS
  'Homepage jewellery-family boxes this shape is hidden from. Empty = visible in every box it is scoped to.';
