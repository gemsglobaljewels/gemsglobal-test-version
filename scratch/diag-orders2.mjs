import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = {}
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data: orders } = await supabase
  .from('orders').select('id,email,user_id,status,created_at,notes')
  .order('created_at', { ascending: false })

const { data: usersList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
const users = usersList.users

// group orders by the auth user they SHOULD belong to (by user_id or email match)
for (const u of users) {
  const emailLower = (u.email || '').toLowerCase()
  const belongs = orders.filter(o =>
    o.user_id === u.id || (o.email && o.email.toLowerCase() === emailLower))
  if (belongs.length === 0) continue

  // Simulate the EXACT API .or() filter (case-sensitive .eq on lowercased jwt email)
  const ors = [`user_id.eq.${u.id}`]
  if (emailLower) ors.push(`email.eq.${emailLower}`)
  const { data: got, error } = await supabase
    .from('orders').select('id').or(ors.join(','))

  const gotIds = new Set((got || []).map(x => x.id))
  const missing = belongs.filter(o => !gotIds.has(o.id))
  console.log(`\nUSER ${u.email} (${u.id.slice(0,8)})`)
  console.log(`  should see: ${belongs.length} | API returns: ${gotIds.size} | MISSING: ${missing.length}`)
  if (error) console.log('  query error:', error.message)
  missing.forEach(o => console.log(`    MISSING order ${o.id.slice(0,8)} email=${JSON.stringify(o.email)} user_id=${o.user_id} custom=${/^\[custom\]/.test(o.notes||'')}`))
  belongs.forEach(o => console.log(`    have order  ${o.id.slice(0,8)} email=${JSON.stringify(o.email)} user_id=${o.user_id? o.user_id.slice(0,8):null}`))
}

// orders that belong to NOBODY (guest, email not in auth)
const userEmails = new Set(users.map(u => (u.email||'').toLowerCase()))
const userIds = new Set(users.map(u => u.id))
const orphan = orders.filter(o => !(o.user_id && userIds.has(o.user_id)) && !(o.email && userEmails.has(o.email.toLowerCase())))
console.log(`\n\nORPHAN orders (no matching auth user by id or email): ${orphan.length}`)
orphan.forEach(o => console.log(`  ${o.id.slice(0,8)} email=${JSON.stringify(o.email)} user_id=${o.user_id}`))
