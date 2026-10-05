'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AlertCircle, Plus, Trash2, Package, User } from 'lucide-react'

type LineItem = {
  productId?: string
  productName?: string
  quantity: number
  unitPrice: number
  discount: number
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500&display=swap');

/* ── Base ── */
.se-page {
  min-height: 100vh;
  background: #0a0806;
  padding: 40px 48px;
  font-family: 'Jost', sans-serif;
}

/* ── Page Header ── */
.se-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 36px;
}
.se-eyebrow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.se-eyebrow-line {
  width: 20px;
  height: 1px;
  background: #D4AF37;
  flex-shrink: 0;
}
.se-eyebrow-tag {
  font-size: 8px;
  font-weight: 400;
  letter-spacing: 0.44em;
  text-transform: uppercase;
  color: rgba(212,175,55,0.65);
}
.se-page-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 36px;
  font-weight: 300;
  color: #F0EBE0;
  line-height: 1.1;
  margin: 0 0 6px 0;
}
.se-page-title em { font-style: italic; color: #D4AF37; }
.se-page-subtitle {
  font-size: 11px;
  font-weight: 300;
  color: rgba(235,229,216,0.38);
  letter-spacing: 0.06em;
}

/* ── Alert ── */
.se-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px;
  margin-bottom: 24px;
  border: 1px solid rgba(180,50,40,0.22);
  background: rgba(180,50,40,0.08);
  font-size: 12px;
  font-weight: 300;
  color: rgba(220,100,90,0.9);
  letter-spacing: 0.03em;
}
.se-alert svg { width: 14px; height: 14px; flex-shrink: 0; margin-top: 1px; }
.se-alert-close {
  margin-left: auto;
  background: transparent;
  border: none;
  cursor: pointer;
  color: rgba(220,100,90,0.6);
  font-size: 16px;
  line-height: 1;
  padding: 0;
}
.se-alert-close:hover { color: rgba(220,100,90,1); }

/* ── Loading / Empty ── */
.se-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 14px;
}
.se-loading-ring {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(212,175,55,0.12);
  border-top-color: rgba(212,175,55,0.55);
  border-radius: 50%;
  animation: se-spin 1s linear infinite;
}
@keyframes se-spin { to { transform: rotate(360deg); } }
.se-state-label {
  font-size: 9px;
  font-weight: 300;
  letter-spacing: 0.30em;
  text-transform: uppercase;
  color: rgba(235,229,216,0.25);
}

/* ── Cards ── */
.se-card {
  background: #13100c;
  border: 1px solid rgba(212,175,55,0.10);
  position: relative;
  overflow: visible;
  margin-bottom: 20px;
}
.se-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212,175,55,0.40), transparent);
  pointer-events: none;
}
.se-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(212,175,55,0.07);
}
.se-card-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.se-card-header svg { width: 14px; height: 14px; color: rgba(212,175,55,0.45); flex-shrink: 0; }
.se-card-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  font-weight: 300;
  color: #F0EBE0;
  margin: 0;
}
.se-card-title em { font-style: italic; color: #D4AF37; }
.se-card-body { padding: 24px 22px; }

/* ── Form Grid ── */
.se-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 24px;
}
.se-form-grid--full { grid-column: 1 / -1; }

/* ── Fields ── */
.se-field { display: flex; flex-direction: column; }
.se-label {
  font-size: 8px;
  font-weight: 400;
  letter-spacing: 0.40em;
  text-transform: uppercase;
  color: rgba(212,175,55,0.55);
  margin-bottom: 8px;
  display: block;
}
.se-input,
.se-textarea {
  background: rgba(235,229,216,0.04);
  border: 1px solid rgba(212,175,55,0.14);
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  font-weight: 300;
  color: #EBE5D8;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
  box-sizing: border-box;
  width: 100%;
}
.se-input::placeholder,
.se-textarea::placeholder { color: rgba(235,229,216,0.2); }
.se-input:focus,
.se-textarea:focus {
  border-color: rgba(212,175,55,0.40);
  background: rgba(235,229,216,0.06);
}
.se-input { height: 40px; padding: 0 12px; }
.se-textarea { padding: 10px 12px; line-height: 1.6; resize: none; }

/* ── Line Items ── */
.se-items-list { display: flex; flex-direction: column; gap: 12px; }

.se-item-row {
  display: grid;
  grid-template-columns: 2fr 2fr 80px 110px 100px 36px;
  gap: 10px;
  align-items: end;
  padding: 20px 18px 16px;
  background: rgba(235,229,216,0.02);
  border: 1px solid rgba(212,175,55,0.07);
  position: relative;
  transition: border-color 0.2s;
}
.se-item-row:hover { border-color: rgba(212,175,55,0.13); }
.se-item-row::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  background: rgba(212,175,55,0.18);
}

.se-item-num {
  position: absolute;
  top: 0; left: 0;
  background: rgba(212,175,55,0.08);
  border-right: 1px solid rgba(212,175,55,0.10);
  border-bottom: 1px solid rgba(212,175,55,0.10);
  font-size: 7px;
  font-weight: 500;
  letter-spacing: 0.22em;
  color: rgba(212,175,55,0.45);
  padding: 3px 8px;
  text-transform: uppercase;
}

.se-item-label {
  font-size: 7.5px;
  font-weight: 400;
  letter-spacing: 0.36em;
  text-transform: uppercase;
  color: rgba(212,175,55,0.38);
  margin-bottom: 6px;
  display: block;
}

/* ── Remove Button ── */
.se-remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 40px;
  background: transparent;
  border: 1px solid rgba(248,113,113,0.12);
  color: rgba(248,113,113,0.40);
  cursor: pointer;
  transition: border-color 0.18s, color 0.18s, background 0.18s;
  align-self: end;
  flex-shrink: 0;
}
.se-remove-btn:hover {
  border-color: rgba(248,113,113,0.38);
  background: rgba(248,113,113,0.07);
  color: rgba(248,113,113,0.9);
}
.se-remove-btn svg { width: 13px; height: 13px; }
.se-remove-btn:disabled { opacity: 0.22; cursor: not-allowed; }

/* ── Add Item Button ── */
.se-add-item-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: 1px dashed rgba(212,175,55,0.20);
  color: rgba(212,175,55,0.50);
  font-family: 'Jost', sans-serif;
  font-size: 8.5px;
  font-weight: 500;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  height: 38px;
  padding: 0 18px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
  margin-top: 4px;
}
.se-add-item-btn:hover {
  border-color: rgba(212,175,55,0.40);
  color: #D4AF37;
  background: rgba(212,175,55,0.04);
}
.se-add-item-btn svg { width: 12px; height: 12px; }

/* ── Totals ── */
.se-totals {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(212,175,55,0.07);
}
.se-total-box {
  background: rgba(235,229,216,0.02);
  border: 1px solid rgba(212,175,55,0.08);
  padding: 14px 16px;
}
.se-total-box--grand { border-color: rgba(212,175,55,0.18); }
.se-total-label {
  font-size: 8px;
  font-weight: 400;
  letter-spacing: 0.38em;
  text-transform: uppercase;
  color: rgba(212,175,55,0.40);
  margin-bottom: 8px;
  display: block;
}
.se-total-value {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  font-weight: 300;
  color: #EDE7D8;
}
.se-total-value em { font-style: italic; color: #D4AF37; }
.se-total-value--discount { color: rgba(74,222,128,0.75); }
.se-total-box--grand .se-total-value { font-size: 26px; }

/* ── Footer Buttons ── */
.se-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
}

.se-btn-primary {
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
  padding: 0 32px;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
}
.se-btn-primary:hover {
  background: #E8D48B;
  box-shadow: 0 6px 24px rgba(212,175,55,0.28);
}
.se-btn-primary::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  transform: skewX(-20deg);
  transition: left 0.5s;
}
.se-btn-primary:hover::before { left: 160%; }
.se-btn-primary:disabled { opacity: 0.40; cursor: not-allowed; }
.se-btn-primary:disabled::before { display: none; }

.se-btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba(212,175,55,0.18);
  color: rgba(212,175,55,0.50);
  font-family: 'Jost', sans-serif;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  height: 44px;
  padding: 0 24px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.se-btn-ghost:hover {
  border-color: rgba(212,175,55,0.4);
  color: #D4AF37;
  background: rgba(212,175,55,0.04);
}

.se-footer-note {
  font-size: 9px;
  font-weight: 300;
  letter-spacing: 0.10em;
  color: rgba(235,229,216,0.20);
  margin-left: 4px;
}
`

export default function AdminOfflineSaleEditPage() {
  const params = useParams() as { id?: string }
  const id = params?.id as string | undefined
  const router = useRouter()

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (id === 'undefined' || !uuidRe.test(id)) {
      setError('Invalid sale ID')
      setLoading(false)
      return
    }
    setError('');
    (async () => {
      try {
        const res = await fetch(`/api/offline-sales/${id}`)
        const data = await res.json()
        if (!res.ok) {
          setError(data?.error || 'Failed to load sale')
        } else {
          setCustomerName(data.customerName || '')
          setCustomerEmail(data.customerEmail || '')
          setCustomerPhone(data.customerPhone || '')
          setCustomerAddress(data.customerAddress?.address || '')
          setNotes(data.notes || '')
          const its = Array.isArray(data.items) ? data.items : []
          setItems(its.map((it: any) => ({
            productId: it.productId || '',
            productName: it.productName || '',
            quantity: Number(it.quantity) || 0,
            unitPrice: Number(it.unitPrice) || 0,
            discount: Number(it.discount) || 0,
          })))
        }
      } catch {
        setError('Failed to load sale')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  function addItem() {
    setItems([...items, { productId: '', productName: '', quantity: 1, unitPrice: 0, discount: 0 }])
  }
  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx))
  }
  function updateItem(idx: number, patch: Partial<LineItem>) {
    const next = [...items]
    next[idx] = { ...next[idx], ...patch }
    setItems(next)
  }

  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0)
  const discountTotal = items.reduce((sum, it) => sum + (Number(it.discount) || 0), 0)
  const total = Math.max(0, subtotal - discountTotal)

  async function handleSubmit() {
    if (!id) return
    try {
      setSubmitting(true)
      setError('')
      const payload = {
        customerName,
        customerEmail,
        customerPhone,
        customerAddress: customerAddress ? { address: customerAddress } : null,
        notes,
        items: items.map((it) => ({
          productId: it.productId || undefined,
          productName: it.productName || undefined,
          quantity: Number(it.quantity) || 0,
          unitPrice: Number(it.unitPrice) || 0,
          discount: Number(it.discount) || 0,
        })),
      }
      const res = await fetch(`/api/offline-sales/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Failed to update sale')
      } else {
        router.push(`/admin/offline-sales/${id}`)
      }
    } catch {
      setError('Failed to update sale')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="se-page">

        {/* Alert */}
        {error && (
          <div className="se-alert">
            <AlertCircle />
            <span>{error}</span>
            <button className="se-alert-close" onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* Page Header */}
        <div className="se-header">
          <div>
            <div className="se-eyebrow">
              <span className="se-eyebrow-line" />
              <span className="se-eyebrow-tag">Point of Sale</span>
            </div>
            <h1 className="se-page-title">Edit <em>Sale</em></h1>
            <p className="se-page-subtitle">
              {id ? `Updating record · ${id.slice(0, 8)}…` : 'Update customer and item details'}
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="se-state">
            <div className="se-loading-ring" />
            <span className="se-state-label">Loading sale</span>
          </div>
        ) : (
          <>
            {/* Customer Details */}
            <div className="se-card">
              <div className="se-card-header">
                <div className="se-card-header-left">
                  <User size={14} />
                  <h2 className="se-card-title">Customer <em>Details</em></h2>
                </div>
              </div>
              <div className="se-card-body">
                <div className="se-form-grid">

                  <div className="se-field">
                    <label className="se-label">Full Name</label>
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="se-input"
                      placeholder="e.g. Priya Mehta"
                    />
                  </div>

                  <div className="se-field">
                    <label className="se-label">Phone Number</label>
                    <input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="se-input"
                      placeholder="e.g. +44 7700 900123"
                    />
                  </div>

                  <div className="se-field">
                    <label className="se-label">Email Address</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="se-input"
                      placeholder="e.g. priya@example.com"
                    />
                  </div>

                  <div className="se-field se-form-grid--full">
                    <label className="se-label">Billing / Delivery Address</label>
                    <textarea
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="se-textarea"
                      rows={3}
                      placeholder="Full address including postcode and country…"
                    />
                  </div>

                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="se-card">
              <div className="se-card-header">
                <div className="se-card-header-left">
                  <Package size={14} />
                  <h2 className="se-card-title">Line <em>Items</em></h2>
                </div>
              </div>
              <div className="se-card-body">

                {items.length === 0 ? (
                  <div style={{
                    padding: '28px 0',
                    textAlign: 'center',
                    color: 'rgba(235,229,216,0.22)',
                    fontSize: '11px',
                    fontWeight: 300,
                    letterSpacing: '0.14em',
                    fontStyle: 'italic',
                  }}>
                    No items — add one below
                  </div>
                ) : (
                  <div className="se-items-list">
                    {items.map((it, idx) => (
                      <div key={idx} className="se-item-row">
                        <span className="se-item-num">Item {idx + 1}</span>

                        {/* Product ID */}
                        <div className="se-field">
                          <label className="se-item-label">Product ID</label>
                          <input
                            value={it.productId || ''}
                            onChange={(e) => updateItem(idx, { productId: e.target.value })}
                            className="se-input"
                            placeholder="UUID (optional)"
                            style={{ fontFamily: "'Courier New', monospace", fontSize: '10px' }}
                          />
                        </div>

                        {/* Product Name */}
                        <div className="se-field">
                          <label className="se-item-label">Product Name</label>
                          <input
                            value={it.productName || ''}
                            onChange={(e) => updateItem(idx, { productName: e.target.value })}
                            className="se-input"
                            placeholder="e.g. Diamond Ring"
                          />
                        </div>

                        {/* Qty */}
                        <div className="se-field">
                          <label className="se-item-label">Qty</label>
                          <input
                            type="number"
                            min={1}
                            value={it.quantity}
                            onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                            className="se-input"
                          />
                        </div>

                        {/* Unit Price */}
                        <div className="se-field">
                          <label className="se-item-label">Unit Price (₹)</label>
                          <input
                            type="number"
                            min={0}
                            step="1"
                            value={it.unitPrice}
                            onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                            className="se-input"
                          />
                        </div>

                        {/* Discount */}
                        <div className="se-field">
                          <label className="se-item-label">Discount (₹)</label>
                          <input
                            type="number"
                            min={0}
                            step="1"
                            value={it.discount}
                            onChange={(e) => updateItem(idx, { discount: Number(e.target.value) })}
                            className="se-input"
                          />
                        </div>

                        {/* Remove */}
                        <button
                          className="se-remove-btn"
                          onClick={() => removeItem(idx)}
                          disabled={items.length === 1}
                          title="Remove item"
                        >
                          <Trash2 />
                        </button>

                      </div>
                    ))}
                  </div>
                )}

                <button className="se-add-item-btn" onClick={addItem}>
                  <Plus />
                  Add Line Item
                </button>

                {/* Totals */}
                <div className="se-totals">
                  <div className="se-total-box">
                    <span className="se-total-label">Subtotal</span>
                    <div className="se-total-value">
                      <em>₹</em>{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="se-total-box">
                    <span className="se-total-label">Discount</span>
                    <div className="se-total-value se-total-value--discount">
                      −₹{discountTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="se-total-box se-total-box--grand">
                    <span className="se-total-label">Total Payable</span>
                    <div className="se-total-value">
                      <em>₹</em>{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Notes */}
            <div className="se-card">
              <div className="se-card-header">
                <div className="se-card-header-left">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <h2 className="se-card-title">Internal <em>Notes</em></h2>
                </div>
              </div>
              <div className="se-card-body">
                <div className="se-field">
                  <label className="se-label">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="se-textarea"
                    rows={4}
                    placeholder="Payment method, special requests, gift wrapping, engraving details…"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="se-footer">
              <button
                className="se-btn-primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Saving Changes…' : 'Save Changes'}
              </button>
              <button
                className="se-btn-ghost"
                onClick={() => router.push(`/admin/offline-sales/${id}`)}
              >
                Cancel
              </button>
              <span className="se-footer-note">Changes will be applied immediately</span>
            </div>
          </>
        )}

      </div>
    </>
  )
}