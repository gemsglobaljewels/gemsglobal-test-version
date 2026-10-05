-- Instagram Feed Tables
-- Run this SQL in your Supabase SQL Editor to add support for Shop the Feed

-- 1. Add Instagram-related columns to site_settings
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS instagram_username TEXT DEFAULT 'gemsglobaljewels',
ADD COLUMN IF NOT EXISTS instagram_link TEXT DEFAULT 'https://instagram.com/gemsglobaljewels',
ADD COLUMN IF NOT EXISTS instagram_logo_url TEXT;

-- 2. Create instagram_reels table
CREATE TABLE IF NOT EXISTS instagram_reels (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  product_ids TEXT[] DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS (optional but recommended)
ALTER TABLE instagram_reels ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies (adjust if you have specific roles)
-- Drop if exists first to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON instagram_reels;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON instagram_reels;

CREATE POLICY "Enable read access for all users"
  ON instagram_reels FOR SELECT USING (true);

CREATE POLICY "Enable all access for authenticated users"
  ON instagram_reels FOR ALL USING (auth.role() = 'authenticated');

-- 5. Create an index on position (for sorting performance)
CREATE INDEX IF NOT EXISTS idx_instagram_reels_position ON instagram_reels(position);