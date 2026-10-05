'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  AlertCircle,
  Trash2,
  Link2,
  Check,
  X,
  CreditCard,
  Clock,
  CheckCircle2,
  IndianRupee,
  DollarSign,
  ExternalLink,
} from 'lucide-react'

// ── Shared types + helpers ──────────────────────────────────────────────────
type CPStatus = 'pending' | 'paid' | 'failed' | 'archived'
type CPCurrency = 'INR' | 'USD'
type CPRequest = {
  id: string
  token: string
  customerName: string
  customerEmail?: string | null
  customerPhone?: string | null
  title: string
  description?: string | null
  amount: number
  currency: CPCurrency
  status: CPStatus
  expiresAt?: string | null
  gateway?: string | null
  paymentId?: string | null
  gatewayOrderId?: string | null
  orderId?: string | null
  paidAt?: string | null
  lastSentAt?: string | null
  createdAt?: string
  updatedAt?: string
}
function money(amount: number, currency: CPCurrency) {
  const symbol = currency === 'INR' ? '₹' : '$'
  return symbol + Number(amount || 0).toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', {
    minimumFractionDigits: currency === 'INR' ? 0 : 2,
    maximumFractionDigits: currency === 'INR' ? 0 : 2,
  })
}
const STATUS_META: Record<CPStatus, { label: string; cls: string }> = {
  pending:  { label: 'Pending',  cls: 'a-badge--warning' },
  paid:     { label: 'Paid',     cls: 'a-badge--success' },
  failed:   { label: 'Failed',   cls: 'a-badge--danger'  },
  archived: { label: 'Archived', cls: 'a-badge--neutral' },
}

const STATUS_TABS: Array<{ key: 'all' | CPStatus; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'paid', label: 'Paid' },
  { key: 'failed', label: 'Failed' },
  { key: 'archived', label: 'Archived' },
]

type ExpiryOption = 'never' | '7' | '30' | 'custom'

const CSS = `
.cp-seg {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
}
.cp-seg-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  font-family: var(--font-dmsans);
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text-muted);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.cp-seg-btn:hover { color: var(--c-text); }
.cp-seg-btn.is-active {
  background: var(--c-bg);
  color: var(--c-accent);
  box-shadow: var(--shadow-sm);
}
.cp-caption {
  font-family: var(--font-dmsans);
  font-size: 11.5px;
  color: var(--c-text-faint);
  margin-top: 8px;
  line-height: 1.5;
}
.cp-amount-wrap { position: relative; }
.cp-amount-sym {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-family: var(--font-dmsans);
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text-muted);
  pointer-events: none;
}
.cp-amount-input { padding-left: 30px !important; }
.cp-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
}
.cp-switch {
  position: relative;
  width: 42px;
  height: 24px;
  flex-shrink: 0;
  border: none;
  padding: 0;
  border-radius: 999px;
  background: var(--c-border-strong);
  cursor: pointer;
  transition: background 0.18s ease;
}
.cp-switch.is-on { background: var(--c-accent); }
.cp-switch::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: var(--shadow-sm);
  transition: transform 0.18s ease;
}
.cp-switch.is-on::after { transform: translateX(18px); }
.cp-copyrow {
  display: flex;
  align-items: stretch;
  gap: 8px;
}
.cp-copyrow .a-input { flex: 1; }
.cp-success-ico {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(var(--c-accent-rgb), 0.12);
  color: var(--c-success);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 18px;
}
.cp-gateway-hint {
  font-family: var(--font-dmsans);
  font-size: 10.5px;
  color: var(--c-text-faint);
  letter-spacing: 0.02em;
  margin-top: 3px;
}
`

export default function AdminCustomPaymentsPage() {
  const [requests, setRequests] = useState<CPRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | CPStatus>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // ── Create modal state ──
  const [modalOpen, setModalOpen] = useState(false)
  const [prefill, setPrefill] = useState<BillPrefill | null>(null)

  // ── Custom orders ready to bill (linked-payment source) ──
  const [billable, setBillable] = useState<any[]>([])

  useEffect(() => { fetchRequests(); fetchBillable() }, [])

  // Deep-link: /admin/custom-payments?bill=<customOrderId> opens the billing
  // modal pre-filled for that order (used by the custom order detail page).
  useEffect(() => {
    const billId = new URLSearchParams(window.location.search).get('bill')
    if (!billId) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/custom-orders/${billId}`)
        if (!res.ok) return
        const order = await res.json()
        if (!cancelled && order?.id) openBill(order)
      } catch { /* ignore — admin can still bill from the list */ }
      finally {
        // Strip the query param so a refresh doesn't reopen the modal.
        window.history.replaceState(null, '', '/admin/custom-payments')
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchRequests() {
    try {
      setLoading(true)
      const res = await fetch('/api/custom-payments')
      const data = await res.json()
      setRequests(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load custom payment requests')
    } finally {
      setLoading(false)
    }
  }

  // Custom orders that have been replied to but not yet billed/paid — the
  // natural candidates for a one-click payment link.
  async function fetchBillable() {
    try {
      const res = await fetch('/api/custom-orders')
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      // Show requests that are past 'new' but not yet at/after 'payment_done'.
      const BILLABLE = new Set(['replied', 'processing'])
      setBillable(list.filter((r: any) => BILLABLE.has(String(r.status || ''))))
    } catch {
      setBillable([])
    }
  }

  function openBill(order: any) {
    setPrefill({
      customOrderId: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      title: order.title,
      description: order.description,
      budgetHint: order.budget || null,
    })
    setModalOpen(true)
  }

  function openBlank() {
    setPrefill(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setPrefill(null)
  }

  const isUuid = (val?: string) =>
    typeof val === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)

  function payUrlFor(token: string) {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `${origin}/custom-payment/${token}`
  }

  async function copyLink(r: CPRequest) {
    try {
      await navigator.clipboard.writeText(payUrlFor(r.token))
      setCopiedId(r.id)
      setTimeout(() => setCopiedId((c) => (c === r.id ? null : c)), 1800)
    } catch {
      setError('Could not copy link to clipboard')
    }
  }

  async function deleteRequest(id: string) {
    if (!isUuid(id)) return
    const ok = window.confirm('Delete this payment request? This action cannot be undone.')
    if (!ok) return
    try {
      const res = await fetch(`/api/custom-payments/${id}`, { method: 'DELETE' })
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
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
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

  // ── Derived stats (currencies never summed together) ──
  const pendingCount = requests.filter((r) => r.status === 'pending').length
  const paidRows = requests.filter((r) => r.status === 'paid')
  const paidCount = paidRows.length
  const collectedInr = paidRows
    .filter((r) => r.currency === 'INR')
    .reduce((a, r) => a + (r.amount || 0), 0)
  const collectedUsd = paidRows
    .filter((r) => r.currency === 'USD')
    .reduce((a, r) => a + (r.amount || 0), 0)

  return (
    <>
      <style>{CSS}</style>
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
            <div className="a-eyebrow">Payments</div>
            <h1 className="a-title">Custom <em>Payments</em></h1>
            <p className="a-subtitle">Bespoke &amp; off-catalogue payment links</p>
          </div>
          <div className="a-head-actions">
            <button className="a-btn a-btn--primary" onClick={openBlank}>
              <Plus size={15} />
              New Payment Request
            </button>
          </div>
        </div>

        {/* Ready to bill: custom orders awaiting a payment link */}
        {!loading && billable.length > 0 && (
          <div className="a-card" style={{ marginBottom: 20 }}>
            <div className="a-card-head">
              <h2 className="a-card-title">Ready to <em>Bill</em></h2>
              <span className="a-badge a-badge--accent">{billable.length}</span>
            </div>
            <div className="a-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p className="a-muted" style={{ fontFamily: 'var(--font-dmsans)', fontSize: 12.5, margin: '0 0 4px' }}>
                Custom orders you&apos;ve replied to — create a payment link in one click. Details are pre-filled; just set the amount.
              </p>
              {billable.map((o) => (
                <div
                  key={o.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                    padding: '12px 14px', border: '1px solid var(--c-border)',
                    borderRadius: 'var(--radius)', background: 'var(--c-surface)',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="a-cell-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={o.title}>
                      {o.title || 'Untitled request'}
                    </div>
                    <div className="a-cell-meta">
                      {o.customerName || '—'}
                      {o.budget ? ` · Budget ${o.budget}` : ''}
                      {` · ${o.status === 'processing' ? 'Process' : 'Replied'}`}
                    </div>
                  </div>
                  <Link href={`/admin/custom-orders/${o.id}`} className="a-btn a-btn--subtle a-btn--sm">
                    View
                  </Link>
                  <button className="a-btn a-btn--primary a-btn--sm" onClick={() => openBill(o)}>
                    <Link2 size={14} />
                    Create Link
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Strip */}
        {!loading && requests.length > 0 && (
          <div className="a-stats" style={{ marginBottom: 20 }}>
            <div className="a-stat">
              <div className="a-stat-top">
                <span className="a-stat-label">Total Requests</span>
                <span className="a-stat-ico"><CreditCard size={16} /></span>
              </div>
              <div className="a-stat-val">{requests.length}</div>
              <div className="a-stat-sub">payment links created</div>
            </div>
            <div className="a-stat">
              <div className="a-stat-top">
                <span className="a-stat-label">Pending</span>
                <span className="a-stat-ico"><Clock size={16} /></span>
              </div>
              <div className="a-stat-val">{pendingCount}</div>
              <div className="a-stat-sub">awaiting payment</div>
            </div>
            <div className="a-stat">
              <div className="a-stat-top">
                <span className="a-stat-label">Paid</span>
                <span className="a-stat-ico"><CheckCircle2 size={16} /></span>
              </div>
              <div className="a-stat-val">{paidCount}</div>
              <div className="a-stat-sub">completed payments</div>
            </div>
            <div className="a-stat">
              <div className="a-stat-top">
                <span className="a-stat-label">Collected</span>
                <span className="a-stat-ico"><IndianRupee size={16} /></span>
              </div>
              <div className="a-stat-val" style={{ fontSize: 22 }}>
                {money(collectedInr, 'INR')}
              </div>
              <div className="a-stat-sub">
                {money(collectedUsd, 'USD')} collected in USD
              </div>
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
                  <th>Order</th>
                  <th>Amount</th>
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
                        <span className="a-loader-label">Loading payment requests</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="a-empty">
                        <div className="a-empty-ico"><CreditCard size={20} /></div>
                        <div className="a-empty-title">
                          {searchQuery || statusFilter !== 'all' ? 'No results match your filters' : 'No payment requests yet'}
                        </div>
                        <div className="a-empty-text">
                          {searchQuery || statusFilter !== 'all'
                            ? 'Try a different search term or status filter.'
                            : 'Create your first custom payment link to see it here.'}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const d = r.createdAt ? new Date(r.createdAt) : null
                    const valid = isUuid(r.id)
                    const meta = STATUS_META[r.status] || STATUS_META.pending
                    const gatewayHint = r.currency === 'INR' ? 'Razorpay' : 'Stripe'
                    return (
                      <tr key={r.id}>
                        {/* Customer */}
                        <td>
                          <div className="a-cell-name">{r.customerName || '—'}</div>
                          <div className="a-cell-meta a-mono">{r.id.slice(0, 8)}…</div>
                        </td>

                        {/* Order */}
                        <td>
                          <div
                            className="a-cell-name"
                            style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={r.title}
                          >
                            {r.title || '—'}
                          </div>
                          {r.customerEmail && <div className="a-cell-meta">{r.customerEmail}</div>}
                        </td>

                        {/* Amount */}
                        <td>
                          <div className="a-cell-name">{money(r.amount, r.currency)}</div>
                          <div className="cp-gateway-hint">via {gatewayHint}</div>
                        </td>

                        {/* Status */}
                        <td>
                          <span className={`a-badge ${meta.cls}`}>{meta.label}</span>
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
                                <Link href={`/admin/custom-payments/${r.id}`} className="a-btn a-btn--subtle a-btn--sm">
                                  View
                                </Link>
                                <button
                                  className="a-icon-btn a-icon-btn--sm"
                                  onClick={() => copyLink(r)}
                                  aria-label="Copy payment link"
                                  title={copiedId === r.id ? 'Copied' : 'Copy payment link'}
                                >
                                  {copiedId === r.id ? <Check size={14} style={{ color: 'var(--c-success)' }} /> : <Link2 size={14} />}
                                </button>
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

        {/* Create Modal */}
        {modalOpen && (
          <CreateModal
            prefill={prefill}
            onClose={closeModal}
            onDone={() => { closeModal(); fetchRequests(); fetchBillable() }}
            onCreated={() => { fetchRequests(); fetchBillable() }}
          />
        )}
      </div>
    </>
  )
}

// ── Prefill payload when billing an existing custom order ────────────────────
type BillPrefill = {
  customOrderId: string
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  title?: string | null
  description?: string | null
  budgetHint?: string | null
}

// ── Create Modal ─────────────────────────────────────────────────────────────
type CreateResult = CPRequest & { payUrl: string; emailSent: boolean }

function CreateModal({
  onClose,
  onDone,
  onCreated,
  prefill,
}: {
  onClose: () => void
  onDone: () => void
  onCreated: () => void
  prefill?: BillPrefill | null
}) {
  const [recordedBy, setRecordedBy] = useState<string | null>(null)

  const [customerName, setCustomerName] = useState(prefill?.customerName || '')
  const [customerEmail, setCustomerEmail] = useState(prefill?.customerEmail || '')
  const [customerPhone, setCustomerPhone] = useState(prefill?.customerPhone || '')
  const [title, setTitle] = useState(prefill?.title || '')
  const [description, setDescription] = useState(prefill?.description || '')
  const [currency, setCurrency] = useState<CPCurrency>('INR')
  const [amount, setAmount] = useState('')
  const [expiry, setExpiry] = useState<ExpiryOption>('never')
  const [customDays, setCustomDays] = useState('14')
  const [sendEmail, setSendEmail] = useState(true)

  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<CreateResult | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id) setRecordedBy(user.id)
      } catch { /* recordedBy is optional */ }
    }
    loadUser()
  }, [])

  const currencyMin = currency === 'INR' ? 1 : 0.5
  const currencySymbol = currency === 'INR' ? '₹' : '$'
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!customerName.trim()) errs.customerName = 'Customer name is required'
    if (!title.trim()) errs.title = 'Order title / product name is required'

    const amt = Number(amount)
    if (!amount.trim() || !Number.isFinite(amt) || amt <= 0) {
      errs.amount = 'Enter an amount greater than zero'
    } else if (amt < currencyMin) {
      errs.amount = `Minimum amount for ${currency} is ${money(currencyMin, currency)}`
    }

    if (customerEmail.trim() && !emailRe.test(customerEmail.trim())) {
      errs.customerEmail = 'Enter a valid email address'
    }
    if (sendEmail && !customerEmail.trim()) {
      errs.customerEmail = 'An email is required to send the payment link'
    }
    if (expiry === 'custom') {
      const days = Number(customDays)
      if (!Number.isFinite(days) || days <= 0) {
        errs.customDays = 'Enter a valid number of days'
      }
    }
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  function expiresInDaysValue(): number {
    if (expiry === 'never') return 0
    if (expiry === 'custom') return Math.max(0, Math.floor(Number(customDays) || 0))
    return Number(expiry)
  }

  async function handleSubmit() {
    setServerError('')
    if (!validate()) return
    try {
      setSubmitting(true)
      const days = expiresInDaysValue()
      const payload: Record<string, any> = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        title: title.trim(),
        description: description.trim(),
        amount: Number(amount),
        currency,
        recordedBy,
        sendEmail,
      }
      // Only send expiresInDays when NOT "never" (never => omit / 0)
      if (days > 0) payload.expiresInDays = days
      // Link this payment back to the custom order it bills (when prefilled).
      if (prefill?.customOrderId) payload.customOrderId = prefill.customOrderId

      const res = await fetch('/api/custom-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setServerError(data?.error || 'Failed to create payment request')
        return
      }
      setResult(data as CreateResult)
      onCreated()
    } catch {
      setServerError('Failed to create payment request')
    } finally {
      setSubmitting(false)
    }
  }

  async function copyResultLink() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.payUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setServerError('Could not copy link to clipboard')
    }
  }

  const fieldCls = (key: string) => `a-field${fieldErrors[key] ? ' a-field--error' : ''}`

  return (
    <div className="a-modal-overlay" onClick={onClose}>
      <div className="a-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>

        {/* ── SUCCESS STATE ── */}
        {result ? (
          <>
            <div className="a-modal-head">
              <h2 className="a-modal-title">Payment link created</h2>
              <button className="a-icon-btn a-icon-btn--sm" onClick={onDone} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="a-modal-body">
              <div className="cp-success-ico">
                <CheckCircle2 size={30} />
              </div>
              <p style={{ textAlign: 'center', fontFamily: 'var(--font-dmsans)', fontSize: 13.5, color: 'var(--c-text-muted)', margin: '0 0 20px', lineHeight: 1.6 }}>
                Share the link below with <strong style={{ color: 'var(--c-text)' }}>{result.customerName}</strong>.
                {' '}An order will be created automatically once they pay
                {' '}{money(result.amount, result.currency)} via {result.currency === 'INR' ? 'Razorpay' : 'Stripe'}.
              </p>

              <div className="a-field">
                <label className="a-label">Payment link</label>
                <div className="cp-copyrow">
                  <input className="a-input a-mono" readOnly value={result.payUrl} style={{ fontSize: 12 }} onFocus={(e) => e.currentTarget.select()} />
                  <button type="button" className="a-btn a-btn--primary" onClick={copyResultLink} style={{ whiteSpace: 'nowrap' }}>
                    {copied ? <Check size={15} /> : <Link2 size={15} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                {sendEmail ? (
                  result.emailSent ? (
                    <span className="a-badge a-badge--success" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Check size={13} /> Email sent to {result.customerEmail}
                    </span>
                  ) : (
                    <span className="a-badge a-badge--warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <AlertCircle size={13} /> Email could not be sent — share the link manually
                    </span>
                  )
                ) : (
                  <span className="a-badge a-badge--neutral">Email not sent — share the link manually</span>
                )}
              </div>
            </div>
            <div className="a-modal-foot">
              <Link href={`/admin/custom-payments/${result.id}`} className="a-btn a-btn--ghost">
                <ExternalLink size={15} />
                Open Request
              </Link>
              <button type="button" className="a-btn a-btn--primary" onClick={onDone}>
                Done
              </button>
            </div>
          </>
        ) : (
          /* ── FORM STATE ── */
          <>
            <div className="a-modal-head">
              <h2 className="a-modal-title">{prefill ? 'Bill Custom Order' : 'New Payment Request'}</h2>
              <button className="a-icon-btn a-icon-btn--sm" onClick={onClose} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="a-modal-body">

              {prefill && (
                <div
                  className="a-badge a-badge--accent"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'flex-start', padding: '11px 14px', borderRadius: 'var(--radius)', marginBottom: 16 }}
                >
                  <Link2 size={15} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>
                    Linked to custom order · details pre-filled.
                    {prefill.budgetHint ? ` Customer budget: ${prefill.budgetHint}.` : ''} Enter the final amount to bill.
                  </span>
                </div>
              )}

              {serverError && (
                <div className="a-badge a-badge--danger" style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'flex-start', padding: '11px 14px', borderRadius: 'var(--radius)', marginBottom: 16 }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{serverError}</span>
                </div>
              )}

              <div className="a-form-grid">
                {/* Full Name */}
                <div className={fieldCls('customerName')}>
                  <label className="a-label">Full Name <span className="a-req">*</span></label>
                  <input
                    className="a-input"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Priya Mehta"
                  />
                  {fieldErrors.customerName && <span className="a-error-text">{fieldErrors.customerName}</span>}
                </div>

                {/* Phone */}
                <div className="a-field">
                  <label className="a-label">Phone Number</label>
                  <input
                    className="a-input"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +44 7700 900123"
                  />
                </div>

                {/* Email */}
                <div className={`${fieldCls('customerEmail')} a-col-span-2`}>
                  <label className="a-label">Email Address</label>
                  <input
                    type="email"
                    className="a-input"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="e.g. priya@example.com"
                  />
                  {fieldErrors.customerEmail
                    ? <span className="a-error-text">{fieldErrors.customerEmail}</span>
                    : <span className="a-hint">Required to send the payment link by email.</span>}
                </div>

                {/* Title */}
                <div className={`${fieldCls('title')} a-col-span-2`}>
                  <label className="a-label">Order Title / Product Name <span className="a-req">*</span></label>
                  <input
                    className="a-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Bespoke Emerald Ring — Balance Payment"
                  />
                  {fieldErrors.title && <span className="a-error-text">{fieldErrors.title}</span>}
                </div>

                {/* Description */}
                <div className="a-field a-col-span-2">
                  <label className="a-label">Description</label>
                  <textarea
                    className="a-textarea"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional details shown to the customer on the payment page…"
                  />
                </div>

                {/* Currency */}
                <div className="a-field">
                  <label className="a-label">Currency</label>
                  <div className="cp-seg" role="group" aria-label="Currency">
                    <button
                      type="button"
                      className={`cp-seg-btn${currency === 'INR' ? ' is-active' : ''}`}
                      onClick={() => setCurrency('INR')}
                    >
                      <IndianRupee size={14} /> INR
                    </button>
                    <button
                      type="button"
                      className={`cp-seg-btn${currency === 'USD' ? ' is-active' : ''}`}
                      onClick={() => setCurrency('USD')}
                    >
                      <DollarSign size={14} /> USD
                    </button>
                  </div>
                  <div className="cp-caption">INR → charged via Razorpay · USD → charged via Stripe</div>
                </div>

                {/* Amount */}
                <div className={fieldCls('amount')}>
                  <label className="a-label">Amount <span className="a-req">*</span></label>
                  <div className="cp-amount-wrap">
                    <span className="cp-amount-sym">{currencySymbol}</span>
                    <input
                      type="number"
                      className="a-input cp-amount-input"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min={currencyMin}
                      step={currency === 'INR' ? 1 : 0.01}
                      placeholder={currency === 'INR' ? '1' : '0.50'}
                    />
                  </div>
                  {fieldErrors.amount
                    ? <span className="a-error-text">{fieldErrors.amount}</span>
                    : <span className="a-hint">Minimum {money(currencyMin, currency)}.</span>}
                </div>

                {/* Expiry */}
                <div className="a-field a-col-span-2">
                  <label className="a-label">Link Expiry</label>
                  <div className="cp-seg" role="group" aria-label="Expiry">
                    {([
                      { k: 'never' as ExpiryOption, l: 'Never' },
                      { k: '7' as ExpiryOption, l: '7 days' },
                      { k: '30' as ExpiryOption, l: '30 days' },
                      { k: 'custom' as ExpiryOption, l: 'Custom' },
                    ]).map((o) => (
                      <button
                        key={o.k}
                        type="button"
                        className={`cp-seg-btn${expiry === o.k ? ' is-active' : ''}`}
                        onClick={() => setExpiry(o.k)}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                  {expiry === 'custom' && (
                    <div className={`${fieldErrors.customDays ? 'a-field--error' : ''}`} style={{ marginTop: 10, maxWidth: 200 }}>
                      <div className="a-input-wrap">
                        <input
                          type="number"
                          className="a-input"
                          value={customDays}
                          onChange={(e) => setCustomDays(e.target.value)}
                          min={1}
                          step={1}
                          placeholder="Days until expiry"
                        />
                      </div>
                      {fieldErrors.customDays && <span className="a-error-text">{fieldErrors.customDays}</span>}
                    </div>
                  )}
                  <div className="cp-caption">Links never expire by default.</div>
                </div>

                {/* Send email switch */}
                <div className="a-field a-col-span-2">
                  <div className="cp-switch-row">
                    <div>
                      <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: 13.5, fontWeight: 600, color: 'var(--c-text)' }}>
                        Send payment link email now
                      </div>
                      <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: 11.5, color: 'var(--c-text-faint)', marginTop: 3 }}>
                        Emails the customer the secure link immediately.
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={sendEmail}
                      aria-label="Send payment link email now"
                      className={`cp-switch${sendEmail ? ' is-on' : ''}`}
                      onClick={() => setSendEmail((v) => !v)}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="a-modal-foot">
              <button type="button" className="a-btn a-btn--ghost" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="button" className="a-btn a-btn--primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Payment Link'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
