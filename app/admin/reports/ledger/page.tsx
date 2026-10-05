'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, AlertCircle, Pencil, Trash2, FileText, Download } from 'lucide-react'
import { downloadInvoicePDF } from '@/lib/invoice-pdf'

type LedgerRow = {
  id: string
  customer_name?: string | null
  bill_no?: string | null
  design_name?: string | null
  item_photo?: string | null
  metal_type?: string | null
  gross_weight?: number | string | null
  net_weight?: number | string | null
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
  const [downloadingId, setDownloadingId] = useState('')

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

  async function onDownload(idRaw?: string) {
    const id = String(idRaw || '').trim()
    if (!id || id === 'undefined') {
      setError('Missing ledger id')
      return
    }
    if (downloadingId) return
    try {
      setDownloadingId(id)
      // Fetch the full row so the invoice has every field (the list endpoint may be trimmed).
      const res = await fetch(`/api/ledger/${id}`)
      const full = await res.json()
      if (!res.ok) {
        setError(full?.error || 'Could not load the invoice data')
        return
      }
      await downloadInvoicePDF(full)
    } catch {
      setError('Could not generate the invoice PDF')
    } finally {
      setDownloadingId('')
    }
  }

  const filtered = rows.filter((r) => {
    const q = searchQuery.toLowerCase()
    return (
      String(r.customer_name || '').toLowerCase().includes(q) ||
      String(r.bill_no || '').toLowerCase().includes(q) ||
      String(r.design_name || '').toLowerCase().includes(q) ||
      String(r.metal_type || '').toLowerCase().includes(q)
    )
  })

  const fmt2 = (n?: number | null) => (Number.isFinite(Number(n)) ? Number(n).toFixed(2) : '—')
  // Gross weight may be numeric or free-form text: append "g" only when numeric.
  const fmtWeight = (v: any) => {
    if (v === null || v === undefined || String(v).trim() === '') return '—'
    return Number.isFinite(Number(v)) ? `${Number(v).toFixed(2)}g` : String(v)
  }
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

  return (
    <div className="a-page">
      {error && (
        <div className="a-card" style={{ marginBottom: 20, borderColor: 'var(--c-danger)', background: 'var(--c-danger-bg)' }}>
          <div className="a-card-body a-row" style={{ gap: 10, alignItems: 'flex-start' }}>
            <AlertCircle size={18} style={{ color: 'var(--c-danger)', flexShrink: 0, marginTop: 2 }} />
            <p style={{ color: 'var(--c-danger)', fontFamily: 'var(--font-dmsans)', fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="a-head">
        <div>
          <div className="a-eyebrow">Reports</div>
          <h1 className="a-title">
            Inventory <em>Ledger</em>
          </h1>
          <p className="a-subtitle">Detailed costing and material tracking for all items</p>
        </div>
        <div className="a-head-actions">
          <Link href="/admin/reports/ledger/new" className="a-btn a-btn--primary">
            <Plus size={16} />
            New Entry
          </Link>
        </div>
      </div>

      {/* Toolbar / Search */}
      <div className="a-toolbar">
        <div className="a-search">
          <Search size={16} className="a-search-ico" />
          <input
            type="text"
            placeholder="Search by customer, bill no, design name or metal type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="a-search-input"
          />
        </div>
      </div>

      {/* Table */}
      <div className="a-table-wrap">
        <div className="a-table-scroll">
          <table className="a-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Bill No</th>
                <th>Customer</th>
                <th>Design Name</th>
                <th>Design No</th>
                <th>Gold KT</th>
                <th className="a-td-num">Gross Wt</th>
                <th className="a-td-num">Touch</th>
                <th className="a-td-num">Fine Wt</th>
                <th className="a-td-num">Labour</th>
                <th className="a-td-num">Total Price</th>
                <th className="a-td-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12}>
                    <div className="a-loader-row">
                      <span className="a-loader" />
                      <span className="a-loader-label">Loading Ledger</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length ? (
                <>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td>{(r as any).bill_date ? new Date((r as any).bill_date).toLocaleDateString() : '—'}</td>
                      <td className="a-mono">{r.bill_no || '—'}</td>
                      <td>
                        <span className="a-cell-name">{r.customer_name || '—'}</span>
                      </td>
                      <td>
                        <span className="a-cell-name">{r.design_name || '—'}</span>
                      </td>
                      <td>{(r as any).design_no || '—'}</td>
                      <td>{(r as any).gold_kt ?? '—'}</td>
                      <td className="a-td-num">{fmtWeight((r as any).gross_weight)}</td>
                      <td className="a-td-num">{fmt2((r as any).touch_purity)}%</td>
                      <td className="a-td-num">{fmt2((r as any).fine_weight)}g</td>
                      <td className="a-td-num">{fmt2((r as any).metal_labour_amount)}</td>
                      <td className="a-td-num" style={{ fontWeight: 600, color: 'var(--c-accent)' }}>
                        ₹{fmt2((r as any).total_price ?? r.total_payable)}
                      </td>
                      <td>
                        <div className="a-cell-actions">
                          <button
                            type="button"
                            onClick={() => onDownload(getRowId(r))}
                            disabled={!!downloadingId}
                            className="a-icon-btn a-icon-btn--sm"
                            title="Download Invoice PDF"
                          >
                            {downloadingId === getRowId(r) ? <span className="a-loader" /> : <Download size={14} />}
                          </button>
                          <Link
                            href={getRowId(r) ? `/admin/reports/ledger/${getRowId(r)}/invoice` : '#'}
                            className="a-icon-btn a-icon-btn--sm"
                            title="Preview Invoice"
                          >
                            <FileText size={14} />
                          </Link>
                          <Link
                            href={getRowId(r) ? `/admin/reports/ledger/${getRowId(r)}/edit` : '#'}
                            className="a-icon-btn a-icon-btn--sm"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => onDelete(getRowId(r))}
                            className="a-icon-btn a-icon-btn--sm a-icon-btn--danger"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr style={{ background: 'var(--c-surface)', fontWeight: 600 }}>
                    <td colSpan={10} style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, color: 'var(--c-text-muted)' }}>
                      Total — {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
                    </td>
                    <td className="a-td-num" style={{ color: 'var(--c-accent)', fontWeight: 700 }}>₹{fmt2(sumTotal)}</td>
                    <td />
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan={12}>
                    <div className="a-empty">
                      <div className="a-empty-ico">
                        <Search size={22} />
                      </div>
                      <div className="a-empty-title">No ledger entries</div>
                      <div className="a-empty-text">No ledger entries match your criteria</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Summary */}
      {!!filtered.length && (
        <div className="a-card" style={{ marginTop: 20 }}>
          <div className="a-card-head a-row a-row--between">
            <span className="a-section-title">Financial Summary</span>
            <span className="a-muted">{filtered.length} Records</span>
          </div>
          <div className="a-card-body">
            <div className="a-stats">
              <div className="a-stat">
                <div className="a-stat-label">Total Payable</div>
                <div className="a-stat-val" style={{ color: 'var(--c-text)' }}>₹{fmt2(sumTotal)}</div>
              </div>
              <div className="a-stat">
                <div className="a-stat-label">Amount Due</div>
                <div className="a-stat-val" style={{ color: sumDue > 0 ? 'var(--c-danger)' : 'var(--c-text)' }}>₹{fmt2(sumDue)}</div>
              </div>
              <div className="a-stat">
                <div className="a-stat-label">Total Credit</div>
                <div className="a-stat-val" style={{ color: sumCredit > 0 ? 'var(--c-success)' : 'var(--c-text)' }}>₹{fmt2(sumCredit)}</div>
              </div>
            </div>
          </div>
          <div className="a-card-foot">
            <div className="a-row a-row--between" style={{ width: '100%', flexWrap: 'wrap', gap: 16 }}>
              <div className="a-row" style={{ gap: 12 }}>
                <span className="a-section-title" style={{ margin: 0 }}>Material Debit</span>
                <span className="a-badge a-badge--neutral">{matDebitMetal}</span>
                <span style={{ fontWeight: 600, color: 'var(--c-accent)', fontFamily: 'var(--font-dmsans)' }}>₹{fmt2(sumMatDebitPrice)}</span>
              </div>
              <div className="a-row" style={{ gap: 12 }}>
                <span className="a-section-title" style={{ margin: 0 }}>Material Credit</span>
                <span className="a-badge a-badge--neutral">{matCreditMetal}</span>
                <span style={{ fontWeight: 600, color: 'var(--c-accent)', fontFamily: 'var(--font-dmsans)' }}>₹{fmt2(sumMatCreditPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
