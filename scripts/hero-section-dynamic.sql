-- SQL for dynamic Hero Section management

-- 1. Create hero_sections table
CREATE TABLE IF NOT EXISTS public.hero_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_active BOOLEAN DEFAULT true,
    slides JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Insert a default record if none exists
INSERT INTO public.hero_sections (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM public.hero_sections);

-- 3. Enable RLS
ALTER TABLE public.hero_sections ENABLE ROW LEVEL SECURITY;

-- 4. Create public access policy
CREATE POLICY "Public can view hero_sections" 
ON public.hero_sections 
FOR SELECT 
USING (true);

-- 5. Create admin access policy (replace with your admin auth logic if needed)
CREATE POLICY "Admins can update hero_sections" 
ON public.hero_sections 
FOR ALL
USING (auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner'))
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner'));

-- 6. Create storage bucket for hero assets
-- NOTE: This part usually needs to be done via Supabase dashboard or API, 
-- but here is the logic for bucket policies if it exists.
-- The bucket name is 'hero-assets'

-- Policy for public read access to hero-assets bucket
CREATE POLICY "Public can view hero assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'hero-assets');

-- Policy for admin write access to hero-assets bucket
CREATE POLICY "Admins can manage hero assets"
ON storage.objects FOR ALL
USING (bucket_id = 'hero-assets' AND auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner'))
WITH CHECK (bucket_id = 'hero-assets' AND auth.uid() IN (SELECT user_id FROM public.admin_users WHERE role = 'admin' OR role = 'owner'));
