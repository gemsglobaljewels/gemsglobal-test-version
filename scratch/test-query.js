const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

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
  console.log('Testing query on products table...')
  const { data, error } = await supabase.from('products').select('*').limit(1)
  if (error) {
    console.error('Error querying products:', error)
  } else {
    const keys = Object.keys(data[0] || {})
    console.log('Columns in products table:', keys)
    console.log('Includes model_3d?', keys.includes('model_3d'))
  }
}

run().catch(console.error)
