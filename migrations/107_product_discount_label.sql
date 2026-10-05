-- Product on-sale + marketing-label support.
--
-- discount_percent: whole-number percentage (0-95) taken off the retail `price`.
--   0 (the default) means "no discount" and the product renders exactly as before.
--   The sale price is COMPUTED (price * (1 - discount_percent/100)); we never store
--   a second price column, so the retail `price` stays the single source of truth
--   and keeps driving metal/size upcharges.
-- label: optional marketing tag shown as a badge on the card / product page
--   (e.g. "Popular", "Limited", "Featured", "New", "Best Seller", "Sale", "Exclusive",
--   or any custom text). NULL / empty means no label.
--
-- Both columns are additive and nullable/defaulted, so existing rows are unaffected.

ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS label TEXT;

-- Keep discounts sane if the column already existed without a guard.
UPDATE products
  SET discount_percent = 0
  WHERE discount_percent IS NULL OR discount_percent < 0 OR discount_percent > 95;
