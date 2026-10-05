const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

// Read .env
const envContent = fs.readFileSync('.env', 'utf8')
const env = {}
envContent.split(/\r?\n/).forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
})

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
const sb = createClient(url, key)

async function check(table, label) {
  try {
    const { data, error, count } = await sb.from(table).select('*', { count: 'exact', head: false }).limit(1)
    if (error) {
      console.log(`❌ ${label} (${table}): ERROR - ${error.message}`)
    } else {
      console.log(`✅ ${label} (${table}): OK - ${count ?? (data ? data.length : 0)} rows`)
      if (data && data.length > 0) {
        console.log(`   Columns: [${Object.keys(data[0]).join(', ')}]`)
      }
    }
  } catch (e) {
    console.log(`❌ ${label} (${table}): EXCEPTION - ${e.message}`)
  }
}

async function main() {
  console.log('=== Supabase Table Diagnostics ===\n')
  await check('orders', 'Orders')
  await check('order_items', 'Order Items')
  await check('products', 'Products')
  await check('categories', 'Categories')
  await check('offline_sales', 'Offline Sales')
  await check('offline_sale_items', 'Offline Sale Items')
  await check('appointments', 'Appointments')
  await check('inventory_movements', 'Inventory Movements')
}

main().catch(console.error)
