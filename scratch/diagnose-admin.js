// Diagnostic: verify which Supabase tables exist, have data, and whether the
// orders JOIN with order_items/products actually works.
// Usage: node scratch/diagnose-admin.js

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env')
  const txt = fs.readFileSync(envPath, 'utf8')
  const env = {}
  txt.split(/\r?\n/).forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  })
  return env
}

const env = loadEnv()
const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const sb = createClient(url, key, { auth: { persistSession: false } })

async function countRows(table) {
  try {
    const { count, error } = await sb.from(table).select('*', { count: 'exact', head: true })
    if (error) return { ok: false, error: error.message, count: 0 }
    return { ok: true, error: null, count: count || 0 }
  } catch (e) {
    return { ok: false, error: e.message, count: 0 }
  }
}

async function main() {
  const tables = [
    'orders',
    'order_items',
    'products',
    'categories',
    'offline_sales',
    'offline_sale_items',
    'appointments',
    'inventory_movements',
  ]

  console.log('\n=== Table existence / row counts ===\n')
  for (const t of tables) {
    const r = await countRows(t)
    const tag = r.ok ? 'OK ' : 'ERR'
    console.log(`[${tag}] ${t.padEnd(22)} rows=${String(r.count).padStart(6)}  ${r.ok ? '' : '→ ' + r.error}`)
  }

  console.log('\n=== Sample orders (raw columns) ===\n')
  const { data: orders, error: oErr } = await sb
    .from('orders')
    .select('id, email, status, total_price, currency, created_at, payment_method, user_id')
    .order('created_at', { ascending: false })
    .limit(2)
  if (oErr) console.log('orders select error:', oErr.message)
  else console.log(JSON.stringify(orders, null, 2))

  console.log('\n=== Does the orders → order_items JOIN work? ===\n')
  const { data: joined, error: joinErr } = await sb
    .from('orders')
    .select('id, order_items(id, quantity, price_at_purchase, product_id, metal, size, products(name, image, images))')
    .order('created_at', { ascending: false })
    .limit(1)
  if (joinErr) {
    console.log('❌ JOIN FAILED:', joinErr.code, joinErr.message)
  } else {
    console.log('✅ JOIN OK. Sample:', JSON.stringify(joined, null, 2))
  }

  // Probe actual column names for the tables that pages depend on
  async function probeColumns(table, cols) {
    console.log(`\n=== Probe columns on ${table} ===`)
    const { data, error } = await sb.from(table).select(cols.join(',')).limit(1)
    if (error) {
      console.log(`❌ ${table}: ${error.code} ${error.message}`)
      // Try to figure out which column is the problem by probing individually
      for (const c of cols) {
        const r = await sb.from(table).select(c).limit(1)
        if (r.error) console.log(`   - missing/bad column: ${c} → ${r.error.message}`)
      }
    } else {
      console.log(`✅ ${table}: all columns readable. row:`, JSON.stringify(data))
    }
  }

  await probeColumns('categories', ['id', 'name', 'slug', 'image_url', 'show_on_home', 'created_at', 'updated_at', 'description', 'parent_category_id'])
  await probeColumns('offline_sales', ['id', 'customer_name', 'customer_email', 'customer_phone', 'subtotal', 'discount_total', 'total_price', 'created_at'])
  await probeColumns('appointments', ['id', 'user_id', 'customer_name', 'customer_email', 'customer_phone', 'appointment_date', 'appointment_time', 'service_type', 'status', 'notes', 'created_at'])
  await probeColumns('inventory_movements', ['product_id', 'product_name', 'change', 'quantity_after', 'reason', 'created_at'])
}

main().catch(e => {
  console.error('Fatal:', e)
  process.exit(1)
})
