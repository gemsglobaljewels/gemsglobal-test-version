'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, CheckCircle, Package, Pencil, Receipt, Clock, MapPin } from 'lucide-react'
import { useParams } from 'next/navigation'
import { formatOrderDate } from '@/lib/formatOrderDate'

const DEFAULT_USD_TO_INR = 83.5

const TIMELINE_CSS = `
.eo-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
}
.eo-timeline::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 8px;
  bottom: 8px;
  width: 1px;
  background: var(--c-border-strong);
}
.eo-timeline-item {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 0 0 18px 0;
  position: relative;
}
.eo-timeline-item:last-child { padding-bottom: 0; }
.eo-timeline-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 1px solid var(--c-border-strong);
  background: #fff;
  flex-shrink: 0;
  margin-top: 2px;
  position: relative;
  z-index: 1;
}
.eo-timeline-dot--active {
  background: var(--c-accent);
  border-color: var(--c-accent);
  box-shadow: 0 0 0 3px rgba(var(--c-accent-rgb),.15);
}
.eo-timeline-label {
  font-family: var(--font-dmsans);
  font-size: 12px;
  font-weight: 400;
  color: var(--c-text);
  letter-spacing: 0.02em;
}
.eo-timeline-label--active { color: var(--c-accent); font-weight: 600; }
.eo-timeline-time {
  font-family: var(--font-dmsans);
  font-size: 11px;
  font-weight: 400;
  color: var(--c-text-faint);
  letter-spacing: 0.02em;
  margin-top: 2px;
}
`

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered']

const BADGE_VARIANT: Record<string, string> = {
  pending: 'warning',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  confirmed: 'info',
  completed: 'success',
  failed: 'danger',
  refunded: 'neutral',
  cancelled: 'danger',
  return_requested: 'warning',
  returned: 'neutral',
}

function StatusBadge({ status }: { status: string }) {
  const variant = BADGE_VARIANT[status] || 'neutral'
  return (
    <span className={`a-badge a-badge--${variant}`}>
      <span className={`a-dot a-dot--${variant === 'neutral' ? 'info' : variant}`} />
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export default function EditOrderPage() {
  const params = useParams()
  const orderId = params?.id as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currency, setCurrency] = useState<'USD' | 'INR'>('INR')
  const [orderCurrency, setOrderCurrency] = useState<'USD' | 'INR'>('INR')
  const [usdToInr, setUsdToInr] = useState(DEFAULT_USD_TO_INR)

  useEffect(() => {
    fetch('/api/exchange-rate')
      .then(r => r.json())
      .then(d => { if (typeof d.rate === 'number') setUsdToInr(d.rate) })
      .catch(() => { })
  }, [])
  const [formData, setFormData] = useState({
    status: 'pending',
    notes: '',
    trackingNumber: '',
  })

  const fmtPrice = (val: number) => {
    // The stored amount is already in the order's own currency; display it as-is
    // and only convert when the admin toggles the summary currency.
    const rawVal = val

    // If viewing in INR
    if (currency === 'INR') {
      // If original order was in USD, convert it
      const inrVal = orderCurrency === 'USD' ? rawVal * usdToInr : rawVal
      return `₹${Math.round(inrVal).toLocaleString('en-IN')}`
    }
    // If viewing in USD
    // If original order was in INR, convert it
    const usdVal = orderCurrency === 'INR' ? rawVal / usdToInr : rawVal
    return `$${Number(usdVal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  async function fetchOrder() {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      const data = await response.json()
      setOrder(data)
      const orderCurr = (data.currency || 'INR').toUpperCase() as 'USD' | 'INR'
      setOrderCurrency(orderCurr)
      setCurrency(orderCurr)
      setFormData({
        status: data.status || 'pending',
        notes: data.notes || '',
        trackingNumber: data.trackingNumber || '',
      })
    } catch (err) {
      setError('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: formData.status,
          notes: formData.notes,
          trackingNumber: formData.trackingNumber,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        setSuccess('Order updated successfully')
        setTimeout(() => window.history.back(), 1500)
      } else {
        setError(data?.error || `Failed to update order (${response.status})`)
      }
    } catch (err: any) {
      setError(err?.message || 'Error updating order')
    } finally {
      setSaving(false)
    }
  }

  const activeStep = STATUS_STEPS.indexOf(formData.status)

  return (
    <>
      <style>{TIMELINE_CSS}</style>
      <div className="a-page">

        {/* Back */}
        <Link href="/admin/orders" className="a-back">
          <ArrowLeft size={14} />
          Back to Orders
        </Link>

        {/* Alerts */}
        {error && (
          <div className="a-card" style={{ marginBottom: 20, borderColor: 'var(--c-danger)', background: 'var(--c-danger-bg)' }}>
            <div className="a-card-body a-row" style={{ gap: 12, color: 'var(--c-danger)' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{error}</span>
              <button type="button" className="a-icon-btn a-icon-btn--sm" onClick={() => setError('')} aria-label="Dismiss">×</button>
            </div>
          </div>
        )}
        {success && (
          <div className="a-card" style={{ marginBottom: 20, borderColor: 'var(--c-success)', background: 'var(--c-success-bg)' }}>
            <div className="a-card-body a-row" style={{ gap: 12, color: 'var(--c-success)' }}>
              <CheckCircle size={16} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{success}</span>
              <button type="button" className="a-icon-btn a-icon-btn--sm" onClick={() => setSuccess('')} aria-label="Dismiss">×</button>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="a-head">
          <div>
            <div className="a-eyebrow">Order Management</div>
            <h1 className="a-title">Edit <em>Order</em></h1>
            <p className="a-subtitle">
              {order ? `#${String(order.id).slice(0, 14)}… · ${order.customerName || order.email}` : `Modify order details and fulfillment status`}
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="a-loader-row">
            <span className="a-loader" />
            <span className="a-loader-label">Loading order</span>
          </div>
        ) : (
          <div className="a-grid-2">

            {/* Left Column — Order Info + Form */}
            <div className="a-stack">

              {/* Order Info */}
              <div className="a-card">
                <div className="a-card-head">
                  <h2 className="a-card-title"><Package size={15} style={{ color: 'var(--c-accent)', verticalAlign: '-2px', marginRight: 8 }} />Order <em>Details</em></h2>
                </div>
                <div className="a-card-body">
                  <div className="a-form-grid">
                    <div className="a-field">
                      <span className="a-label">Order ID</span>
                      <span className="a-mono">#{String(order?.id || '').slice(0, 14)}…</span>
                    </div>
                    <div className="a-field">
                      <span className="a-label">Customer</span>
                      <span>{order?.customerName || order?.email || '—'}</span>
                    </div>
                    <div className="a-field">
                      <span className="a-label">Date Placed</span>
                      <span>{formatOrderDate(order?.createdAt)}</span>
                    </div>
                    <div className="a-field">
                      <span className="a-label">Current Status</span>
                      <span><StatusBadge status={order?.status || 'pending'} /></span>
                    </div>
                    <div className="a-field">
                      <span className="a-label">Total Value</span>
                      <span style={{ fontFamily: 'var(--font-main)', fontSize: 18 }}>{order?.total ? fmtPrice(order.total) : '—'}</span>
                    </div>
                    <div className="a-field">
                      <span className="a-label">Payment</span>
                      <span style={{ textTransform: 'uppercase' }}>{order?.paymentMethod === 'cod' ? 'Cash on Delivery' : (order?.paymentMethod === 'online' || order?.paymentMethod === 'razorpay') ? 'Razorpay' : order?.paymentMethod === 'upi' ? 'UPI (Razorpay)' : order?.paymentMethod || '—'}</span>
                    </div>
                  </div>

                  {order?.cancellationReason && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: '12px 14px',
                        border: '1px solid var(--c-danger)',
                        background: 'var(--c-danger-bg)',
                        display: 'flex',
                        gap: 10,
                        alignItems: 'flex-start',
                        borderRadius: 6,
                      }}
                    >
                      <AlertCircle size={15} style={{ color: 'var(--c-danger)', flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <div className="a-label" style={{ color: 'var(--c-danger)', marginBottom: 4 }}>Cancellation Reason (given by customer)</div>
                        <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--c-text)' }}>{order.cancellationReason}</div>
                      </div>
                    </div>
                  )}

                  {order?.returnReason && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: '12px 14px',
                        border: '1px solid var(--c-warning)',
                        background: 'var(--c-warning-bg)',
                        display: 'flex',
                        gap: 10,
                        alignItems: 'flex-start',
                        borderRadius: 6,
                      }}
                    >
                      <AlertCircle size={15} style={{ color: 'var(--c-warning)', flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <div className="a-label" style={{ color: 'var(--c-warning)', marginBottom: 4 }}>Return Reason (given by customer)</div>
                        <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--c-text)' }}>{order.returnReason}</div>
                      </div>
                    </div>
                  )}

                  {order?.items?.length > 0 && (
                    <>
                      <hr className="a-divider" />
                      <div className="a-table-wrap">
                        <div className="a-table-scroll">
                          <table className="a-table">
                            <thead>
                              <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th className="a-td-right">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item: any, i: number) => (
                                <tr key={i}>
                                  <td>
                                    <div className="a-cell-lead">
                                      {item.image && <img className="a-media" src={item.image} alt={item.name} />}
                                      <div>
                                        <div className="a-cell-name">{item.name || 'Product'}</div>
                                        <div className="a-cell-meta" style={{ display: 'flex', gap: 8 }}>
                                          {item.metal && <span style={{ color: 'var(--c-accent)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{item.metal}</span>}
                                          {item.size && <span style={{ letterSpacing: '.05em' }}>Size {item.size}</span>}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="a-cell-meta">Qty: {item.quantity}</td>
                                  <td className="a-td-right" style={{ fontFamily: 'var(--font-main)', fontSize: 16 }}>{fmtPrice(item.price * item.quantity)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Edit Form */}
              <div className="a-card">
                <div className="a-card-head">
                  <h2 className="a-card-title"><Pencil size={15} style={{ color: 'var(--c-accent)', verticalAlign: '-2px', marginRight: 8 }} />Update <em>Order</em></h2>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="a-card-body">

                    <div className="a-field">
                      <label className="a-label">Order Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="a-select"
                      >
                        {(() => {
                          const currentStatus = order?.status || 'pending'
                          const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
                          const currentIdx = statusOrder.indexOf(currentStatus)

                          const options = [
                            { value: 'pending', label: 'Pending (Unpaid)' },
                            { value: 'confirmed', label: 'Confirmed (Paid)' },
                            { value: 'processing', label: 'Processing' },
                            { value: 'shipped', label: 'Shipped' },
                            { value: 'delivered', label: 'Delivered' },
                            { value: 'return_requested', label: 'Return Requested' },
                            { value: 'returned', label: 'Returned' },
                            { value: 'cancelled', label: 'Cancelled' },
                            { value: 'refunded', label: 'Refunded' },
                          ]

                          return options.map(opt => {
                            const optIdx = statusOrder.indexOf(opt.value)
                            let isDisabled = false

                            // Prevent going backwards in flow
                            if (currentIdx !== -1 && optIdx !== -1 && optIdx < currentIdx) {
                              isDisabled = true
                            }

                            // Returns only exist after delivery
                            if (currentIdx !== -1 && currentStatus !== 'delivered' && ['return_requested', 'returned'].includes(opt.value)) {
                              isDisabled = true
                            }

                            // Delivered may only move to refunded or return_requested
                            if (currentStatus === 'delivered' && !['delivered', 'refunded', 'return_requested'].includes(opt.value)) {
                              isDisabled = true
                            }

                            // Return request may be completed (returned), refunded, or rejected (back to delivered)
                            if (currentStatus === 'return_requested' && !['return_requested', 'returned', 'refunded', 'delivered'].includes(opt.value)) {
                              isDisabled = true
                            }

                            // Returned may only move to refunded
                            if (currentStatus === 'returned' && !['returned', 'refunded'].includes(opt.value)) {
                              isDisabled = true
                            }

                            // Cancelled and refunded are terminal
                            if (['cancelled', 'refunded'].includes(currentStatus) && opt.value !== currentStatus) {
                              isDisabled = true
                            }

                            return (
                              <option key={opt.value} value={opt.value} disabled={isDisabled}>
                                {opt.label} {isDisabled ? '(Locked)' : ''}
                              </option>
                            )
                          })
                        })()}
                      </select>
                    </div>

                    <div className="a-field">
                      <label className="a-label">Tracking Number</label>
                      <input
                        type="text"
                        name="trackingNumber"
                        value={formData.trackingNumber}
                        onChange={handleChange}
                        placeholder="e.g. GB123456789GB"
                        className="a-input"
                      />
                    </div>

                    <div className="a-field" style={{ marginBottom: 0 }}>
                      <label className="a-label">Internal Notes</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Add internal notes visible only to admin staff…"
                        rows={4}
                        className="a-textarea"
                      />
                    </div>

                  </div>
                  <div className="a-card-foot">
                    <Link href="/admin/orders" className="a-btn a-btn--ghost">
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={saving}
                      className="a-btn a-btn--primary"
                    >
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>

            </div>

            {/* Right Column — Summary + Timeline */}
            <div className="a-stack">

              {/* Order Summary */}
              <div className="a-card">
                <div className="a-card-head">
                  <h2 className="a-card-title"><Receipt size={15} style={{ color: 'var(--c-accent)', verticalAlign: '-2px', marginRight: 8 }} />Order <em>Summary</em></h2>
                </div>
                <div className="a-card-body">
                  {/* Currency Toggle */}
                  <div className="a-segmented" style={{ marginBottom: 16 }}>
                    <button type="button" className={currency === 'INR' ? 'is-active' : ''} onClick={() => setCurrency('INR')}>₹ INR</button>
                    <button type="button" className={currency === 'USD' ? 'is-active' : ''} onClick={() => setCurrency('USD')}>$ USD</button>
                  </div>
                  <div className="a-row a-row--between" style={{ padding: '9px 0', borderBottom: '1px solid var(--c-border)' }}>
                    <span className="a-muted">Subtotal</span>
                    <span>{fmtPrice(order?.subtotal || 0)}</span>
                  </div>
                  <div className="a-row a-row--between" style={{ padding: '9px 0', borderBottom: '1px solid var(--c-border)' }}>
                    <span className="a-muted">Shipping</span>
                    <span>{(order?.shipping || 0) === 0 ? 'Free' : fmtPrice(order?.shipping || 0)}</span>
                  </div>
                  <div className="a-row a-row--between" style={{ padding: '9px 0', borderBottom: '1px solid var(--c-border)' }}>
                    <span className="a-muted">Tax (8%)</span>
                    <span>{fmtPrice(order?.tax || 0)}</span>
                  </div>
                  <hr className="a-divider" />
                  <div className="a-row a-row--between" style={{ padding: '9px 0' }}>
                    <span>Total</span>
                    <span style={{ fontFamily: 'var(--font-main)', fontSize: 18 }}>{fmtPrice(order?.total || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Fulfillment Timeline */}
              <div className="a-card">
                <div className="a-card-head">
                  <h2 className="a-card-title"><Clock size={15} style={{ color: 'var(--c-accent)', verticalAlign: '-2px', marginRight: 8 }} />Fulfilment <em>Status</em></h2>
                </div>
                <div className="a-card-body">
                  <div className="eo-timeline">
                    {STATUS_STEPS.map((step, i) => {
                      const isPast = i < activeStep
                      const isActive = i === activeStep
                      return (
                        <div className="eo-timeline-item" key={step}>
                          <div className={`eo-timeline-dot${isActive ? ' eo-timeline-dot--active' : ''}`}
                            style={isPast ? { background: 'var(--c-accent)', borderColor: 'var(--c-accent)', opacity: 0.4 } : {}}
                          />
                          <div>
                            <div className={`eo-timeline-label${isActive ? ' eo-timeline-label--active' : ''}`}
                              style={isPast ? { color: 'var(--c-text-muted)' } : {}}
                            >
                              {step.charAt(0).toUpperCase() + step.slice(1)}
                            </div>
                            {isActive && (
                              <div className="eo-timeline-time">Current status</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {formData.status === 'cancelled' && (
                      <div className="eo-timeline-item">
                        <div className="eo-timeline-dot" style={{ background: 'var(--c-danger)', borderColor: 'var(--c-danger)' }} />
                        <div>
                          <div className="eo-timeline-label" style={{ color: 'var(--c-danger)' }}>Cancelled</div>
                          <div className="eo-timeline-time">Order cancelled</div>
                        </div>
                      </div>
                    )}
                    {formData.status === 'return_requested' && (
                      <div className="eo-timeline-item">
                        <div className="eo-timeline-dot" style={{ background: 'var(--c-warning)', borderColor: 'var(--c-warning)' }} />
                        <div>
                          <div className="eo-timeline-label" style={{ color: 'var(--c-warning)' }}>Return Requested</div>
                          <div className="eo-timeline-time">Return requested by customer</div>
                        </div>
                      </div>
                    )}
                    {formData.status === 'returned' && (
                      <div className="eo-timeline-item">
                        <div className="eo-timeline-dot" style={{ background: 'var(--c-text-muted)', borderColor: 'var(--c-text-muted)' }} />
                        <div>
                          <div className="eo-timeline-label" style={{ color: 'var(--c-text-muted)' }}>Returned</div>
                          <div className="eo-timeline-time">Order returned</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {order?.shippingAddress && (
                <div className="a-card">
                  <div className="a-card-head">
                    <h2 className="a-card-title"><MapPin size={15} style={{ color: 'var(--c-accent)', verticalAlign: '-2px', marginRight: 8 }} />Shipping <em>Address</em></h2>
                  </div>
                  <div className="a-card-body">
                    <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: 'var(--c-text-muted)', lineHeight: 1.8, letterSpacing: '0.02em' }}>
                      {order.shippingAddress.name && <><strong style={{ color: 'var(--c-text)' }}>{order.shippingAddress.name}</strong><br /></>}
                      {order.shippingAddress.street || order.shippingAddress.line1}<br />
                      {(order.shippingAddress.line2) && <>{order.shippingAddress.line2}<br /></>}
                      {order.shippingAddress.city}{order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}{order.shippingAddress.zip ? ` - ${order.shippingAddress.zip}` : order.shippingAddress.postcode ? ` - ${order.shippingAddress.postcode}` : ''}<br />
                      {order.shippingAddress.email && <span style={{ fontSize: 11, color: 'var(--c-text-faint)' }}>{order.shippingAddress.email}</span>}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </>
  )
}
