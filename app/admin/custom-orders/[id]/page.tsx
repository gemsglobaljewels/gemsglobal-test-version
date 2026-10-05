'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  X,
  Trash2,
  Send,
  Gem,
  Mail,
  Phone,
  MapPin,
  Tag,
  Sparkles,
  Package,
  Clock,
  Wallet,
  MailCheck,
  CreditCard,
} from 'lucide-react'
import { STATUS_FLOW, STATUS_LABELS, STATUS_BADGE_CLASS, canonicalStatus, statusRank, type CustomOrderStatus } from '@/lib/customOrder'

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

const isUuid = (val?: string) =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)

function fmtDate(s?: string | null) {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const CSS = `
.co-a-desc {
  font-family: var(--font-dmsans);
  font-size: 14px;
  color: var(--c-text-muted);
  line-height: 1.75;
  white-space: pre-wrap;
  margin: 0;
}
.co-a-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.co-a-chip {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: var(--font-dmsans); font-size: 12px; font-weight: 600;
  color: var(--c-text-muted); background: var(--c-surface);
  border: 1px solid var(--c-border); border-radius: 999px; padding: 6px 12px;
}
.co-a-chip svg { color: var(--c-accent); }
.co-a-gallery { display: flex; flex-wrap: wrap; gap: 12px; }
.co-a-thumb {
  width: 108px; height: 108px; border-radius: var(--radius);
  overflow: hidden; border: 1px solid var(--c-border); background: var(--c-surface);
  display: block; transition: border-color 0.15s ease, transform 0.15s ease;
}
.co-a-thumb:hover { border-color: var(--c-accent); transform: translateY(-2px); }
.co-a-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.co-a-kv { display: flex; flex-direction: column; gap: 2px; }
.co-a-kv-key {
  font-family: var(--font-dmsans); font-size: 10.5px; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--c-text-faint);
}
.co-a-kv-val { font-family: var(--font-dmsans); font-size: 14px; color: var(--c-text); }
.co-a-kv-val--empty { color: var(--c-text-faint); font-style: italic; }
.co-a-reply-prev {
  background: var(--c-surface); border: 1px solid var(--c-border);
  border-left: 3px solid var(--c-success); border-radius: var(--radius);
  padding: 14px 16px; margin-bottom: 16px;
}
.co-a-reply-prev-top {
  display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
  font-family: var(--font-dmsans); font-size: 11.5px; font-weight: 600;
  color: var(--c-success); letter-spacing: 0.04em;
}
.co-a-reply-prev-body {
  font-family: var(--font-dmsans); font-size: 13.5px; color: var(--c-text-muted);
  line-height: 1.7; white-space: pre-wrap; margin: 0;
}
.co-a-status-seg { display: inline-flex; flex-wrap: wrap; gap: 6px; }
.co-a-status-btn {
  font-family: var(--font-dmsans); font-size: 12px; font-weight: 600;
  color: var(--c-text-muted); background: var(--c-surface);
  border: 1px solid var(--c-border); border-radius: var(--radius);
  padding: 8px 14px; cursor: pointer; transition: all 0.15s ease;
}
.co-a-status-btn:hover { color: var(--c-text); border-color: var(--c-accent); }
.co-a-status-btn.is-active { background: var(--c-accent); color: #fff; border-color: var(--c-accent); }
.co-a-status-btn:disabled { opacity: 0.5; cursor: default; }
`

export default function AdminCustomOrderDetailPage() {
  const params = useParams() as { id?: string }
  const id = params?.id

  const [req, setReq] = useState<CORequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => { if (id) fetchDetail() /* eslint-disable-next-line */ }, [id])

  async function fetchDetail() {
    if (!isUuid(id)) { setLoading(false); return }
    try {
      setLoading(true)
      const res = await fetch(`/api/custom-orders/${id}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Failed to load custom order')
        setReq(null)
      } else {
        setReq(data)
      }
    } catch {
      setError('Failed to load custom order')
    } finally {
      setLoading(false)
    }
  }

  async function setStatus(next: CustomOrderStatus) {
    if (!req) return
    const current = canonicalStatus(req.status)
    if (statusRank(next) <= statusRank(current)) return
    try {
      setBusy(true)
      const res = await fetch(`/api/custom-orders/${req.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Failed to update status')
      } else {
        setReq(data)
        setNotice(`Status updated to “${STATUS_LABELS[next]}”.`)
      }
    } catch {
      setError('Failed to update status')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!req) return
    const ok = window.confirm('Delete this custom order request? This action cannot be undone.')
    if (!ok) return
    try {
      setBusy(true)
      const res = await fetch(`/api/custom-orders/${req.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Failed to delete request')
      } else {
        window.location.href = '/admin/custom-orders'
      }
    } catch {
      setError('Failed to delete request')
    } finally {
      setBusy(false)
    }
  }

  async function sendReply() {
    if (!req) return
    const message = reply.trim()
    if (!message) { setError('Please write a reply before sending.'); return }
    if (!req.customerEmail) { setError('No customer email on file to reply to.'); return }
    try {
      setSending(true)
      setError('')
      const res = await fetch(`/api/custom-orders/${req.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Failed to send reply')
      } else {
        if (data?.order) setReq(data.order)
        setReply('')
        setNotice(`Reply emailed to ${data?.sentTo || req.customerEmail}.`)
      }
    } catch {
      setError('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const st = req ? canonicalStatus(req.status) : 'new'
  const images = useMemo(
    () => (Array.isArray(req?.referenceImages) ? req!.referenceImages : []),
    [req]
  )

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
            <button className="a-icon-btn a-icon-btn--sm" onClick={() => setError('')} style={{ marginLeft: 'auto', color: 'var(--c-danger)' }} aria-label="Dismiss">
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
            <button className="a-icon-btn a-icon-btn--sm" onClick={() => setNotice('')} style={{ marginLeft: 'auto', color: 'var(--c-success)' }} aria-label="Dismiss">
              <X size={15} />
            </button>
          </div>
        )}

        {/* Back link */}
        <Link href="/admin/custom-orders" className="a-back">
          <ArrowLeft size={15} />
          Back to Custom Orders
        </Link>

        {/* Header */}
        <div className="a-head">
          <div>
            <div className="a-eyebrow">Custom Order</div>
            <h1 className="a-title">Request <em>Detail</em></h1>
            <p className="a-subtitle">
              {req?.customerName ? `${req.customerName} · ` : ''}{id?.slice(0, 8)}…
            </p>
          </div>

          {req && !loading && (
            <div className="a-head-actions">
              <span className={`a-badge ${STATUS_BADGE_CLASS[st]}`} style={{ alignSelf: 'center' }}>{STATUS_LABELS[st]}</span>
              {statusRank(st) < statusRank('payment_done') && (
                <Link href={`/admin/custom-payments?bill=${req.id}`} className="a-btn a-btn--primary">
                  <CreditCard size={15} />
                  Create Payment Link
                </Link>
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
            <div className="a-empty-ico"><Gem size={20} /></div>
            <div className="a-empty-title">Custom order not found</div>
            <div className="a-empty-text">This request may have been deleted or the link is invalid.</div>
            <Link href="/admin/custom-orders" className="a-btn a-btn--subtle a-btn--sm" style={{ marginTop: 14 }}>
              <ArrowLeft size={14} />
              Back to Custom Orders
            </Link>
          </div>
        ) : (
          <div className="a-grid-2">
            {/* MAIN column */}
            <div className="a-stack">
              {/* Request Summary */}
              <div className="a-card">
                <div className="a-card-head">
                  <h2 className="a-card-title">Request <em>Summary</em></h2>
                </div>
                <div className="a-card-body">
                  <div style={{ fontFamily: 'var(--font-main)', fontSize: 20, color: 'var(--c-text)', marginBottom: 12 }}>
                    {req.title}
                  </div>
                  {req.description ? (
                    <p className="co-a-desc">{req.description}</p>
                  ) : (
                    <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: 13, color: 'var(--c-text-faint)', fontStyle: 'italic', margin: 0 }}>
                      No description provided.
                    </p>
                  )}

                  <div className="co-a-chips">
                    {req.category && <span className="co-a-chip"><Tag size={13} /> {req.category}</span>}
                    {req.metalPreference && <span className="co-a-chip"><Sparkles size={13} /> {req.metalPreference}</span>}
                    {req.quantity && req.quantity > 1 ? <span className="co-a-chip"><Package size={13} /> Qty {req.quantity}</span> : null}
                    {req.budget && <span className="co-a-chip"><Wallet size={13} /> {req.budget}</span>}
                    {req.processingTime && <span className="co-a-chip"><Clock size={13} /> {req.processingTime}</span>}
                  </div>

                  {req.referenceProduct && (
                    <div style={{ marginTop: 16, fontFamily: 'var(--font-dmsans)', fontSize: 12.5, color: 'var(--c-text-muted)' }}>
                      Inspired by product{' '}
                      <Link href={`/products/${req.referenceProduct}`} style={{ color: 'var(--c-accent)', fontWeight: 600 }} target="_blank">
                        {req.referenceProduct}
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Reference Images */}
              {images.length > 0 && (
                <div className="a-card">
                  <div className="a-card-head">
                    <h2 className="a-card-title">Reference <em>Images</em></h2>
                    <span className="a-badge a-badge--neutral">{images.length}</span>
                  </div>
                  <div className="a-card-body">
                    <div className="co-a-gallery">
                      {images.map((url, i) => (
                        <a key={url + i} href={url} target="_blank" rel="noreferrer" className="co-a-thumb" title="Open full size">
                          <img src={url} alt={`Reference ${i + 1}`} />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Reply */}
              <div className="a-card">
                <div className="a-card-head">
                  <h2 className="a-card-title">Reply to <em>Customer</em></h2>
                  {req.repliedAt && (
                    <span className="a-badge a-badge--success" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <MailCheck size={13} /> Replied {fmtDate(req.repliedAt)}
                    </span>
                  )}
                </div>
                <div className="a-card-body">
                  {req.adminReply && (
                    <div className="co-a-reply-prev">
                      <div className="co-a-reply-prev-top"><MailCheck size={13} /> Last reply sent</div>
                      <p className="co-a-reply-prev-body">{req.adminReply}</p>
                    </div>
                  )}

                  {!req.customerEmail ? (
                    <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: 13, color: 'var(--c-text-faint)', fontStyle: 'italic' }}>
                      No customer email on file — a reply cannot be emailed for this request.
                    </div>
                  ) : (
                    <>
                      <div className="a-field">
                        <label className="a-label">
                          {req.adminReply ? 'Send another reply' : 'Your reply'} to {req.customerEmail}
                        </label>
                        <textarea
                          className="a-textarea"
                          rows={6}
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          placeholder="Write your response to the customer's custom order request. This will be emailed to them directly."
                        />
                        <span className="a-hint">
                          Sending marks this request as “Replied” and emails the customer.
                        </span>
                      </div>
                      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="a-btn a-btn--primary" onClick={sendReply} disabled={sending || !reply.trim()}>
                          <Send size={15} />
                          {sending ? 'Sending…' : 'Send Reply'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ASIDE column */}
            <div className="a-stack">
              {/* Status control */}
              <div className="a-card">
                <div className="a-card-head">
                  <h2 className="a-card-title">Status</h2>
                </div>
                <div className="a-card-body">
                  <div className="co-a-status-seg">
                    {(() => {
                      const current = canonicalStatus(req.status)
                      return STATUS_FLOW.map((s) => {
                        const isCurrent = s === current
                        const isPast = statusRank(s) < statusRank(current)
                        const isFuture = statusRank(s) > statusRank(current)
                        return (
                          <button
                            key={s}
                            type="button"
                            className={`co-a-status-btn${isCurrent ? ' is-active' : ''}`}
                            onClick={() => { if (isFuture) setStatus(s) }}
                            disabled={busy || !isFuture}
                          >
                            {isPast && <CheckCircle size={13} style={{ marginRight: 4, verticalAlign: '-2px' }} />}
                            {STATUS_LABELS[s]}
                          </button>
                        )
                      })
                    })()}
                  </div>
                  <span className="a-hint" style={{ display: 'block', marginTop: 10 }}>
                    Status only moves forward — a stage can’t be reverted once reached.
                  </span>
                </div>
              </div>

              {/* Customer */}
              <div className="a-card">
                <div className="a-card-head">
                  <h2 className="a-card-title">Customer <em>Information</em></h2>
                </div>
                <div className="a-card-body">
                  <div className="a-stack" style={{ gap: 16 }}>
                    <KV icon={<Gem size={14} />} k="Full Name" v={req.customerName} />
                    <KV icon={<Mail size={14} />} k="Email" v={req.customerEmail} />
                    <KV icon={<Phone size={14} />} k="Phone" v={req.customerPhone} />
                    <KV icon={<MapPin size={14} />} k="Country" v={req.country} />
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="a-card">
                <div className="a-card-head">
                  <h2 className="a-card-title">Record</h2>
                </div>
                <div className="a-card-body">
                  <div className="a-stack" style={{ gap: 16 }}>
                    <KV k="Submitted" v={fmtDate(req.createdAt)} />
                    <KV k="Last Updated" v={fmtDate(req.updatedAt)} />
                    <KV k="Request ID" v={req.id} mono />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── Key/value row ────────────────────────────────────────────────────────────
function KV({
  icon, k, v, mono,
}: { icon?: React.ReactNode; k: string; v?: string | null; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      {icon && <span style={{ color: 'var(--c-accent)', marginTop: 2, flexShrink: 0 }}>{icon}</span>}
      <div className="co-a-kv" style={{ minWidth: 0 }}>
        <span className="co-a-kv-key">{k}</span>
        <span
          className={`co-a-kv-val${v ? '' : ' co-a-kv-val--empty'}`}
          style={mono ? { fontFamily: 'var(--font-mono, monospace)', fontSize: 12, wordBreak: 'break-all' } : undefined}
        >
          {v || 'Not provided'}
        </span>
      </div>
    </div>
  )
}
