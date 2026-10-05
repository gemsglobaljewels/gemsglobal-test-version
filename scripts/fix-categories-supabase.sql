
-- ======================================
-- COMPLETE CATEGORIES TABLE FIX
-- Run this in your Supabase SQL Editor
-- ======================================

-- 1. Add missing columns (IF NOT EXISTS = safe!)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN DEFAULT FALSE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 3. Drop old policies if they exist
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;

-- 4. Create NEW RLS policies (for everyone to read, authenticated users to write)
CREATE POLICY "Categories are viewable by everyone"
ON categories FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage categories"
ON categories FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 5. Add indexes for performance (optional but recommended)
DROP INDEX IF EXISTS idx_categories_parent_id;
DROP INDEX IF EXISTS idx_categories_show_on_home;

CREATE INDEX idx_categories_parent_id ON categories(parent_category_id);
CREATE INDEX idx_categories_show_on_home ON categories(show_on_home);

-- 6. (Optional) Add a function to auto-generate slugs if needed
CREATE OR REPLACE FUNCTION generate_category_slug()
RETURNS TRIGGER AS $$
BEGIN
  NEW.slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9\s]', '', 'g'));
  NEW.slug := REGEXP_REPLACE(NEW.slug, '\s+', '-', 'g');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. (Optional) Drop old trigger if exists
DROP TRIGGER IF EXISTS trigger_category_slug ON categories;

-- 8. (Optional) Create trigger to auto-generate slug
CREATE TRIGGER trigger_category_slug
BEFORE INSERT OR UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION generate_category_slug();

-- Done!
