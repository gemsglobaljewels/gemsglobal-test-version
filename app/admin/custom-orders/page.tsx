'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  AlertCircle,
  Trash2,
  X,
  Gem,
  Clock,
  CheckCircle2,
  MailCheck,
  Package,
  SlidersHorizontal,
} from 'lucide-react'
import { STATUS_FLOW, STATUS_LABELS, STATUS_BADGE_CLASS, canonicalStatus, type CustomOrderStatus } from '@/lib/customOrder'

// ── Shared types + helpers ──────────────────────────────────────────────────
type CORequest = {
  id: string
  userId?: string | null
  customerName: string
  customerEmail?: string | null
  customerPhone?: string | null
  country?: string | null
  title: string
  description?: string | null
  category?: string | null
  metalPreference?: string | null
  budget?: string | null
  processingTime?: string | null
  quantity?: number
  referenceImages?: string[]
  referenceProduct?: string | null
  status: string
  adminReply?: string | null
  repliedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

const STATUS_TABS: Array<{ key: 'all' | CustomOrderStatus; label: string }> = [
  { key: 'all', label: 'All' },
  ...STATUS_FLOW.map((s) => ({ key: s, label: STATUS_LABELS[s] })),
]

const isUuid = (val?: string) =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)

export default function AdminCustomOrdersPage() {
  const [requests, setRequests] = useState<CORequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | CustomOrderStatus>('all')

  useEffect(() => { fetchRequests() }, [])

  async function fetchRequests() {
    try {
      setLoading(true)
      const res = await fetch('/api/custom-orders')
      const data = await res.json()
      setRequests(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load custom orders')
    } finally {
      setLoading(false)
    }
  }

  async function deleteRequest(id: string) {
    if (!isUuid(id)) return
    const ok = window.confirm('Delete this custom order request? This action cannot be undone.')
    if (!ok) return
    try {
      const res = await fetch(`/api/custom-orders/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Failed to delete request')
      } else {
        await fetchRequests()
      }
    } catch {
      setError('Failed to delete request')
    }
  }

  // ── Client-side filter (search + status) ──
  const filtered = requests.filter((r) => {
    if (statusFilter !== 'all' && canonicalStatus(r.status) !== statusFilter) return false
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return (
      String(r.customerName || '').toLowerCase().includes(q) ||
      String(r.customerEmail || '').toLowerCase().includes(q) ||
      String(r.customerPhone || '').toLowerCase().includes(q) ||
      String(r.title || '').toLowerCase().includes(q) ||
      String(r.id || '').toLowerCase().includes(q)
    )
  })

  // ── Derived stats ──
  const newCount = requests.filter((r) => canonicalStatus(r.status) === 'new').length
  const repliedCount = requests.filter((r) => canonicalStatus(r.status) === 'replied').length
  const placedCount = requests.filter((r) => canonicalStatus(r.status) === 'place_order').length

  return (
    <>
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
            <div className="a-eyebrow">Bespoke</div>
            <h1 className="a-title">Custom <em>Orders</em></h1>
            <p className="a-subtitle">Customer-submitted bespoke jewellery requests</p>
          </div>
          <div className="a-head-actions">
            <Link href="/admin/custom-orders/options" className="a-btn a-btn--subtle">
              <SlidersHorizontal size={16} /> Manage Options
            </Link>
          </div>
        </div>

        {/* Stats Strip */}
        {!loading && requests.length > 0 && (
          <div className="a-stats" style={{ marginBottom: 20 }}>
            <div className="a-stat">
              <div className="a-stat-top">
                <span className="a-stat-label">Total Requests</span>
                <span className="a-stat-ico"><Gem size={16} /></span>
              </div>
              <div className="a-stat-val">{requests.length}</div>
              <div className="a-stat-sub">custom orders received</div>
            </div>
            <div className="a-stat">
              <div className="a-stat-top">
                <span className="a-stat-label">New</span>
                <span className="a-stat-ico"><Clock size={16} /></span>
              </div>
              <div className="a-stat-val">{newCount}</div>
              <div className="a-stat-sub">awaiting review</div>
            </div>
            <div className="a-stat">
              <div className="a-stat-top">
                <span className="a-stat-label">Replied</span>
                <span className="a-stat-ico"><MailCheck size={16} /></span>
              </div>
              <div className="a-stat-val">{repliedCount}</div>
              <div className="a-stat-sub">customer contacted</div>
            </div>
            <div className="a-stat">
              <div className="a-stat-top">
                <span className="a-stat-label">Placed</span>
                <span className="a-stat-ico"><Package size={16} /></span>
              </div>
              <div className="a-stat-val">{placedCount}</div>
              <div className="a-stat-sub">order placed</div>
            </div>
          </div>
        )}

        {/* Toolbar: search + status filter */}
        <div className="a-toolbar">
          <div className="a-search">
            <span className="a-search-ico"><Search size={15} /></span>
            <input
              type="text"
              placeholder="Search by customer, email, title…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="a-search-input"
            />
          </div>
          <div className="a-segmented">
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={statusFilter === t.key ? 'is-active' : ''}
                onClick={() => setStatusFilter(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          {(searchQuery || statusFilter !== 'all') && (
            <span className="a-muted" style={{ fontFamily: 'var(--font-dmsans)', fontSize: 12 }}>
              Showing <strong style={{ color: 'var(--c-accent)' }}>{filtered.length}</strong> of {requests.length}
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
                  <th>Request</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="a-td-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="a-loader-row">
                        <span className="a-loader" />
                        <span className="a-loader-label">Loading custom orders</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="a-empty">
                        <div className="a-empty-ico"><Gem size={20} /></div>
                        <div className="a-empty-title">
                          {searchQuery || statusFilter !== 'all' ? 'No results match your filters' : 'No custom orders yet'}
                        </div>
                        <div className="a-empty-text">
                          {searchQuery || statusFilter !== 'all'
                            ? 'Try a different search term or status filter.'
                            : 'Bespoke requests submitted by customers will appear here.'}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const d = r.createdAt ? new Date(r.createdAt) : null
                    const valid = isUuid(r.id)
                    const st = canonicalStatus(r.status)
                    const imgCount = Array.isArray(r.referenceImages) ? r.referenceImages.length : 0
                    return (
                      <tr key={r.id}>
                        {/* Customer */}
                        <td>
                          <div className="a-cell-name">{r.customerName || '—'}</div>
                          <div className="a-cell-meta">{r.customerEmail || r.customerPhone || '—'}</div>
                        </td>

                        {/* Request */}
                        <td>
                          <div
                            className="a-cell-name"
                            style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={r.title}
                          >
                            {r.title || '—'}
                          </div>
                          <div className="a-cell-meta">
                            {[r.category, r.metalPreference].filter(Boolean).join(' · ') || 'No category'}
                          </div>
                        </td>

                        {/* Details */}
                        <td>
                          <div className="a-cell-meta">
                            {r.country ? `${r.country}` : '—'}
                            {r.quantity && r.quantity > 1 ? ` · ×${r.quantity}` : ''}
                          </div>
                          <div className="a-cell-meta">
                            {r.budget ? r.budget : 'No budget'}{imgCount > 0 ? ` · ${imgCount} img` : ''}
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <span className={`a-badge ${STATUS_BADGE_CLASS[st]}`}>{STATUS_LABELS[st]}</span>
                        </td>

                        {/* Created */}
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
                                <Link href={`/admin/custom-orders/${r.id}`} className="a-btn a-btn--subtle a-btn--sm">
                                  View
                                </Link>
                                <button
                                  className="a-icon-btn a-icon-btn--sm a-icon-btn--danger"
                                  onClick={() => deleteRequest(r.id)}
                                  aria-label="Delete request"
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
    </>
  )
}
