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
  console.log('Testing reading product_metal_options...')
  const { data, error } = await supabase.from('product_metal_options').select('*').limit(1)
  if (error) {
    console.error('Failed to read product_metal_options:', error)
  } else {
    console.log('Success! product_metal_options:', data)
  }
}

run().catch(console.error)
