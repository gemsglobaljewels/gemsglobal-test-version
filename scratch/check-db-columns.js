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
  console.log('Testing exec_sql with sql parameter...')
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position;
    `
  })
  
  if (error) {
    console.error('exec_sql failed:', error)
  } else {
    console.log('Columns in products table:')
    console.log(data)
  }
}

run().catch(console.error)
