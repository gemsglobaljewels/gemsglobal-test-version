'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'

type Form = {
  sr_no?: number | null
  design_no?: string
  cpm?: number | null
  percentage?: number | null
  customer_name?: string
  design_name?: string
  item_photo?: string
  gold_kt?: number | null
  metal_type?: string
  gross_weight?: number | string | null
  net_weight?: number | string | null
  wastage?: number | null
  touch_purity?: number | null
  diamond_pcs?: number | null
  diamond_weight?: number | null
  labour?: number | null
  metal_rate?: number | null
  labour_rate?: number | null
  diamond_price?: number | null
  due_amount?: number | null
  credit_amount?: number | null
  mat_debit_metal?: string
  mat_debit_price?: number | null
  mat_credit_metal?: string
  mat_credit_price?: number | null
  bill_no?: string
  bill_date?: string
  solitaire_diamond_pcs?: number | null
  solitaire_diamond_wt?: number | null
  loose_diamond_pcs?: number | null
  loose_diamond_wt?: number | null
  diamond_labour_amount?: number | null
  metal_labour_amount?: number | null
  credit_metal_date?: string
}

export default function AdminLedgerNewPage() {
  const router = useRouter()
  const [form, setForm] = useState<Form>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handlePhotoFileUpload(file: File | null) {
    if (!file) return
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/storage/upload-product-image', { method: 'POST', body: fd })
      const j = await r.json()
      if (r.ok && j?.url) {
        setForm((prev) => ({ ...prev, item_photo: j.url }))
      } else {
        setError(j?.error || 'Photo upload failed')
      }
    } catch {
      setError('Photo upload failed')
    }
  }

  const num = (v: any) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }
  const net = num(form.net_weight)
  const purity = num(form.touch_purity)
  const wastage = num(form.wastage)
  const fineWeight = Math.round((net * (purity / 100)) * 1000) / 1000
  const metalPrice = Math.round(((fineWeight + wastage) * num(form.metal_rate)) * 100) / 100
  const labourCharge = Math.round((num(form.labour) * num(form.labour_rate)) * 100) / 100
  const diamondPrice = num(form.diamond_price)
  const totalPayable = Math.round((metalPrice + labourCharge + diamondPrice) * 100) / 100

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError('')
      setSuccess('')
      const res = await fetch('/api/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          fine_weight: fineWeight,
          metal_price: metalPrice,
          labour_charge: labourCharge,
          total_payable: totalPayable,
          final_amount: totalPayable,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Failed to create entry')
        return
      }
      setSuccess('Entry created')
      router.push('/admin/reports/ledger')
    } catch {
      setError('Failed to create entry')
    } finally {
      setSubmitting(false)
    }
  }

  function set<K extends keyof Form>(k: K, v: any) {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  return (
    <div className="a-page">
      <button type="button" className="a-back" onClick={() => router.push('/admin/reports/ledger')}>
        <ArrowLeft size={15} />
        Back to Ledger
      </button>

      <div className="a-head">
        <div>
          <div className="a-eyebrow">Reports / Ledger</div>
          <h1 className="a-title">New Ledger <em>Entry</em></h1>
          <p className="a-subtitle">Fill in the details below. Totals calculate automatically.</p>
        </div>
        <div className="a-head-actions">
          <button
            type="button"
            className="a-btn a-btn--ghost"
            onClick={() => router.push('/admin/reports/ledger')}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="ledger-new-form"
            disabled={submitting}
            className="a-btn a-btn--primary"
          >
            {submitting ? 'Saving…' : 'Save Entry'}
          </button>
        </div>
      </div>

      {error && (
        <div className="a-card" style={{ marginBottom: 16, borderColor: 'var(--c-danger)' }}>
          <div className="a-card-body" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', color: 'var(--c-danger)' }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontFamily: 'var(--font-dmsans)', fontSize: 14 }}>{error}</p>
          </div>
        </div>
      )}
      {success && (
        <div className="a-card" style={{ marginBottom: 16, borderColor: 'var(--c-success)' }}>
          <div className="a-card-body" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', color: 'var(--c-success)' }}>
            <CheckCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontFamily: 'var(--font-dmsans)', fontSize: 14 }}>{success}</p>
          </div>
        </div>
      )}

      <form id="ledger-new-form" onSubmit={onSubmit} className="a-stack">
        <div className="a-card">
          <div className="a-card-head">
            <h3 className="a-card-title">Entry <em>Details</em></h3>
            <p className="a-card-sub">Customer, billing and design information.</p>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid a-form-grid--3">
              <div className="a-field">
                <label className="a-label">Customer Name</label>
                <input className="a-input" type="text" onChange={(e) => set('customer_name', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">Bill No</label>
                <input className="a-input" type="text" onChange={(e) => set('bill_no', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">Bill Date</label>
                <input className="a-input" type="date" onChange={(e) => set('bill_date', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">SR No</label>
                <input className="a-input" type="number" onChange={(e) => set('sr_no', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Design No</label>
                <input className="a-input" type="text" onChange={(e) => set('design_no', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">CPM</label>
                <input className="a-input" type="number" step="0.01" onChange={(e) => set('cpm', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Percentage</label>
                <input className="a-input" type="number" step="0.01" onChange={(e) => set('percentage', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Design Name</label>
                <input className="a-input" type="text" onChange={(e) => set('design_name', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">Item Photo URL</label>
                <input className="a-input" type="text" onChange={(e) => set('item_photo', e.target.value)} />
              </div>
              <div className="a-field a-col-span-2">
                <label className="a-label">Upload Item Photo</label>
                <input className="a-input" type="file" accept="image/*" onChange={(e) => handlePhotoFileUpload(e.target.files?.[0] || null)} />
                {form.item_photo ? (
                  <div style={{ marginTop: 10, border: '1px solid var(--c-border)', borderRadius: 'var(--radius)', padding: 8, background: 'var(--c-surface)', width: 'fit-content' }}>
                    <img src={form.item_photo} alt="" style={{ width: 96, height: 96, objectFit: 'contain', display: 'block' }} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="a-card">
          <div className="a-card-head">
            <h3 className="a-card-title">Metal &amp; <em>Weight</em></h3>
            <p className="a-card-sub">Fine weight is computed from net weight and touch.</p>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid a-form-grid--3">
              <div className="a-field">
                <label className="a-label">Gold KT</label>
                <input className="a-input" type="number" step="0.1" onChange={(e) => set('gold_kt', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Metal Type</label>
                <input className="a-input" type="text" onChange={(e) => set('metal_type', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">Gross Weight</label>
                <input className="a-input" type="text" onChange={(e) => set('gross_weight', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">Net Weight</label>
                <input className="a-input" type="text" onChange={(e) => set('net_weight', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">Wastage</label>
                <input className="a-input" type="number" step="0.001" onChange={(e) => set('wastage', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Touch (Purity %)</label>
                <input className="a-input" type="number" step="0.01" onChange={(e) => set('touch_purity', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Fine Weight (auto)</label>
                <input className="a-input" type="number" value={Number.isFinite(fineWeight) ? fineWeight : 0} readOnly />
                <span className="a-hint">Calculated automatically</span>
              </div>
            </div>
          </div>
        </div>

        <div className="a-card">
          <div className="a-card-head">
            <h3 className="a-card-title">Diamond <em>Details</em></h3>
            <p className="a-card-sub">Diamond, solitaire and loose stone counts and weights.</p>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid a-form-grid--3">
              <div className="a-field">
                <label className="a-label">Diamond Pcs</label>
                <input className="a-input" type="number" onChange={(e) => set('diamond_pcs', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Diamond Weight</label>
                <input className="a-input" type="number" step="0.001" onChange={(e) => set('diamond_weight', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Solitaire Diamond (pcs)</label>
                <input className="a-input" type="number" onChange={(e) => set('solitaire_diamond_pcs', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Solitaire Diamond (wt)</label>
                <input className="a-input" type="number" step="0.001" onChange={(e) => set('solitaire_diamond_wt', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Loose Diamond (pcs)</label>
                <input className="a-input" type="number" onChange={(e) => set('loose_diamond_pcs', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Loose Diamond (wt)</label>
                <input className="a-input" type="number" step="0.001" onChange={(e) => set('loose_diamond_wt', Number(e.target.value))} />
              </div>
            </div>
          </div>
        </div>

        <div className="a-card">
          <div className="a-card-head">
            <h3 className="a-card-title">Labour &amp; <em>Rates</em></h3>
            <p className="a-card-sub">Labour, metal and diamond rate inputs.</p>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid a-form-grid--3">
              <div className="a-field">
                <label className="a-label">Labour</label>
                <input className="a-input" type="number" step="0.01" onChange={(e) => set('labour', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Metal Rate</label>
                <input className="a-input" type="number" step="0.01" onChange={(e) => set('metal_rate', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Labour Rate</label>
                <input className="a-input" type="number" step="0.01" onChange={(e) => set('labour_rate', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Diamond Labour Amount</label>
                <input className="a-input" type="number" step="0.01" onChange={(e) => set('diamond_labour_amount', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Metal Labour Amount</label>
                <input className="a-input" type="number" step="0.01" onChange={(e) => set('metal_labour_amount', Number(e.target.value))} />
              </div>
            </div>
          </div>
        </div>

        <div className="a-card">
          <div className="a-card-head">
            <h3 className="a-card-title">Credit &amp; <em>Material</em></h3>
            <p className="a-card-sub">Dues, credits and material debit / credit details.</p>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid a-form-grid--3">
              <div className="a-field">
                <label className="a-label">Due Amount</label>
                <input className="a-input" type="number" step="0.01" onChange={(e) => set('due_amount', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Credit Amount</label>
                <input className="a-input" type="number" step="0.01" onChange={(e) => set('credit_amount', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Credit Metal Date</label>
                <input className="a-input" type="date" onChange={(e) => set('credit_metal_date', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">Mat Debit (Metal)</label>
                <input className="a-input" type="text" onChange={(e) => set('mat_debit_metal', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">Mat Debit (Price)</label>
                <input className="a-input" type="number" step="0.01" onChange={(e) => set('mat_debit_price', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Mat Credit (Metal)</label>
                <input className="a-input" type="text" onChange={(e) => set('mat_credit_metal', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">Mat Credit (Price)</label>
                <input className="a-input" type="number" step="0.01" onChange={(e) => set('mat_credit_price', Number(e.target.value))} />
              </div>
            </div>
          </div>
        </div>

        <div className="a-card">
          <div className="a-card-head">
            <h3 className="a-card-title">Price <em>Section</em></h3>
            <p className="a-card-sub">Metal price, labour charge and total payable are calculated.</p>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid a-form-grid--3">
              <div className="a-field">
                <label className="a-label">Metal Price (auto)</label>
                <input className="a-input" type="number" value={metalPrice} readOnly />
                <span className="a-hint">Calculated automatically</span>
              </div>
              <div className="a-field">
                <label className="a-label">Labour Charge (auto)</label>
                <input className="a-input" type="number" value={labourCharge} readOnly />
                <span className="a-hint">Calculated automatically</span>
              </div>
              <div className="a-field">
                <label className="a-label">Diamond Price</label>
                <input className="a-input" type="number" step="0.01" onChange={(e) => set('diamond_price', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Total Payable (auto)</label>
                <input className="a-input" type="number" value={totalPayable} readOnly />
                <span className="a-hint">Calculated automatically</span>
              </div>
            </div>
          </div>
          <div className="a-card-foot">
            <button
              type="button"
              className="a-btn a-btn--ghost"
              onClick={() => router.push('/admin/reports/ledger')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="a-btn a-btn--primary"
            >
              {submitting ? 'Saving…' : 'Save Entry'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
