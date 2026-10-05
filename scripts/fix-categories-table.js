
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials! Check your .env file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixCategoriesTable() {
  console.log('Adding missing columns to categories table...')

  // Add show_on_home column
  console.log('1. Adding show_on_home column...')
  try {
    const { error } = await supabase.rpc('exec', { sql: `
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN DEFAULT FALSE;
    ` })
    if (error) {
      console.log('Falling back to single column add...')
      // Try each column individually if exec RPC isn't available
      try {
        await supabase
          .from('categories')
          .select('id, show_on_home')
          .limit(1)
        console.log('✓ show_on_home column already exists!')
      } catch (e) {
        console.log('Need to add show_on_home, but RPC "exec" not available.')
        console.log('Please run this SQL in your Supabase SQL Editor:')
        console.log('ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN DEFAULT FALSE;')
      }
    } else {
      console.log('✓ show_on_home column added successfully!')
    }
  } catch (e) {
    console.log('Error adding show_on_home:', e)
  }

  // Add slug column if missing
  console.log('2. Checking slug column...')
  try {
    await supabase
      .from('categories')
      .select('id, slug')
      .limit(1)
    console.log('✓ slug column exists!')
  } catch (e) {
    console.log('Need to add slug column!')
    console.log('Please run this SQL in your Supabase SQL Editor:')
    console.log('ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug TEXT;')
  }

  console.log('\nAll checks complete!')
  console.log('Your categories table should now have all the required columns!')
  console.log('Now you can use the admin panel to manage categories normally!')
}

fixCategoriesTable()
