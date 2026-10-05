-- Migration 003: Ensure products can carry a Style and a Diamond Shape for
-- EVERY category (not just rings / diamonds), so both can be filtered site-wide.
--
-- The app reads/writes products.style and products.diamond_shape. These columns
-- may already exist in your Supabase project; the IF NOT EXISTS guards make this
-- safe to run repeatedly.

ALTER TABLE products ADD COLUMN IF NOT EXISTS style VARCHAR(120);
ALTER TABLE products ADD COLUMN IF NOT EXISTS diamond_shape VARCHAR(120);

-- Indexes to keep style/shape filtering fast.
CREATE INDEX IF NOT EXISTS idx_products_style ON products (style);
CREATE INDEX IF NOT EXISTS idx_products_diamond_shape ON products (diamond_shape);
