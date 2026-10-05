'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, CheckCircle, Package } from 'lucide-react'
import { useParams } from 'next/navigation'

const DEFAULT_USD_TO_INR = 83.5

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500&display=swap');

.eo-page {
  min-height: 100vh;
  background: #0a0806;
  padding: 40px 48px;
  font-family: 'Jost', sans-serif;
}

/* ── Back Button ── */
.eo-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 36px;
  background: transparent;
  border: 1px solid rgba(212,175,55,0.18);
  color: rgba(212,175,55,0.55);
  font-family: 'Jost', sans-serif;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  padding: 0 18px;
  height: 36px;
  cursor: pointer;
  text-decoration: none;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.eo-back:hover {
  border-color: rgba(212,175,55,0.4);
  color: #D4AF37;
  background: rgba(212,175,55,0.04);
}
.eo-back svg {
  width: 13px;
  height: 13px;
}

/* ── Page Header ── */
.eo-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
}
.eo-page-header-left {}
.eo-eyebrow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.eo-eyebrow-line {
  width: 20px;
  height: 1px;
  background: #D4AF37;
}
.eo-eyebrow-tag {
  font-family: 'Jost', sans-serif;
  font-size: 8px;
  font-weight: 400;
  letter-spacing: 0.44em;
  text-transform: uppercase;
  color: rgba(212,175,55,0.65);
}
.eo-page-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 36px;
  font-weight: 300;
  color: #F0EBE0;
  line-height: 1.1;
  margin: 0 0 6px 0;
}
.eo-page-title em {
  font-style: italic;
  color: #D4AF37;
}
.eo-page-subtitle {
  font-family: 'Jost', sans-serif;
  font-size: 11px;
  font-weight: 300;
  color: rgba(235,229,216,0.38);
  letter-spacing: 0.06em;
}

/* ── Alert Bars ── */
.eo-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px;
  margin-bottom: 24px;
  border: 1px solid;
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  font-weight: 300;
  letter-spacing: 0.03em;
}
.eo-alert svg {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  margin-top: 1px;
}
.eo-alert-close {
  margin-left: auto;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  opacity: 0.5;
  transition: opacity 0.2s;
  padding: 0;
}
.eo-alert-close:hover { opacity: 1; }

.eo-alert--error {
  background: rgba(180,50,40,0.08);
  border-color: rgba(180,50,40,0.22);
  color: rgba(220,100,90,0.9);
}
.eo-alert--error .eo-alert-close { color: rgba(220,100,90,0.7); }

.eo-alert--success {
  background: rgba(74,222,128,0.05);
  border-color: rgba(74,222,128,0.20);
  color: rgba(74,222,128,0.85);
}
.eo-alert--success .eo-alert-close { color: rgba(74,222,128,0.6); }

/* ── Loading ── */
.eo-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 16px;
}
.eo-loading-ring {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(212,175,55,0.15);
  border-top-color: #D4AF37;
  border-radius: 50%;
  animation: eo-spin 1s linear infinite;
}
@keyframes eo-spin { to { transform: rotate(360deg); } }
.eo-loading-text {
  font-family: 'Jost', sans-serif;
  font-size: 10px;
  letter-spacing: 0.38em;
  text-transform: uppercase;
  color: rgba(212,175,55,0.45);
}

/* ── Grid Layout ── */
.eo-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  align-items: start;
}

/* ── Cards ── */
.eo-card {
  background: #13100c;
  border: 1px solid rgba(212,175,55,0.10);
  position: relative;
  overflow: hidden;
}
.eo-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212,175,55,0.45), transparent);
  pointer-events: none;
}
.eo-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(212,175,55,0.07);
}
.eo-card-header svg {
  width: 14px;
  height: 14px;
  color: rgba(212,175,55,0.5);
  flex-shrink: 0;
}
.eo-card-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  font-weight: 300;
  color: #F0EBE0;
  margin: 0;
}
.eo-card-title em {
  font-style: italic;
  color: #D4AF37;
}
.eo-card-body {
  padding: 24px 22px;
}

/* ── Order Info Card ── */
.eo-order-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
  margin-bottom: 20px;
}
.eo-meta-item {}
.eo-meta-label {
  font-family: 'Jost', sans-serif;
  font-size: 8px;
  font-weight: 400;
  letter-spacing: 0.40em;
  text-transform: uppercase;
  color: rgba(212,175,55,0.55);
  margin-bottom: 5px;
  display: block;
}
.eo-meta-value {
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  font-weight: 300;
  color: rgba(235,229,216,0.85);
  letter-spacing: 0.04em;
}
.eo-meta-value--mono {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: rgba(235,229,216,0.5);
}
.eo-meta-value--price {
  font-family: 'Cormorant Garamond', serif;
  font-size: 15px;
  font-weight: 400;
  color: #EDE7D8;
}

/* Status badge */
.eo-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 9px;
  border: 1px solid;
  font-family: 'Jost', sans-serif;
  font-size: 8px;
  font-weight: 400;
  letter-spacing: 0.17em;
  text-transform: uppercase;
}
.eo-badge-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  flex-shrink: 0;
}
.eo-badge--pending {
  background: rgba(251,191,36,0.07);
  border-color: rgba(251,191,36,0.25);
  color: rgba(251,191,36,0.85);
}
.eo-badge--pending .eo-badge-dot { background: rgba(251,191,36,0.8); }
.eo-badge--processing {
  background: rgba(96,165,250,0.07);
  border-color: rgba(96,165,250,0.25);
  color: rgba(96,165,250,0.85);
}
.eo-badge--processing .eo-badge-dot { background: rgba(96,165,250,0.8); }
.eo-badge--shipped {
  background: rgba(167,139,250,0.07);
  border-color: rgba(167,139,250,0.25);
  color: rgba(167,139,250,0.85);
}
.eo-badge--shipped .eo-badge-dot { background: rgba(167,139,250,0.8); }
.eo-badge--delivered {
  background: rgba(74,222,128,0.07);
  border-color: rgba(74,222,128,0.25);
  color: rgba(74,222,128,0.85);
}
.eo-badge--delivered .eo-badge-dot { background: rgba(74,222,128,0.8); }
.eo-badge--confirmed {
  background: rgba(96,165,250,0.07);
  border-color: rgba(96,165,250,0.25);
  color: rgba(96,165,250,0.85);
}
.eo-badge--confirmed .eo-badge-dot { background: rgba(96,165,250,0.8); }
.eo-badge--completed {
  background: rgba(74,222,128,0.07);
  border-color: rgba(74,222,128,0.25);
  color: rgba(74,222,128,0.85);
}
.eo-badge--completed .eo-badge-dot { background: rgba(74,222,128,0.8); }
.eo-badge--failed {
  background: rgba(248,113,113,0.07);
  border-color: rgba(248,113,113,0.25);
  color: rgba(248,113,113,0.85);
}
.eo-badge--failed .eo-badge-dot { background: rgba(248,113,113,0.8); }
.eo-badge--refunded {
  background: rgba(235,229,216,0.07);
  border-color: rgba(235,229,216,0.25);
  color: rgba(235,229,216,0.85);
}
.eo-badge--refunded .eo-badge-dot { background: rgba(235,229,216,0.8); }
.eo-badge--cancelled {
  background: rgba(248,113,113,0.07);
  border-color: rgba(248,113,113,0.25);
  color: rgba(248,113,113,0.85);
}
.eo-badge--cancelled .eo-badge-dot { background: rgba(248,113,113,0.8); }

/* Divider */
.eo-divider {
  height: 1px;
  background: rgba(212,175,55,0.07);
  margin: 20px 0;
}

/* Order items mini list */
.eo-items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.eo-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(212,175,55,0.05);
}
.eo-item-row:last-child { border-bottom: none; }
.eo-item-name {
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  font-weight: 300;
  color: rgba(235,229,216,0.75);
  letter-spacing: 0.04em;
}
.eo-item-qty {
  font-family: 'Jost', sans-serif;
  font-size: 10px;
  font-weight: 300;
  color: rgba(235,229,216,0.35);
  letter-spacing: 0.08em;
}
.eo-item-price {
  font-family: 'Cormorant Garamond', serif;
  font-size: 14px;
  font-weight: 400;
  color: #EDE7D8;
}

/* ── Form Elements ── */
.eo-field {
  margin-bottom: 20px;
}
.eo-label {
  display: block;
  font-family: 'Jost', sans-serif;
  font-size: 8px;
  font-weight: 400;
  letter-spacing: 0.40em;
  text-transform: uppercase;
  color: rgba(212,175,55,0.55);
  margin-bottom: 8px;
}
.eo-input,
.eo-select,
.eo-textarea {
  width: 100%;
  background: rgba(235,229,216,0.04);
  border: 1px solid rgba(212,175,55,0.14);
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  font-weight: 300;
  color: #EBE5D8;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
  box-sizing: border-box;
}
.eo-input::placeholder,
.eo-textarea::placeholder { color: rgba(235,229,216,0.2); }
.eo-input:focus,
.eo-select:focus,
.eo-textarea:focus {
  border-color: rgba(212,175,55,0.40);
  background: rgba(235,229,216,0.06);
}

.eo-input { height: 40px; padding: 0 12px; }

.eo-select {
  height: 40px;
  padding: 0 12px;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23D4AF37' stroke-width='1.2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  cursor: pointer;
}
.eo-select option {
  background: #13100c;
  color: #EBE5D8;
}

.eo-textarea {
  padding: 10px 12px;
  line-height: 1.6;
  resize: none;
}

/* ── Buttons ── */
.eo-btn-primary {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #D4AF37;
  color: #0a0806;
  border: none;
  font-family: 'Jost', sans-serif;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  height: 44px;
  padding: 0 28px;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
  width: 100%;
}
.eo-btn-primary:hover {
  background: #E8D48B;
  box-shadow: 0 6px 24px rgba(212,175,55,0.28);
}
.eo-btn-primary::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  transform: skewX(-20deg);
  transition: left 0.5s;
}
.eo-btn-primary:hover::before { left: 160%; }
.eo-btn-primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.eo-btn-primary:disabled::before { display: none; }

.eo-btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: transparent;
  border: 1px solid rgba(212,175,55,0.18);
  color: rgba(212,175,55,0.55);
  font-family: 'Jost', sans-serif;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  height: 44px;
  padding: 0 28px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
  width: 100%;
  text-decoration: none;
}
.eo-btn-ghost:hover {
  border-color: rgba(212,175,55,0.4);
  color: #D4AF37;
  background: rgba(212,175,55,0.04);
}

/* ── Form Actions ── */
.eo-form-actions {
  display: flex;
  gap: 12px;
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid rgba(212,175,55,0.07);
}

/* ── Summary Card (side panel) ── */
.eo-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 8px 0;
  border-bottom: 1px solid rgba(212,175,55,0.05);
}
.eo-summary-row:last-child { border-bottom: none; }
.eo-summary-key {
  font-family: 'Jost', sans-serif;
  font-size: 10px;
  font-weight: 300;
  letter-spacing: 0.06em;
  color: rgba(235,229,216,0.45);
}
.eo-summary-val {
  font-family: 'Jost', sans-serif;
  font-size: 11px;
  font-weight: 300;
  color: rgba(235,229,216,0.75);
  letter-spacing: 0.04em;
}
.eo-summary-val--price {
  font-family: 'Cormorant Garamond', serif;
  font-size: 16px;
  font-weight: 400;
  color: #EDE7D8;
}

/* Timeline */
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
  background: rgba(212,175,55,0.12);
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
  border: 1px solid rgba(212,175,55,0.35);
  background: #0a0806;
  flex-shrink: 0;
  margin-top: 2px;
  position: relative;
  z-index: 1;
}
.eo-timeline-dot--active {
  background: #D4AF37;
  border-color: #D4AF37;
  box-shadow: 0 0 8px rgba(212,175,55,0.4);
}
.eo-timeline-content {}
.eo-timeline-label {
  font-family: 'Jost', sans-serif;
  font-size: 10px;
  font-weight: 400;
  color: rgba(235,229,216,0.65);
  letter-spacing: 0.06em;
}
.eo-timeline-label--active { color: #D4AF37; }
.eo-timeline-time {
  font-family: 'Jost', sans-serif;
  font-size: 9px;
  font-weight: 300;
  color: rgba(235,229,216,0.28);
  letter-spacing: 0.05em;
  margin-top: 2px;
}
`

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered']

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`eo-badge eo-badge--${status}`}>
      <span className="eo-badge-dot" />
      {status}
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
    let rawVal = val
    // HEURISTIC: Fix old INR orders that were stored in USD values (e.g. 12.96 instead of 1000+)
    if (orderCurrency === 'INR' && val < 500) {
      rawVal = val * usdToInr
    }

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
      <style>{CSS}</style>
      <div className="eo-page">

        {/* Back */}
        <Link href="/admin/orders" className="eo-back">
          <ArrowLeft size={13} />
          Back to Orders
        </Link>

        {/* Alerts */}
        {error && (
          <div className="eo-alert eo-alert--error">
            <AlertCircle size={15} />
            <span>{error}</span>
            <button className="eo-alert-close" onClick={() => setError('')}>×</button>
          </div>
        )}
        {success && (
          <div className="eo-alert eo-alert--success">
            <CheckCircle size={15} />
            <span>{success}</span>
            <button className="eo-alert-close" onClick={() => setSuccess('')}>×</button>
          </div>
        )}

        {/* Page Header */}
        <div className="eo-page-header">
          <div className="eo-page-header-left">
            <div className="eo-eyebrow">
              <span className="eo-eyebrow-line" />
              <span className="eo-eyebrow-tag">Order Management</span>
            </div>
            <h1 className="eo-page-title">
              Edit <em>Order</em>
            </h1>
            <p className="eo-page-subtitle">
              {order ? `#${String(order.id).slice(0, 14)}… · ${order.customerName || order.email}` : `Modify order details and fulfillment status`}
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="eo-loading">
            <div className="eo-loading-ring" />
            <span className="eo-loading-text">Loading order</span>
          </div>
        ) : (
          <div className="eo-grid">

            {/* Left Column — Order Info + Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Order Info */}
              <div className="eo-card">
                <div className="eo-card-header">
                  <Package size={14} />
                  <h2 className="eo-card-title">Order <em>Details</em></h2>
                </div>
                <div className="eo-card-body">
                  <div className="eo-order-meta">
                    <div className="eo-meta-item">
                      <span className="eo-meta-label">Order ID</span>
                      <span className="eo-meta-value eo-meta-value--mono">#{String(order?.id || '').slice(0, 14)}…</span>
                    </div>
                    <div className="eo-meta-item">
                      <span className="eo-meta-label">Customer</span>
                      <span className="eo-meta-value">{order?.customerName || order?.email || '—'}</span>
                    </div>
                    <div className="eo-meta-item">
                      <span className="eo-meta-label">Date Placed</span>
                      <span className="eo-meta-value">{order?.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                    </div>
                    <div className="eo-meta-item">
                      <span className="eo-meta-label">Current Status</span>
                      <StatusBadge status={order?.status || 'pending'} />
                    </div>
                    <div className="eo-meta-item">
                      <span className="eo-meta-label">Total Value</span>
                      <span className="eo-meta-value eo-meta-value--price">{order?.total ? fmtPrice(order.total) : '—'}</span>
                    </div>
                    <div className="eo-meta-item">
                      <span className="eo-meta-label">Payment</span>
                      <span className="eo-meta-value" style={{ textTransform: 'uppercase' }}>{order?.paymentMethod === 'cod' ? 'Cash on Delivery' : order?.paymentMethod === 'online' ? 'Online (Razorpay)' : order?.paymentMethod === 'upi' ? 'UPI (Razorpay)' : order?.paymentMethod || '—'}</span>
                    </div>
                  </div>

                  {order?.items?.length > 0 && (
                    <>
                      <div className="eo-divider" />
                      <div className="eo-items-list">
                        {order.items.map((item: any, i: number) => (
                          <div className="eo-item-row" key={i}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {item.image && <img src={item.image} alt={item.name} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, border: '1px solid rgba(212,175,55,.1)' }} />}
                              <div>
                                <div className="eo-item-name">{item.name || 'Product'}</div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                                  {item.metal && <span style={{ fontSize: 9, color: 'rgba(212,175,55,.6)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{item.metal}</span>}
                                  {item.size && <span style={{ fontSize: 9, color: 'rgba(235,229,216,.4)', letterSpacing: '.05em' }}>Size {item.size}</span>}
                                </div>
                                <div className="eo-item-qty">Qty: {item.quantity}</div>
                              </div>
                            </div>
                            <span className="eo-item-price">{fmtPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Edit Form */}
              <div className="eo-card">
                <div className="eo-card-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  <h2 className="eo-card-title">Update <em>Order</em></h2>
                </div>
                <div className="eo-card-body">
                  <form onSubmit={handleSubmit}>

                    <div className="eo-field">
                      <label className="eo-label">Order Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="eo-select"
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

                            // Prevent changes from terminal states
                            if (['delivered', 'cancelled', 'refunded'].includes(currentStatus)) {
                              if (opt.value !== currentStatus) {
                                // Allow delivered -> refunded
                                if (!(currentStatus === 'delivered' && opt.value === 'refunded')) {
                                  isDisabled = true
                                }
                              }
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

                    <div className="eo-field">
                      <label className="eo-label">Tracking Number</label>
                      <input
                        type="text"
                        name="trackingNumber"
                        value={formData.trackingNumber}
                        onChange={handleChange}
                        placeholder="e.g. GB123456789GB"
                        className="eo-input"
                      />
                    </div>

                    <div className="eo-field" style={{ marginBottom: 0 }}>
                      <label className="eo-label">Internal Notes</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Add internal notes visible only to admin staff…"
                        rows={4}
                        className="eo-textarea"
                      />
                    </div>

                    <div className="eo-form-actions">
                      <Link href="/admin/orders" className="eo-btn-ghost">
                        Cancel
                      </Link>
                      <button
                        type="submit"
                        disabled={saving}
                        className="eo-btn-primary"
                      >
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>

                  </form>
                </div>
              </div>

            </div>

            {/* Right Column — Summary + Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Order Summary */}
              <div className="eo-card">
                <div className="eo-card-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
                  <h2 className="eo-card-title">Order <em>Summary</em></h2>
                </div>
                <div className="eo-card-body">
                  {/* Currency Toggle */}
                  <div style={{ display: 'flex', gap: 0, marginBottom: 16, border: '1px solid rgba(212,175,55,.18)' }}>
                    <button type="button" onClick={() => setCurrency('INR')} style={{ flex: 1, padding: '8px 0', background: currency === 'INR' ? 'rgba(212,175,55,.12)' : 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Jost',sans-serif", fontSize: 11, fontWeight: 400, letterSpacing: '.08em', color: currency === 'INR' ? '#D4AF37' : 'rgba(235,229,216,.45)', transition: 'all .2s' }}>₹ INR</button>
                    <button type="button" onClick={() => setCurrency('USD')} style={{ flex: 1, padding: '8px 0', background: currency === 'USD' ? 'rgba(212,175,55,.12)' : 'transparent', border: 'none', borderLeft: '1px solid rgba(212,175,55,.12)', cursor: 'pointer', fontFamily: "'Jost',sans-serif", fontSize: 11, fontWeight: 400, letterSpacing: '.08em', color: currency === 'USD' ? '#D4AF37' : 'rgba(235,229,216,.45)', transition: 'all .2s' }}>$ USD</button>
                  </div>
                  <div className="eo-summary-row">
                    <span className="eo-summary-key">Subtotal</span>
                    <span className="eo-summary-val">{fmtPrice(order?.subtotal || 0)}</span>
                  </div>
                  <div className="eo-summary-row">
                    <span className="eo-summary-key">Shipping</span>
                    <span className="eo-summary-val">{(order?.shipping || 0) === 0 ? 'Free' : fmtPrice(order?.shipping || 0)}</span>
                  </div>
                  <div className="eo-summary-row">
                    <span className="eo-summary-key">Tax (8%)</span>
                    <span className="eo-summary-val">{fmtPrice(order?.tax || 0)}</span>
                  </div>
                  <div className="eo-divider" />
                  <div className="eo-summary-row">
                    <span className="eo-summary-key" style={{ color: 'rgba(235,229,216,0.65)' }}>Total</span>
                    <span className="eo-summary-val eo-summary-val--price">{fmtPrice(order?.total || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Fulfillment Timeline */}
              <div className="eo-card">
                <div className="eo-card-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  <h2 className="eo-card-title">Fulfilment <em>Status</em></h2>
                </div>
                <div className="eo-card-body">
                  <div className="eo-timeline">
                    {STATUS_STEPS.map((step, i) => {
                      const isPast = i < activeStep
                      const isActive = i === activeStep
                      return (
                        <div className="eo-timeline-item" key={step}>
                          <div className={`eo-timeline-dot${isActive ? ' eo-timeline-dot--active' : ''}`}
                            style={isPast ? { background: 'rgba(212,175,55,0.25)', borderColor: 'rgba(212,175,55,0.25)' } : {}}
                          />
                          <div className="eo-timeline-content">
                            <div className={`eo-timeline-label${isActive ? ' eo-timeline-label--active' : ''}`}
                              style={isPast ? { color: 'rgba(235,229,216,0.35)' } : {}}
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
                        <div className="eo-timeline-dot" style={{ background: 'rgba(248,113,113,0.6)', borderColor: 'rgba(248,113,113,0.6)' }} />
                        <div className="eo-timeline-content">
                          <div className="eo-timeline-label" style={{ color: 'rgba(248,113,113,0.8)' }}>Cancelled</div>
                          <div className="eo-timeline-time">Order cancelled</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {order?.shippingAddress && (
                <div className="eo-card">
                  <div className="eo-card-header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    <h2 className="eo-card-title">Shipping <em>Address</em></h2>
                  </div>
                  <div className="eo-card-body">
                    <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', fontWeight: 300, color: 'rgba(235,229,216,0.65)', lineHeight: 1.8, letterSpacing: '0.04em' }}>
                      {order.shippingAddress.name && <><strong style={{ color: 'rgba(235,229,216,.85)' }}>{order.shippingAddress.name}</strong><br /></>}
                      {order.shippingAddress.street || order.shippingAddress.line1}<br />
                      {(order.shippingAddress.line2) && <>{order.shippingAddress.line2}<br /></>}
                      {order.shippingAddress.city}{order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}{order.shippingAddress.zip ? ` - ${order.shippingAddress.zip}` : order.shippingAddress.postcode ? ` - ${order.shippingAddress.postcode}` : ''}<br />
                      {order.shippingAddress.email && <span style={{ fontSize: 10, color: 'rgba(235,229,216,.4)' }}>{order.shippingAddress.email}</span>}
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