import { supabaseServer } from './lib/supabaseServer'

async function checkProducts() {
  const { data, error } = await supabaseServer
    .from('products')
    .select('id, name, is_featured')
    .limit(10)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Products:', JSON.stringify(data, null, 2))
}

checkProducts()
