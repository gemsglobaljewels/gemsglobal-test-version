'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Plus, Minus, AlertCircle, RefreshCcw, ChevronDown, X, ArrowUpRight, ArrowDownRight, Boxes, AlertTriangle, PackageX, Wallet } from 'lucide-react'
import { startingRetailPrice } from '@/components/ProductCard'

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

  const qtyOf = (p: Product) => Number(latestQtyById[p.id] ?? Number(p.stock_quantity || 0))
  const lowStockCount = filtered.filter(p => { const q = qtyOf(p); return q > 0 && q <= 3 }).length
  const outOfStockCount = filtered.filter(p => qtyOf(p) <= 0).length
  const totalUnits = filtered.reduce((sum, p) => sum + qtyOf(p), 0)

  const stockBadge = (qty: number) => {
    if (qty <= 0) return 'a-badge a-badge--danger'
    if (qty <= 3) return 'a-badge a-badge--warning'
    return 'a-badge a-badge--success'
  }
  const stockDot = (qty: number) => {
    if (qty <= 0) return 'a-dot a-dot--danger'
    if (qty <= 3) return 'a-dot a-dot--warning a-dot--pulse'
    return 'a-dot a-dot--success'
  }

  return (
    <div className="a-page">
      {/* Header */}
      <div className="a-head">
        <div>
          <div className="a-eyebrow">Stock Management</div>
          <h1 className="a-title"><em>Inventory</em> Control</h1>
          <p className="a-subtitle">{filtered.length} products · adjust stock and prices</p>
        </div>
        <div className="a-head-actions">
          <Link href="/admin/products/new" className="a-btn a-btn--primary">
            <Plus size={15} strokeWidth={2} /> Add Product
          </Link>
          <button className="a-btn a-btn--ghost" onClick={load}>
            <RefreshCcw size={15} strokeWidth={1.5} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="a-card" style={{ background: 'var(--c-danger-bg)', borderColor: 'var(--c-danger)', marginBottom: 20 }}>
          <div className="a-card-body">
            <div className="a-row" style={{ alignItems: 'flex-start', gap: 12 }}>
              <AlertCircle size={20} style={{ color: 'var(--c-danger)', flexShrink: 0, marginTop: 1 }} />
              <p style={{ color: 'var(--c-danger)', flex: 1, margin: 0, fontFamily: 'var(--font-dmsans)' }}>{error}</p>
              <button className="a-icon-btn a-icon-btn--sm" onClick={() => setError('')} style={{ color: 'var(--c-danger)' }} aria-label="Dismiss">
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="a-stats">
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-ico" style={{ background: 'var(--c-info-bg)', color: 'var(--c-info)' }}>
              <Boxes size={18} />
            </span>
            <span className="a-stat-label">Total Units</span>
          </div>
          <div className={`a-stat-val${loading ? ' is-loading' : ''}`}>{totalUnits}</div>
          <div className="a-stat-sub">{filtered.length} products on this page</div>
        </div>
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-ico" style={{ background: 'var(--c-warning-bg)', color: 'var(--c-warning)' }}>
              <AlertTriangle size={18} />
            </span>
            <span className="a-stat-label">Low Stock</span>
          </div>
          <div className={`a-stat-val${loading ? ' is-loading' : ''}`}>{lowStockCount}</div>
          <div className="a-stat-sub">≤ 3 units remaining</div>
        </div>
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-ico" style={{ background: 'var(--c-danger-bg)', color: 'var(--c-danger)' }}>
              <PackageX size={18} />
            </span>
            <span className="a-stat-label">Out of Stock</span>
          </div>
          <div className={`a-stat-val${loading ? ' is-loading' : ''}`}>{outOfStockCount}</div>
          <div className="a-stat-sub">Needs restocking</div>
        </div>
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-ico" style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}>
              <Wallet size={18} />
            </span>
            <span className="a-stat-label">Stock Value</span>
          </div>
          <div className={`a-stat-val${loading ? ' is-loading' : ''}`}>
            {currency === 'INR'
              ? fmtINR(toINR(filtered.reduce((sum, p) => sum + startingRetailPrice(p) * qtyOf(p), 0)))
              : fmtUSD(filtered.reduce((sum, p) => sum + startingRetailPrice(p) * qtyOf(p), 0))}
          </div>
          <div className="a-stat-sub">Across visible products</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="a-toolbar">
        <div className="a-search">
          <Search className="a-search-ico" size={18} />
          <input
            type="text"
            className="a-search-input"
            placeholder="Search by name, SKU, or category…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="a-toolbar-group">
          <label className="a-label" style={{ margin: 0 }}>Currency</label>
          <select
            className="a-select"
            style={{ width: 'auto' }}
            value={currency}
            onChange={e => {
              const v = e.target.value as 'USD' | 'INR'; setCurrency(v); localStorage.setItem('admin_currency_pref', v)
            }}
          >
            <option value="USD">USD $</option>
            <option value="INR">INR ₹</option>
          </select>
        </div>
        <div className="a-toolbar-group">
          <label className="a-label" style={{ margin: 0 }}>FX Rate</label>
          <input
            type="number"
            step="0.01"
            className="a-input"
            style={{ width: 90 }}
            value={fxRate}
            onChange={e => { const v = Number(e.target.value || '0'); const nv = Number.isFinite(v) && v > 0 ? v : 83; setFxRate(nv); localStorage.setItem('admin_fx_rate', String(nv)) }}
          />
          <span className="a-muted" style={{ whiteSpace: 'nowrap' }}>1 USD ≈ ₹{fxRate.toFixed(2)}</span>
        </div>
      </div>

      {/* Main table */}
      <div className="a-table-wrap">
        <div className="a-table-scroll">
          <table className="a-table">
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
                <tr>
                  <td colSpan={9}>
                    <div className="a-loader-row">
                      <span className="a-loader" />
                      <span className="a-loader-label">Loading inventory…</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="a-empty">
                      <Boxes className="a-empty-ico" size={32} />
                      <div className="a-empty-title">No products found</div>
                      <div className="a-empty-text">Try adjusting your search or add a new product.</div>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(p => {
                const qty = Number(latestQtyById[p.id] ?? Number(p.stock_quantity || 0))
                const img = (Array.isArray(p.images) && p.images[0]) || p.image || ''
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="a-cell-lead">
                        {img
                          ? <img src={img} alt={p.name} className="a-media" />
                          : <div className="a-media" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💎</div>
                        }
                        <span className="a-cell-name">{p.name}</span>
                      </div>
                    </td>
                    <td className="a-mono">{p.sku || '—'}</td>
                    <td>{p.category || '—'}</td>
                    <td>{fmtUSD(startingRetailPrice(p))}</td>
                    <td>{fmtINR(toINR(startingRetailPrice(p)))}</td>
                    <td>
                      <span className={stockBadge(qty)}>
                        <span className={stockDot(qty)} />
                        {qty} units
                      </span>
                    </td>
                    <td>
                      <div className="a-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                        <input
                          type="number"
                          min={1}
                          className="a-input"
                          style={{ width: 64, textAlign: 'center' }}
                          value={amountById[p.id] ?? 1}
                          onChange={e => setAmountById(prev => ({ ...prev, [p.id]: parseInt(e.target.value || '1', 10) }))}
                        />
                        <button
                          className="a-btn a-btn--danger a-btn--sm"
                          disabled={adjustingId === p.id}
                          onClick={() => adjust(p.id, -Math.abs(amountById[p.id] ?? 1))}
                        >
                          <Minus size={13} strokeWidth={1.5} /> Out
                        </button>
                        <button
                          className="a-btn a-btn--primary a-btn--sm"
                          disabled={adjustingId === p.id}
                          onClick={() => adjust(p.id, Math.abs(amountById[p.id] ?? 1))}
                        >
                          <Plus size={13} strokeWidth={1.5} /> In
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="a-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Δ USD"
                          className="a-input"
                          style={{ width: 72, textAlign: 'center' }}
                          value={priceDeltaById[p.id] ?? 0}
                          onChange={e => setPriceDeltaById(prev => ({ ...prev, [p.id]: parseFloat(e.target.value || '0') }))}
                        />
                        <button
                          className="a-btn a-btn--danger a-btn--sm"
                          disabled={adjustingId === p.id}
                          onClick={() => adjustPrice(p.id, -1)}
                        >
                          <Minus size={13} strokeWidth={1.5} /> Price
                        </button>
                        <button
                          className="a-btn a-btn--subtle a-btn--sm"
                          disabled={adjustingId === p.id}
                          onClick={() => adjustPrice(p.id, +1)}
                        >
                          <Plus size={13} strokeWidth={1.5} /> Price
                        </button>
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="a-input"
                        style={{ width: 160 }}
                        placeholder="Reason (optional)"
                        value={reasonById[p.id] ?? ''}
                        onChange={e => setReasonById(prev => ({ ...prev, [p.id]: e.target.value }))}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="a-row a-row--between" style={{ marginTop: 16 }}>
          <span className="a-muted" style={{ fontSize: 13 }}>
            Page <strong style={{ color: 'var(--c-text)' }}>{page}</strong> of {totalPages} · {total} products total
          </span>
          <div className="a-pager">
            <button
              className="a-pager-btn"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronDown size={16} style={{ transform: 'rotate(90deg)' }} />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`a-pager-btn ${page === i + 1 ? 'is-active' : ''}`}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="a-pager-btn"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
            </button>
          </div>
        </div>
      )}

      {/* Recent Movements */}
      <div className="a-card" style={{ marginTop: 24 }}>
        <div className="a-card-head">
          <div>
            <h2 className="a-card-title">Recent <em>Movements</em></h2>
            <p className="a-card-sub">Showing {Math.min(visibleMv, movements.length)} of {movements.length}</p>
          </div>
        </div>
        <div className="a-card-body a-card-body--flush">
          <div className="a-table-scroll">
            <table className="a-table">
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
                  <tr>
                    <td colSpan={5}>
                      <div className="a-empty">
                        <ArrowUpRight className="a-empty-ico" size={32} />
                        <div className="a-empty-title">No movements yet</div>
                        <div className="a-empty-text">Stock and price adjustments will appear here.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  shownMv.map((mv, idx) => (
                    <tr key={`${mv.product_id}-${idx}`}>
                      <td className="a-cell-meta">{new Date(mv.created_at).toLocaleString()}</td>
                      <td className="a-cell-name">{mv.product_name}</td>
                      <td>
                        {mv.change >= 0
                          ? <span className="a-badge a-badge--success"><ArrowUpRight size={12} strokeWidth={1.5} />+{mv.change}</span>
                          : <span className="a-badge a-badge--danger"><ArrowDownRight size={12} strokeWidth={1.5} />{mv.change}</span>
                        }
                      </td>
                      <td style={{ fontFamily: 'var(--font-main)', fontSize: 15 }}>{mv.quantity_after}</td>
                      <td>{mv.reason || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {hasMoreMv && (
          <div className="a-card-foot" style={{ justifyContent: 'center' }}>
            <button className="a-btn a-btn--ghost a-btn--block" onClick={() => setVisibleMv(p => p + MOVEMENTS_INCREMENT)}>
              <ChevronDown size={15} strokeWidth={1.5} />
              View More ({Math.min(MOVEMENTS_INCREMENT, movements.length - visibleMv)} more)
            </button>
          </div>
        )}
        {!hasMoreMv && movements.length > MOVEMENTS_INITIAL && (
          <div className="a-card-foot" style={{ justifyContent: 'center' }}>
            <span className="a-muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.18em' }}>All movements loaded</span>
          </div>
        )}
      </div>
    </div>
  )
}
