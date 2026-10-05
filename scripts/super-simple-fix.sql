
-- ======================================
-- SUPER SIMPLE CATEGORIES FIX
-- Run this in Supabase SQL Editor
-- ======================================

-- 1. Add missing columns
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_category_id UUID;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN DEFAULT FALSE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. TEMPORARILY DISABLE RLS (for testing)
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Done!
