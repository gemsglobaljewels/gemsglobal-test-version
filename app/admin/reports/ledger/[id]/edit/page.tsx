'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
  fine_weight?: number | null
  diamond_pcs?: number | null
  diamond_weight?: number | null
  labour?: number | null
  metal_rate?: number | null
  labour_rate?: number | null
  metal_price?: number | null
  labour_charge?: number | null
  diamond_price?: number | null
  total_payable?: number | null
  final_amount?: number | null
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

export default function AdminLedgerEditPage() {
  const params = useParams() as Record<string, string | string[] | undefined>
  const rawId = params?.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  const router = useRouter()
  const [form, setForm] = useState<Form>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
        // persist immediately
        try {
          await fetch(`/api/ledger/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_photo: j.url })
          })
        } catch { }
      } else {
        setError(j?.error || 'Photo upload failed')
      }
    } catch {
      setError('Photo upload failed')
    }
  }

  useEffect(() => {
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!id || id === 'undefined' || !uuidRe.test(String(id))) {
      setError('Invalid ledger id')
      setLoading(false)
      return
    }
    ; (async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/ledger/${id}`)
        const data = await res.json()
        if (!res.ok) {
          setError(data?.error || 'Failed to load entry')
        } else {
          setForm(data || {})
          setError('')
        }
      } catch {
        setError('Failed to load entry')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

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
      setSaving(true)
      setError('')
      setSuccess('')
      const res = await fetch(`/api/ledger/${id}`, {
        method: 'PUT',
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
        setError(data?.error || 'Failed to save entry')
        return
      }
      setSuccess('Entry updated')
      router.push('/admin/reports/ledger')
    } catch {
      setError('Failed to save entry')
    } finally {
      setSaving(false)
    }
  }

  function set<K extends keyof Form>(k: K, v: any) {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  if (loading) return (
    <div className="a-page">
      <div className="a-loader-row">
        <span className="a-loader" />
        <span className="a-loader-label">Loading entry…</span>
      </div>
    </div>
  )

  return (
    <div className="a-page">
      <button type="button" className="a-back" onClick={() => router.push('/admin/reports/ledger')}>
        <ArrowLeft size={15} />
        Back to ledger
      </button>

      <div className="a-head">
        <div>
          <div className="a-eyebrow">Ledger</div>
          <h1 className="a-title">Edit <em>Entry</em></h1>
          <p className="a-subtitle">Update the details of this ledger record.</p>
        </div>
        <div className="a-head-actions">
          <Button type="button" className="a-btn a-btn--ghost" onClick={() => router.push('/admin/reports/ledger')}>
            Cancel
          </Button>
          <Button type="submit" form="ledger-edit-form" disabled={saving} className="a-btn a-btn--primary">
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="a-badge a-badge--danger" role="alert" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: 20, width: '100%' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="a-badge a-badge--success" role="status" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: 20, width: '100%' }}>
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      <form id="ledger-edit-form" onSubmit={onSubmit} className="a-stack">
        <div className="a-card">
          <div className="a-card-head">
            <h3 className="a-card-title">Entry <em>Details</em></h3>
            <p className="a-card-sub">Customer, billing and item identification.</p>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid a-form-grid--3">
              <div className="a-field">
                <label className="a-label">Customer Name</label>
                <input className="a-input" type="text" value={(form as any).customer_name || ''} onChange={(e) => set('customer_name', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">Bill No</label>
                <input className="a-input" type="text" value={(form as any).bill_no || ''} onChange={(e) => set('bill_no', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">Bill Date</label>
                <input className="a-input" type="date" value={(form as any).bill_date || ''} onChange={(e) => set('bill_date', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">SR No</label>
                <input className="a-input" type="number" value={form.sr_no ?? ''} onChange={(e) => set('sr_no', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Design No</label>
                <input className="a-input" type="text" value={form.design_no || ''} onChange={(e) => set('design_no', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">Design Name</label>
                <input className="a-input" type="text" value={form.design_name || ''} onChange={(e) => set('design_name', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">CPM</label>
                <input className="a-input" type="number" step="0.01" value={form.cpm ?? ''} onChange={(e) => set('cpm', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Percentage</label>
                <input className="a-input" type="number" step="0.01" value={form.percentage ?? ''} onChange={(e) => set('percentage', Number(e.target.value))} />
              </div>
            </div>
          </div>
        </div>

        <div className="a-card">
          <div className="a-card-head">
            <h3 className="a-card-title">Item <em>Photo</em></h3>
            <p className="a-card-sub">Provide an image URL or upload a new photo.</p>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid">
              <div className="a-field">
                <label className="a-label">Item Photo URL</label>
                <input className="a-input" type="text" value={form.item_photo || ''} onChange={(e) => set('item_photo', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">Upload Item Photo</label>
                <input className="a-input" type="file" accept="image/*" onChange={(e) => handlePhotoFileUpload(e.target.files?.[0] || null)} />
              </div>
              {form.item_photo ? (
                <div className="a-field a-col-span-2">
                  <div className="a-media" style={{ width: 112, height: 112, padding: 8 }}>
                    <img src={form.item_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="a-card">
          <div className="a-card-head">
            <h3 className="a-card-title">Metal &amp; <em>Weight</em></h3>
            <p className="a-card-sub">Metal type, weights, purity and wastage.</p>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid a-form-grid--3">
              <div className="a-field">
                <label className="a-label">Gold KT</label>
                <input className="a-input" type="number" step="0.1" value={form.gold_kt ?? ''} onChange={(e) => set('gold_kt', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Metal Type</label>
                <input className="a-input" type="text" value={form.metal_type || ''} onChange={(e) => set('metal_type', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">Gross Weight</label>
                <input className="a-input" type="text" value={form.gross_weight ?? ''} onChange={(e) => set('gross_weight', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">Net Weight</label>
                <input className="a-input" type="text" value={form.net_weight ?? ''} onChange={(e) => set('net_weight', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">Wastage</label>
                <input className="a-input" type="number" step="0.001" value={form.wastage ?? ''} onChange={(e) => set('wastage', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Touch (Purity %)</label>
                <input className="a-input" type="number" step="0.01" value={form.touch_purity ?? ''} onChange={(e) => set('touch_purity', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Fine Weight (auto)</label>
                <input className="a-input" type="number" value={fineWeight} readOnly />
                <span className="a-hint">Calculated automatically</span>
              </div>
            </div>
          </div>
        </div>

        <div className="a-card">
          <div className="a-card-head">
            <h3 className="a-card-title">Diamond <em>Details</em></h3>
            <p className="a-card-sub">Diamond pieces and weights.</p>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid a-form-grid--3">
              <div className="a-field">
                <label className="a-label">Diamond Pcs</label>
                <input className="a-input" type="number" value={form.diamond_pcs ?? ''} onChange={(e) => set('diamond_pcs', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Diamond Weight</label>
                <input className="a-input" type="number" step="0.001" value={form.diamond_weight ?? ''} onChange={(e) => set('diamond_weight', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Solitaire Diamond (pcs)</label>
                <input className="a-input" type="number" value={(form as any).solitaire_diamond_pcs ?? ''} onChange={(e) => set('solitaire_diamond_pcs', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Solitaire Diamond (wt)</label>
                <input className="a-input" type="number" step="0.001" value={(form as any).solitaire_diamond_wt ?? ''} onChange={(e) => set('solitaire_diamond_wt', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Loose Diamond (pcs)</label>
                <input className="a-input" type="number" value={(form as any).loose_diamond_pcs ?? ''} onChange={(e) => set('loose_diamond_pcs', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Loose Diamond (wt)</label>
                <input className="a-input" type="number" step="0.001" value={(form as any).loose_diamond_wt ?? ''} onChange={(e) => set('loose_diamond_wt', Number(e.target.value))} />
              </div>
            </div>
          </div>
        </div>

        <div className="a-card">
          <div className="a-card-head">
            <h3 className="a-card-title">Labour &amp; <em>Rates</em></h3>
            <p className="a-card-sub">Labour values and applicable rates.</p>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid a-form-grid--3">
              <div className="a-field">
                <label className="a-label">Labour</label>
                <input className="a-input" type="number" step="0.01" value={form.labour ?? ''} onChange={(e) => set('labour', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Metal Rate</label>
                <input className="a-input" type="number" step="0.01" value={form.metal_rate ?? ''} onChange={(e) => set('metal_rate', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Labour Rate</label>
                <input className="a-input" type="number" step="0.01" value={form.labour_rate ?? ''} onChange={(e) => set('labour_rate', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Diamond Labour Amount</label>
                <input className="a-input" type="number" step="0.01" value={(form as any).diamond_labour_amount ?? ''} onChange={(e) => set('diamond_labour_amount', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Metal Labour Amount</label>
                <input className="a-input" type="number" step="0.01" value={(form as any).metal_labour_amount ?? ''} onChange={(e) => set('metal_labour_amount', Number(e.target.value))} />
              </div>
            </div>
          </div>
        </div>

        <div className="a-card">
          <div className="a-card-head">
            <h3 className="a-card-title">Credit &amp; <em>Material</em></h3>
            <p className="a-card-sub">Dues, credits and material debit/credit details.</p>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid a-form-grid--3">
              <div className="a-field">
                <label className="a-label">Due Amount</label>
                <input className="a-input" type="number" step="0.01" value={form.due_amount ?? ''} onChange={(e) => set('due_amount', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Credit Amount</label>
                <input className="a-input" type="number" step="0.01" value={form.credit_amount ?? ''} onChange={(e) => set('credit_amount', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Credit Metal Date</label>
                <input className="a-input" type="date" value={(form as any).credit_metal_date || ''} onChange={(e) => set('credit_metal_date', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">Mat Debit (Metal)</label>
                <input className="a-input" type="text" value={form.mat_debit_metal || ''} onChange={(e) => set('mat_debit_metal', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">Mat Debit (Price)</label>
                <input className="a-input" type="number" step="0.01" value={form.mat_debit_price ?? ''} onChange={(e) => set('mat_debit_price', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Mat Credit (Metal)</label>
                <input className="a-input" type="text" value={form.mat_credit_metal || ''} onChange={(e) => set('mat_credit_metal', e.target.value)} />
              </div>
              <div className="a-field">
                <label className="a-label">Mat Credit (Price)</label>
                <input className="a-input" type="number" step="0.01" value={form.mat_credit_price ?? ''} onChange={(e) => set('mat_credit_price', Number(e.target.value))} />
              </div>
            </div>
          </div>
        </div>

        <div className="a-card">
          <div className="a-card-head">
            <h3 className="a-card-title">Price <em>Section</em></h3>
            <p className="a-card-sub">Auto-calculated totals and diamond pricing.</p>
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
                <input className="a-input" type="number" step="0.01" value={form.diamond_price ?? ''} onChange={(e) => set('diamond_price', Number(e.target.value))} />
              </div>
              <div className="a-field">
                <label className="a-label">Total Payable (auto)</label>
                <input className="a-input" type="number" value={totalPayable} readOnly />
                <span className="a-hint">Calculated automatically</span>
              </div>
            </div>
          </div>
          <div className="a-card-foot">
            <Button type="button" className="a-btn a-btn--ghost" onClick={() => router.push('/admin/reports/ledger')}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="a-btn a-btn--primary">
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
