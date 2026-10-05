'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Copy,
  Check,
  Pencil,
  Trash2,
  Send,
  Archive,
  RotateCcw,
  Receipt,
  X,
  ExternalLink,
  CreditCard,
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
type CPEvent = { id: string; type: string; detail: any; created_at: string }
type CPDetail = CPRequest & { events: CPEvent[] }

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

// ── Local CSS (unique cp- prefix): timeline, copy-row, currency toggle ───────
const CSS = `
.cp-copy-row {
  display: flex;
  align-items: stretch;
  gap: 8px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 8px 8px 8px 12px;
}
.cp-copy-url {
  flex: 1;
  min-width: 0;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 12px;
  color: var(--c-text-muted);
  align-self: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cp-amount-box {
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  border-radius: var(--radius);
  padding: 18px 20px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}
.cp-amount-box--paid { border-color: var(--c-success); }
.cp-amount-label {
  font-family: var(--font-dmsans);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--c-text-muted);
  margin-bottom: 6px;
}
.cp-amount-val {
  font-family: var(--font-main);
  font-size: 30px;
  line-height: 1;
  color: var(--c-text);
}
.cp-gw-hint {
  font-family: var(--font-dmsans);
  font-size: 11px;
  color: var(--c-text-faint);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.cp-detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid var(--c-border);
}
.cp-detail-row:last-child { border-bottom: none; }
.cp-detail-key {
  font-family: var(--font-dmsans);
  font-size: 13px;
  color: var(--c-text-muted);
  flex-shrink: 0;
}
.cp-detail-val {
  font-family: var(--font-dmsans);
  font-size: 13px;
  color: var(--c-text);
  text-align: right;
  word-break: break-word;
  min-width: 0;
}
/* Timeline */
.cp-timeline { position: relative; padding-left: 4px; }
.cp-tl-item {
  position: relative;
  padding: 0 0 18px 22px;
  border-left: 1px solid var(--c-border);
}
.cp-tl-item:last-child { border-left-color: transparent; padding-bottom: 0; }
.cp-tl-dot {
  position: absolute;
  left: -5px;
  top: 2px;
}
.cp-tl-label {
  font-family: var(--font-dmsans);
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text);
}
.cp-tl-time {
  font-family: var(--font-dmsans);
  font-size: 11px;
  color: var(--c-text-faint);
  margin-top: 2px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.cp-tl-detail {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 11px;
  color: var(--c-text-muted);
  margin-top: 4px;
  word-break: break-word;
}
/* Currency segmented control in modal */
.cp-seg {
  display: inline-flex;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.cp-seg-btn {
  appearance: none;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 9px 18px;
  font-family: var(--font-dmsans);
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text-muted);
  transition: background 0.15s ease, color 0.15s ease;
}
.cp-seg-btn + .cp-seg-btn { border-left: 1px solid var(--c-border); }
.cp-seg-btn--on { background: var(--c-accent); color: #fff; }
.cp-modal-scroll { max-height: min(72vh, 640px); overflow-y: auto; }
@media (prefers-reduced-motion: reduce) {
  .cp-seg-btn { transition: none; }
}
`

// ── Event type → friendly label + dot colour ────────────────────────────────
const EVENT_META: Record<string, { label: string; dot: string }> = {
  created:   { label: 'Request created',     dot: 'a-dot--info' },
  link_sent: { label: 'Payment link sent',   dot: 'a-dot--info' },
  attempt:   { label: 'Payment attempted',   dot: 'a-dot--warning' },
  paid:      { label: 'Payment received',    dot: 'a-dot--success' },
  failed:    { label: 'Payment failed',      dot: 'a-dot--danger' },
  archived:  { label: 'Request archived',    dot: '' },
  restored:  { label: 'Request restored',    dot: 'a-dot--info' },
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function fmtDate(v?: string | null) {
  if (!v) return null
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null
  return {
    date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  }
}

type ExpiryChoice = 'never' | '7' | '30' | 'custom'

export default function AdminCustomPaymentDetailPage() {
  const params = useParams() as { id?: string }
  const id = params?.id as string | undefined
  const router = useRouter()

  const [req, setReq] = useState<CPDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  // Edit modal
  const [editOpen, setEditOpen] = useState(false)
  const [eName, setEName] = useState('')
  const [eEmail, setEEmail] = useState('')
  const [ePhone, setEPhone] = useState('')
  const [eTitle, setETitle] = useState('')
  const [eDesc, setEDesc] = useState('')
  const [eCurrency, setECurrency] = useState<CPCurrency>('INR')
  const [eAmount, setEAmount] = useState('')
  const [eExpiry, setEExpiry] = useState<ExpiryChoice>('never')
  const [eCustomDays, setECustomDays] = useState('14')
  // Snapshot of the expiry control as it was when the modal opened, so we only
  // re-issue expiry (which is relative to "now") when the admin actually
  // changed it — otherwise editing e.g. the title would silently reset the
  // countdown forward on every save.
  const [eExpirySnap, setEExpirySnap] = useState('never:')
  const [editErr, setEditErr] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    if (id === 'undefined' || !UUID_RE.test(id)) {
      router.replace('/admin/custom-payments')
      return
    }
    setError('')
    fetchReq(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function fetchReq(reqId: string) {
    try {
      setLoading(true)
      const res = await fetch(`/api/custom-payments/${reqId}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 400) {
          router.replace('/admin/custom-payments')
          return
        }
        // 404 → leave req null so the empty state renders; other → surface error
        if (res.status !== 404) setError(data?.error || 'Failed to load payment request')
        setReq(null)
      } else {
        setReq(data as CPDetail)
      }
    } catch {
      setError('Failed to load payment request')
    } finally {
      setLoading(false)
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const payUrl = useMemo(() => {
    if (!req?.token) return ''
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `${origin}/custom-payment/${req.token}`
  }, [req?.token])

  const expired = useMemo(() => {
    if (!req?.expiresAt) return false
    const t = new Date(req.expiresAt).getTime()
    return Number.isFinite(t) && t < Date.now()
  }, [req?.expiresAt])

  const status = req?.status
  const isPaid = status === 'paid'
  const isArchived = status === 'archived'
  // A link can still accept payment unless it is paid, archived, or expired.
  // 'failed' means a prior attempt failed — the link stays live and retryable
  // (mirrors the backend isPayable()), so resend / live-link copy apply here too.
  const payable = (status === 'pending' || status === 'failed') && !expired
  const canResend = !!req && payable && !!req.customerEmail
  const gatewayHint = req?.currency === 'USD' ? 'Stripe' : 'Razorpay'

  // ── Copy link ──────────────────────────────────────────────────────────────
  async function copyLink() {
    if (!payUrl) return
    try {
      await navigator.clipboard.writeText(payUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Could not copy link to clipboard')
    }
  }

  // ── Resend ─────────────────────────────────────────────────────────────────
  async function handleResend() {
    if (!id || busy) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const res = await fetch(`/api/custom-payments/${id}/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Failed to resend payment link')
      } else {
        setNotice(`Payment link sent to ${data?.sentTo || 'the customer'}`)
        await fetchReq(id)
      }
    } catch {
      setError('Failed to resend payment link')
    } finally {
      setBusy(false)
    }
  }

  // ── Archive / restore ──────────────────────────────────────────────────────
  async function setStatus(next: 'pending' | 'archived') {
    if (!id || busy) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const res = await fetch(`/api/custom-payments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Failed to update request')
      } else {
        setNotice(next === 'archived' ? 'Request archived' : 'Request restored')
        await fetchReq(id)
      }
    } catch {
      setError('Failed to update request')
    } finally {
      setBusy(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!id) return
    const ok = window.confirm('Delete this payment request? This action cannot be undone.')
    if (!ok) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/custom-payments/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Failed to delete request')
        setBusy(false)
      } else {
        router.push('/admin/custom-payments')
      }
    } catch {
      setError('Failed to delete request')
      setBusy(false)
    }
  }

  // ── Edit modal ─────────────────────────────────────────────────────────────
  function openEdit() {
    if (!req) return
    setEditErr('')
    setEName(req.customerName || '')
    setEEmail(req.customerEmail || '')
    setEPhone(req.customerPhone || '')
    setETitle(req.title || '')
    setEDesc(req.description || '')
    setECurrency(req.currency || 'INR')
    setEAmount(String(req.amount ?? ''))
    let snap = 'never:'
    if (!req.expiresAt) {
      setEExpiry('never')
    } else {
      // Prefill a sensible bucket; default to custom with computed remaining days.
      const days = Math.max(1, Math.round((new Date(req.expiresAt).getTime() - Date.now()) / 86400000))
      if (days === 7) { setEExpiry('7'); snap = '7:' }
      else if (days === 30) { setEExpiry('30'); snap = '30:' }
      else { setEExpiry('custom'); setECustomDays(String(days)); snap = `custom:${days}` }
    }
    setEExpirySnap(snap)
    setEditOpen(true)
  }

  async function handleEditSubmit() {
    if (!id) return
    setEditErr('')

    const name = eName.trim()
    const title = eTitle.trim()
    const email = eEmail.trim()
    const amountNum = Number(eAmount)

    if (!name) { setEditErr('Customer name is required'); return }
    if (!title) { setEditErr('Title is required'); return }
    if (email && !EMAIL_RE.test(email)) { setEditErr('Please enter a valid customer email'); return }
    if (!Number.isFinite(amountNum) || amountNum <= 0) { setEditErr('Enter an amount greater than zero'); return }
    if (eCurrency === 'INR' && amountNum < 1) { setEditErr('INR amount must be at least ₹1'); return }
    if (eCurrency === 'USD' && amountNum < 0.5) { setEditErr('USD amount must be at least $0.50'); return }

    let expiresInDays = 0
    if (eExpiry === '7') expiresInDays = 7
    else if (eExpiry === '30') expiresInDays = 30
    else if (eExpiry === 'custom') {
      const d = Number(eCustomDays)
      if (!Number.isFinite(d) || d <= 0) { setEditErr('Enter a valid number of days'); return }
      expiresInDays = Math.round(d)
    }

    const body: Record<string, any> = {
      customerName: name,
      customerEmail: email,
      customerPhone: ePhone.trim(),
      title,
      description: eDesc.trim(),
      currency: eCurrency,
      amount: amountNum,
    }
    // Only touch expiry if the admin actually changed the control — sending a
    // recomputed relative expiresInDays on an unchanged expiry would drift the
    // countdown forward each save.
    const expiryNow = eExpiry === 'custom' ? `custom:${Math.round(Number(eCustomDays) || 0)}` : `${eExpiry}:`
    if (expiryNow !== eExpirySnap) body.expiresInDays = expiresInDays

    setSaving(true)
    try {
      const res = await fetch(`/api/custom-payments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setEditErr(data?.error || 'Failed to save changes')
      } else {
        setEditOpen(false)
        setNotice('Request updated')
        await fetchReq(id)
      }
    } catch {
      setEditErr('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const created = fmtDate(req?.createdAt)
  const lastSent = fmtDate(req?.lastSentAt)
  const paidAt = fmtDate(req?.paidAt)
  const expiry = fmtDate(req?.expiresAt)

  return (
    <>
      <style>{CSS}</style>
      <div className="a-page">

        {/* Error alert */}
        {error && (
          <div
            className="a-card"
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '14px 18px', marginBottom: 20,
              border: '1px solid var(--c-danger)', background: 'var(--c-danger-bg)', color: 'var(--c-danger)',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
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
        )}

        {/* Success / info notice */}
        {notice && (
          <div
            className="a-card"
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '14px 18px', marginBottom: 20,
              border: '1px solid var(--c-success)', background: 'var(--c-surface)', color: 'var(--c-success)',
            }}
          >
            <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 13 }}>{notice}</span>
            <button
              className="a-icon-btn a-icon-btn--sm"
              onClick={() => setNotice('')}
              style={{ marginLeft: 'auto', color: 'var(--c-success)' }}
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Back link */}
        <Link href="/admin/custom-payments" className="a-back">
          <ArrowLeft size={15} />
          Back to Custom Payments
        </Link>

        {/* Header */}
        <div className="a-head">
          <div>
            <div className="a-eyebrow">Payment Request</div>
            <h1 className="a-title">Request <em>Detail</em></h1>
            <p className="a-subtitle">
              {req?.customerName ? `${req.customerName} · ` : ''}{id?.slice(0, 8)}…
            </p>
          </div>

          {req && !loading && (
            <div className="a-head-actions">
              <button className="a-btn a-btn--ghost" onClick={copyLink}>
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? 'Copied' : 'Copy Link'}
              </button>

              {canResend && (
                <button className="a-btn a-btn--ghost" onClick={handleResend} disabled={busy}>
                  <Send size={15} />
                  Resend
                </button>
              )}

              {!isPaid && (
                <button className="a-btn a-btn--ghost" onClick={openEdit} disabled={busy}>
                  <Pencil size={15} />
                  Edit
                </button>
              )}

              {isArchived ? (
                <button
                  className="a-btn a-btn--subtle"
                  onClick={() => {
                    // A previously-paid request that was archived would be moved
                    // back to 'pending' by a restore — confirm before re-opening it.
                    if (req?.paidAt && !window.confirm('This request was already paid. Restoring will move it back to pending. Continue?')) return
                    setStatus('pending')
                  }}
                  disabled={busy}
                >
                  <RotateCcw size={15} />
                  Restore
                </button>
              ) : (
                <button className="a-btn a-btn--subtle" onClick={() => setStatus('archived')} disabled={busy}>
                  <Archive size={15} />
                  Archive
                </button>
              )}

              <button className="a-btn a-btn--danger" onClick={handleDelete} disabled={busy}>
                <Trash2 size={15} />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Loading / Empty / Content */}
        {loading ? (
          <div className="a-loader-row" style={{ padding: '80px 0' }}>
            <span className="a-loader" />
            <span className="a-loader-label">Loading request</span>
          </div>
        ) : !req ? (
          <div className="a-empty">
            <div className="a-empty-ico"><Receipt size={20} /></div>
            <div className="a-empty-title">Payment request not found</div>
            <div className="a-empty-text">This request may have been deleted or the link is invalid.</div>
            <Link href="/admin/custom-payments" className="a-btn a-btn--subtle a-btn--sm" style={{ marginTop: 14 }}>
              <ArrowLeft size={14} />
              Back to Custom Payments
            </Link>
          </div>
        ) : (
          <div className="a-grid-2">
            {/* MAIN column */}
            <div className="a-stack">
              {/* Order Summary */}
              <div className="a-card">
                <div className="a-card-head">
                  <h2 className="a-card-title">Order <em>Summary</em></h2>
                  <span className={`a-badge ${STATUS_META[req.status].cls}`}>
                    {expired && req.status === 'pending' ? 'Expired' : STATUS_META[req.status].label}
                  </span>
                </div>
                <div className="a-card-body">
                  <div style={{ fontFamily: 'var(--font-main)', fontSize: 20, color: 'var(--c-text)', marginBottom: 8 }}>
                    {req.title}
                  </div>
                  {req.description ? (
                    <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: 14, color: 'var(--c-text-muted)', lineHeight: 1.7, margin: '0 0 18px' }}>
                      {req.description}
                    </p>
                  ) : (
                    <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: 13, color: 'var(--c-text-faint)', fontStyle: 'italic', margin: '0 0 18px' }}>
                      No description provided.
                    </p>
                  )}

                  <div className={`cp-amount-box${isPaid ? ' cp-amount-box--paid' : ''}`}>
                    <div>
                      <div className="cp-amount-label">{isPaid ? 'Amount Paid' : 'Amount Due'}</div>
                      <div className="cp-amount-val">{money(req.amount, req.currency)}</div>
                    </div>
                    <div className="cp-gw-hint">
                      <CreditCard size={13} />
                      {req.currency} · {gatewayHint}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer */}
              <div className="a-card">
                <div className="a-card-head">
                  <h2 className="a-card-title">Customer <em>Information</em></h2>
                </div>
                <div className="a-card-body">
                  <div className="a-form-grid">
                    <Field label="Full Name" value={req.customerName} />
                    <Field label="Phone" value={req.customerPhone} />
                    <div className="a-col-span-2">
                      <Field label="Email Address" value={req.customerEmail} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="a-card">
                <div className="a-card-head">
                  <h2 className="a-card-title">Payment <em>Details</em></h2>
                </div>
                <div className="a-card-body">
                  <div className="cp-detail-row">
                    <span className="cp-detail-key">Status</span>
                    <span className="cp-detail-val">
                      <span className={`a-badge ${STATUS_META[req.status].cls}`}>
                        {expired && req.status === 'pending' ? 'Expired' : STATUS_META[req.status].label}
                      </span>
                    </span>
                  </div>
                  <div className="cp-detail-row">
                    <span className="cp-detail-key">Gateway</span>
                    <span className="cp-detail-val">{req.gateway || gatewayHint}</span>
                  </div>
                  {req.paymentId && (
                    <div className="cp-detail-row">
                      <span className="cp-detail-key">Payment ID</span>
                      <span className="cp-detail-val a-mono" style={{ fontSize: 12 }}>{req.paymentId}</span>
                    </div>
                  )}
                  {req.gatewayOrderId && (
                    <div className="cp-detail-row">
                      <span className="cp-detail-key">Gateway Order ID</span>
                      <span className="cp-detail-val a-mono" style={{ fontSize: 12 }}>{req.gatewayOrderId}</span>
                    </div>
                  )}
                  {paidAt && (
                    <div className="cp-detail-row">
                      <span className="cp-detail-key">Paid At</span>
                      <span className="cp-detail-val">{paidAt.date} · {paidAt.time}</span>
                    </div>
                  )}
                  {req.orderId && (
                    <div className="cp-detail-row">
                      <span className="cp-detail-key">Linked Order</span>
                      <span className="cp-detail-val">
                        <Link
                          href={`/admin/orders/${req.orderId}`}
                          className="a-btn a-btn--subtle a-btn--sm"
                        >
                          <ExternalLink size={13} />
                          View linked order
                        </Link>
                      </span>
                    </div>
                  )}

                  {/* Live pay link when unpaid & payable */}
                  {!isPaid && !isArchived && (
                    <div style={{ marginTop: 16 }}>
                      <span className="a-label" style={{ display: 'block', marginBottom: 8 }}>Payment Link</span>
                      <div className="cp-copy-row">
                        <span className="cp-copy-url" title={payUrl}>{payUrl}</span>
                        <button className="a-btn a-btn--subtle a-btn--sm" onClick={copyLink}>
                          {copied ? <Check size={13} /> : <Copy size={13} />}
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <p className="a-muted" style={{ fontFamily: 'var(--font-dmsans)', fontSize: 12, margin: '8px 0 0' }}>
                        {expired
                          ? 'This link has expired and can no longer accept payment.'
                          : 'This link is live — the customer can pay at any time.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SIDE column */}
            <div className="a-stack">
              {/* Record */}
              <div className="a-card">
                <div className="a-card-head">
                  <h2 className="a-card-title">Request <em>Record</em></h2>
                </div>
                <div className="a-card-body">
                  <div
                    style={{
                      background: 'var(--c-surface)', border: '1px solid var(--c-border)',
                      borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 16,
                    }}
                  >
                    <span className="a-label" style={{ display: 'block', marginBottom: 6 }}>Request ID</span>
                    <div className="a-mono" style={{ fontSize: 12, color: 'var(--c-text)', wordBreak: 'break-all', lineHeight: 1.5 }}>
                      {req.id}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="a-field">
                      <span className="a-label">Created</span>
                      {created ? (
                        <>
                          <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: 14, color: 'var(--c-text)' }}>{created.date}</div>
                          <div className="a-muted" style={{ fontFamily: 'var(--font-dmsans)', fontSize: 12, marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <Clock size={12} />{created.time}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: 14, color: 'var(--c-text-faint)', fontStyle: 'italic' }}>Unknown</div>
                      )}
                    </div>

                    <div className="a-field">
                      <span className="a-label">Last Sent</span>
                      {lastSent ? (
                        <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: 14, color: 'var(--c-text)' }}>
                          {lastSent.date} · {lastSent.time}
                        </div>
                      ) : (
                        <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: 14, color: 'var(--c-text-faint)', fontStyle: 'italic' }}>Never sent</div>
                      )}
                    </div>

                    <div className="a-field">
                      <span className="a-label">Expires</span>
                      {expiry ? (
                        <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: 14, color: expired ? 'var(--c-danger)' : 'var(--c-text)' }}>
                          {expiry.date} · {expiry.time}{expired ? ' (expired)' : ''}
                        </div>
                      ) : (
                        <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: 14, color: 'var(--c-text)' }}>Never expires</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="a-card">
                <div className="a-card-head">
                  <h2 className="a-card-title">Activity <em>Timeline</em></h2>
                </div>
                <div className="a-card-body">
                  {(req.events || []).length === 0 ? (
                    <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: 13, color: 'var(--c-text-faint)', fontStyle: 'italic', margin: 0 }}>
                      No activity recorded yet.
                    </p>
                  ) : (
                    <div className="cp-timeline">
                      {req.events.map((ev) => {
                        const meta = EVENT_META[ev.type] || { label: ev.type, dot: '' }
                        const t = fmtDate(ev.created_at)
                        const detailStr =
                          ev.detail && typeof ev.detail === 'object'
                            ? Object.entries(ev.detail)
                                .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
                                .join(' · ')
                            : ev.detail != null
                              ? String(ev.detail)
                              : ''
                        return (
                          <div className="cp-tl-item" key={ev.id}>
                            <span className={`cp-tl-dot a-dot ${meta.dot}`} />
                            <div className="cp-tl-label">{meta.label}</div>
                            {t && (
                              <div className="cp-tl-time">
                                <Clock size={11} />{t.date} · {t.time}
                              </div>
                            )}
                            {detailStr && <div className="cp-tl-detail">{detailStr}</div>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {editOpen && req && (
          <div className="a-modal-overlay" onClick={() => !saving && setEditOpen(false)}>
            <div className="a-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560, width: '100%' }}>
              <div className="a-modal-head">
                <h3 className="a-modal-title">Edit Payment Request</h3>
                <button className="a-icon-btn a-icon-btn--sm" onClick={() => !saving && setEditOpen(false)} aria-label="Close">
                  <X size={16} />
                </button>
              </div>

              <div className="a-modal-body cp-modal-scroll">
                {editErr && (
                  <div className="a-badge a-badge--danger" style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'flex-start', padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: 16 }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{editErr}</span>
                  </div>
                )}

                <div className="a-form-grid">
                  <div className="a-field">
                    <label className="a-label">Customer Name <span className="a-req">*</span></label>
                    <input className="a-input" value={eName} onChange={(e) => setEName(e.target.value)} placeholder="e.g. Priya Mehta" />
                  </div>
                  <div className="a-field">
                    <label className="a-label">Phone</label>
                    <input className="a-input" value={ePhone} onChange={(e) => setEPhone(e.target.value)} placeholder="e.g. +44 7700 900123" />
                  </div>
                  <div className="a-field a-col-span-2">
                    <label className="a-label">Email Address</label>
                    <input type="email" className="a-input" value={eEmail} onChange={(e) => setEEmail(e.target.value)} placeholder="e.g. priya@example.com" />
                  </div>
                  <div className="a-field a-col-span-2">
                    <label className="a-label">Title <span className="a-req">*</span></label>
                    <input className="a-input" value={eTitle} onChange={(e) => setETitle(e.target.value)} placeholder="e.g. Custom bridal set — balance payment" />
                  </div>
                  <div className="a-field a-col-span-2">
                    <label className="a-label">Description</label>
                    <textarea className="a-textarea" rows={3} value={eDesc} onChange={(e) => setEDesc(e.target.value)} placeholder="Optional details shown to the customer…" />
                  </div>

                  <div className="a-field">
                    <label className="a-label">Currency</label>
                    <div className="cp-seg" role="group" aria-label="Currency">
                      {(['INR', 'USD'] as CPCurrency[]).map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`cp-seg-btn${eCurrency === c ? ' cp-seg-btn--on' : ''}`}
                          onClick={() => setECurrency(c)}
                        >
                          {c === 'INR' ? '₹ INR' : '$ USD'}
                        </button>
                      ))}
                    </div>
                    <span className="a-hint">{eCurrency === 'INR' ? 'Charged via Razorpay · min ₹1' : 'Charged via Stripe · min $0.50'}</span>
                  </div>

                  <div className="a-field">
                    <label className="a-label">Amount <span className="a-req">*</span></label>
                    <input
                      type="number"
                      className="a-input"
                      value={eAmount}
                      onChange={(e) => setEAmount(e.target.value)}
                      min={eCurrency === 'INR' ? 1 : 0.5}
                      step={eCurrency === 'INR' ? 1 : 0.01}
                      placeholder={eCurrency === 'INR' ? '5000' : '50.00'}
                    />
                  </div>

                  <div className="a-field a-col-span-2">
                    <label className="a-label">Expiry</label>
                    <div className="a-segmented" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {([
                        { k: 'never', label: 'Never' },
                        { k: '7', label: '7 days' },
                        { k: '30', label: '30 days' },
                        { k: 'custom', label: 'Custom' },
                      ] as { k: ExpiryChoice; label: string }[]).map((opt) => (
                        <button
                          key={opt.k}
                          type="button"
                          className={`cp-seg-btn${eExpiry === opt.k ? ' cp-seg-btn--on' : ''}`}
                          style={{ border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)' }}
                          onClick={() => setEExpiry(opt.k)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {eExpiry === 'custom' && (
                      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="number"
                          className="a-input"
                          value={eCustomDays}
                          onChange={(e) => setECustomDays(e.target.value)}
                          min={1}
                          step={1}
                          style={{ maxWidth: 120 }}
                        />
                        <span className="a-muted" style={{ fontFamily: 'var(--font-dmsans)', fontSize: 13 }}>days from now</span>
                      </div>
                    )}
                    <span className="a-hint">Links never expire by default.</span>
                  </div>
                </div>
              </div>

              <div className="a-modal-foot">
                <button className="a-btn a-btn--ghost" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</button>
                <button className="a-btn a-btn--primary" onClick={handleEditSubmit} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── Small labelled read-only field (matches reference "Not provided" style) ──
function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="a-field">
      <span className="a-label">{label}</span>
      <div
        style={{
          fontFamily: 'var(--font-dmsans)',
          fontSize: 14,
          color: value ? 'var(--c-text)' : 'var(--c-text-faint)',
          fontStyle: value ? 'normal' : 'italic',
        }}
      >
        {value || 'Not provided'}
      </div>
    </div>
  )
}
