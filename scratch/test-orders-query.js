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
  console.log('Testing basic query on orders table...')
  const { data: ordersData, error: ordersError } = await supabase.from('orders').select('*').limit(5)
  if (ordersError) {
    console.error('Error querying orders:', ordersError)
  } else {
    console.log('Orders found:', ordersData ? ordersData.length : 0)
    if (ordersData && ordersData.length > 0) {
      console.log('Sample order columns:', Object.keys(ordersData[0]))
    }
  }

  console.log('Testing query on order_items table...')
  const { data: itemsData, error: itemsError } = await supabase.from('order_items').select('*').limit(5)
  if (itemsError) {
    console.error('Error querying order_items:', itemsError)
  } else {
    console.log('Order items found:', itemsData ? itemsData.length : 0)
    if (itemsData && itemsData.length > 0) {
      console.log('Sample order_items columns:', Object.keys(itemsData[0]))
    }
  }

  console.log('Testing the complex query from route.ts...')
  const { data: complexData, error: complexError } = await supabase
    .from('orders')
    .select(`
      id, 
      email, 
      status, 
      total_price, 
      currency,
      created_at, 
      payment_method,
      order_items (
        id,
        quantity,
        price_at_purchase,
        product_id,
        metal,
        size,
        products (
          name,
          image,
          images
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (complexError) {
    console.error('Error in complex query:', complexError)
  } else {
    console.log('Complex query results count:', complexData ? complexData.length : 0)
    if (complexData && complexData.length > 0) {
      console.log('Complex query item 0:', JSON.stringify(complexData[0], null, 2))
    }
  }
}

run().catch(console.error)
