'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Edit, Trash2, AlertCircle, X, ShoppingCart } from 'lucide-react'
import { formatOrderDate } from '@/lib/formatOrderDate'
import { isUnpaidStatus } from '@/lib/orderStatus'

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
    try {
      // includeUnpaid=1: admins CAN review abandoned checkouts (pending /
      // payment_failed / failed) via the status filter — but the default "All"
      // view below hides them so they never masquerade as real placed orders.
      const res = await fetch('/api/orders?includeUnpaid=1')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err?.error || `HTTP error ${res.status}`)
      }
      const data = await res.json()
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
    // Default "All" hides unpaid/abandoned checkouts so they aren't mistaken for
    // real orders; picking a specific status (incl. Pending / Payment Failed /
    // Failed) still surfaces them for auditing.
    const matchesStatus = filterStatus === 'all'
      ? !isUnpaidStatus(o.status)
      : String(o.status).toLowerCase() === filterStatus.toLowerCase()
    const matchesCurrency = filterCurrency === 'all' || (o.currency || 'INR').toUpperCase() === filterCurrency.toUpperCase()
    return matchesSearch && matchesStatus && matchesCurrency
  })

  const STATUS_BADGE_MAP: Record<string, string> = {
    pending: 'a-badge--warning',
    confirmed: 'a-badge--info',
    processing: 'a-badge--info',
    shipped: 'a-badge--info',
    delivered: 'a-badge--success',
    completed: 'a-badge--success',
    cancelled: 'a-badge--danger',
    failed: 'a-badge--danger',
    payment_failed: 'a-badge--danger',
    refunded: 'a-badge--danger',
    return_requested: 'a-badge--warning',
    returned: 'a-badge--neutral'
  }

  function statusCls(s: string) {
    const mod = STATUS_BADGE_MAP[String(s).toLowerCase()] || 'a-badge--neutral'
    return `a-badge ${mod}`
  }

  const fmtPrice = (val: number, orderCurrency?: string) => {
    const curr = (orderCurrency || 'INR').toUpperCase()
    // The stored total_price is already in the order's own currency
    // (INR orders store the INR amount, USD orders store USD). Display it as-is
    // and only convert when the admin explicitly switches the "View As" currency.
    const rawVal = val

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
    <div className="a-page">
      {error && (
        <div className="a-card" style={{ borderColor: 'var(--c-danger)', background: 'var(--c-danger-bg)', marginBottom: 22 }}>
          <div className="a-row" style={{ alignItems: 'flex-start', gap: 10, padding: '13px 16px' }}>
            <AlertCircle size={16} strokeWidth={1.5} style={{ color: 'var(--c-danger)', flexShrink: 0, marginTop: 1 }} />
            <span style={{ flex: 1, fontSize: 13, lineHeight: 1.5, color: 'var(--c-danger)' }}>{error}</span>
            <button
              className="a-icon-btn a-icon-btn--sm a-icon-btn--danger"
              onClick={() => setError('')}
              aria-label="Dismiss error"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      <div className="a-head">
        <div>
          <div className="a-eyebrow">Sales</div>
          <h1 className="a-title"><em>Customer</em> Orders</h1>
          <p className="a-subtitle">Manage and process all customer orders</p>
        </div>
      </div>

      <div className="a-toolbar">
        <div className="a-search">
          <Search size={16} strokeWidth={1.5} className="a-search-ico" />
          <input
            type="text"
            className="a-search-input"
            placeholder="Search by order ID or customer…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="a-toolbar-group">
          <div className="a-field" style={{ minWidth: 0 }}>
            <span className="a-label">Status</span>
            <select className="a-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Placed Orders</option>
              <optgroup label="Fulfilment">
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
              </optgroup>
              <optgroup label="Returns & Cancellations">
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
                <option value="return_requested">Return Requested</option>
                <option value="returned">Returned</option>
              </optgroup>
              <optgroup label="Unpaid / Abandoned">
                <option value="pending">Pending (unpaid)</option>
                <option value="payment_failed">Payment Failed</option>
                <option value="failed">Failed</option>
              </optgroup>
            </select>
          </div>

          <div className="a-field" style={{ minWidth: 0 }}>
            <span className="a-label">Paid In</span>
            <select className="a-select" value={filterCurrency} onChange={e => setFilterCurrency(e.target.value)}>
              <option value="all">Any Currency</option>
              <option value="INR">₹ INR</option>
              <option value="USD">$ USD</option>
            </select>
          </div>

          <div className="a-field" style={{ minWidth: 0 }}>
            <span className="a-label">View As</span>
            <div className="a-segmented">
              <button
                className={displayCurrency === 'ORIGINAL' ? 'is-active' : ''}
                onClick={() => setDisplayCurrency('ORIGINAL')}
              >Original</button>
              <button
                className={displayCurrency === 'INR' ? 'is-active' : ''}
                onClick={() => setDisplayCurrency('INR')}
              >₹ INR</button>
              <button
                className={displayCurrency === 'USD' ? 'is-active' : ''}
                onClick={() => setDisplayCurrency('USD')}
              >$ USD</button>
            </div>
          </div>

          <span className="a-muted" style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', alignSelf: 'flex-end', paddingBottom: 11 }}>
            {filtered.length} order{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="a-table-wrap">
        <div className="a-table-scroll">
          <table className="a-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Date</th>
                <th className="a-td-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="a-loader-row">
                      <span className="a-loader" />
                      <span className="a-loader-label">Loading orders…</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="a-empty">
                      <div className="a-empty-ico">
                        <ShoppingCart size={40} strokeWidth={1} />
                      </div>
                      <div className="a-empty-title">No customer orders found.</div>
                      <div className="a-empty-text">Orders will appear here once customers start purchasing.</div>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(order => (
                <tr key={order.id}>
                  <td>
                    <span className="a-mono" title={order.id}>{String(order.id).slice(0, 14)}…</span>
                  </td>
                  <td>
                    <span className="a-cell-name">{order.customerName || '—'}</span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-main)', fontSize: 15, fontWeight: 400 }}>
                      {fmtPrice(Number(order.total || 0), order.currency)}
                    </span>
                  </td>
                  <td>
                    <span className={statusCls(order.status)}>
                      {(order.status || 'pending').split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                  </td>
                  <td className="a-cell-meta" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {order.payment_method === 'cod' ? 'COD' : (order.payment_method === 'online' || order.payment_method === 'razorpay') ? 'Razorpay' : order.payment_method === 'upi' ? 'UPI' : order.payment_method || '—'}
                  </td>
                  <td className="a-cell-meta">
                    {formatOrderDate(order.createdAt || order.created_at)}
                  </td>
                  <td>
                    <div className="a-cell-actions">
                      <Link href={`/admin/orders/${order.id}/edit`} className="a-icon-btn" title="Edit Order" aria-label="Edit Order">
                        <Edit size={15} strokeWidth={1.5} />
                      </Link>
                      <button className="a-icon-btn a-icon-btn--danger" title="Delete Order" aria-label="Delete Order" onClick={() => deleteOrder(order.id)}>
                        <Trash2 size={15} strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
