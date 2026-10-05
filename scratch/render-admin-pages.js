// Fetch the raw HTML of each admin page to detect server-side compile/render errors.
const BASE = 'http://localhost:3000'

const pages = [
  '/admin/orders',
  '/admin/inventory',
  '/admin/categories',
  '/admin/offline-sales',
  '/admin/appointments',
  '/admin/products', // reference (works)
]

async function check(path) {
  try {
    const res = await fetch(BASE + path, { cache: 'no-store' })
    const text = await res.text()
    const len = text.length
    // Look for common Next.js error markers
    const hasErr = /Application error|Internal Server Error|Unhandled Runtime|Module not found|SyntaxError|TypeError/i.test(text)
    // Extract any visible error text
    const errMatch = text.match(/(?:Application error|Internal Server Error)[\s\S]{0,300}/i)
    console.log(`[${res.status}] ${path}  htmlLen=${len}${hasErr ? '  ⚠️ ERROR MARKER' : ''}`)
    if (errMatch) console.log('   → ', errMatch[0].replace(/\s+/g, ' ').slice(0, 300))
    // Look for the page's signature content (client shell)
    const shellHits = ['orders-root','inv-root','ac-root','os-page','ap-page','ap-v6']
    const found = shellHits.filter(s => text.includes(s))
    console.log(`   shells found: ${found.join(',') || '(none)'}`)
    console.log('')
  } catch (e) {
    console.log(`[NET-ERR] ${path} → ${e.message}\n`)
  }
}

;(async () => { for (const p of pages) await check(p) })()
