// Replay the real API responses through each admin page's render logic to find
// any row that throws during the .map() / formatting step (the part React would
// bail on, leaving an empty table).
const BASE = 'http://localhost:3000'

const fmt = {
  ok: s => `\x1b[32m✓\x1b[0m ${s}`,
  err: s => `\x1b[31m✗\x1b[0m ${s}`,
}

async function getJSON(path) {
  const res = await fetch(BASE + path, { cache: 'no-store' })
  const text = await res.text()
  try { return JSON.parse(text) } catch { return { __nonJson: text.slice(0, 200) } }
}

// --- Appointments page render logic (mirror) ---
function renderAppointment(apt) {
  const statusKey = s => ['pending','confirmed','completed','cancelled'].includes(s) ? s : 'pending'
  const _ = statusKey(apt.status)
  return `${apt.customerName || '—'} | ${apt.service || '—'} | ${apt.date || '—'} | ${apt.status || 'pending'} | ${String(apt.id).slice(0,8)}`
}

// --- Offline-sales filter logic (mirror) ---
function renderSale(s, q = '') {
  const ql = q.toLowerCase()
  const matches = String(s.customerName||'').toLowerCase().includes(ql)
    || String(s.customerEmail||'').toLowerCase().includes(ql)
    || String(s.customerPhone||'').toLowerCase().includes(ql)
  const d = s.createdAt ? new Date(s.createdAt) : null
  return matches && `${s.customerName||'—'} total=${s.total||0} date=${d ? d.toDateString() : '—'}`
}

// --- Inventory filtered + qty logic (mirror) ---
function renderInventory(p, latestQty) {
  const qty = Number(latestQty[p.id] ?? Number(p.stock_quantity || 0))
  return `${p.name} qty=${qty} price=${p.price} sku=${p.sku||'—'} cat=${p.category||'—'}`
}

// --- Categories ---
function renderCategory(c) {
  return `${c.name} count=${c.product_count ?? 0} home=${!!c.show_on_home} img=${c.image_url ? 'y' : 'n'}`
}

// --- Orders fmtPrice is complex; just check the access patterns for a throw ---
function renderOrder(o, usdToInr = 93.1) {
  const fmtPrice = (val, orderCurrency) => {
    const curr = (orderCurrency || 'INR').toUpperCase()
    let rawVal = val
    if (curr === 'INR' && val < 500) rawVal = val * (usdToInr || 93.1)
    return rawVal
  }
  const price = fmtPrice(Number(o.total || 0), o.currency)
  return `${o.customerName || '—'} | total=${o.total} | ${o.status} | ${o.payment_method || '—'} | ${o.createdAt || o.created_at || '—'} | ${price}`
}

async function main() {
  console.log('\n=== Appointments ===')
  const appts = await getJSON('/api/appointments')
  let i = 0, bad = 0
  if (Array.isArray(appts)) for (const a of appts) { try { renderAppointment(a); i++ } catch (e) { console.log(fmt.err(`row ${i}: ${e.message}`)); bad++ } }
  console.log(`rendered ${i} ok, ${bad} threw`)

  console.log('\n=== Offline Sales ===')
  const sales = await getJSON('/api/offline-sales')
  i = 0; bad = 0
  if (Array.isArray(sales)) for (const s of sales) { try { renderSale(s); i++ } catch (e) { console.log(fmt.err(`row ${i}: ${e.message}`)); bad++ } }
  console.log(`rendered ${i} ok, ${bad} threw`)

  console.log('\n=== Categories ===')
  const cats = await getJSON('/api/categories')
  i = 0; bad = 0
  if (Array.isArray(cats)) for (const c of cats) { try { renderCategory(c); i++ } catch (e) { console.log(fmt.err(`row ${i}: ${e.message}`)); bad++ } }
  console.log(`rendered ${i} ok, ${bad} threw`)

  console.log('\n=== Orders ===')
  const orders = await getJSON('/api/orders')
  i = 0; bad = 0
  if (Array.isArray(orders)) for (const o of orders) { try { renderOrder(o); i++ } catch (e) { console.log(fmt.err(`row ${i}: ${e.message}`)); bad++ } }
  console.log(`rendered ${i} ok, ${bad} threw`)

  console.log('\n=== Inventory (products + movements) ===')
  const prods = await getJSON('/api/products?page=1&limit=10')
  const mv = await getJSON('/api/inventory/movements')
  // mirror latestQtyById
  const latestQty = (Array.isArray(mv) ? mv : []).reduce((acc, m) => {
    const prev = acc[`__date_${m.product_id}`]
    const curr = new Date(m.created_at).getTime()
    if (!prev || curr >= prev) { acc[m.product_id] = m.quantity_after; acc[`__date_${m.product_id}`] = curr }
    return acc
  }, {})
  i = 0; bad = 0
  const arr = prods?.products || []
  for (const p of arr) { try { renderInventory(p, latestQty); i++ } catch (e) { console.log(fmt.err(`row ${i}: ${e.message}`)); bad++ } }
  console.log(`rendered ${i} ok, ${bad} threw`)
}

main().catch(e => { console.error('fatal', e); process.exit(1) })
