'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Plus, Minus, AlertCircle, RefreshCcw, ChevronDown, X, ArrowUpRight, ArrowDownRight } from 'lucide-react'

type Product = {
  id: string; name: string; sku?: string;
  stock_quantity?: number; price?: number; category?: string;
  image?: string; images?: string[];
}
type Movement = {
  product_id: string; product_name: string; change: number;
  quantity_after: number; reason: string; created_at: string;
}

const MOVEMENTS_INITIAL = 5
const MOVEMENTS_INCREMENT = 10

const CSS = `
/* ══ ROOT ════════════════════════════════════════════════════════ */
.inv-root {
  min-height: 100vh;
  background: var(--c-bg);
  font-family: var(--font-main);
  padding: 40px 40px 80px;
  color: var(--c-text);
}
@media (max-width: 1023px) { .inv-root { padding: 28px 20px 60px; } }
@media (max-width: 767px)  { .inv-root { padding: 18px 14px 48px; } }

/* ── header ── */
.inv-hdr {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 20px; flex-wrap: wrap; margin-bottom: 28px;
}
.inv-hdr-eyebrow { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.inv-hdr-line { width: 20px; height: .5px; background: var(--c-border); }
.inv-hdr-tag { font-size: 8px; font-weight: 400; letter-spacing: .44em; text-transform: uppercase; color: var(--c-text-muted); }
.inv-hdr-title { font-family: var(--font-main); font-size: 36px; font-weight: 300; letter-spacing: .02em; color: var(--c-text); }
.inv-hdr-title em { font-style: italic; color: var(--c-accent); }
.inv-hdr-sub { font-size: 11px; font-weight: 300; letter-spacing: .09em; color: var(--c-text-muted); margin-top: 4px; }

.inv-hdr-btns { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.inv-btn-primary {
  display: flex; align-items: center; gap: 7px; padding: 10px 18px;
  background: var(--c-accent); border: none; cursor: pointer;
  font-family: var(--font-main); font-size: 8.5px; font-weight: 500;
  letter-spacing: .24em; text-transform: uppercase; color: #fff;
  text-decoration: none; transition: background .22s, box-shadow .22s;
  border-radius: var(--radius);
}
.inv-btn-primary:hover { background: var(--c-text); box-shadow: var(--shadow-md); }
.inv-btn-ghost {
  display: flex; align-items: center; gap: 7px; padding: 10px 16px;
  background: transparent; border: 1px solid var(--c-border); cursor: pointer;
  font-family: var(--font-main); font-size: 8.5px; font-weight: 400;
  letter-spacing: .22em; text-transform: uppercase; color: var(--c-text-muted);
  transition: all .22s; border-radius: var(--radius);
}
.inv-btn-ghost:hover { border-color: var(--c-accent); color: var(--c-accent); }

/* ── error ── */
.inv-error {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 13px 16px; margin-bottom: 22px;
  background: rgba(185,64,64,.08); border: 1px solid rgba(185,64,64,.22);
}
.inv-error-ico { color: rgba(185,64,64,.8); flex-shrink: 0; margin-top: 1px; }
.inv-error-txt { font-size: 12px; font-weight: 300; line-height: 1.5; color: rgba(185,64,64,.9); flex: 1; }
.inv-error-close { background: transparent; border: none; cursor: pointer; color: rgba(185,64,64,.4); transition: color .2s; }
.inv-error-close:hover { color: rgba(185,64,64,.8); }

/* ── filters card ── */
.inv-filters {
  background: var(--c-surface); border: 1px solid var(--c-border);
  padding: 18px 20px; margin-bottom: 16px;
}
.inv-filters-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.inv-search-wrap { position: relative; flex: 1; min-width: 200px; }
.inv-search-ico { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--c-text-muted); pointer-events: none; }
.inv-search {
  width: 100%; height: 38px; padding: 0 12px 0 36px;
  background: var(--c-bg); border: 1px solid var(--c-border);
  font-family: var(--font-main); font-size: 12px; font-weight: 300;
  letter-spacing: .05em; color: var(--c-text); outline: none; transition: border-color .25s;
}
.inv-search:focus { border-color: var(--c-accent); }
.inv-search::placeholder { color: var(--c-text-muted); }

.inv-sel-wrap { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
.inv-sel-lbl { font-size: 8.5px; font-weight: 400; letter-spacing: .24em; text-transform: uppercase; color: var(--c-text-muted); white-space: nowrap; }
.inv-sel {
  height: 38px; padding: 0 28px 0 10px;
  background: var(--c-bg); border: 1px solid var(--c-border);
  font-family: var(--font-main); font-size: 11px; font-weight: 300;
  letter-spacing: .05em; color: var(--c-text);
  outline: none; cursor: pointer; appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6' stroke='rgba(143,122,112,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center;
  transition: border-color .22s;
}
.inv-sel:focus { border-color: var(--c-accent); }
.inv-sel option { background: var(--c-surface); color: var(--c-text); }
.inv-fx-inp {
  width: 72px; height: 38px; padding: 0 8px;
  background: var(--c-bg); border: 1px solid var(--c-border);
  font-family: var(--font-main); font-size: 11px; font-weight: 300;
  color: var(--c-text); outline: none; transition: border-color .22s;
}
.inv-fx-inp:focus { border-color: var(--c-accent); }
.inv-fx-note { font-size: 9px; font-weight: 300; letter-spacing: .1em; color: var(--c-text-muted); white-space: nowrap; }

/* ══ TABLE ═══════════════════════════════════════════════════════ */
.inv-table-wrap {
  background: var(--c-surface); border: 1px solid var(--c-border); overflow: hidden;
}
.inv-table-scroll {
  overflow-x: auto;
  scrollbar-width: thin; scrollbar-color: rgba(143,122,112,0.2) transparent;
}
.inv-table-scroll::-webkit-scrollbar { height: 3px; }
.inv-table-scroll::-webkit-scrollbar-thumb { background: rgba(143,122,112,0.2); }

table.inv-table { width: 100%; border-collapse: collapse; }
.inv-table thead tr { background: rgba(143,122,112,0.06); border-bottom: 1px solid var(--c-border); }
.inv-table th {
  padding: 12px 16px; text-align: left; white-space: nowrap;
  font-size: 7.5px; font-weight: 500; letter-spacing: .38em; text-transform: uppercase;
  color: var(--c-text-muted);
  border-right: 1px solid rgba(143,122,112,0.08);
}
.inv-table th:last-child { border-right: none; }

.inv-table tbody tr { border-bottom: 1px solid rgba(143,122,112,0.08); transition: background .18s; }
.inv-table tbody tr:last-child { border-bottom: none; }
.inv-table tbody tr:hover { background: rgba(143,122,112,0.04); }
.inv-table td {
  padding: 12px 16px; vertical-align: middle;
  font-size: 12px; font-weight: 300; letter-spacing: .04em;
  color: var(--c-text); white-space: nowrap;
  border-right: 1px solid rgba(143,122,112,0.06);
}
.inv-table td:last-child { border-right: none; }

/* product cell */
.inv-prod { display: flex; align-items: center; gap: 10px; }
.inv-prod-img {
  width: 34px; height: 34px; flex-shrink: 0;
  object-fit: cover; border: 1px solid var(--c-border);
}
.inv-prod-img-ph {
  width: 34px; height: 34px; flex-shrink: 0;
  background: rgba(143,122,112,0.06); border: 1px solid var(--c-border);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
}
.inv-prod-name { font-size: 12px; font-weight: 400; letter-spacing: .04em; color: var(--c-text); }

/* price */
.inv-price { font-family: var(--font-main); font-size: 14px; font-weight: 400; letter-spacing: .04em; color: var(--c-text); }

/* stock badge */
.inv-stock-ok  { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 400; color: rgba(74,222,128,.8); }
.inv-stock-low { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 400; color: rgba(251,191,36,.8); }
.inv-stock-out { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 400; color: rgba(185,64,64,.8); }
.inv-stock-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; animation: invDotPulse 2s ease-in-out infinite; }
@keyframes invDotPulse { 0%,100%{opacity:1} 50%{opacity:.4} }

/* adjust controls */
.inv-adj { display: flex; align-items: center; gap: 6px; }
.inv-adj-inp {
  width: 60px; height: 32px; padding: 0 8px; text-align: center;
  background: var(--c-bg); border: 1px solid var(--c-border);
  font-family: var(--font-main); font-size: 12px; font-weight: 300;
  color: var(--c-text); outline: none; transition: border-color .2s;
}
.inv-adj-inp:focus { border-color: var(--c-accent); }
.inv-adj-out {
  display: flex; align-items: center; gap: 4px; height: 32px; padding: 0 10px;
  background: transparent; border: 1px solid rgba(185,64,64,0.3); cursor: pointer;
  font-family: var(--font-main); font-size: 8.5px; font-weight: 400; letter-spacing: .16em;
  color: rgba(185,64,64,0.7); transition: all .2s; border-radius: var(--radius);
}
.inv-adj-out:hover:not(:disabled) { border-color: rgba(185,64,64,0.8); color: rgba(185,64,64,0.9); background: rgba(185,64,64,0.08); }
.inv-adj-out:disabled { opacity: .35; cursor: not-allowed; }
.inv-adj-in-btn {
  display: flex; align-items: center; gap: 4px; height: 32px; padding: 0 10px;
  background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.3); cursor: pointer;
  font-family: var(--font-main); font-size: 8.5px; font-weight: 400; letter-spacing: .16em;
  color: rgba(74,222,128,0.7); transition: all .2s; border-radius: var(--radius);
}
.inv-adj-in-btn:hover:not(:disabled) { border-color: rgba(74,222,128,0.8); color: rgba(74,222,128,0.95); background: rgba(74,222,128,0.16); }
.inv-adj-in-btn:disabled { opacity: .35; cursor: not-allowed; }

/* price adjust */
.inv-padj-sub {
  display: flex; align-items: center; gap: 4px; height: 32px; padding: 0 10px;
  background: transparent; border: 1px solid rgba(185,64,64,0.3); cursor: pointer;
  font-family: var(--font-main); font-size: 8px; font-weight: 400; letter-spacing: .14em;
  color: rgba(185,64,64,0.7); transition: all .2s; border-radius: var(--radius);
}
.inv-padj-sub:hover:not(:disabled) { border-color: rgba(185,64,64,0.8); color: rgba(185,64,64,0.9); background: rgba(185,64,64,0.08); }
.inv-padj-add {
  display: flex; align-items: center; gap: 4px; height: 32px; padding: 0 10px;
  background: transparent; border: 1px solid var(--c-border); cursor: pointer;
  font-family: var(--font-main); font-size: 8px; font-weight: 400; letter-spacing: .14em;
  color: var(--c-text-muted); transition: all .2s; border-radius: var(--radius);
}
.inv-padj-add:hover:not(:disabled) { border-color: var(--c-accent); color: var(--c-accent); background: rgba(143,122,112,0.08); }
.inv-padj-sub:disabled,.inv-padj-add:disabled { opacity: .35; cursor: not-allowed; }

/* reason input */
.inv-reason {
  width: 160px; height: 32px; padding: 0 10px;
  background: var(--c-bg); border: 1px solid var(--c-border);
  font-family: var(--font-main); font-size: 11px; font-weight: 300;
  letter-spacing: .04em; color: var(--c-text); outline: none;
  transition: border-color .2s;
}
.inv-reason:focus { border-color: var(--c-accent); }
.inv-reason::placeholder { color: var(--c-text-muted); }

/* ══ PAGINATION ══════════════════════════════════════════════════ */
.inv-pagination {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 16px 22px;
  border-top: 1px solid var(--c-border);
}
.inv-page-info {
  font-size: 11px; font-weight: 300; letter-spacing: .06em;
  color: var(--c-text-muted);
}
.inv-page-info strong { font-weight: 500; color: var(--c-text); }
.inv-page-btns { display: flex; align-items: center; gap: 8px; }
.inv-page-btn {
  height: 34px; padding: 0 14px;
  background: transparent; border: 1px solid var(--c-border); cursor: pointer;
  font-family: var(--font-main); font-size: 9px; font-weight: 400;
  letter-spacing: .2em; text-transform: uppercase; color: var(--c-text-muted);
  transition: all .22s; border-radius: var(--radius);
}
.inv-page-btn:hover { border-color: var(--c-accent); color: var(--c-accent); }
.inv-page-btn:disabled {
  opacity: .4; cursor: not-allowed;
  border-color: var(--c-border) !important;
  color: var(--c-text-muted) !important;
}

/* ══ MOVEMENTS ═══════════════════════════════════════════════════ */
.inv-mv-section { margin-top: 24px; }
.inv-mv-card { background: var(--c-surface); border: 1px solid var(--c-border); overflow: hidden; }
.inv-mv-hdr {
  display: flex; align-items: flex-end; justify-content: space-between;
  padding: 18px 22px 14px; border-bottom: 1px solid rgba(143,122,112,0.1);
}
.inv-mv-title { font-family: var(--font-main); font-size: 20px; font-weight: 300; letter-spacing: .04em; color: var(--c-text); }
.inv-mv-title em { font-style: italic; color: var(--c-accent); }
.inv-mv-count { font-size: 9.5px; font-weight: 300; letter-spacing: .12em; color: var(--c-text-muted); margin-top: 3px; }

table.inv-mv-table { width: 100%; border-collapse: collapse; }
.inv-mv-table thead tr { background: rgba(143,122,112,0.06); border-bottom: 1px solid rgba(143,122,112,0.1); }
.inv-mv-table th {
  padding: 11px 20px; text-align: left; white-space: nowrap;
  font-size: 7.5px; font-weight: 500; letter-spacing: .38em; text-transform: uppercase;
  color: var(--c-text-muted);
  border-right: 1px solid rgba(143,122,112,0.06);
}
.inv-mv-table th:last-child { border-right: none; }
.inv-mv-table tbody tr { border-bottom: 1px solid rgba(143,122,112,0.06); transition: background .18s; }
.inv-mv-table tbody tr:last-child { border-bottom: none; }
.inv-mv-table tbody tr:hover { background: rgba(143,122,112,0.04); }
.inv-mv-table td {
  padding: 11px 20px; font-size: 11.5px; font-weight: 300; letter-spacing: .04em;
  color: var(--c-text); white-space: nowrap;
  border-right: 1px solid rgba(143,122,112,0.06);
}
.inv-mv-table td:last-child { border-right: none; }
.inv-mv-in  { display: flex; align-items: center; gap: 4px; font-weight: 400; color: rgba(74,222,128,.8); }
.inv-mv-out { display: flex; align-items: center; gap: 4px; font-weight: 400; color: rgba(185,64,64,.8); }

/* view more btn */
.inv-view-more {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  width: 100%; padding: 13px;
  background: transparent; border: none; border-top: 1px solid rgba(143,122,112,0.08); cursor: pointer;
  font-family: var(--font-main); font-size: 8.5px; font-weight: 400; letter-spacing: .22em; text-transform: uppercase;
  color: var(--c-text-muted); transition: color .2s, background .2s;
}
.inv-view-more:hover { background: rgba(143,122,112,0.04); color: var(--c-accent); }
.inv-all-loaded {
  padding: 12px; text-align: center;
  font-size: 8px; font-weight: 300; letter-spacing: .26em; text-transform: uppercase;
  color: var(--c-text-muted); opacity: 0.5;
}

/* empty/loading */
.inv-state td { padding: 40px 24px; text-align: center; font-size: 10px; font-weight: 300; letter-spacing: .22em; text-transform: uppercase; color: var(--c-text-muted); }
`

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [movements, setMovements] = useState<Movement[]>([])
  const [visibleMv, setVisibleMv] = useState(MOVEMENTS_INITIAL)
  const [amountById, setAmountById] = useState<Record<string, number>>({})
  const [reasonById, setReasonById] = useState<Record<string, string>>({})
  const [adjustingId, setAdjustingId] = useState<string | null>(null)
  const [priceDeltaById, setPriceDeltaById] = useState<Record<string, number>>({})
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD')
  const [fxRate, setFxRate] = useState(83)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const c = localStorage.getItem('admin_currency_pref') as 'USD' | 'INR'
    if (c) setCurrency(c)
    const fx = Number(localStorage.getItem('admin_fx_rate') || '83')
    if (Number.isFinite(fx) && fx > 0) setFxRate(fx)
  }, [])

  const latestQtyById = movements.reduce<Record<string, number>>((acc, m) => {
    const prevDate = (acc as any)[`__date_${m.product_id}`] as number | undefined
    const curr = new Date(m.created_at).getTime()
    if (!prevDate || curr >= prevDate) { acc[m.product_id] = m.quantity_after; (acc as any)[`__date_${m.product_id}`] = curr }
    return acc
  }, {})

  async function load() {
    try {
      setLoading(true)
      const [pRes, mRes] = await Promise.all([
        fetch(`/api/products?page=${page}&limit=${limit}`),
        fetch('/api/inventory/movements')
      ])
      const pData = await pRes.json(); const m = await mRes.json()
      const p = pData.products || []
      setProducts(Array.isArray(p) ? p : [])
      setTotal(pData.total || 0)
      setTotalPages(pData.totalPages || 1)
      setMovements(Array.isArray(m) ? m : [])
      setVisibleMv(MOVEMENTS_INITIAL)
      try {
        const fr = await fetch('/api/exchange-rate', { cache: 'no-store' })
        if (fr.ok) {
          const { rate } = await fr.json(); const r = Number(rate)
          if (Number.isFinite(r) && r > 0) { setFxRate(r); localStorage.setItem('admin_fx_rate', String(r)) }
        }
      } catch { }
    } catch { setError('Failed to load inventory') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, limit])

  async function adjust(id: string, delta: number) {
    try {
      setAdjustingId(id)
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id, delta, reason: reasonById[id] || '' }),
      })
      if (!res.ok) { setError((await res.json().catch(() => ({})))?.error || 'Adjustment failed'); return }
      const mv: Movement = await res.json()
      setMovements(p => [mv, ...p])
      setProducts(p => p.map(x => x.id === id ? { ...x, stock_quantity: mv.quantity_after } : x))
    } catch { setError('Adjustment failed') }
    finally { setAdjustingId(null) }
  }

  async function adjustPrice(id: string, sign: 1 | -1) {
    try {
      setAdjustingId(id)
      const base = Number(priceDeltaById[id] ?? 0)
      if (!Number.isFinite(base) || base === 0) return
      const prod = products.find(x => x.id === id)
      const nextUsd = Math.max(0, Math.round((Number(prod?.price || 0) + base * sign) * 100) / 100)
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: nextUsd }),
      })
      if (!res.ok) { setError((await res.json().catch(() => ({})))?.error || 'Price update failed'); return }
      const upd = await res.json()
      setProducts(p => p.map(x => x.id === id ? { ...x, price: upd.price } : x))
      window.dispatchEvent(new CustomEvent('admin-price-updated', { detail: { id, priceUSD: Number(upd.price) } }))
    } catch { setError('Price update failed') }
    finally { setAdjustingId(null) }
  }

  const fmtUSD = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v || 0)
  const fmtINR = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0)
  const toINR = (usd: number) => Math.round((usd || 0) * fxRate)

  const filtered = products
    .filter(p => {
      const n = (s: any) => String(s || '').toLowerCase().replace(/\s+/g, '')
      return !['name', 'slug', 'sku'].some(k => ['demo1234', 'demo12345'].includes(n((p as any)?.[k])))
    })
    .filter(p => {
      const s = searchQuery.toLowerCase()
      return p.name?.toLowerCase().includes(s) || p.sku?.toLowerCase().includes(s) || (p.category || '').toLowerCase().includes(s)
    })

  const shownMv = movements.slice(0, visibleMv)
  const hasMoreMv = visibleMv < movements.length

  const stockClass = (qty: number) => {
    if (qty <= 0) return 'inv-stock-out'
    if (qty <= 3) return 'inv-stock-low'
    return 'inv-stock-ok'
  }

  return (
    <div className="inv-root">
      <style>{CSS}</style>

      {error && (
        <div className="inv-error">
          <AlertCircle size={14} strokeWidth={1.5} className="inv-error-ico" />
          <p className="inv-error-txt">{error}</p>
          <button className="inv-error-close" onClick={() => setError('')}><X size={12} strokeWidth={1.5} /></button>
        </div>
      )}

      {/* Header */}
      <div className="inv-hdr">
        <div>
          <div className="inv-hdr-eyebrow">
            <div className="inv-hdr-line" />
            <span className="inv-hdr-tag">Stock Management</span>
          </div>
          <h1 className="inv-hdr-title"><em>Inventory</em> Control</h1>
          <p className="inv-hdr-sub">{filtered.length} products · adjust stock and prices</p>
        </div>
        <div className="inv-hdr-btns">
          <Link href="/admin/products/new" className="inv-btn-primary">
            <Plus size={11} strokeWidth={2.5} /> Add Product
          </Link>
          <button className="inv-btn-ghost" onClick={load}>
            <RefreshCcw size={11} strokeWidth={1.5} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="inv-filters">
        <div className="inv-filters-row">
          <div className="inv-search-wrap">
            <Search size={13} strokeWidth={1.5} className="inv-search-ico" />
            <input type="text" className="inv-search" placeholder="Search by name, SKU, or category…"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="inv-sel-wrap">
            <span className="inv-sel-lbl">Currency</span>
            <select className="inv-sel" value={currency} onChange={e => {
              const v = e.target.value as 'USD' | 'INR'; setCurrency(v); localStorage.setItem('admin_currency_pref', v)
            }}>
              <option value="USD">USD $</option>
              <option value="INR">INR ₹</option>
            </select>
          </div>
          <div className="inv-sel-wrap">
            <span className="inv-sel-lbl">FX Rate</span>
            <input type="number" step="0.01" className="inv-fx-inp" value={fxRate}
              onChange={e => { const v = Number(e.target.value || '0'); const nv = Number.isFinite(v) && v > 0 ? v : 83; setFxRate(nv); localStorage.setItem('admin_fx_rate', String(nv)) }} />
          </div>
          <span className="inv-fx-note">1 USD ≈ ₹{fxRate.toFixed(2)}</span>
        </div>
      </div>

      {/* Main table */}
      <div className="inv-table-wrap">
        <div className="inv-table-scroll">
          <table className="inv-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price USD</th>
                <th>Price INR</th>
                <th>Stock</th>
                <th>Stock Adjust</th>
                <th>Price Adjust</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="inv-state"><td colSpan={9}>Loading inventory…</td></tr>
              ) : filtered.length === 0 ? (
                <tr className="inv-state"><td colSpan={9}>No products found</td></tr>
              ) : filtered.map(p => {
                const qty = Number(latestQtyById[p.id] ?? Number(p.stock_quantity || 0))
                const img = (Array.isArray(p.images) && p.images[0]) || p.image || ''
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="inv-prod">
                        {img
                          ? <img src={img} alt={p.name} className="inv-prod-img" />
                          : <div className="inv-prod-img-ph">💎</div>
                        }
                        <span className="inv-prod-name">{p.name}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--c-text-muted)' }}>{p.sku || '—'}</td>
                    <td>{p.category || '—'}</td>
                    <td><span className="inv-price">{fmtUSD(Number(p.price || 0))}</span></td>
                    <td><span className="inv-price">{fmtINR(toINR(Number(p.price || 0)))}</span></td>
                    <td>
                      <div className={stockClass(qty)}>
                        <div className="inv-stock-dot" />
                        {qty} units
                      </div>
                    </td>
                    <td>
                      <div className="inv-adj">
                        <input type="number" min={1} className="inv-adj-inp"
                          value={amountById[p.id] ?? 1}
                          onChange={e => setAmountById(prev => ({ ...prev, [p.id]: parseInt(e.target.value || '1', 10) }))} />
                        <button className="inv-adj-out" disabled={adjustingId === p.id}
                          onClick={() => adjust(p.id, -Math.abs(amountById[p.id] ?? 1))}>
                          <Minus size={10} strokeWidth={1.5} /> Out
                        </button>
                        <button className="inv-adj-in-btn" disabled={adjustingId === p.id}
                          onClick={() => adjust(p.id, Math.abs(amountById[p.id] ?? 1))}>
                          <Plus size={10} strokeWidth={1.5} /> In
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="inv-adj">
                        <input type="number" step="0.01" placeholder="Δ USD" className="inv-adj-inp"
                          value={priceDeltaById[p.id] ?? 0}
                          onChange={e => setPriceDeltaById(prev => ({ ...prev, [p.id]: parseFloat(e.target.value || '0') }))} />
                        <button className="inv-padj-sub" disabled={adjustingId === p.id}
                          onClick={() => adjustPrice(p.id, -1)}>
                          <Minus size={10} strokeWidth={1.5} /> Price
                        </button>
                        <button className="inv-padj-add" disabled={adjustingId === p.id}
                          onClick={() => adjustPrice(p.id, +1)}>
                          <Plus size={10} strokeWidth={1.5} /> Price
                        </button>
                      </div>
                    </td>
                    <td>
                      <input type="text" className="inv-reason" placeholder="Reason (optional)"
                        value={reasonById[p.id] ?? ''}
                        onChange={e => setReasonById(prev => ({ ...prev, [p.id]: e.target.value }))} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Movements */}
      <div className="inv-mv-section">
        <div className="inv-mv-card">
          <div className="inv-mv-hdr">
            <div>
              <h2 className="inv-mv-title">Recent <em>Movements</em></h2>
              <p className="inv-mv-count">Showing {Math.min(visibleMv, movements.length)} of {movements.length}</p>
            </div>
          </div>
          <table className="inv-mv-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Product</th>
                <th>Change</th>
                <th>Qty After</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr className="inv-state"><td colSpan={5}>No movements yet</td></tr>
              ) : (
                shownMv.map((mv, idx) => (
                  <tr key={`${mv.product_id}-${idx}`}>
                    <td style={{ color: 'var(--c-text-muted)', fontSize: 10 }}>
                      {new Date(mv.created_at).toLocaleString()}
                    </td>
                    <td style={{ color: 'var(--c-text)', fontWeight: 400 }}>{mv.product_name}</td>
                    <td>
                      {mv.change >= 0
                        ? <div className="inv-mv-in"><ArrowUpRight size={11} strokeWidth={1.5} />+{mv.change}</div>
                        : <div className="inv-mv-out"><ArrowDownRight size={11} strokeWidth={1.5} />{mv.change}</div>
                      }
                    </td>
                    <td style={{ fontFamily: 'var(--font-main)', fontSize: 15, color: 'var(--c-text)', fontWeight: 400 }}>
                      {mv.quantity_after}
                    </td>
                    <td>{mv.reason || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {hasMoreMv && (
            <button className="inv-view-more" onClick={() => setVisibleMv(p => p + MOVEMENTS_INCREMENT)}>
              <ChevronDown size={11} strokeWidth={1.5} />
              View More ({Math.min(MOVEMENTS_INCREMENT, movements.length - visibleMv)} more)
            </button>
          )}
          {!hasMoreMv && movements.length > MOVEMENTS_INITIAL && (
            <div className="inv-all-loaded">All movements loaded</div>
          )}
        </div>
      </div>
    </div>
  )
}
