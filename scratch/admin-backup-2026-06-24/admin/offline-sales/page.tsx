'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, AlertCircle, Pencil, Trash2, ShoppingBag } from 'lucide-react'

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

const CSS = `


/* ── Base ── */
.os-page {
  min-height: 100vh;
  background: var(--c-bg);
  padding: 40px 48px;
  font-family: var(--font-main);
}

/* ── Page Header ── */
.os-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 36px;
}
.os-eyebrow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.os-eyebrow-line {
  width: 20px;
  height: 1px;
  background: var(--c-accent);
  flex-shrink: 0;
}
.os-eyebrow-tag {
  font-family: var(--font-main);
  font-size: 8px;
  font-weight: 400;
  letter-spacing: 0.44em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}
.os-page-title {
  font-family: var(--font-main);
  font-size: 36px;
  font-weight: 300;
  color: var(--c-text);
  line-height: 1.1;
  margin: 0 0 6px 0;
}
.os-page-title em {
  font-style: italic;
  color: var(--c-accent);
}
.os-page-subtitle {
  font-family: var(--font-main);
  font-size: 11px;
  font-weight: 300;
  color: var(--c-text-muted);
  letter-spacing: 0.06em;
}

/* ── Primary Button ── */
.os-btn-primary {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--c-accent);
  color: #fff;
  border: none;
  font-family: var(--font-main);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  height: 42px;
  padding: 0 22px;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s, box-shadow 0.2s;
  white-space: nowrap;
  border-radius: var(--radius);
}
.os-btn-primary:hover {
  background: var(--c-text);
  box-shadow: var(--shadow-md);
}
.os-btn-primary::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  transform: skewX(-20deg);
  transition: left 0.5s;
}
.os-btn-primary:hover::before { left: 160%; }
.os-btn-primary svg { width: 13px; height: 13px; }

/* ── Alert ── */
.os-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px;
  margin-bottom: 24px;
  border: 1px solid rgba(180,50,40,0.22);
  background: rgba(180,50,40,0.08);
  font-family: var(--font-main);
  font-size: 12px;
  font-weight: 300;
  color: rgba(220,100,90,0.9);
  letter-spacing: 0.03em;
}
.os-alert svg { width: 14px; height: 14px; flex-shrink: 0; margin-top: 1px; }
.os-alert-close {
  margin-left: auto;
  background: transparent;
  border: none;
  cursor: pointer;
  color: rgba(220,100,90,0.6);
  font-size: 16px;
  line-height: 1;
  padding: 0;
  transition: opacity 0.2s;
}
.os-alert-close:hover { opacity: 1; color: rgba(220,100,90,1); }

/* ── Search Card ── */
.os-search-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  position: relative;
  padding: 16px 20px;
  margin-bottom: 20px;
}
.os-search-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--c-accent-rgb), 0.35), transparent);
  pointer-events: none;
}
.os-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.os-search-icon {
  position: absolute;
  left: 12px;
  color: var(--c-text-muted);
  pointer-events: none;
  display: flex;
}
.os-search-icon svg { width: 14px; height: 14px; }
.os-search-input {
  width: 100%;
  height: 40px;
  padding: 0 12px 0 38px;
  background: rgba(var(--c-text-rgb), 0.04);
  border: 1px solid var(--c-border);
  font-family: var(--font-main);
  font-size: 12px;
  font-weight: 300;
  color: var(--c-text);
  outline: none;
  transition: border-color 0.2s, background 0.2s;
  box-sizing: border-box;
}
.os-search-input::placeholder { color: var(--c-text-muted); }
.os-search-input:focus {
  border-color: var(--c-accent);
  background: rgba(var(--c-text-rgb), 0.06);
}
.os-search-meta {
  margin-top: 10px;
  font-family: var(--font-main);
  font-size: 9px;
  font-weight: 300;
  letter-spacing: 0.12em;
  color: var(--c-text-muted);
}
.os-search-meta strong {
  font-weight: 400;
  color: var(--c-accent);
}

/* ── Table Card ── */
.os-table-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  position: relative;
  overflow: hidden;
}
.os-table-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--c-accent-rgb), 0.45), transparent);
  pointer-events: none;
  z-index: 1;
}
.os-table-scroll {
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--c-accent-rgb), 0.2) transparent;
}
.os-table-scroll::-webkit-scrollbar { height: 4px; }
.os-table-scroll::-webkit-scrollbar-track { background: transparent; }
.os-table-scroll::-webkit-scrollbar-thumb {
  background: rgba(var(--c-accent-rgb), 0.2);
  border-radius: 2px;
}
.os-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 680px;
}

/* thead */
.os-table thead {
  background: rgba(var(--c-accent-rgb), 0.04);
  border-bottom: 1px solid var(--c-border);
}
.os-table th {
  padding: 14px 20px;
  text-align: left;
  font-family: var(--font-main);
  font-size: 7.5px;
  font-weight: 500;
  letter-spacing: 0.38em;
  text-transform: uppercase;
  color: var(--c-text-muted);
  white-space: nowrap;
}
.os-table th.os-th-center { text-align: center; }

/* tbody */
.os-table tbody tr {
  border-bottom: 1px solid rgba(var(--c-accent-rgb), 0.05);
  transition: background 0.15s;
}
.os-table tbody tr:last-child { border-bottom: none; }
.os-table tbody tr:hover { background: rgba(var(--c-accent-rgb), 0.03); }

.os-table td {
  padding: 16px 20px;
  font-family: var(--font-main);
  font-size: 12px;
  font-weight: 300;
  color: var(--c-text-muted);
  letter-spacing: 0.04em;
  vertical-align: middle;
}
.os-table td.os-td-center { text-align: center; }

/* Customer cell */
.os-customer-name {
  font-family: var(--font-main);
  font-size: 12px;
  font-weight: 400;
  color: var(--c-text);
  letter-spacing: 0.04em;
  margin-bottom: 2px;
}
.os-customer-id {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: var(--c-text-muted);
  letter-spacing: 0.04em;
}

/* Contact cell */
.os-contact-email {
  font-size: 11px;
  color: var(--c-text-muted);
  letter-spacing: 0.03em;
}
.os-contact-phone {
  font-size: 11px;
  color: var(--c-text-muted);
  margin-top: 2px;
  letter-spacing: 0.06em;
}

/* Price cell */
.os-price {
  font-family: var(--font-main);
  font-size: 15px;
  font-weight: 400;
  color: var(--c-text);
  letter-spacing: 0.02em;
}
.os-discount {
  font-family: var(--font-main);
  font-size: 10px;
  font-weight: 300;
  color: rgba(74,222,128,0.6);
  letter-spacing: 0.06em;
  margin-top: 2px;
}

/* Date cell */
.os-date {
  font-size: 11px;
  color: var(--c-text-muted);
}
.os-time {
  font-size: 10px;
  color: var(--c-text-muted);
  margin-top: 2px;
  letter-spacing: 0.06em;
}

/* Action buttons */
.os-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.os-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: transparent;
  border: 1px solid var(--c-border);
  color: var(--c-accent);
  cursor: pointer;
  text-decoration: none;
  transition: border-color 0.18s, color 0.18s, background 0.18s;
}
.os-action-btn svg { width: 13px; height: 13px; }
.os-action-btn:hover {
  border-color: var(--c-accent);
  color: var(--c-accent);
  background: rgba(var(--c-accent-rgb), 0.06);
}
.os-action-btn--view {
  font-family: var(--font-main);
  font-size: 8px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  width: auto;
  padding: 0 10px;
}
.os-action-btn--delete {
  border-color: rgba(248,113,113,0.12);
  color: rgba(248,113,113,0.45);
}
.os-action-btn--delete:hover {
  border-color: rgba(248,113,113,0.38);
  background: rgba(248,113,113,0.07);
  color: rgba(248,113,113,0.9);
}
.os-action-btn--disabled {
  opacity: 0.25;
  cursor: not-allowed;
  pointer-events: none;
}

/* Empty / Loading states */
.os-state-row td {
  padding: 60px 20px;
  text-align: center;
}
.os-state-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.os-state-icon {
  width: 40px;
  height: 40px;
  border: 1px solid var(--c-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-text-muted);
}
.os-state-icon svg { width: 18px; height: 18px; }
.os-state-label {
  font-family: var(--font-main);
  font-size: 10px;
  font-weight: 300;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}
.os-loading-ring {
  width: 28px;
  height: 28px;
  border: 1px solid var(--c-border);
  border-top-color: var(--c-accent);
  border-radius: 50%;
  animation: os-spin 1s linear infinite;
}
@keyframes os-spin { to { transform: rotate(360deg); } }

/* Stats strip */
.os-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.os-stat-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  padding: 18px 20px;
  position: relative;
  overflow: hidden;
}
.os-stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--c-accent-rgb), 0.30), transparent);
  pointer-events: none;
}
.os-stat-label {
  font-family: var(--font-main);
  font-size: 8px;
  font-weight: 400;
  letter-spacing: 0.40em;
  text-transform: uppercase;
  color: var(--c-text-muted);
  margin-bottom: 10px;
  display: block;
}
.os-stat-value {
  font-family: var(--font-main);
  font-size: 28px;
  font-weight: 300;
  color: var(--c-text);
  line-height: 1;
}
.os-stat-value em {
  font-style: italic;
  color: var(--c-accent);
}
.os-stat-sub {
  font-family: var(--font-main);
  font-size: 9px;
  font-weight: 300;
  color: var(--c-text-muted);
  letter-spacing: 0.08em;
  margin-top: 4px;
}
`

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
    <>
      <style>{CSS}</style>
      <div className="os-page">

        {/* Error */}
        {error && (
          <div className="os-alert">
            <AlertCircle />
            <span>{error}</span>
            <button className="os-alert-close" onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* Page Header */}
        <div className="os-header">
          <div>
            <div className="os-eyebrow">
              <span className="os-eyebrow-line" />
              <span className="os-eyebrow-tag">Point of Sale</span>
            </div>
            <h1 className="os-page-title">Offline <em>Sales</em></h1>
            <p className="os-page-subtitle">In-store transactions · boutique &amp; pop-up records</p>
          </div>
          <Link href="/admin/offline-sales/new" className="os-btn-primary">
            <Plus size={13} />
            Record Sale
          </Link>
        </div>

        {/* Stats Strip */}
        {!loading && sales.length > 0 && (
          <div className="os-stats">
            <div className="os-stat-card">
              <span className="os-stat-label">Total Sales</span>
              <div className="os-stat-value">{sales.length}</div>
              <div className="os-stat-sub">transactions recorded</div>
            </div>
            <div className="os-stat-card">
              <span className="os-stat-label">Total Revenue</span>
              <div className="os-stat-value">
                <em>₹</em>{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="os-stat-sub">gross sales value</div>
            </div>
            <div className="os-stat-card">
              <span className="os-stat-label">Total Discounts</span>
              <div className="os-stat-value">
                <em>₹</em>{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="os-stat-sub">across all transactions</div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="os-search-card">
          <div className="os-search-wrap">
            <span className="os-search-icon"><Search /></span>
            <input
              type="text"
              placeholder="Search by customer name, email or phone…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="os-search-input"
            />
          </div>
          {searchQuery && (
            <div className="os-search-meta">
              Showing <strong>{filtered.length}</strong> of {sales.length} records
            </div>
          )}
        </div>

        {/* Table */}
        <div className="os-table-card">
          <div className="os-table-scroll">
            <table className="os-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th className="os-th-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr className="os-state-row">
                    <td colSpan={5}>
                      <div className="os-state-inner">
                        <div className="os-loading-ring" />
                        <span className="os-state-label">Loading sales</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr className="os-state-row">
                    <td colSpan={5}>
                      <div className="os-state-inner">
                        <div className="os-state-icon"><ShoppingBag /></div>
                        <span className="os-state-label">
                          {searchQuery ? 'No results match your search' : 'No offline sales recorded'}
                        </span>
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
                          <div className="os-customer-name">{s.customerName || '—'}</div>
                          <div className="os-customer-id">{s.id.slice(0, 8)}…</div>
                        </td>

                        {/* Contact */}
                        <td>
                          {s.customerEmail && <div className="os-contact-email">{s.customerEmail}</div>}
                          {s.customerPhone && <div className="os-contact-phone">{s.customerPhone}</div>}
                          {!s.customerEmail && !s.customerPhone && <span style={{ color: 'var(--c-text-muted)' }}>—</span>}
                        </td>

                        {/* Total */}
                        <td>
                          <div className="os-price">₹{(s.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                          {s.discount ? (
                            <div className="os-discount">−₹{s.discount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} disc.</div>
                          ) : null}
                        </td>

                        {/* Date */}
                        <td>
                          {d ? (
                            <>
                              <div className="os-date">{d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                              <div className="os-time">{d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                            </>
                          ) : <span style={{ color: 'var(--c-text-muted)' }}>—</span>}
                        </td>

                        {/* Actions */}
                        <td className="os-td-center">
                          <div className="os-actions">
                            {valid ? (
                              <>
                                <Link href={`/admin/offline-sales/${s.id}`} className={`os-action-btn os-action-btn--view`}>
                                  View
                                </Link>
                                <Link href={`/admin/offline-sales/${s.id}/edit`} className="os-action-btn">
                                  <Pencil />
                                </Link>
                                <button
                                  className="os-action-btn os-action-btn--delete"
                                  onClick={() => deleteSale(s.id)}
                                >
                                  <Trash2 />
                                </button>
                              </>
                            ) : (
                              <span className="os-action-btn os-action-btn--view os-action-btn--disabled">View</span>
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
    </>
  )
}