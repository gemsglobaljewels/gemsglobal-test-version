/**
 * Applies migration 111 (restock on 'returned' via update_inventory_on_status_change) against Supabase.
 * Usage: node scripts/run-111-returned-restock.mjs
 * Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

// Minimal .env parser — avoids adding a dotenv dependency.
const env = {}
for (const line of fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const sql = fs.readFileSync(path.join(root, 'migrations', '111_returned_restock.sql'), 'utf8')

// PostgREST rejects unknown columns in ?select= — a 400 means the migration adding it never ran.
async function columnExists(column) {
  const r = await fetch(`${url}/rest/v1/orders?select=${column}&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  return r.ok
}

// Try the exec_sql RPC first (present in some setups), then pg-meta query API.
async function tryRpc() {
  const r = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql }),
  })
  return r.ok
}

async function verify() {
  // A function (not a column) changed, so call it with a nil UUID: a 200 whose
  // JSON is the function's own result proves it exists and is callable.
  const r = await fetch(`${url}/rest/v1/rpc/update_inventory_on_status_change`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      p_order_id: '00000000-0000-0000-0000-000000000000',
      p_old_status: 'pending',
      p_new_status: 'pending',
    }),
  })
  if (!r.ok) return false
  const json = await r.json().catch(() => null)
  return json !== null && typeof json === 'object' && 'success' in json
}

// Preflight: 111 assumes the return flow columns from 109/110 are in place.
if (!(await columnExists('cancellation_reason'))) {
  console.warn('WARNING: orders.cancellation_reason is missing — run migrations/109_orders_cancellation_reason.sql first.')
}
if (!(await columnExists('return_reason'))) {
  console.warn('WARNING: orders.return_reason is missing — run migrations/110_orders_return_flow.sql first.')
}

if (await tryRpc() && await verify()) {
  console.log('Migration applied via exec_sql RPC. update_inventory_on_status_change now restocks on \'returned\'.')
  process.exit(0)
}

console.log('Could not apply automatically (no exec_sql RPC on this project).')
console.log('Run this SQL in the Supabase Dashboard → SQL Editor:\n')
console.log(sql)
process.exit(2)
