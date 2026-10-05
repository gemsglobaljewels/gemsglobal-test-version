'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, AlertCircle, Pencil, Trash2, ShoppingBag, X, IndianRupee, Receipt, BadgePercent } from 'lucide-react'

type SaleRow = {
  id: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  total?: number
  discount?: number
  subtotal?: number
  createdAt?: string
}

export default function AdminOfflineSalesPage() {
  const [sales, setSales] = useState<SaleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { fetchSales() }, [])

  async function fetchSales() {
    try {
      setLoading(true)
      const res = await fetch('/api/offline-sales')
      const data = await res.json()
      setSales(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load offline sales')
    } finally {
      setLoading(false)
    }
  }

  const filtered = sales.filter((s) => {
    const q = searchQuery.toLowerCase()
    return (
      String(s.customerName || '').toLowerCase().includes(q) ||
      String(s.customerEmail || '').toLowerCase().includes(q) ||
      String(s.customerPhone || '').toLowerCase().includes(q)
    )
  })

  const isUuid = (val?: string) =>
    typeof val === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)

  async function deleteSale(id: string) {
    if (!isUuid(id)) return
    const ok = window.confirm('Delete this offline sale? This action cannot be undone.')
    if (!ok) return
    try {
      const res = await fetch(`/api/offline-sales/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Failed to delete sale')
      } else {
        await fetchSales()
      }
    } catch {
      setError('Failed to delete sale')
    }
  }

  // Derived stats
  const totalRevenue = sales.reduce((a, s) => a + (s.total || 0), 0)
  const totalDiscount = sales.reduce((a, s) => a + (s.discount || 0), 0)

  return (
    <div className="a-page">

      {/* Error */}
      {error && (
        <div className="a-card" style={{ borderColor: 'var(--c-danger)', background: 'var(--c-danger-bg)', marginBottom: 20 }}>
          <div className="a-card-body a-row" style={{ gap: 12, color: 'var(--c-danger)' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 13 }}>{error}</span>
            <button
              className="a-icon-btn a-icon-btn--sm"
              onClick={() => setError('')}
              style={{ marginLeft: 'auto', color: 'var(--c-danger)' }}
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="a-head">
        <div>
          <div className="a-eyebrow">Point of Sale</div>
          <h1 className="a-title">Offline <em>Sales</em></h1>
          <p className="a-subtitle">In-store transactions · boutique &amp; pop-up records</p>
        </div>
        <div className="a-head-actions">
          <Link href="/admin/offline-sales/new" className="a-btn a-btn--primary">
            <Plus size={15} />
            Record Sale
          </Link>
        </div>
      </div>

      {/* Stats Strip */}
      {!loading && sales.length > 0 && (
        <div className="a-stats" style={{ marginBottom: 20 }}>
          <div className="a-stat">
            <div className="a-stat-top">
              <span className="a-stat-label">Total Sales</span>
              <span className="a-stat-ico"><Receipt size={16} /></span>
            </div>
            <div className="a-stat-val">{sales.length}</div>
            <div className="a-stat-sub">transactions recorded</div>
          </div>
          <div className="a-stat">
            <div className="a-stat-top">
              <span className="a-stat-label">Total Revenue</span>
              <span className="a-stat-ico"><IndianRupee size={16} /></span>
            </div>
            <div className="a-stat-val">
              ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="a-stat-sub">gross sales value</div>
          </div>
          <div className="a-stat">
            <div className="a-stat-top">
              <span className="a-stat-label">Total Discounts</span>
              <span className="a-stat-ico"><BadgePercent size={16} /></span>
            </div>
            <div className="a-stat-val">
              ₹{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="a-stat-sub">across all transactions</div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="a-toolbar">
        <div className="a-search">
          <span className="a-search-ico"><Search size={15} /></span>
          <input
            type="text"
            placeholder="Search by customer name, email or phone…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="a-search-input"
          />
        </div>
        {searchQuery && (
          <span className="a-muted" style={{ fontFamily: 'var(--font-dmsans)', fontSize: 12 }}>
            Showing <strong style={{ color: 'var(--c-accent)' }}>{filtered.length}</strong> of {sales.length} records
          </span>
        )}
      </div>

      {/* Table */}
      <div className="a-table-wrap">
        <div className="a-table-scroll">
          <table className="a-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Total</th>
                <th>Date</th>
                <th className="a-td-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <div className="a-loader-row">
                      <span className="a-loader" />
                      <span className="a-loader-label">Loading sales</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="a-empty">
                      <div className="a-empty-ico"><ShoppingBag size={20} /></div>
                      <div className="a-empty-title">
                        {searchQuery ? 'No results match your search' : 'No offline sales recorded'}
                      </div>
                      <div className="a-empty-text">
                        {searchQuery ? 'Try a different customer name, email or phone.' : 'Record your first in-store transaction to see it here.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const d = s.createdAt ? new Date(s.createdAt) : null
                  const valid = isUuid(s.id)
                  return (
                    <tr key={s.id}>
                      {/* Customer */}
                      <td>
                        <div className="a-cell-name">{s.customerName || '—'}</div>
                        <div className="a-cell-meta a-mono">{s.id.slice(0, 8)}…</div>
                      </td>

                      {/* Contact */}
                      <td>
                        {s.customerEmail && <div className="a-cell-meta">{s.customerEmail}</div>}
                        {s.customerPhone && <div className="a-cell-meta">{s.customerPhone}</div>}
                        {!s.customerEmail && !s.customerPhone && <span className="a-muted">—</span>}
                      </td>

                      {/* Total */}
                      <td>
                        <div className="a-cell-name">₹{(s.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                        {s.discount ? (
                          <div style={{ marginTop: 4 }}>
                            <span className="a-badge a-badge--success">
                              −₹{s.discount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} disc.
                            </span>
                          </div>
                        ) : null}
                      </td>

                      {/* Date */}
                      <td>
                        {d ? (
                          <>
                            <div className="a-cell-meta">{d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div className="a-cell-meta">{d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                          </>
                        ) : <span className="a-muted">—</span>}
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="a-cell-actions">
                          {valid ? (
                            <>
                              <Link href={`/admin/offline-sales/${s.id}`} className="a-btn a-btn--subtle a-btn--sm">
                                View
                              </Link>
                              <Link href={`/admin/offline-sales/${s.id}/edit`} className="a-icon-btn a-icon-btn--sm" aria-label="Edit sale">
                                <Pencil size={14} />
                              </Link>
                              <button
                                className="a-icon-btn a-icon-btn--sm a-icon-btn--danger"
                                onClick={() => deleteSale(s.id)}
                                aria-label="Delete sale"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          ) : (
                            <span className="a-btn a-btn--subtle a-btn--sm" style={{ opacity: 0.4, pointerEvents: 'none' }}>View</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
