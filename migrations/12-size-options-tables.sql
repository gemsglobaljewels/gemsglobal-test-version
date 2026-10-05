-- Size Options Table Migration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.size_options (
  key VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255),
  price_modifier NUMERIC DEFAULT 0,
  is_enabled BOOLEAN DEFAULT TRUE,
  position INTEGER DEFAULT 0
);

-- Insert default size options if table is empty
INSERT INTO public.size_options (key, name, price_modifier, is_enabled, position)
VALUES 
  ('5', '5', 0, true, 0),
  ('5-5', '5.5', 0, true, 1),
  ('6', '6', 0, true, 2),
  ('6-5', '6.5', 0, true, 3),
  ('7', '7', 0, true, 4),
  ('7-5', '7.5', 0, true, 5),
  ('8', '8', 0, true, 6)
ON CONFLICT (key) DO NOTHING;

-- Add index for ordering
CREATE INDEX IF NOT EXISTS idx_size_options_position ON public.size_options(position);

-- Product Size Options Table (links products to selected sizes and product-specific prices)
CREATE TABLE IF NOT EXISTS public.product_size_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  size_name VARCHAR(255) NOT NULL,
  price_modifier NUMERIC DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and add public SELECT policy on product_size_options
ALTER TABLE IF EXISTS public.product_size_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view product_size_options" ON public.product_size_options;
CREATE POLICY "Public can view product_size_options" ON public.product_size_options
  FOR SELECT USING (true);

-- Enable RLS and add public SELECT policy on size_options
ALTER TABLE IF EXISTS public.size_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view size_options" ON public.size_options;
CREATE POLICY "Public can view size_options" ON public.size_options
  FOR SELECT USING (true);

-- Grant appropriate permissions to anon, authenticated, and service_role
GRANT ALL ON TABLE public.size_options TO service_role;
GRANT SELECT ON TABLE public.size_options TO authenticated;
GRANT SELECT ON TABLE public.size_options TO anon;

GRANT ALL ON TABLE public.product_size_options TO service_role;
GRANT SELECT ON TABLE public.product_size_options TO authenticated;
GRANT SELECT ON TABLE public.product_size_options TO anon;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
