-- Mega Menu System Migration
-- Run this in Supabase SQL Editor

-- Enable uuid-ossp if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Update categories table to add header visibility and display order
ALTER TABLE IF EXISTS public.categories
ADD COLUMN IF NOT EXISTS parent_category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS show_in_header BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS header_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS header_image_url TEXT,
ADD COLUMN IF NOT EXISTS header_description TEXT;

-- 2. Create mega_menu_sections table (for columns in mega menu)
CREATE TABLE IF NOT EXISTS public.mega_menu_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    section_order INTEGER DEFAULT 0,
    section_type TEXT CHECK (section_type IN ('categories', 'links', 'image')) DEFAULT 'categories',
    custom_links JSONB DEFAULT '[]', -- For links section
    data JSONB DEFAULT '[]', -- For categories section (array of child category IDs)
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add data column if it doesn't exist
ALTER TABLE public.mega_menu_sections ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '[]';
-- Add custom_links column if it doesn't exist
ALTER TABLE public.mega_menu_sections ADD COLUMN IF NOT EXISTS custom_links JSONB DEFAULT '[]';
-- Add image_url column if it doesn't exist
ALTER TABLE public.mega_menu_sections ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Create header_config table for overall header settings
CREATE TABLE IF NOT EXISTS public.header_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logo_url TEXT,
    logo_text TEXT DEFAULT 'Gems Global Jewels',
    show_search BOOLEAN DEFAULT TRUE,
    show_cart BOOLEAN DEFAULT TRUE,
    show_account BOOLEAN DEFAULT TRUE,
    phone_number TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insert default header config only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.header_config) THEN
        INSERT INTO public.header_config (logo_text) VALUES ('Gems Global Jewels');
    END IF;
END $$;

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_categories_header ON public.categories(show_in_header, header_order);
CREATE INDEX IF NOT EXISTS idx_mega_menu_category ON public.mega_menu_sections(category_id, section_order);

-- 6. RLS Policies

-- Enable RLS on new tables
ALTER TABLE public.mega_menu_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.header_config ENABLE ROW LEVEL SECURITY;

-- Categories (update existing policies if needed)
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories"
ON public.categories
FOR SELECT
USING (TRUE);

DROP POLICY IF EXISTS "Admins can modify categories" ON public.categories;
CREATE POLICY "Admins can modify categories"
ON public.categories
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = auth.uid()
        AND admin_users.role IN ('owner', 'admin', 'editor')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = auth.uid()
        AND admin_users.role IN ('owner', 'admin', 'editor')
    )
);

-- Mega Menu Sections Policies
DROP POLICY IF EXISTS "Public can view mega menu sections" ON public.mega_menu_sections;
CREATE POLICY "Public can view mega menu sections"
ON public.mega_menu_sections
FOR SELECT
USING (TRUE);

DROP POLICY IF EXISTS "Admins can modify mega menu sections" ON public.mega_menu_sections;
CREATE POLICY "Admins can modify mega menu sections"
ON public.mega_menu_sections
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = auth.uid()
        AND admin_users.role IN ('owner', 'admin', 'editor')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = auth.uid()
        AND admin_users.role IN ('owner', 'admin', 'editor')
    )
);

-- Header Config Policies
DROP POLICY IF EXISTS "Public can view header config" ON public.header_config;
CREATE POLICY "Public can view header config"
ON public.header_config
FOR SELECT
USING (TRUE);

DROP POLICY IF EXISTS "Admins can modify header config" ON public.header_config;
CREATE POLICY "Admins can modify header config"
ON public.header_config
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = auth.uid()
        AND admin_users.role IN ('owner', 'admin', 'editor')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = auth.uid()
        AND admin_users.role IN ('owner', 'admin', 'editor')
    )
);

-- 7. Create updated_at trigger if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Add triggers for updated_at
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_mega_menu_sections_updated_at ON public.mega_menu_sections;
CREATE TRIGGER update_mega_menu_sections_updated_at
BEFORE UPDATE ON public.mega_menu_sections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_header_config_updated_at ON public.header_config;
CREATE TRIGGER update_header_config_updated_at
BEFORE UPDATE ON public.header_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Done!
