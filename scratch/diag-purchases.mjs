import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = {}
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const TEST_EMAIL = process.argv[2] || 'hardikkamaliya0000@gmail.com'

// Find the auth user id for that email
const { data: usersList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
const u = usersList.users.find(x => (x.email || '').toLowerCase() === TEST_EMAIL.toLowerCase())
console.log('AUTH USER:', u ? `${u.email} id=${u.id}` : 'NOT FOUND in auth')

const callerId = u?.id || '00000000-0000-0000-0000-000000000000'
const callerEmail = (u?.email || TEST_EMAIL).trim().toLowerCase()

// Reproduce EXACT API select + or()
const selectStr = `
  id, email, status, total_price, currency, created_at, payment_method, notes,
  order_items ( id, quantity, price_at_purchase, product_id, metal, size,
    products ( name, image, images ) )
`
const ors = [`user_id.eq.${callerId}`]
if (callerEmail) ors.push(`email.eq.${callerEmail}`)
console.log('\nOR filter:', ors.join(','))

const { data, error } = await supabase
  .from('orders')
  .select(selectStr)
  .or(ors.join(','))
  .order('created_at', { ascending: false })

if (error) {
  console.log('\n*** QUERY ERROR (this = API 500 => account shows 0) ***')
  console.log(JSON.stringify(error, null, 2))
} else {
  console.log(`\nAPI would return ${data.length} orders`)
  data.slice(0, 15).forEach(o =>
    console.log(`  ${o.id.slice(0,8)} email=${JSON.stringify(o.email)} cur=${o.currency} total=${o.total_price} status=${o.status}`)
  )
}

// Cross-check: raw counts by user_id and by email separately
const { data: byId } = await supabase.from('orders').select('id').eq('user_id', callerId)
const { data: byEmailLc } = await supabase.from('orders').select('id,email').ilike('email', callerEmail)
console.log(`\nRaw: user_id matches=${byId?.length ?? 0} | email(ilike lc) matches=${byEmailLc?.length ?? 0}`)

// Show what emails actually exist for this user's orders (case!)
const { data: allForEmail } = await supabase.from('orders').select('email').ilike('email', TEST_EMAIL)
const distinct = [...new Set((allForEmail || []).map(o => JSON.stringify(o.email)))]
console.log('Distinct stored email spellings (ilike):', distinct)
