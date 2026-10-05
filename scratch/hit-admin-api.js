// Hit each affected admin API endpoint directly against the running dev server
// and report status + a short body excerpt + parsed length where applicable.
const BASE = process.env.BASE || 'http://localhost:3000'

const endpoints = [
  '/api/orders',
  '/api/categories',
  '/api/offline-sales',
  '/api/appointments',
  '/api/inventory/movements',
  '/api/products?page=1&limit=10',
]

async function check(path) {
  try {
    const res = await fetch(BASE + path, { cache: 'no-store' })
    const text = await res.text()
    let parsed = null
    try { parsed = JSON.parse(text) } catch {}
    let len = '?'
    if (Array.isArray(parsed)) len = String(parsed.length)
    else if (parsed && Array.isArray(parsed.products)) len = String(parsed.products.length)
    else if (parsed && parsed.error) len = 'ERROR'
    console.log(`[${res.status}] ${path}`)
    console.log(`       shape: ${parsed === null ? 'NON-JSON' : Array.isArray(parsed) ? 'array' : typeof parsed}  count: ${len}`)
    console.log(`       body[0:240]: ${text.slice(0, 240).replace(/\s+/g, ' ')}`)
    console.log('')
  } catch (e) {
    console.log(`[NET-ERR] ${path} → ${e.message}\n`)
  }
}

;(async () => {
  console.log('Base:', BASE, '\n')
  for (const p of endpoints) await check(p)
})()
