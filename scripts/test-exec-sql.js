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

async function test() {
  console.log('Testing exec_sql...')
  const { data, error } = await supabase.rpc('exec_sql', { query: 'SELECT 1;' })
  if (error) {
    console.error('exec_sql failed:', error)
  } else {
    console.log('exec_sql succeeded! Result:', data)
  }
}

test().catch(console.error)
