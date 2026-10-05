-- ══════════════════════════════════════════════════════
-- 09_TESTIMONIALS SETUP
-- Run this script in the Supabase Dashboard -> SQL Editor
-- ══════════════════════════════════════════════════════

-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Customer info
  name TEXT NOT NULL,
  location TEXT DEFAULT '',
  email TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  
  -- Review content
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  review TEXT NOT NULL,
  product_name TEXT DEFAULT '',
  product_image_url TEXT DEFAULT '',
  product_images JSONB DEFAULT '[]', -- Multiple product images
  tag TEXT DEFAULT '',               -- e.g. 'Verified Buyer', 'Bridal Collection', 'Trending'
  
  -- Source / platform
  source TEXT DEFAULT 'manual',      -- 'google', 'manual', 'instagram', 'facebook'
  source_url TEXT DEFAULT '',        -- link to original review if external
  
  -- Status & visibility
  is_visible BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- show first / highlight on homepage
  is_verified BOOLEAN DEFAULT true,  -- verified purchase badge
  
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  review_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for frontend query (visible, ordered)
CREATE INDEX IF NOT EXISTS idx_testimonials_visible 
  ON testimonials (is_visible, sort_order, review_date DESC);

-- Index for featured testimonials
CREATE INDEX IF NOT EXISTS idx_testimonials_featured 
  ON testimonials (is_featured, is_visible);

-- Enable RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can see visible testimonials
DROP POLICY IF EXISTS "Public can view visible testimonials" ON testimonials;
CREATE POLICY "Public can view visible testimonials"
  ON testimonials FOR SELECT
  USING (is_visible = true);

-- Service role full access
DROP POLICY IF EXISTS "Service role full access" ON testimonials;
CREATE POLICY "Service role full access"
  ON testimonials FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
