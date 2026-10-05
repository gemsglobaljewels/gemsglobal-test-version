-- 1. Add custom image column to offline_sale_items
ALTER TABLE public.offline_sale_items 
ADD COLUMN IF NOT EXISTS product_image TEXT;

-- 2. Create storage bucket for offline sale assets
-- (Bucket creation usually handled via dashboard or API, but policies can be scripted)

-- 3. RLS Policies for offline-sale-assets bucket
-- Note: Replace 'admin_users' logic with your specific admin check if needed
CREATE POLICY "Public can view offline sale assets" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'offline-sale-assets');

CREATE POLICY "Admins can manage offline sale assets" 
ON storage.objects FOR ALL 
USING (
  bucket_id = 'offline-sale-assets' AND 
  auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner')
)
WITH CHECK (
  bucket_id = 'offline-sale-assets' AND 
  auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner')
);
