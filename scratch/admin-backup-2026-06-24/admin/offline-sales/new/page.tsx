'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle, Plus, Trash2, Search, Package, Upload, Image as ImageIcon } from 'lucide-react'

type LineItem = {
  productId?: string
  productName?: string
  productImage?: string
  quantity: number
  unitPrice: number
  discount: number
}

const CSS = `


/* ── Base ── */
.ns-page {
  min-height: 100vh;
  background: #0a0806;
  padding: 40px 48px;
  font-family: var(--font-main);
}

/* ── Page Header ── */
.ns-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 36px;
}
.ns-eyebrow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.ns-eyebrow-line {
  width: 20px;
  height: 1px;
  background: #D4AF37;
  flex-shrink: 0;
}
.ns-eyebrow-tag {
  font-family: var(--font-main);
  font-size: 8px;
  font-weight: 400;
  letter-spacing: 0.44em;
  text-transform: uppercase;
  color: rgba(212,175,55,0.65);
}
.ns-page-title {
  font-family: var(--font-heading);
  font-size: 36px;
  font-weight: 300;
  color: #F0EBE0;
  line-height: 1.1;
  margin: 0 0 6px 0;
}
.ns-page-title em {
  font-style: italic;
  color: #D4AF37;
}
.ns-page-subtitle {
  font-family: var(--font-main);
  font-size: 11px;
  font-weight: 300;
  color: rgba(235,229,216,0.38);
  letter-spacing: 0.06em;
}

/* ── Alerts ── */
.ns-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px;
  margin-bottom: 24px;
  border: 1px solid;
  font-family: var(--font-main);
  font-size: 12px;
  font-weight: 300;
  letter-spacing: 0.03em;
}
.ns-alert svg { width: 14px; height: 14px; flex-shrink: 0; margin-top: 1px; }
.ns-alert-close {
  margin-left: auto;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0;
  transition: opacity 0.2s;
}
.ns-alert--error {
  background: rgba(180,50,40,0.08);
  border-color: rgba(180,50,40,0.22);
  color: rgba(220,100,90,0.9);
}
.ns-alert--error .ns-alert-close { color: rgba(220,100,90,0.6); }
.ns-alert--success {
  background: rgba(74,222,128,0.05);
  border-color: rgba(74,222,128,0.20);
  color: rgba(74,222,128,0.85);
}
.ns-alert--success .ns-alert-close { color: rgba(74,222,128,0.6); }

/* ── Cards ── */
.ns-card {
  background: #13100c;
  border: 1px solid rgba(212,175,55,0.10);
  position: relative;
  overflow: visible;
  margin-bottom: 20px;
}
.ns-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212,175,55,0.40), transparent);
  pointer-events: none;
}
.ns-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(212,175,55,0.07);
}
.ns-card-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ns-card-header svg {
  width: 14px;
  height: 14px;
  color: rgba(212,175,55,0.45);
  flex-shrink: 0;
}
.ns-card-title {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 300;
  color: #F0EBE0;
  margin: 0;
}
.ns-card-title em {
  font-style: italic;
  color: #D4AF37;
}
.ns-card-body {
  padding: 24px 22px;
}

/* ── Form Grid ── */
.ns-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 24px;
}
.ns-form-grid--full { grid-column: 1 / -1; }

/* ── Field ── */
.ns-field { display: flex; flex-direction: column; }
.ns-label {
  font-family: var(--font-main);
  font-size: 8px;
  font-weight: 400;
  letter-spacing: 0.40em;
  text-transform: uppercase;
  color: rgba(212,175,55,0.55);
  margin-bottom: 8px;
}
.ns-input,
.ns-textarea {
  background: rgba(235,229,216,0.04);
  border: 1px solid rgba(212,175,55,0.14);
  font-family: var(--font-main);
  font-size: 12px;
  font-weight: 300;
  color: #EBE5D8;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
  box-sizing: border-box;
  width: 100%;
}
.ns-input::placeholder,
.ns-textarea::placeholder { color: rgba(235,229,216,0.2); }
.ns-input:focus,
.ns-textarea:focus {
  border-color: rgba(212,175,55,0.40);
  background: rgba(235,229,216,0.06);
}
.ns-input { height: 40px; padding: 0 12px; }
.ns-textarea { padding: 10px 12px; line-height: 1.6; resize: none; }

/* ── Line Items ── */
.ns-items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ns-item-row {
  display: grid;
  grid-template-columns: 60px 1.5fr 2fr 80px 110px 100px 36px;
  gap: 10px;
  align-items: end;
  padding: 16px 18px;
  background: rgba(235,229,216,0.02);
  border: 1px solid rgba(212,175,55,0.07);
  position: relative;
  transition: border-color 0.2s;
}

/* image upload box */
.ns-item-img-box {
  width: 60px;
  height: 60px;
  background: rgba(235,229,216,0.03);
  border: 1px dashed rgba(212,175,55,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.2s;
  align-self: flex-start;
  margin-top: 16px;
}
.ns-item-img-box:hover {
  background: rgba(212,175,55,0.05);
  border-color: rgba(212,175,55,0.3);
}
.ns-item-img-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ns-item-img-icon {
  color: rgba(212,175,55,0.25);
  width: 18px;
  height: 18px;
}
.ns-item-img-upload-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}
.ns-item-img-box:hover .ns-item-img-upload-overlay { opacity: 1; }
.ns-item-img-upload-overlay svg { color: #fff; width: 14px; height: 14px; }
.ns-item-row:hover { border-color: rgba(212,175,55,0.12); }
.ns-item-row::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  background: rgba(212,175,55,0.18);
}

/* product name with autocomplete */
.ns-autocomplete-wrap { position: relative; }
.ns-autocomplete-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #1a1610;
  border: 1px solid rgba(212,175,55,0.22);
  z-index: 50;
  max-height: 220px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(212,175,55,0.2) transparent;
}
.ns-autocomplete-dropdown::-webkit-scrollbar { width: 3px; }
.ns-autocomplete-dropdown::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); }

.ns-suggestion-btn {
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(212,175,55,0.05);
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s;
}
.ns-suggestion-btn:last-child { border-bottom: none; }
.ns-suggestion-btn:hover { background: rgba(212,175,55,0.06); }
.ns-suggestion-name {
  font-family: var(--font-main);
  font-size: 11px;
  font-weight: 400;
  color: rgba(235,229,216,0.82);
  letter-spacing: 0.04em;
  margin-bottom: 2px;
}
.ns-suggestion-meta {
  font-family: var(--font-main);
  font-size: 9px;
  font-weight: 300;
  color: rgba(235,229,216,0.32);
  letter-spacing: 0.06em;
  display: flex;
  gap: 10px;
}
.ns-suggestion-sku { font-family: 'Courier New', monospace; font-size: 9px; }

/* item field label */
.ns-item-label {
  font-family: var(--font-main);
  font-size: 7.5px;
  font-weight: 400;
  letter-spacing: 0.36em;
  text-transform: uppercase;
  color: rgba(212,175,55,0.40);
  margin-bottom: 6px;
  display: block;
}

/* item number badge */
.ns-item-num {
  position: absolute;
  top: -1px; left: -1px;
  background: rgba(212,175,55,0.10);
  border: 1px solid rgba(212,175,55,0.15);
  font-family: var(--font-main);
  font-size: 7px;
  font-weight: 500;
  letter-spacing: 0.20em;
  color: rgba(212,175,55,0.5);
  padding: 2px 7px;
  text-transform: uppercase;
}

/* ── Remove button ── */
.ns-remove-btn {
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
.ns-remove-btn:hover {
  border-color: rgba(248,113,113,0.38);
  background: rgba(248,113,113,0.07);
  color: rgba(248,113,113,0.9);
}
.ns-remove-btn svg { width: 13px; height: 13px; }
.ns-remove-btn:disabled { opacity: 0.25; cursor: not-allowed; }

/* ── Add Item button ── */
.ns-add-item-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: 1px dashed rgba(212,175,55,0.20);
  color: rgba(212,175,55,0.50);
  font-family: var(--font-main);
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
.ns-add-item-btn:hover {
  border-color: rgba(212,175,55,0.40);
  color: #D4AF37;
  background: rgba(212,175,55,0.04);
}
.ns-add-item-btn svg { width: 12px; height: 12px; }

/* ── Totals Strip ── */
.ns-totals {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(212,175,55,0.07);
}
.ns-total-box {
  background: rgba(235,229,216,0.02);
  border: 1px solid rgba(212,175,55,0.08);
  padding: 14px 16px;
}
.ns-total-label {
  font-family: var(--font-main);
  font-size: 8px;
  font-weight: 400;
  letter-spacing: 0.38em;
  text-transform: uppercase;
  color: rgba(212,175,55,0.40);
  margin-bottom: 8px;
  display: block;
}
.ns-total-value {
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 300;
  color: #EDE7D8;
}
.ns-total-value em { font-style: italic; color: #D4AF37; }
.ns-total-value--discount { color: rgba(74,222,128,0.75); }
.ns-total-box--grand { border-color: rgba(212,175,55,0.18); }
.ns-total-box--grand .ns-total-value { font-size: 26px; }

/* ── Primary Button ── */
.ns-btn-primary {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #D4AF37;
  color: #0a0806;
  border: none;
  font-family: var(--font-main);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  height: 44px;
  padding: 0 32px;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
}
.ns-btn-primary:hover {
  background: #E8D48B;
  box-shadow: 0 6px 24px rgba(212,175,55,0.28);
}
.ns-btn-primary::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  transform: skewX(-20deg);
  transition: left 0.5s;
}
.ns-btn-primary:hover::before { left: 160%; }
.ns-btn-primary:disabled { opacity: 0.40; cursor: not-allowed; }
.ns-btn-primary:disabled::before { display: none; }

/* ── Footer actions ── */
.ns-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 8px;
}
.ns-footer-note {
  font-family: var(--font-main);
  font-size: 9px;
  font-weight: 300;
  letter-spacing: 0.10em;
  color: rgba(235,229,216,0.22);
}

/* ── Loading search ── */
.ns-search-loading {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border: 1px solid rgba(212,175,55,0.15);
  border-top-color: rgba(212,175,55,0.55);
  border-radius: 50%;
  animation: ns-spin 0.8s linear infinite;
}
@keyframes ns-spin { to { transform: translateY(-50%) rotate(360deg); } }
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
      <div className="ns-page">

        {/* Alerts */}
        {error && (
          <div className="ns-alert ns-alert--error">
            <AlertCircle />
            <span>{error}</span>
            <button className="ns-alert-close" onClick={() => setError('')}>×</button>
          </div>
        )}
        {success && (
          <div className="ns-alert ns-alert--success">
            <CheckCircle size={14} />
            <span>{success}</span>
            <button className="ns-alert-close" onClick={() => setSuccess('')}>×</button>
          </div>
        )}

        {/* Page Header */}
        <div className="ns-header">
          <div>
            <div className="ns-eyebrow">
              <span className="ns-eyebrow-line" />
              <span className="ns-eyebrow-tag">Point of Sale</span>
            </div>
            <h1 className="ns-page-title">Record <em>Sale</em></h1>
            <p className="ns-page-subtitle">New in-store or boutique transaction</p>
          </div>
        </div>

        {/* Customer Details */}
        <div className="ns-card">
          <div className="ns-card-header">
            <div className="ns-card-header-left">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              <h2 className="ns-card-title">Customer <em>Details</em></h2>
            </div>
          </div>
          <div className="ns-card-body">
            <div className="ns-form-grid">

              <div className="ns-field">
                <label className="ns-label">Full Name</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="ns-input"
                  placeholder="e.g. Priya Mehta"
                />
              </div>

              <div className="ns-field">
                <label className="ns-label">Phone Number</label>
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="ns-input"
                  placeholder="e.g. +44 7700 900123"
                />
              </div>

              <div className="ns-field">
                <label className="ns-label">Email Address</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="ns-input"
                  placeholder="e.g. priya@example.com"
                />
              </div>

              <div className="ns-field ns-form-grid--full">
                <label className="ns-label">Billing / Delivery Address</label>
                <textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="ns-textarea"
                  rows={3}
                  placeholder="Full address including postcode and country…"
                />
              </div>

            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="ns-card">
          <div className="ns-card-header">
            <div className="ns-card-header-left">
              <Package size={14} />
              <h2 className="ns-card-title">Line <em>Items</em></h2>
            </div>
          </div>
          <div className="ns-card-body">

            <div className="ns-items-list">
              {items.map((it, idx) => (
                <div key={idx} className="ns-item-row" onClick={(e) => e.stopPropagation()}>
                  <span className="ns-item-num">Item {idx + 1}</span>

                  {/* Product Image Upload */}
                  <div className="ns-item-img-box" onClick={() => document.getElementById(`it_img_${idx}`)?.click()}>
                    {it.productImage ? (
                      <img src={it.productImage} className="ns-item-img-preview" alt="" />
                    ) : (
                      <ImageIcon className="ns-item-img-icon" />
                    )}
                    <div className="ns-item-img-upload-overlay">
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

                  {/* Product ID */}
                  <div className="ns-field" style={{ marginTop: '16px' }}>
                    <label className="ns-item-label">Product ID</label>
                    <input
                      value={it.productId || ''}
                      onChange={(e) => updateItem(idx, { productId: e.target.value })}
                      className="ns-input"
                      placeholder="UUID (optional)"
                      style={{ fontFamily: "'Courier New', monospace", fontSize: '10px' }}
                    />
                  </div>

                  {/* Product Name + Autocomplete */}
                  <div className="ns-field ns-autocomplete-wrap" style={{ marginTop: '16px' }}>
                    <label className="ns-item-label">Product Name</label>
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
                        className="ns-input"
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

                  {/* Qty */}
                  <div className="ns-field" style={{ marginTop: '16px' }}>
                    <label className="ns-item-label">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                      className="ns-input"
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="ns-field" style={{ marginTop: '16px' }}>
                    <label className="ns-item-label">Unit Price (₹)</label>
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={it.unitPrice}
                      onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                      className="ns-input"
                    />
                  </div>

                  {/* Discount */}
                  <div className="ns-field" style={{ marginTop: '16px' }}>
                    <label className="ns-item-label">Discount (₹)</label>
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={it.discount}
                      onChange={(e) => updateItem(idx, { discount: Number(e.target.value) })}
                      className="ns-input"
                    />
                  </div>

                  {/* Remove */}
                  <button
                    className="ns-remove-btn"
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    title="Remove item"
                    style={{ marginTop: '16px' }}
                  >
                    <Trash2 />
                  </button>

                </div>
              ))}
            </div>

            <button className="ns-add-item-btn" onClick={addItem}>
              <Plus />
              Add Line Item
            </button>

            {/* Totals */}
            <div className="ns-totals">
              <div className="ns-total-box">
                <span className="ns-total-label">Subtotal</span>
                <div className="ns-total-value"><em>₹</em>{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
              <div className="ns-total-box">
                <span className="ns-total-label">Discount</span>
                <div className="ns-total-value ns-total-value--discount">−₹{discountTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
              <div className="ns-total-box ns-total-box--grand">
                <span className="ns-total-label">Total Payable</span>
                <div className="ns-total-value"><em>₹</em>{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
            </div>

          </div>
        </div>

        {/* Notes */}
        <div className="ns-card">
          <div className="ns-card-header">
            <div className="ns-card-header-left">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
              <h2 className="ns-card-title">Internal <em>Notes</em></h2>
            </div>
          </div>
          <div className="ns-card-body">
            <div className="ns-field">
              <label className="ns-label">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="ns-textarea"
                rows={4}
                placeholder="Payment method, special requests, gift wrapping, engraving details…"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="ns-footer">
          <button
            className="ns-btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Recording Sale…' : 'Record Sale'}
          </button>
          <span className="ns-footer-note">Transaction will be saved and assigned a unique sale ID</span>
        </div>

      </div>
    </>
  )
}
