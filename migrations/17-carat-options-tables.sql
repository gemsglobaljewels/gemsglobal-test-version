-- Carat Options Table Migration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.carat_options (
  key VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255),
  price_modifier NUMERIC DEFAULT 0,
  is_enabled BOOLEAN DEFAULT TRUE,
  position INTEGER DEFAULT 0
);

-- Insert default carat options if table is empty
INSERT INTO public.carat_options (key, name, price_modifier, is_enabled, position)
VALUES 
  ('0-50-ct', '0.50 Carat', 0, true, 0),
  ('0-75-ct', '0.75 Carat', 0, true, 1),
  ('1-00-ct', '1.00 Carat', 0, true, 2),
  ('1-50-ct', '1.50 Carat', 0, true, 3),
  ('2-00-ct', '2.00 Carat', 0, true, 4),
  ('2-50-ct', '2.50 Carat', 0, true, 5),
  ('3-00-ct', '3.00 Carat', 0, true, 6)
ON CONFLICT (key) DO NOTHING;

-- Add index for ordering
CREATE INDEX IF NOT EXISTS idx_carat_options_position ON public.carat_options(position);

-- Product Carat Options Table (links products to selected carats and product-specific prices)
CREATE TABLE IF NOT EXISTS public.product_carat_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  carat_name VARCHAR(255) NOT NULL,
  price_modifier NUMERIC DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and add public SELECT policy on product_carat_options
ALTER TABLE IF EXISTS public.product_carat_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view product_carat_options" ON public.product_carat_options;
CREATE POLICY "Public can view product_carat_options" ON public.product_carat_options
  FOR SELECT USING (true);

-- Enable RLS and add public SELECT policy on carat_options
ALTER TABLE IF EXISTS public.carat_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view carat_options" ON public.carat_options;
CREATE POLICY "Public can view carat_options" ON public.carat_options
  FOR SELECT USING (true);

-- Grant appropriate permissions to anon, authenticated, and service_role
GRANT ALL ON TABLE public.carat_options TO service_role;
GRANT SELECT ON TABLE public.carat_options TO authenticated;
GRANT SELECT ON TABLE public.carat_options TO anon;

GRANT ALL ON TABLE public.product_carat_options TO service_role;
GRANT SELECT ON TABLE public.product_carat_options TO authenticated;
GRANT SELECT ON TABLE public.product_carat_options TO anon;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
