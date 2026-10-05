/**
 * Applies migration 109 (orders.cancellation_reason) against Supabase.
 * Usage: node scripts/run-109-cancellation-reason.mjs
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

const sql = fs.readFileSync(path.join(root, 'migrations', '109_orders_cancellation_reason.sql'), 'utf8')

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
  // PostgREST rejects unknown columns in ?select= — a 200 proves the column exists.
  const r = await fetch(`${url}/rest/v1/orders?select=cancellation_reason&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  return r.ok
}

if (await verify()) {
  console.log('Column orders.cancellation_reason already exists — nothing to do.')
  process.exit(0)
}

if (await tryRpc() && await verify()) {
  console.log('Migration applied via exec_sql RPC. orders.cancellation_reason is live.')
  process.exit(0)
}

console.log('Could not apply automatically (no exec_sql RPC on this project).')
console.log('Run this SQL in the Supabase Dashboard → SQL Editor:\n')
console.log(sql)
process.exit(2)
