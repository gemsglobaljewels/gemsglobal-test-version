import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = {}
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data: orders, error } = await supabase
  .from('orders')
  .select('id,email,status,total_price,currency,created_at,notes,order_items(quantity,price_at_purchase)')
  .order('created_at', { ascending: false })
  .limit(40)

if (error) { console.error('ERR:', error); process.exit(1) }

console.log('recent orders (total_price / currency):')
for (const o of orders) {
  const items = (o.order_items || []).map(i => `${i.quantity}x${i.price_at_purchase}`).join(',')
  console.log(
    `  ${o.id.slice(0,8)} | cur=${String(o.currency).padEnd(4)} | total=${String(o.total_price).padStart(10)} | ${String(o.status).padEnd(10)} | items=[${items}] | ${o.email}`
  )
}

// currency distribution
const dist = {}
for (const o of orders) dist[o.currency ?? 'null'] = (dist[o.currency ?? 'null'] || 0) + 1
console.log('\ncurrency distribution (last 40):', dist)

// Flag suspicious: currency USD but total looks like an INR magnitude, or vice-versa
console.log('\npotential inconsistencies:')
for (const o of orders) {
  const t = Number(o.total_price)
  if (o.currency === 'USD' && t > 2000) console.log(`  USD order with large total ${t} (looks like INR?) -> ${o.id.slice(0,8)}`)
  if (o.currency === 'INR' && t > 0 && t < 50) console.log(`  INR order with tiny total ${t} (looks like USD?) -> ${o.id.slice(0,8)}`)
  if (o.currency == null) console.log(`  NULL currency -> ${o.id.slice(0,8)} total=${t}`)
}
