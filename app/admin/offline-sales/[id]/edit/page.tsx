'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AlertCircle, Plus, Trash2, Package, User, ArrowLeft, FileText } from 'lucide-react'

type LineItem = {
  productId?: string
  productName?: string
  quantity: number
  unitPrice: number
  discount: number
}

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
    <div className="a-page">

      <style>{`
        .ose-items { display: flex; flex-direction: column; gap: 14px; }
        .ose-item-row {
          display: grid;
          grid-template-columns: 2fr 2fr 84px 1fr 1fr 44px;
          gap: 12px;
          align-items: end;
          position: relative;
          padding: 26px 18px 18px;
          background: var(--c-surface);
          border: 1px solid var(--c-border);
          border-radius: var(--radius-lg);
        }
        .ose-item-row::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 2px;
          background: var(--c-accent);
          border-radius: var(--radius-lg) 0 0 var(--radius-lg);
        }
        .ose-item-num {
          position: absolute;
          top: 0; left: 0;
          background: var(--c-accent-soft);
          border-right: 1px solid var(--c-border);
          border-bottom: 1px solid var(--c-border);
          border-radius: var(--radius-lg) 0 var(--radius-sm) 0;
          font-family: var(--font-dmsans);
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--c-accent);
          padding: 4px 9px;
        }
        .ose-mini-label {
          font-family: var(--font-dmsans);
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--c-text-muted);
          margin-bottom: 6px;
          display: block;
        }
        .ose-add-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          justify-content: center;
          background: #fff;
          border: 1px dashed var(--c-border-strong);
          border-radius: var(--radius);
          color: var(--c-text-muted);
          font-family: var(--font-dmsans);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          height: 44px;
          padding: 0 20px;
          cursor: pointer;
          margin-top: 14px;
          transition: border-color .2s, color .2s, background .2s;
        }
        .ose-add-btn:hover {
          border-color: var(--c-accent);
          color: var(--c-accent);
          background: var(--c-surface);
        }
        .ose-add-btn svg { width: 14px; height: 14px; }
        .ose-totals {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--c-border);
        }
        .ose-total-box {
          background: var(--c-surface);
          border: 1px solid var(--c-border);
          border-radius: var(--radius);
          padding: 16px 18px;
        }
        .ose-total-box--grand { border-color: var(--c-accent); background: var(--c-accent-soft); }
        .ose-total-label {
          font-family: var(--font-dmsans);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--c-text-muted);
          margin-bottom: 8px;
          display: block;
        }
        .ose-total-val {
          font-family: var(--font-main);
          font-size: 24px;
          font-weight: 400;
          color: var(--c-text);
        }
        .ose-total-val em { font-style: italic; color: var(--c-accent); }
        .ose-total-val--discount { color: var(--c-success); }
        .ose-total-box--grand .ose-total-val { font-size: 28px; }
        @media (max-width: 720px) {
          .ose-item-row { grid-template-columns: 1fr 1fr; }
          .ose-totals { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Back link */}
      <button className="a-back" onClick={() => router.push(`/admin/offline-sales/${id}`)}>
        <ArrowLeft size={15} />
        Back to sale
      </button>

      {/* Alert */}
      {error && (
        <div className="a-card" style={{ borderColor: 'var(--c-danger)', background: 'var(--c-danger-bg)', marginBottom: 20 }}>
          <div className="a-card-body a-row" style={{ alignItems: 'flex-start', gap: 12, color: 'var(--c-danger)' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ flex: 1, fontFamily: 'var(--font-dmsans)', fontSize: 13 }}>{error}</span>
            <button className="a-icon-btn a-icon-btn--sm" onClick={() => setError('')} title="Dismiss">×</button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="a-head">
        <div>
          <div className="a-eyebrow">Point of Sale</div>
          <h1 className="a-title">Edit <em>Sale</em></h1>
          <p className="a-subtitle">
            {id ? `Updating record · ${id.slice(0, 8)}…` : 'Update customer and item details'}
          </p>
        </div>
        {!loading && (
          <div className="a-head-actions">
            <button
              className="a-btn a-btn--ghost"
              onClick={() => router.push(`/admin/offline-sales/${id}`)}
            >
              Cancel
            </button>
            <button
              className="a-btn a-btn--primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Saving Changes…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="a-loader-row">
          <div className="a-loader" />
          <span className="a-loader-label">Loading sale</span>
        </div>
      ) : (
        <>
          {/* Customer Details */}
          <div className="a-card">
            <div className="a-card-head">
              <div className="a-row" style={{ gap: 10 }}>
                <User size={15} style={{ color: 'var(--c-accent)' }} />
                <h2 className="a-card-title">Customer <em>Details</em></h2>
              </div>
            </div>
            <div className="a-card-body">
              <div className="a-form-grid">

                <div className="a-field">
                  <label className="a-label">Full Name</label>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="a-input"
                    placeholder="e.g. Priya Mehta"
                  />
                </div>

                <div className="a-field">
                  <label className="a-label">Phone Number</label>
                  <input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="a-input"
                    placeholder="e.g. +44 7700 900123"
                  />
                </div>

                <div className="a-field">
                  <label className="a-label">Email Address</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="a-input"
                    placeholder="e.g. priya@example.com"
                  />
                </div>

                <div className="a-field a-col-span-2">
                  <label className="a-label">Billing / Delivery Address</label>
                  <textarea
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="a-textarea"
                    rows={3}
                    placeholder="Full address including postcode and country…"
                  />
                </div>

              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="a-card">
            <div className="a-card-head">
              <div className="a-row" style={{ gap: 10 }}>
                <Package size={15} style={{ color: 'var(--c-accent)' }} />
                <h2 className="a-card-title">Line <em>Items</em></h2>
              </div>
            </div>
            <div className="a-card-body">

              {items.length === 0 ? (
                <div className="a-empty">
                  <div className="a-empty-ico"><Package size={22} /></div>
                  <div className="a-empty-title">No items yet</div>
                  <div className="a-empty-text">Add your first line item below.</div>
                </div>
              ) : (
                <div className="ose-items">
                  {items.map((it, idx) => (
                    <div key={idx} className="ose-item-row">
                      <span className="ose-item-num">Item {idx + 1}</span>

                      {/* Product ID */}
                      <div className="a-field">
                        <label className="ose-mini-label">Product ID</label>
                        <input
                          value={it.productId || ''}
                          onChange={(e) => updateItem(idx, { productId: e.target.value })}
                          className="a-input a-mono"
                          placeholder="UUID (optional)"
                          style={{ fontSize: 11 }}
                        />
                      </div>

                      {/* Product Name */}
                      <div className="a-field">
                        <label className="ose-mini-label">Product Name</label>
                        <input
                          value={it.productName || ''}
                          onChange={(e) => updateItem(idx, { productName: e.target.value })}
                          className="a-input"
                          placeholder="e.g. Diamond Ring"
                        />
                      </div>

                      {/* Qty */}
                      <div className="a-field">
                        <label className="ose-mini-label">Qty</label>
                        <input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                          className="a-input"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="a-field">
                        <label className="ose-mini-label">Unit Price (₹)</label>
                        <input
                          type="number"
                          min={0}
                          step="1"
                          value={it.unitPrice}
                          onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                          className="a-input"
                        />
                      </div>

                      {/* Discount */}
                      <div className="a-field">
                        <label className="ose-mini-label">Discount (₹)</label>
                        <input
                          type="number"
                          min={0}
                          step="1"
                          value={it.discount}
                          onChange={(e) => updateItem(idx, { discount: Number(e.target.value) })}
                          className="a-input"
                        />
                      </div>

                      {/* Remove */}
                      <button
                        className="a-icon-btn a-icon-btn--danger"
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>

                    </div>
                  ))}
                </div>
              )}

              <button className="ose-add-btn" onClick={addItem}>
                <Plus />
                Add Line Item
              </button>

              {/* Totals */}
              <div className="ose-totals">
                <div className="ose-total-box">
                  <span className="ose-total-label">Subtotal</span>
                  <div className="ose-total-val">
                    <em>₹</em>{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="ose-total-box">
                  <span className="ose-total-label">Discount</span>
                  <div className="ose-total-val ose-total-val--discount">
                    −₹{discountTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="ose-total-box ose-total-box--grand">
                  <span className="ose-total-label">Total Payable</span>
                  <div className="ose-total-val">
                    <em>₹</em>{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Notes */}
          <div className="a-card">
            <div className="a-card-head">
              <div className="a-row" style={{ gap: 10 }}>
                <FileText size={15} style={{ color: 'var(--c-accent)' }} />
                <h2 className="a-card-title">Internal <em>Notes</em></h2>
              </div>
            </div>
            <div className="a-card-body">
              <div className="a-field">
                <label className="a-label">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="a-textarea"
                  rows={4}
                  placeholder="Payment method, special requests, gift wrapping, engraving details…"
                />
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="a-card">
            <div className="a-card-foot a-row a-row--between">
              <span className="a-muted">Changes will be applied immediately</span>
              <div className="a-row" style={{ gap: 12 }}>
                <button
                  className="a-btn a-btn--ghost"
                  onClick={() => router.push(`/admin/offline-sales/${id}`)}
                >
                  Cancel
                </button>
                <button
                  className="a-btn a-btn--primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Saving Changes…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
