// One-off heal script: brings every diamond shape back on the homepage.
// Why: an earlier version of the admin "Hide all <box>" stamped the GLOBAL
// is_enabled=false flag on rows, so an entire box action hid shapes from
// every box. This resets the damage:
//   · is_enabled = true for every row
//   · hidden_families = {} (clear any box-level hides)
// Safe to run multiple times.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// Pull env values straight from .env (this script runs outside Next).
function envValue(name) {
  const raw = readFileSync(new URL('../.env', import.meta.url), 'utf8')
  const line = raw.split(/\r?\n/).find((l) => l.trim().startsWith(name + '='))
  if (!line) return ''
  return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '')
}

const url = envValue('NEXT_PUBLIC_SUPABASE_URL')
const serviceKey = envValue('SUPABASE_SERVICE_ROLE_KEY')
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

// 1) Does the hidden_families column exist yet?
const probe = await supabase.from('diamond_shapes').select('key, is_enabled, hidden_families').limit(1)
const migrated = !probe.error || !/hidden_families|42703|column/i.test(String(probe.error?.message || ''))
if (probe.error) {
  if (migrated) {
    console.error('Unexpected probe error:', probe.error.message)
  } else {
    console.log('hidden_families column NOT in DB yet — run scripts/121_diamond_shapes_hidden_families.sql in the Supabase SQL editor first.')
  }
} else {
  console.log('hidden_families column: present (migration applied)')
}

// 2) Heal — everything back on the homepage.
const select = migrated
  ? await supabase.from('diamond_shapes').select('key, name, is_enabled, hidden_families')
  : await supabase.from('diamond_shapes').select('key, name, is_enabled')
if (select.error) {
  console.error('Failed to read rows:', select.error.message)
  process.exit(1)
}
const rows = select.data || []
const off = rows.filter((r) => r.is_enabled === false)
const hiddenInBoxes = migrated
  ? rows.filter((r) => Array.isArray(r.hidden_families) && r.hidden_families.length > 0)
  : []
console.log(`Rows: ${rows.length} · globally OFF: ${off.length} · box-hidden: ${hiddenInBoxes.length}`)

if (off.length > 0) {
  const { error } = await supabase.from('diamond_shapes').update({ is_enabled: true }).eq('is_enabled', false)
  console.log(error ? `Failed to re-enable: ${error.message}` : `Re-enabled ${off.length} shape(s) globally ✅`)
} else {
  console.log('All shapes already globally enabled.')
}

if (migrated && hiddenInBoxes.length > 0) {
  for (const r of hiddenInBoxes) {
    const { error } = await supabase.from('diamond_shapes').update({ hidden_families: [] }).eq('key', r.key)
    if (error) console.error(`Failed to clear box hides for ${r.key}: ${error.message}`)
  }
  console.log(`Cleared box-level hides on ${hiddenInBoxes.length} shape(s) ✅`)
}
console.log('Done.')
