import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/apiAuth'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const FRESH_SQL = `
-- ======================================
-- FRESH CATEGORIES SETUP
-- ======================================

-- [OPTIONAL] Drop old table if you want to start completely fresh
-- DROP TABLE IF EXISTS categories CASCADE;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  image_url TEXT,
  parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  show_on_home BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ======================================
-- RLS POLICIES
-- ======================================

-- Policy 1: Anyone can read categories
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories are viewable by everyone" 
ON categories FOR SELECT USING (true);

-- Policy 2: Authenticated users can do everything
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;
CREATE POLICY "Authenticated users can manage categories" 
ON categories FOR ALL USING (auth.role() = 'authenticated');

-- ======================================
-- INDEXES FOR FASTER QUERIES
-- ======================================

-- Index for parent category lookups
DROP INDEX IF EXISTS idx_categories_parent_id;
CREATE INDEX idx_categories_parent_id ON categories(parent_category_id);

-- Index for show_on_home
DROP INDEX IF EXISTS idx_categories_show_on_home;
CREATE INDEX idx_categories_show_on_home ON categories(show_on_home);

-- ======================================
-- ADD MISSING COLUMNS (FOR EXISTING TABLES)
-- ======================================

ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN DEFAULT FALSE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug TEXT;
    `;

    // First try to use exec_sql or exec RPC
    let error: any = null;
    try {
      const result = await supabaseServer.rpc('exec_sql', { sql_query: FRESH_SQL });
      error = result.error;
    } catch (e) {
      try {
        const result = await supabaseServer.rpc('exec', { sql: FRESH_SQL });
        error = result.error;
      } catch (e2) {
        error = e2;
      }
    }

    if (error) {
      console.error('Could not execute SQL via RPC:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Please run the provided SQL in your Supabase SQL Editor',
      sql: FRESH_SQL,
      steps: [
        '1. Go to https://supabase.com/dashboard',
        '2. Select your project',
        '3. Click on "SQL Editor" in the sidebar',
        '4. Click "New Query"',
        '5. Paste the SQL below and click "Run"'
      ]
    });
  } catch (err: any) {
    console.error('Error in fix-db-schema:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
