-- 1. Create Blogs Table
CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    image_url TEXT,
    author TEXT DEFAULT 'Admin',
    is_visible BOOLEAN DEFAULT true,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- 3. Policies for Blogs
CREATE POLICY "Allow public read access for visible blogs" 
ON public.blogs FOR SELECT 
TO anon, authenticated 
USING (is_visible = true);

CREATE POLICY "Allow service role full access to blogs" 
ON public.blogs FOR ALL 
TO service_role 
USING (true);

-- 4. Storage Bucket for Blog Images
-- Note: Supabase UI or API should be used to create 'blog-images' bucket if not exists.
-- The following are policy templates for the bucket.

-- Allow public access to blog images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'blog-images');

-- Allow authenticated (admin) to upload/delete
CREATE POLICY "Admin Full Access" ON storage.objects FOR ALL TO service_role USING (bucket_id = 'blog-images');
