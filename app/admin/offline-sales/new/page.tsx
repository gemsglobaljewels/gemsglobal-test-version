'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle, Plus, Trash2, Package, Upload, Image as ImageIcon, ArrowLeft, User, FileText } from 'lucide-react'

type LineItem = {
  productId?: string
  productName?: string
  productImage?: string
  quantity: number
  unitPrice: number
  discount: number
}

const CSS = `
.ns-autocomplete-wrap { position: relative; }
.ns-autocomplete-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  z-index: 50;
  max-height: 240px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--c-border-strong) transparent;
}
.ns-autocomplete-dropdown::-webkit-scrollbar { width: 5px; }
.ns-autocomplete-dropdown::-webkit-scrollbar-thumb { background: var(--c-border-strong); border-radius: 999px; }
.ns-suggestion-btn {
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--c-border);
  padding: 11px 14px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.ns-suggestion-btn:last-child { border-bottom: none; }
.ns-suggestion-btn:hover { background: var(--c-surface); }
.ns-suggestion-name {
  font-family: var(--font-dmsans);
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text);
  margin-bottom: 3px;
}
.ns-suggestion-meta {
  font-family: var(--font-dmsans);
  font-size: 11px;
  font-weight: 400;
  color: var(--c-text-muted);
  display: flex;
  gap: 12px;
}
.ns-suggestion-sku { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 11px; color: var(--c-text-faint); }
.ns-search-loading {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  border: 1.5px solid var(--c-border);
  border-top-color: var(--c-accent);
  border-radius: 50%;
  animation: ns-spin 0.8s linear infinite;
}
@keyframes ns-spin { to { transform: translateY(-50%) rotate(360deg); } }
.ns-img-box {
  width: 44px;
  height: 44px;
  background: var(--c-surface);
  border: 1px dashed var(--c-border-strong);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.ns-img-box:hover { border-color: var(--c-accent); background: var(--c-surface-2); }
.ns-img-preview { width: 100%; height: 100%; object-fit: cover; }
.ns-img-icon { color: var(--c-text-faint); width: 16px; height: 16px; }
.ns-img-overlay {
  position: absolute;
  inset: 0;
  background: rgba(var(--c-accent-rgb), 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.ns-img-box:hover .ns-img-overlay { opacity: 1; }
.ns-img-overlay svg { color: #fff; width: 14px; height: 14px; }
@media (prefers-reduced-motion: reduce) {
  .ns-suggestion-btn, .ns-img-box, .ns-img-overlay { transition: none; }
}
`

export default function AdminOfflineSaleNewPage() {
  const router = useRouter()
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([
    { productId: '', productName: '', quantity: 1, unitPrice: 0, discount: 0 },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [recordedBy, setRecordedBy] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Record<number, any[]>>({})
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id) setRecordedBy(user.id)
      } catch { }
    }
    loadUser()

    // Close dropdowns on outside click
    const handler = () => setOpenIdx(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

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

  async function fetchSuggestions(q: string, idx: number) {
    if (!q || q.trim().length < 2) {
      setSuggestions((prev) => ({ ...prev, [idx]: [] }))
      setOpenIdx(null)
      return
    }
    try {
      setLoadingIdx(idx)
      const res = await fetch(`/api/products?search=${encodeURIComponent(q)}`)
      const list = await res.json()
      const top = Array.isArray(list) ? list.slice(0, 8) : []
      setSuggestions((prev) => ({ ...prev, [idx]: top }))
      setOpenIdx(idx)
    } catch {
      setSuggestions((prev) => ({ ...prev, [idx]: [] }))
    } finally {
      setLoadingIdx(null)
    }
  }

  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0)
  const discountTotal = items.reduce((sum, it) => sum + (Number(it.discount) || 0), 0)
  const total = Math.max(0, subtotal - discountTotal)

  async function handleItemImageUpload(idx: number, file: File) {
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/storage/upload-offline-sale', { method: 'POST', body: fd })
      const d = await res.json()
      if (d.url) {
        updateItem(idx, { productImage: d.url })
      } else throw new Error(d.error || 'Upload failed')
    } catch (e: any) {
      setError(e.message || 'Image upload failed')
    }
  }

  async function handleSubmit() {
    try {
      setSubmitting(true)
      setError('')
      setSuccess('')
      const payload = {
        customerName,
        customerEmail,
        customerPhone,
        customerAddress: customerAddress ? { address: customerAddress } : null,
        notes,
        recordedBy,
        items: items.map((it) => ({
          productId: it.productId || undefined,
          productName: it.productName || undefined,
          productImage: it.productImage || undefined,
          quantity: Number(it.quantity) || 0,
          unitPrice: Number(it.unitPrice) || 0,
          discount: Number(it.discount) || 0,
        })),
      }
      const res = await fetch('/api/offline-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Failed to create sale')
      } else {
        const newId = data?.id
        if (typeof newId === 'string' && newId) {
          router.push(`/admin/offline-sales/${newId}`)
          return
        } else {
          setSuccess('Sale recorded successfully')
          setCustomerName(''); setCustomerEmail(''); setCustomerPhone('')
          setCustomerAddress(''); setNotes('')
          setItems([{ productId: '', productName: '', quantity: 1, unitPrice: 0, discount: 0 }])
        }
      }
    } catch {
      setError('Failed to create sale')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="a-page">

        {/* Back */}
        <Link href="/admin/offline-sales" className="a-back">
          <ArrowLeft size={14} />
          Back to Offline Sales
        </Link>

        {/* Header */}
        <div className="a-head">
          <div>
            <div className="a-eyebrow">Point of Sale</div>
            <h1 className="a-title">Record <em>Sale</em></h1>
            <p className="a-subtitle">New in-store or boutique transaction</p>
          </div>
          <div className="a-head-actions">
            <Link href="/admin/offline-sales" className="a-btn a-btn--ghost">
              Cancel
            </Link>
            <button
              type="button"
              className="a-btn a-btn--primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Recording Sale…' : 'Record Sale'}
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="a-badge a-badge--danger" style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'flex-start', padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: 16 }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{error}</span>
            <button
              type="button"
              className="a-icon-btn a-icon-btn--sm"
              onClick={() => setError('')}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}
        {success && (
          <div className="a-badge a-badge--success" style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'flex-start', padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: 16 }}>
            <CheckCircle size={15} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{success}</span>
            <button
              type="button"
              className="a-icon-btn a-icon-btn--sm"
              onClick={() => setSuccess('')}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* Customer Details */}
        <div className="a-card" style={{ marginBottom: 20 }}>
          <div className="a-card-head">
            <h2 className="a-card-title">
              <User size={15} style={{ color: 'var(--c-accent)', verticalAlign: 'middle', marginRight: 8 }} />
              Customer <em>Details</em>
            </h2>
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
        <div className="a-card" style={{ marginBottom: 20 }}>
          <div className="a-card-head">
            <h2 className="a-card-title">
              <Package size={15} style={{ color: 'var(--c-accent)', verticalAlign: 'middle', marginRight: 8 }} />
              Line <em>Items</em>
            </h2>
            <button type="button" className="a-btn a-btn--subtle a-btn--sm" onClick={addItem}>
              <Plus size={14} />
              Add Line Item
            </button>
          </div>
          <div className="a-card-body a-card-body--flush">
            <div className="a-table-wrap">
              <div className="a-table-scroll">
                <table className="a-table">
                  <thead>
                    <tr>
                      <th style={{ width: 56 }}>Image</th>
                      <th>Product</th>
                      <th style={{ width: 200 }}>Product ID</th>
                      <th className="a-td-right" style={{ width: 90 }}>Qty</th>
                      <th className="a-td-right" style={{ width: 130 }}>Unit Price (₹)</th>
                      <th className="a-td-right" style={{ width: 130 }}>Discount (₹)</th>
                      <th style={{ width: 56 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} onClick={(e) => e.stopPropagation()}>
                        {/* Product Image Upload */}
                        <td>
                          <div className="ns-img-box" onClick={() => document.getElementById(`it_img_${idx}`)?.click()}>
                            {it.productImage ? (
                              <img src={it.productImage} className="ns-img-preview" alt="" />
                            ) : (
                              <ImageIcon className="ns-img-icon" />
                            )}
                            <div className="ns-img-overlay">
                              <Upload />
                            </div>
                            <input
                              type="file"
                              id={`it_img_${idx}`}
                              hidden
                              accept="image/*"
                              onChange={(e) => e.target.files?.[0] && handleItemImageUpload(idx, e.target.files[0])}
                            />
                          </div>
                        </td>

                        {/* Product Name + Autocomplete */}
                        <td>
                          <div className="ns-autocomplete-wrap">
                            <div style={{ position: 'relative' }}>
                              <input
                                value={it.productName || ''}
                                onChange={(e) => {
                                  updateItem(idx, { productName: e.target.value })
                                  fetchSuggestions(e.target.value, idx)
                                }}
                                onFocus={() => {
                                  if ((it.productName?.length || 0) >= 2) {
                                    fetchSuggestions(it.productName || '', idx)
                                  }
                                }}
                                className="a-input"
                                placeholder="e.g. Diamond Pendant"
                              />
                              {loadingIdx === idx && <span className="ns-search-loading" />}
                            </div>
                            {openIdx === idx && (suggestions[idx]?.length || 0) > 0 && (
                              <div className="ns-autocomplete-dropdown">
                                {suggestions[idx]!.map((p: any) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    className="ns-suggestion-btn"
                                    onClick={() => {
                                      updateItem(idx, {
                                        productId: p.id,
                                        productName: p.name,
                                        unitPrice: Number(p.price) || it.unitPrice,
                                      })
                                      setOpenIdx(null)
                                    }}
                                  >
                                    <div className="ns-suggestion-name">{p.name}</div>
                                    <div className="ns-suggestion-meta">
                                      {p.sku && <span className="ns-suggestion-sku">{p.sku}</span>}
                                      <span>₹{Number(p.price || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                      <span>Stock: {Number(p.stock_quantity || 0)}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Product ID */}
                        <td>
                          <input
                            value={it.productId || ''}
                            onChange={(e) => updateItem(idx, { productId: e.target.value })}
                            className="a-input a-mono"
                            placeholder="UUID (optional)"
                            style={{ fontSize: '11px' }}
                          />
                        </td>

                        {/* Qty */}
                        <td>
                          <input
                            type="number"
                            min={1}
                            value={it.quantity}
                            onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                            className="a-input"
                            style={{ textAlign: 'right' }}
                          />
                        </td>

                        {/* Unit Price */}
                        <td>
                          <input
                            type="number"
                            min={0}
                            step="1"
                            value={it.unitPrice}
                            onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                            className="a-input"
                            style={{ textAlign: 'right' }}
                          />
                        </td>

                        {/* Discount */}
                        <td>
                          <input
                            type="number"
                            min={0}
                            step="1"
                            value={it.discount}
                            onChange={(e) => updateItem(idx, { discount: Number(e.target.value) })}
                            className="a-input"
                            style={{ textAlign: 'right' }}
                          />
                        </td>

                        {/* Remove */}
                        <td className="a-cell-actions">
                          <button
                            type="button"
                            className="a-icon-btn a-icon-btn--danger a-icon-btn--sm"
                            onClick={() => removeItem(idx)}
                            disabled={items.length === 1}
                            title="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="a-card-foot">
            <div className="a-stats" style={{ width: '100%' }}>
              <div className="a-stat">
                <div className="a-stat-label">Subtotal</div>
                <div className="a-stat-val">₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
              <div className="a-stat">
                <div className="a-stat-label">Discount</div>
                <div className="a-stat-val" style={{ color: 'var(--c-success)' }}>−₹{discountTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
              <div className="a-stat">
                <div className="a-stat-label">Total Payable</div>
                <div className="a-stat-val" style={{ color: 'var(--c-accent)' }}>₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="a-card" style={{ marginBottom: 20 }}>
          <div className="a-card-head">
            <h2 className="a-card-title">
              <FileText size={15} style={{ color: 'var(--c-accent)', verticalAlign: 'middle', marginRight: 8 }} />
              Internal <em>Notes</em>
            </h2>
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

        {/* Submit */}
        <div className="a-card-foot" style={{ display: 'flex', alignItems: 'center', gap: 18, border: 'none', padding: '4px 0' }}>
          <button
            type="button"
            className="a-btn a-btn--primary a-btn--lg"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Recording Sale…' : 'Record Sale'}
          </button>
          <span className="a-muted" style={{ fontSize: 12 }}>Transaction will be saved and assigned a unique sale ID</span>
        </div>

      </div>
    </>
  )
}
