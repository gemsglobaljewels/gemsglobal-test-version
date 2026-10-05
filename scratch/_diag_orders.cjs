const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')
const envContent = fs.readFileSync('.env', 'utf8')
const env = {}
envContent.split(/\r?\n/).forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
})
const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
;(async () => {
  const { data, error } = await supa
    .from('orders')
    .select('id, email, total_price, subtotal, tax, shipping_cost, currency, payment_method, created_at')
    .order('created_at', { ascending: false })
    .limit(60)
  if (error) { console.error('ERR', error.message); process.exit(1) }
  console.log('Total fetched:', data.length)
  // Distribution
  const buckets = { 'INR <500': 0, 'INR 500-5000': 0, 'INR >5000': 0, 'USD': 0, 'other': 0 }
  data.forEach(o => {
    const c = String(o.currency||'INR').toUpperCase()
    const t = Number(o.total_price)
    if (c === 'USD') buckets['USD']++
    else if (c === 'INR' && t < 500) buckets['INR <500']++
    else if (c === 'INR' && t <= 5000) buckets['INR 500-5000']++
    else if (c === 'INR') buckets['INR >5000']++
    else buckets['other']++
  })
  console.log('Buckets:', JSON.stringify(buckets, null, 2))
  console.log('\n--- 25 most recent (date | currency | total | subtotal | tax | ship | pay) ---')
  data.slice(0,25).forEach(o => {
    console.log(
      String(o.created_at).slice(0,19),
      '|', String(o.currency||'?').padEnd(4),
      '| tot', String(o.total_price).padStart(9),
      '| sub', String(o.subtotal).padStart(9),
      '| tax', String(o.tax).padStart(6),
      '| ship', String(o.shipping_cost).padStart(5),
      '|', o.payment_method
    )
  })
})()
