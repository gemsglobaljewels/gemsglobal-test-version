const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')
const envContent = fs.readFileSync('.env', 'utf8')
const env = {}
envContent.split(/\r?\n/).forEach(line => { const m = line.match(/^([^#=]+)=(.*)$/); if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '') })
const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
;(async () => {
  const { data } = await supa.from('orders').select('id, created_at').order('created_at',{ascending:false}).limit(2)
  data.forEach(o => {
    const raw = o.created_at
    const d = new Date(raw)
    console.log('raw created_at   :', JSON.stringify(raw))
    console.log('  .toISOString() :', d.toISOString())
    console.log('  slice(0,10) UTC:', String(raw).slice(0,10))
    console.log('  IST date       :', d.toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric'}))
    console.log('  IST full       :', d.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}))
    console.log('---')
  })
})()
