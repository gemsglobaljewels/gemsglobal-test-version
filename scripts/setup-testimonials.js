const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env
const envContent = fs.readFileSync('.env', 'utf8')
const env = {}
envContent.split(/\r?\n/).forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
})

const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing Supabase credentials in .env or process.env')
  process.exit(1)
}

const supabase = createClient(url, key)

const testimonialsSql = `
-- Create testimonials table if not exists
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
`

async function run() {
  console.log('Connecting to Supabase at:', url)
  console.log('Running testimonials database schema migration...')
  
  const { data, error } = await supabase.rpc('exec', { sql: testimonialsSql })
  
  if (error) {
    console.error('Error executing SQL via RPC:', error)
    
    // Sometimes the 'exec' RPC is not defined or has a different name
    console.log('Trying fallback: checking if we can execute this in another way or if we need to guide the user.')
    process.exit(1)
  }
  
  console.log('Database migration executed successfully! Output:', data)
  console.log('Checking if table exists now by querying it...')
  
  const { data: testData, error: testError } = await supabase
    .from('testimonials')
    .select('count')
    .limit(1)
    
  if (testError) {
    console.error('Failed to query testimonials table after creation:', testError)
  } else {
    console.log('Successfully verified testimonials table! Table exists and is queryable.')
  }
}

run().catch(console.error)
