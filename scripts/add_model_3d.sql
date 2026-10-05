-- 1. Add model_3d column to products table if missing
ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS model_3d TEXT;

-- 2. Add video_url column to products table if missing
ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 3. Add key column to product_metal_options table if missing
ALTER TABLE IF EXISTS public.product_metal_options
  ADD COLUMN IF NOT EXISTS key VARCHAR(255);

-- 4. Enable Row Level Security and add public SELECT policy on product_metal_options
ALTER TABLE IF EXISTS public.product_metal_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view product_metal_options" ON public.product_metal_options;
CREATE POLICY "Public can view product_metal_options" ON public.product_metal_options
  FOR SELECT USING (true);

-- 5. Reload PostgREST schema cache to make the columns available in the API immediately
NOTIFY pgrst, 'reload schema';

