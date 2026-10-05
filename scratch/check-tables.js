const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
const envContent = fs.readFileSync('.env', 'utf8')
const env = {}
envContent.split(/\r?\n/).forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
})

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(url, key)

async function run() {
  console.log('Checking columns on order_items...')
  const { data: cols, error: err } = await supabase.rpc('exec_sql', {
    query: `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'order_items' 
      ORDER BY ordinal_position;
    `
  })
  if (err) console.error(err)
  else console.log(cols)

  console.log('Checking if size_options / product_size_options table exists...')
  const { data: tables, error: err2 } = await supabase.rpc('exec_sql', {
    query: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE '%size%';
    `
  })
  if (err2) console.error(err2)
  else console.log(tables)
}

run().catch(console.error)
