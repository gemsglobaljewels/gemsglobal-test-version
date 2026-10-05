
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

const fixSql = `
-- Add show_on_home column if missing
ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN DEFAULT FALSE;

-- Add slug column if missing
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug TEXT;

-- Add parent_category_id if missing (with self reference)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'parent_category_id'
  ) THEN
    ALTER TABLE categories ADD COLUMN parent_category_id UUID REFERENCES categories(id);
  END IF;
END $$;

-- Add image_url if missing
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
`

async function run() {
  console.log('Connecting to Supabase at:', url)
  console.log('Fixing categories database schema...')

  const { data, error } = await supabase.rpc('exec', { sql: fixSql })

  if (error) {
    console.error('Error executing SQL via RPC:', error)
    console.log('\n==========================================')
    console.log('Please run this SQL in your Supabase SQL Editor:')
    console.log('==========================================')
    console.log(fixSql)
    console.log('==========================================')
    process.exit(1)
  }

  console.log('Database migration executed successfully! Output:', data)
  console.log('Checking if columns exist now...')

  try {
    const { data: testData, error: testError } = await supabase
      .from('categories')
      .select('id, name, slug, show_on_home, parent_category_id, image_url')
      .limit(1)

    if (testError) {
      console.error('Failed to query categories table:', testError)
    } else {
      console.log('✅ All columns are present! Categories table is now fixed!')
    }
  } catch (e) {
    console.log('Could not query categories, but SQL ran successfully!')
  }

  console.log('\n🎉 Category fix complete!')
}

run().catch(console.error)
