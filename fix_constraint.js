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
const sb = createClient(url, key)

async function test() {
  // Try to execute raw SQL via RPC to get constraint definition, if we have an exec_sql function
  // Or just generate the SQL for the user to run
  console.log("SQL TO RUN IN SUPABASE SQL EDITOR:")
  console.log(`
-- First, drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Then add it back with the new values
ALTER TABLE orders ADD CONSTRAINT orders_status_check
CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'payment_failed'));

-- Just in case there's a payment_method check constraint too
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
CHECK (payment_method IN ('cod', 'card', 'upi'));
  `)
}
test().catch(console.error)
