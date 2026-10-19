// One-off restore script: brings the 10 standard diamond shapes back into
// diamond_shapes after they were wiped (admin deletes / experiments).
// · Upserts by key — custom admin rows (bracelet1, rings1 …) are NOT touched.
// · Each restored shape is scoped to EVERY category, so it shows in every
//   homepage box (exactly how these rows behaved originally). Per-box hiding
//   can be redone safely from Admin → Diamond Shapes.
// · is_enabled = true, hidden_families = {}.
// Safe to run multiple times (upsert).
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

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

const DEFAULTS = [
  ['round', 'Round', 'A classic and timeless cut that maximizes brilliance and fire.'],
  ['cushion', 'Cushion', 'A romantic pillow-shaped cut with rounded corners and large facets.'],
  ['princess', 'Princess', 'A modern square cut with exceptional brilliance and sharp corners.'],
  ['emerald', 'Emerald', 'An elegant step-cut with a rectangular shape and hall-of-mirrors effect.'],
  ['oval', 'Oval', 'A brilliant cut that elongates the finger with exceptional sparkle.'],
  ['marquise', 'Marquise', 'A regal elongated shape with pointed ends for maximum carat appearance.'],
  ['pear', 'Pear', 'A teardrop-shaped cut combining the best of round and marquise.'],
  ['heart', 'Heart', 'A sentimental shape symbolizing love and romance.'],
  ['radiant', 'Radiant', 'A vibrant cut blending the elegance of emerald with the sparkle of round.'],
  ['asscher', 'Asscher', 'A vintage square step-cut with deep pavilion and high crown.'],
]

// Every category → each restored shape shows in every homepage box.
const cats = await supabase.from('categories').select('id, name')
if (cats.error) {
  console.error('Failed to read categories:', cats.error.message)
  process.exit(1)
}
const allIds = (cats.data || []).map((c) => c.id)
console.log(`Categories: ${allIds.length}`)

const rows = DEFAULTS.map(([key, name, sub]) => ({
  key,
  name,
  sub,
  image: '',
  model_3d: null,
  is_enabled: true,
  category_ids: allIds,
  hidden_families: [],
}))

const { data, error } = await supabase
  .from('diamond_shapes')
  .upsert(rows, { onConflict: 'key' })
  .select('key, name, is_enabled')
if (error) {
  console.error('Upsert failed:', error.message)
  process.exit(1)
}
console.log(`Restored ${data.length} standard shape(s) (scoped to all categories, enabled) ✅`)

// Final state check
const after = await supabase.from('diamond_shapes').select('key, is_enabled')
console.log(`Total rows in table now: ${after.data?.length}`)
console.log('Done.')
