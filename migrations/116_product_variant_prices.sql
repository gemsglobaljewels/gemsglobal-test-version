-- Migration 116: per-variant (Metal x Carat) prices
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query > Run).
-- Until this runs, the app keeps working with shared metal+carat sums
-- (variant API calls fail soft and the admin shows a notice).

CREATE TABLE IF NOT EXISTS public.product_variant_prices (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  metal_key VARCHAR(255) NOT NULL,
  carat_key VARCHAR(255) NOT NULL,
  price_modifier NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (product_id, metal_key, carat_key)
);

CREATE INDEX IF NOT EXISTS idx_pvp_product ON public.product_variant_prices(product_id);

ALTER TABLE IF EXISTS public.product_variant_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view product_variant_prices" ON public.product_variant_prices;
CREATE POLICY "Public can view product_variant_prices" ON public.product_variant_prices
  FOR SELECT USING (true);

GRANT ALL ON TABLE public.product_variant_prices TO service_role;
GRANT SELECT ON TABLE public.product_variant_prices TO authenticated;
GRANT SELECT ON TABLE public.product_variant_prices TO anon;

NOTIFY pgrst, 'reload schema';
