'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle } from 'lucide-react'

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
  gross_weight?: number | null
  net_weight?: number | null
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

  const inputCls = 'w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent text-sm'
  const labelCls = 'text-sm text-foreground/70'

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-primary">New Ledger Entry</h1>
        <p className="text-foreground/70 mt-2">Fill details. Totals calculate automatically.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
          <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Customer Name</label>
            <input className={inputCls} type="text" onChange={(e) => set('customer_name', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Bill No</label>
            <input className={inputCls} type="text" onChange={(e) => set('bill_no', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Bill Date</label>
            <input className={labelCls.includes('') ? inputCls : inputCls} type="date" onChange={(e) => set('bill_date', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>SR No</label>
            <input className={inputCls} type="number" onChange={(e) => set('sr_no', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Design No</label>
            <input className={inputCls} type="text" onChange={(e) => set('design_no', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>CPM</label>
            <input className={inputCls} type="number" step="0.01" onChange={(e) => set('cpm', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Percentage</label>
            <input className={inputCls} type="number" step="0.01" onChange={(e) => set('percentage', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Design Name</label>
            <input className={inputCls} type="text" onChange={(e) => set('design_name', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Item Photo URL</label>
            <input className={inputCls} type="text" onChange={(e) => set('item_photo', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Upload Item Photo</label>
            <input className={inputCls} type="file" accept="image/*" onChange={(e) => handlePhotoFileUpload(e.target.files?.[0] || null)} />
            {form.item_photo ? (
              <div style={{ marginTop: 8, border: '1px solid var(--border)', borderRadius: 6, padding: 6 }}>
                <img src={form.item_photo} alt="" style={{ width: 96, height: 96, objectFit: 'contain' }} />
              </div>
            ) : null}
          </div>
          <div>
            <label className={labelCls}>Gold KT</label>
            <input className={inputCls} type="number" step="0.1" onChange={(e) => set('gold_kt', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Metal Type</label>
            <input className={inputCls} type="text" onChange={(e) => set('metal_type', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Gross Weight</label>
            <input className={inputCls} type="number" step="0.001" onChange={(e) => set('gross_weight', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Net Weight</label>
            <input className={inputCls} type="number" step="0.001" onChange={(e) => set('net_weight', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Wastage</label>
            <input className={inputCls} type="number" step="0.001" onChange={(e) => set('wastage', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Touch (Purity %)</label>
            <input className={inputCls} type="number" step="0.01" onChange={(e) => set('touch_purity', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Fine Weight (auto)</label>
            <input className={inputCls} type="number" value={Number.isFinite(fineWeight) ? fineWeight : 0} readOnly />
          </div>
          <div>
            <label className={labelCls}>Diamond Pcs</label>
            <input className={inputCls} type="number" onChange={(e) => set('diamond_pcs', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Diamond Weight</label>
            <input className={inputCls} type="number" step="0.001" onChange={(e) => set('diamond_weight', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Solitaire Diamond (pcs)</label>
            <input className={inputCls} type="number" onChange={(e) => set('solitaire_diamond_pcs', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Solitaire Diamond (wt)</label>
            <input className={inputCls} type="number" step="0.001" onChange={(e) => set('solitaire_diamond_wt', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Loose Diamond (pcs)</label>
            <input className={inputCls} type="number" onChange={(e) => set('loose_diamond_pcs', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Loose Diamond (wt)</label>
            <input className={inputCls} type="number" step="0.001" onChange={(e) => set('loose_diamond_wt', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Labour</label>
            <input className={inputCls} type="number" step="0.01" onChange={(e) => set('labour', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Metal Rate</label>
            <input className={inputCls} type="number" step="0.01" onChange={(e) => set('metal_rate', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Labour Rate</label>
            <input className={inputCls} type="number" step="0.01" onChange={(e) => set('labour_rate', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Diamond Labour Amount</label>
            <input className={inputCls} type="number" step="0.01" onChange={(e) => set('diamond_labour_amount', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Metal Labour Amount</label>
            <input className={inputCls} type="number" step="0.01" onChange={(e) => set('metal_labour_amount', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Due Amount</label>
            <input className={inputCls} type="number" step="0.01" onChange={(e) => set('due_amount', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Credit Amount</label>
            <input className={inputCls} type="number" step="0.01" onChange={(e) => set('credit_amount', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Credit Metal Date</label>
            <input className={inputCls} type="date" onChange={(e) => set('credit_metal_date', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Mat Debit (Metal)</label>
            <input className={inputCls} type="text" onChange={(e) => set('mat_debit_metal', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Mat Debit (Price)</label>
            <input className={inputCls} type="number" step="0.01" onChange={(e) => set('mat_debit_price', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>Mat Credit (Metal)</label>
            <input className={inputCls} type="text" onChange={(e) => set('mat_credit_metal', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Mat Credit (Price)</label>
            <input className={inputCls} type="number" step="0.01" onChange={(e) => set('mat_credit_price', Number(e.target.value))} />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="font-serif text-xl font-bold text-primary mb-3">Price Section</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Metal Price (auto)</label>
              <input className={inputCls} type="number" value={metalPrice} readOnly />
            </div>
            <div>
              <label className={labelCls}>Labour Charge (auto)</label>
              <input className={inputCls} type="number" value={labourCharge} readOnly />
            </div>
            <div>
              <label className={labelCls}>Diamond Price</label>
              <input className={inputCls} type="number" step="0.01" onChange={(e) => set('diamond_price', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelCls}>Total Payable (auto)</label>
              <input className={inputCls} type="number" value={totalPayable} readOnly />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {submitting ? 'Saving…' : 'Save Entry'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/admin/reports/ledger')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
