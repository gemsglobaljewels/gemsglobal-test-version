-- Add product linking to image gallery
-- Run this in Supabase SQL Editor

-- Add product_id column to img_gallery table
ALTER TABLE public.img_gallery ADD COLUMN IF NOT EXISTS product_id UUID;

-- Add foreign key constraint to products table
ALTER TABLE public.img_gallery
  ADD CONSTRAINT fk_img_gallery_product
  FOREIGN KEY (product_id)
  REFERENCES public.products(id)
  ON DELETE SET NULL;

-- Add index for product_id lookups
CREATE INDEX IF NOT EXISTS idx_img_gallery_product_id ON public.img_gallery(product_id);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
