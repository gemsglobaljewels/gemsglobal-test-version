'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Edit, Trash2, AlertCircle, X, ShoppingCart } from 'lucide-react'

const CSS = `
.orders-root {
  min-height: 100vh;
  background: var(--c-bg);
  color: var(--c-text);
  font-family: var(--font-main);
  padding: 120px 40px 100px;
  position: relative;
}

.orders-grain {
  position: fixed; inset: 0; z-index: 50; pointer-events: none; opacity: 0.02;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* Header */
.orders-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 40px;
}
.orders-header-eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.orders-header-line {
  width: 20px;
  height: 0.5px;
  background-color: var(--c-border);
}
.orders-header-tag {
  font-size: 8px;
  font-weight: 400;
  letter-spacing: 0.44em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}
.orders-header-title {
  font-family: var(--font-main);
  font-size: 36px;
  font-weight: 300;
  letter-spacing: 0.02em;
  color: var(--c-text);
}
.orders-header-title em {
  font-style: italic;
  color: var(--c-accent);
}
.orders-header-subtitle {
  font-size: 11px;
  font-weight: 300;
  letter-spacing: 0.09em;
  color: var(--c-text-muted);
  margin-top: 4px;
}

/* Error */
.orders-error {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 13px 16px;
  margin-bottom: 22px;
  background-color: rgba(185, 64, 64, 0.08);
  border: 1px solid rgba(185, 64, 64, 0.22);
}
.orders-error-text {
  font-size: 12px;
  font-weight: 300;
  line-height: 1.5;
  color: rgba(185, 64, 64, 0.9);
  flex: 1;
}

/* Filters */
.orders-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 20px;
}
@media (max-width: 900px) { .orders-filters { flex-direction: column; align-items: stretch; } }

.orders-search-wrap {
  flex: 1;
  position: relative;
  max-width: 400px;
}
.orders-search {
  width: 100%;
  height: 48px;
  background: #fff;
  border: 1px solid var(--c-border);
  padding: 0 16px 0 48px;
  font-size: 13px;
  outline: none;
  transition: 0.3s;
  border-radius: var(--radius);
}
.orders-search:focus { border-color: var(--c-accent); box-shadow: var(--shadow-md); }
.orders-search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--c-accent); }

.orders-btn-group { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.orders-select-wrap { display: flex; align-items: center; gap: 8px; }
.orders-select-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--c-text-muted);
}
.orders-select {
  height: 48px;
  padding: 0 32px 0 16px;
  background: #fff;
  border: 1px solid var(--c-border);
  color: var(--c-text);
  font-size: 12px;
  outline: none;
  cursor: pointer;
  border-radius: var(--radius);
  transition: 0.3s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6' stroke='rgba(143,122,112,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}
.orders-select:focus { border-color: var(--c-accent); }

/* Currency Toggle */
.orders-currency-toggle {
  display: flex;
  border: 1px solid var(--c-border);
  height: 48px;
  border-radius: var(--radius);
  background: #fff;
  overflow: hidden;
}
.orders-currency-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0 16px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--c-text-muted);
  transition: 0.2s;
}
.orders-currency-btn:hover { color: var(--c-accent); }
.orders-currency-btn.active {
  background: rgba(143, 122, 112, 0.12);
  color: var(--c-accent);
}

/* Table */
.orders-table-container {
  background: #fff;
  border: 1px solid var(--c-border);
  overflow-x: auto;
  box-shadow: var(--shadow-md);
  border-radius: var(--radius);
}
.orders-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}
.orders-table th {
  text-align: left;
  padding: 20px 24px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--c-accent);
  border-bottom: 1px solid var(--c-border);
  background: var(--c-surface);
}
.orders-table td {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(var(--c-accent-rgb), 0.06);
  font-size: 13px;
  vertical-align: middle;
  color: var(--c-text);
}
.orders-table tr:hover { background: var(--c-surface); }

.orders-order-id {
  font-family: monospace;
  font-size: 11px;
  color: var(--c-text-muted);
  font-weight: 600;
}

.orders-amount {
  font-family: var(--font-main);
  font-size: 15px;
  font-weight: 400;
}

/* Status Badges */
.orders-status {
  padding: 4px 10px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-radius: 100px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid transparent;
}
.orders-status-pending { background: #FEF3C7; color: #D97706; }
.orders-status-processing { background: #DBEAFE; color: #2563EB; }
.orders-status-shipped { background: #F3E8FF; color: #7C3AED; }
.orders-status-delivered, .orders-status-completed { background: #D1FAE5; color: #059669; }
.orders-status-cancelled, .orders-status-failed, .orders-status-refunded, .orders-status-payment_failed { background: #FEE2E2; color: #DC2626; }
.orders-status-default { background: #F3F4F6; color: #4B5563; }

.orders-actions { display: flex; gap: 8px; }
.orders-action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--c-border);
  background: transparent;
  color: var(--c-text);
  cursor: pointer;
  transition: 0.2s;
  border-radius: var(--radius);
}
.orders-action-btn:hover { border-color: var(--c-accent); color: var(--c-accent); background: #fff; }
.orders-action-btn.del:hover { border-color: #EF4444; color: #EF4444; }

.orders-state-td {
  text-align: center;
  padding: 100px 0 !important;
}
`

const DEFAULT_USD_TO_INR = 83.5

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCurrency, setFilterCurrency] = useState('all')
  const [error, setError] = useState('')
  const [displayCurrency, setDisplayCurrency] = useState<'ORIGINAL' | 'USD' | 'INR'>('ORIGINAL')
  const [usdToInr, setUsdToInr] = useState(DEFAULT_USD_TO_INR)

  useEffect(() => {
    fetch('/api/exchange-rate')
      .then(r => r.json())
      .then(d => { if (typeof d?.rate === 'number') setUsdToInr(d.rate) })
      .catch(() => { })
  }, [])

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    console.log('[AdminOrdersPage] Fetching orders...')
    try {
      const res = await fetch('/api/orders')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err?.error || `HTTP error ${res.status}`)
      }
      const data = await res.json()
      console.log('[AdminOrdersPage] API returned:', data)
      setOrders(Array.isArray(data) ? data : [])
    } catch (e: any) {
      console.error('[AdminOrdersPage] Error:', e)
      setError(e.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  async function deleteOrder(id: string) {
    if (!confirm('Are you sure you want to delete this order?')) return
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        throw new Error('Failed to delete')
      }
      setOrders(p => p.filter(o => o.id !== id))
    } catch {
      setError('Failed to delete order')
    }
  }

  const filtered = orders.filter(o => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = String(o.id).toLowerCase().includes(q) || (o.customerName || '').toLowerCase().includes(q)
    const matchesStatus = filterStatus === 'all' ? true : String(o.status).toLowerCase() === filterStatus.toLowerCase()
    const matchesCurrency = filterCurrency === 'all' || (o.currency || 'INR').toUpperCase() === filterCurrency.toUpperCase()
    return matchesSearch && matchesStatus && matchesCurrency
  })

  const STATUS_BADGE_MAP: Record<string, string> = {
    pending: 'orders-status-pending',
    confirmed: 'orders-status-processing',
    processing: 'orders-status-processing',
    shipped: 'orders-status-shipped',
    delivered: 'orders-status-delivered',
    completed: 'orders-status-completed',
    cancelled: 'orders-status-cancelled',
    failed: 'orders-status-failed',
    payment_failed: 'orders-status-payment_failed',
    refunded: 'orders-status-refunded'
  }

  function statusCls(s: string) {
    const mod = STATUS_BADGE_MAP[String(s).toLowerCase()] || 'orders-status-default'
    return `orders-status ${mod}`
  }

  const fmtPrice = (val: number, orderCurrency?: string) => {
    const curr = (orderCurrency || 'INR').toUpperCase()
    let rawVal = val

    // HEURISTIC: Fix old INR orders stored as USD values
    if (curr === 'INR' && val < 500) {
      rawVal = val * (usdToInr || 93.1)
    }

    if (displayCurrency === 'INR') {
      const inrVal = curr === 'USD' ? rawVal * usdToInr : rawVal
      return `₹${Math.round(inrVal).toLocaleString('en-IN')}`
    }

    if (displayCurrency === 'USD') {
      const usdVal = curr === 'INR' ? rawVal / usdToInr : rawVal
      return `$${Number(usdVal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    // ORIGINAL
    if (curr === 'USD') {
      return `$${Number(rawVal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return `₹${Number(rawVal).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  return (
    <div className="orders-root">
      <style>{CSS}</style>
      <div className="orders-grain" />

      {error && (
        <div className="orders-error">
          <AlertCircle size={14} strokeWidth={1.5} style={{ color: 'var(--c-error)', flexShrink: 0 }} />
          <span className="orders-error-text">{error}</span>
          <button onClick={() => setError('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--c-error)', opacity: 0.5 }}>
            <X size={12} strokeWidth={1.5} />
          </button>
        </div>
      )}

      <div className="orders-header">
        <div className="orders-header-eyebrow">
          <div className="orders-header-line" />
          <span className="orders-header-tag">Sales</span>
        </div>
        <h1 className="orders-header-title">
          <em>Customer</em> Orders
        </h1>
        <p className="orders-header-subtitle">Manage and process all customer orders</p>
      </div>

      <div className="orders-filters">
        <div className="orders-search-wrap">
          <Search size={16} strokeWidth={1.5} className="orders-search-icon" />
          <input
            type="text"
            className="orders-search"
            placeholder="Search by order ID or customer…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="orders-btn-group">
          <div className="orders-select-wrap">
            <span className="orders-select-label">Status</span>
            <select className="orders-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
              <option value="payment_failed">Payment Failed</option>
            </select>
          </div>

          <div className="orders-select-wrap">
            <span className="orders-select-label">Paid In</span>
            <select className="orders-select" value={filterCurrency} onChange={e => setFilterCurrency(e.target.value)}>
              <option value="all">Any Currency</option>
              <option value="INR">₹ INR</option>
              <option value="USD">$ USD</option>
            </select>
          </div>

          <div className="orders-select-wrap">
            <span className="orders-select-label">View As</span>
            <div className="orders-currency-toggle">
              <button className={`orders-currency-btn ${displayCurrency === 'ORIGINAL' ? 'active' : ''}`} onClick={() => setDisplayCurrency('ORIGINAL')}>Original</button>
              <button className={`orders-currency-btn ${displayCurrency === 'INR' ? 'active' : ''}`} onClick={() => setDisplayCurrency('INR')}>₹ INR</button>
              <button className={`orders-currency-btn ${displayCurrency === 'USD' ? 'active' : ''}`} onClick={() => setDisplayCurrency('USD')}>$ USD</button>
            </div>
          </div>
          
          <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', color: 'var(--c-text-muted)', marginLeft: 8 }}>
            {filtered.length} order{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="orders-state-td">
                  <span style={{ letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: 11, color: 'var(--c-text-muted)' }}>Loading orders…</span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="orders-state-td">
                  <ShoppingCart size={48} strokeWidth={1} opacity={0.2} style={{ margin: '0 auto 20px' }} />
                  <p style={{ fontStyle: 'italic', color: 'var(--c-text-muted)', fontSize: 13 }}>No customer orders found.</p>
                </td>
              </tr>
            ) : filtered.map(order => (
              <tr key={order.id}>
                <td>
                  <span className="orders-order-id" title={order.id}>{String(order.id).slice(0, 14)}…</span>
                </td>
                <td>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text)' }}>
                    {order.customerName || '—'}
                  </span>
                </td>
                <td>
                  <span className="orders-amount">{fmtPrice(Number(order.total || 0), order.currency)}</span>
                </td>
                <td>
                  <span className={statusCls(order.status)}>
                    {order.status === 'payment_failed' ? 'Payment Failed' : order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                  </span>
                </td>
                <td style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--c-text-muted)' }}>
                  {order.payment_method === 'cod' ? 'COD' : order.payment_method === 'online' ? 'Online' : order.payment_method === 'upi' ? 'UPI' : order.payment_method || '—'}
                </td>
                <td style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>
                  {order.createdAt || order.created_at ? String(order.createdAt || order.created_at).slice(0, 10) : '—'}
                </td>
                <td>
                  <div className="orders-actions" style={{ justifyContent: 'flex-end' }}>
                    <Link href={`/admin/orders/${order.id}/edit`}>
                      <button className="orders-action-btn" title="Edit Order">
                        <Edit size={14} />
                      </button>
                    </Link>
                    <button className="orders-action-btn del" title="Delete Order" onClick={() => deleteOrder(order.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
