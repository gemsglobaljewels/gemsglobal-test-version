const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env
const envContent = fs.readFileSync('.env', 'utf8')
const env = {}
envContent.split(/\r?\n/).forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
})

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(url, key)

async function check() {
  console.log('Querying testimonials table...')
  const { data, error } = await supabase.from('testimonials').select('*')
  if (error) {
    console.error('Error fetching testimonials:', error)
  } else {
    console.log('Success! Count:', data.length)
    console.log('Testimonials:', data)
  }
}

check().catch(console.error)
