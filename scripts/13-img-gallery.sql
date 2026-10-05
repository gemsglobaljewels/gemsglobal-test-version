-- Image Gallery Table Migration
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.img_gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  alt_text TEXT DEFAULT '',
  is_big BOOLEAN DEFAULT FALSE,
  side TEXT CHECK (side IN ('left', 'right')) DEFAULT 'left',
  show_shop_now BOOLEAN DEFAULT FALSE,
  magazine_text TEXT,
  magazine_position TEXT CHECK (magazine_position IN ('tl', 'br')) DEFAULT 'tl',
  show_parallax BOOLEAN DEFAULT FALSE,
  show_on_homepage BOOLEAN DEFAULT TRUE,
  position INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT TRUE,
  crop_position TEXT DEFAULT 'center',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patch already-deployed tables: the CREATE TABLE IF NOT EXISTS above will NOT
-- add new columns to a table that already exists, so add crop_position here.
ALTER TABLE public.img_gallery ADD COLUMN IF NOT EXISTS crop_position TEXT DEFAULT 'center';



-- Add index for ordering
CREATE INDEX IF NOT EXISTS idx_img_gallery_position ON public.img_gallery(position);
CREATE INDEX IF NOT EXISTS idx_img_gallery_show_homepage ON public.img_gallery(show_on_homepage);

-- Enable RLS and add policies
ALTER TABLE public.img_gallery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for enabled gallery items" ON public.img_gallery;
CREATE POLICY "Public read access for enabled gallery items" ON public.img_gallery
  FOR SELECT USING (is_enabled = true);

DROP POLICY IF EXISTS "Admins can modify gallery items" ON public.img_gallery;
CREATE POLICY "Admins can modify gallery items" ON public.img_gallery
  FOR ALL USING (
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

-- Grant appropriate permissions
GRANT ALL ON TABLE public.img_gallery TO service_role;
GRANT SELECT ON TABLE public.img_gallery TO authenticated;
GRANT SELECT ON TABLE public.img_gallery TO anon;

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_img_gallery_updated_at ON public.img_gallery;
CREATE TRIGGER update_img_gallery_updated_at BEFORE UPDATE ON public.img_gallery
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
