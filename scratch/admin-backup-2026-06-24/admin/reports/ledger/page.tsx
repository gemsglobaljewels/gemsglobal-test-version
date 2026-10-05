'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Search, AlertCircle, Pencil, Trash2 } from 'lucide-react'

type LedgerRow = {
  id: string
  design_name?: string | null
  item_photo?: string | null
  metal_type?: string | null
  gross_weight?: number | null
  net_weight?: number | null
  fine_weight?: number | null
  diamond_weight?: number | null
  metal_rate?: number | null
  labour?: number | null
  labour_rate?: number | null
  diamond_price?: number | null
  total_payable?: number | null
  final_amount?: number | null
  created_at?: string
}

export default function AdminLedgerPage() {
  const [rows, setRows] = useState<LedgerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  function getRowId(r: any): string {
    const id = (r?.id ?? (r as any)?.ID ?? (r as any)?.Id ?? (r as any)?.entry_id) as any
    return typeof id === 'string' ? id.trim() : ''
  }

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await fetch('/api/ledger')
      const data = await res.json()
      setRows(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load ledger entries')
    } finally {
      setLoading(false)
    }
  }

  async function onDelete(idRaw?: string) {
    const id = String(idRaw || '').trim()
    if (!confirm('Delete this ledger entry?')) return
    try {
      if (!id || id === 'undefined') {
        setError('Missing ledger id')
        return
      }
      const res = await fetch(`/api/ledger/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const msg = (await res.json().catch(() => ({})))?.error || 'Delete failed'
        setError(msg)
        return
      }
      setRows(prev => prev.filter(r => r.id !== id))
    } catch {
      setError('Delete failed')
    }
  }

  const filtered = rows.filter((r) => {
    const q = searchQuery.toLowerCase()
    return (
      String(r.design_name || '').toLowerCase().includes(q) ||
      String(r.metal_type || '').toLowerCase().includes(q)
    )
  })

  const fmt2 = (n?: number | null) => (Number.isFinite(Number(n)) ? Number(n).toFixed(2) : '—')
  const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0)
  const sumBy = (arr: any[], key: string) => arr.reduce((acc, r) => acc + num((r as any)[key]), 0)
  const sumTotal = sumBy(filtered, 'total_payable')
  const sumDue = sumBy(filtered, 'due_amount')
  const sumCredit = sumBy(filtered, 'credit_amount')
  const sumMatDebitPrice = sumBy(filtered, 'mat_debit_price')
  const sumMatCreditPrice = sumBy(filtered, 'mat_credit_price')
  const uniqueLabel = (arr: any[], key: string) => {
    const labels = arr
      .map((r) => String((r as any)[key] || '').trim())
      .filter(Boolean)
    const lower = new Set(labels.map((s) => s.toLowerCase()))
    if (!labels.length) return '—'
    if (lower.size === 1) return labels[0]
    return 'Mixed'
  }
  const matDebitMetal = uniqueLabel(filtered, 'mat_debit_metal')
  const matCreditMetal = uniqueLabel(filtered, 'mat_credit_metal')

  const thClass = "text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wide border-r border-border last:border-r-0 whitespace-nowrap"
  const tdClass = "px-3 py-2 text-xs border-r border-border last:border-r-0"

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-4">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-light text-primary tracking-tight">
            Inventory <em>Ledger</em>
          </h1>
          <p className="text-foreground/50 text-xs mt-1">Detailed costing and material tracking for all items</p>
        </div>
        <Link href="/admin/reports/ledger/new">
          <Button className="bg-primary hover:bg-primary/90 text-black rounded-full px-6 h-10 font-semibold text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20">
            <Plus size={16} className="mr-2" />
            New Entry
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-card/30 backdrop-blur-sm rounded-xl border border-white/5 p-1.5 mb-6 sticky top-4 z-10 shadow-2xl">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" />
          <input
            type="text"
            placeholder="Search by design name or metal type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-transparent border-none focus:ring-0 text-sm placeholder:text-foreground/30"
          />
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-card/20 rounded-xl border border-white/5 overflow-hidden shadow-xl mb-6">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className={thClass}>Date</th>
                <th className={thClass}>Bill No</th>
                <th className={thClass}>Design Name</th>
                <th className={thClass}>Design No</th>
                <th className={thClass}>Gold KT</th>
                <th className={thClass}>Gross Wt</th>
                <th className={thClass}>Touch</th>
                <th className={thClass}>Fine Wt</th>
                <th className={thClass}>Labour</th>
                <th className={thClass}>Total Price</th>
                <th className="text-right px-6 py-4 text-[9px] font-bold uppercase tracking-[0.2em] text-primary/60">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="text-[9px] uppercase tracking-[0.2em] text-foreground/30">Loading Ledger</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length ? (
                filtered.map((r, i) => (
                  <tr
                    key={r.id}
                    className="group hover:bg-white/[0.01] transition-colors"
                  >
                    <td className={tdClass}>{(r as any).bill_date ? new Date((r as any).bill_date).toLocaleDateString() : '—'}</td>
                    <td className={tdClass}>{(r as any).bill_no || '—'}</td>
                    <td className={tdClass}>
                      <div className="font-medium text-foreground">{r.design_name || '—'}</div>
                    </td>
                    <td className={tdClass}>{(r as any).design_no || '—'}</td>
                    <td className={tdClass}>{(r as any).gold_kt ?? '—'}</td>
                    <td className={tdClass}>{fmt2((r as any).gross_weight)}g</td>
                    <td className={tdClass}>{fmt2((r as any).touch_purity)}%</td>
                    <td className={tdClass}>{fmt2((r as any).fine_weight)}g</td>
                    <td className={tdClass}>{fmt2((r as any).metal_labour_amount)}</td>
                    <td className="px-6 py-3 text-xs font-bold text-primary">
                      ₹{fmt2((r as any).total_price ?? r.total_payable)}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={getRowId(r) ? `/admin/reports/ledger/${getRowId(r)}/invoice` : '#'}>
                          <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full hover:bg-primary hover:text-black">
                            <span className="text-[8px] font-bold">PDF</span>
                          </Button>
                        </Link>
                        <Link href={getRowId(r) ? `/admin/reports/ledger/${getRowId(r)}/edit` : '#'}>
                          <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full hover:bg-white/5">
                            <Pencil size={12} />
                          </Button>
                        </Link>
                        <Button
                          onClick={() => onDelete(getRowId(r))}
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 rounded-full hover:bg-red-500/10 hover:text-red-500"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-6 py-16 text-center text-foreground/30 text-xs">
                    No ledger entries match your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View (shown only on small screens) */}
      <div className="md:hidden grid grid-cols-1 gap-4 mb-6">
        {filtered.map((r) => (
          <div key={r.id} className="bg-card/20 rounded-xl border border-white/5 p-5 space-y-3 shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xs font-semibold text-foreground">{r.design_name || 'Untitled Entry'}</h3>
                <p className="text-[9px] text-foreground/40 mt-1 uppercase tracking-wider">Bill #{(r as any).bill_no || '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-primary">₹{fmt2((r as any).total_price ?? r.total_payable)}</p>
                <p className="text-[9px] text-foreground/40 mt-1">{(r as any).bill_date ? new Date((r as any).bill_date).toLocaleDateString() : '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/5">
              <div>
                <p className="text-[8px] uppercase tracking-widest text-foreground/30 mb-0.5">Metal Info</p>
                <p className="text-[11px] text-foreground/70">{(r as any).gold_kt ?? '—'} KT / {fmt2((r as any).touch_purity)}%</p>
              </div>
              <div>
                <p className="text-[8px] uppercase tracking-widest text-foreground/30 mb-0.5">Fine Weight</p>
                <p className="text-[11px] text-foreground/70">{fmt2((r as any).fine_weight)}g</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Link href={getRowId(r) ? `/admin/reports/ledger/${getRowId(r)}/invoice` : '#'}>
                <Button variant="outline" size="sm" className="rounded-full px-3 text-[9px] h-7 border-white/10">PDF</Button>
              </Link>
              <Link href={getRowId(r) ? `/admin/reports/ledger/${getRowId(r)}/edit` : '#'}>
                <Button variant="outline" size="sm" className="rounded-full px-3 text-[9px] h-7 border-white/10">Edit</Button>
              </Link>
              <Button
                onClick={() => onDelete(getRowId(r))}
                variant="outline"
                size="sm"
                className="rounded-full px-3 text-[9px] h-7 border-red-500/20 text-red-500/70"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Section */}
      {!!filtered.length && (
        <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-primary/10 overflow-hidden shadow-2xl">
          <div className="px-6 py-3 bg-primary/5 border-b border-primary/10 flex justify-between items-center">
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary">Financial Summary</span>
            <span className="text-[9px] text-foreground/40">{filtered.length} Records</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
            <div className="p-6 group hover:bg-white/[0.02] transition-colors">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/30 mb-2">Total Payable</p>
              <p className="text-2xl font-light text-primary tracking-tighter">₹{fmt2(sumTotal)}</p>
            </div>
            <div className="p-6 group hover:bg-white/[0.02] transition-colors">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/30 mb-2">Amount Due</p>
              <p className={`text-2xl font-light tracking-tighter ${sumDue > 0 ? 'text-red-400' : 'text-primary'}`}>₹{fmt2(sumDue)}</p>
            </div>
            <div className="p-6 group hover:bg-white/[0.02] transition-colors">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/30 mb-2">Total Credit</p>
              <p className={`text-2xl font-light tracking-tighter ${sumCredit > 0 ? 'text-green-400' : 'text-primary'}`}>₹{fmt2(sumCredit)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5 border-t border-white/5 bg-white/[0.01]">
            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/20">Material Debit</span>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-medium bg-white/5 px-2 py-0.5 rounded-full border border-white/5 text-foreground/50">{matDebitMetal}</span>
                <span className="text-xs font-semibold text-primary">₹{fmt2(sumMatDebitPrice)}</span>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/20">Material Credit</span>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-medium bg-white/5 px-2 py-0.5 rounded-full border border-white/5 text-foreground/50">{matCreditMetal}</span>
                <span className="text-xs font-semibold text-primary">₹{fmt2(sumMatCreditPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
