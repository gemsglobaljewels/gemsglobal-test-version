'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

type Row = Record<string, any>

export default function LedgerInvoicePage() {
  const params = useParams() as Record<string, string | string[] | undefined>
  const rawId = params?.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  const [row, setRow] = useState<Row | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) { setError('Missing id'); setLoading(false); return }
    ; (async () => {
      try {
        setLoading(true)
        const r = await fetch(`/api/ledger/${id}`)
        const j = await r.json()
        if (!r.ok) setError(j?.error || 'Failed to load')
        else setRow(j || null)
      } catch {
        setError('Failed to load')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const fmt = (n: any) => (Number.isFinite(Number(n)) ? Number(n).toFixed(3) : '—')
  const fmt2 = (n: any) => (Number.isFinite(Number(n)) ? Number(n).toFixed(2) : '—')

  return (
    <div>
      <style>{`
        /* ── Google Font ── */
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');

        /* ── Print setup ── */
        @page { size: A4; margin: 16mm 18mm; }

        * { box-sizing: border-box; }

        .sheet {
          font-family: 'DM Sans', system-ui, Arial, sans-serif;
          font-size: 11px;
          color: #1c2333;
          background: #fff;
          max-width: 780px;
          margin: 0 auto;
          padding: 32px 0 0;
        }

        /* ── Header band ── */
        .inv-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 16px;
          border-bottom: 2px solid #1c2333;
          margin-bottom: 18px;
        }

        .co-name {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: #1c2333;
          line-height: 1.2;
        }

        .co-sub {
          font-size: 10px;
          color: #6b7280;
          margin-top: 3px;
          letter-spacing: 0.03em;
        }

        .inv-meta {
          text-align: right;
          font-size: 11px;
        }

        .inv-badge {
          display: inline-block;
          background: #1c2333;
          color: #fff;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          padding: 3px 10px;
          border-radius: 3px;
          margin-bottom: 6px;
        }

        .inv-meta-row {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
          color: #6b7280;
          font-size: 10px;
          margin-top: 3px;
        }

        .inv-meta-row strong {
          color: #1c2333;
          font-weight: 600;
        }

        /* ── Section label ── */
        .section-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 6px;
          padding-left: 2px;
        }

        /* ── Main item table ── */
        .item-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
        }

        .item-table thead tr {
          background: #f1f5f9;
        }

        .item-table th {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #475569;
          padding: 8px 7px;
          border: 1px solid #e5e7eb;
          text-align: center;
          white-space: nowrap;
        }

        .item-table td {
          font-size: 11px;
          padding: 9px 7px;
          border: 1px solid #e5e7eb;
          text-align: center;
          vertical-align: middle;
          color: #1c2333;
        }

        .item-table tbody tr:nth-child(even) {
          background: #fafbfc;
        }

        .item-table td.r { text-align: right; }
        .item-table td.l { text-align: left; }

        /* ── Total row ── */
        .total-row td {
          background: #1c2333 !important;
          color: #fff !important;
          font-weight: 600;
          font-size: 11px;
          padding: 8px 7px;
          border-color: #1c2333 !important;
        }

        /* ── Summary cards ── */
        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-bottom: 20px;
        }

        .sum-card {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
        }

        .sum-card-head {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 6px 10px;
          border-bottom: 1px solid #e5e7eb;
        }

        .sum-card-head.blue  { background: #eff6ff; color: #1d4ed8; }
        .sum-card-head.slate { background: #f8fafc; color: #475569; }
        .sum-card-head.green { background: #f0fdf4; color: #15803d; }

        .sum-card table {
          width: 100%;
          border-collapse: collapse;
        }

        .sum-card table td {
          font-size: 10.5px;
          padding: 5px 10px;
          border-bottom: 1px solid #f1f5f9;
          color: #374151;
        }

        .sum-card table tr:last-child td {
          border-bottom: none;
        }

        .sum-card table td.r {
          text-align: right;
          font-weight: 600;
          color: #1c2333;
        }

        /* ── Final amount highlight ── */
        .final-row td {
          background: #f0fdf4 !important;
          font-weight: 700 !important;
          font-size: 12px !important;
          color: #15803d !important;
        }

        /* ── Footer ── */
        .inv-footer {
          margin-top: 28px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          font-size: 10px;
          color: #9ca3af;
        }

        .sig-box {
          text-align: center;
          width: 140px;
        }

        .sig-line {
          border-top: 1px solid #d1d5db;
          margin-bottom: 4px;
        }

        /* ── Print button bar ── */
        .btns {
          position: sticky;
          top: 0;
          z-index: 50;
          background: #fff;
          padding: 10px 16px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .btns-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-right: auto;
        }

        @media print {
          .btns  { display: none !important; }
          aside, nav, header, footer { display: none !important; }
          html, body { background: #fff !important; }
          .sheet { padding-top: 0 !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Print bar */}
      <div className="btns">
        <span className="btns-title">Invoice Preview</span>
        <Button variant="outline" onClick={() => window.history.back()}>← Back</Button>
        <Button onClick={() => window.print()}>Download PDF</Button>
      </div>

      <div className="sheet">
        {loading ? (
          <p style={{ color: '#6b7280', padding: '32px 0' }}>Loading…</p>
        ) : error ? (
          <p style={{ color: '#b91c1c', padding: '32px 0' }}>{error}</p>
        ) : !row ? (
          <p style={{ color: '#6b7280', padding: '32px 0' }}>Not found</p>
        ) : (
          <>
            {/* ── Header ── */}
            <div className="inv-header">
              <div>
                <div className="co-name">TULSIYA JEWELS LLP</div>
                <div className="co-sub" style={{ marginTop: 6 }}>
                  <span style={{ color: '#6b7280' }}>Customer:&nbsp;</span>
                  <strong>{row?.customer_name || '—'}</strong>
                </div>
              </div>
              <div className="inv-meta">
                <div className="inv-badge">INVOICE</div>
                <div className="inv-meta-row">
                  <span style={{ color: '#9ca3af' }}>Bill No</span>
                  <strong>{row?.bill_no || row?.design_no || '—'}</strong>
                </div>
                <div className="inv-meta-row">
                  <span style={{ color: '#9ca3af' }}>Date</span>
                  <strong>
                    {row?.bill_date
                      ? new Date(row.bill_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : new Date(row?.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </strong>
                </div>
                {row?.credit_metal_date && (
                  <div className="inv-meta-row">
                    <span style={{ color: '#9ca3af' }}>Credit Date</span>
                    <strong>{new Date(row.credit_metal_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* ── Item table ── */}
            <div className="section-label">Item Details</div>
            <table className="item-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item No.</th>
                  <th>Design Name</th>
                  <th>Image</th>
                  <th>KT</th>
                  <th>Gross Wt</th>
                  <th>Net Wt</th>
                  <th>Touch %</th>
                  <th>Fine Wt</th>
                  <th>Metal Rate</th>
                  <th>Sol. Dia</th>
                  <th>Loose Dia</th>
                  <th>Dia Labour</th>
                  <th>Metal Labour</th>
                  <th>Total Metal</th>
                  <th>Total Price</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>{row?.design_no || '—'}</td>
                  <td className="l" style={{ fontWeight: 600 }}>{row?.design_name || '—'}</td>
                  <td>
                    {row?.item_photo
                      ? <img src={row.item_photo} alt="" style={{ width: 52, height: 52, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                      : '—'}
                  </td>
                  <td>{row?.gold_kt || '—'}</td>
                  <td>{fmt(row?.gross_weight)}</td>
                  <td>{fmt(row?.net_weight)}</td>
                  <td>{fmt2(row?.touch_purity)}</td>
                  <td>{fmt(row?.fine_weight)}</td>
                  <td>{fmt2(row?.metal_rate)}</td>
                  <td style={{ fontSize: 10 }}>
                    {(row?.solitaire_diamond_pcs || row?.solitaire_diamond_wt)
                      ? `${row.solitaire_diamond_pcs ?? 0} pcs\n${fmt(row.solitaire_diamond_wt)} ct`
                      : '—'}
                  </td>
                  <td style={{ fontSize: 10 }}>
                    {(row?.loose_diamond_pcs || row?.loose_diamond_wt)
                      ? `${row.loose_diamond_pcs ?? 0} pcs / ${fmt(row.loose_diamond_wt)} ct`
                      : '—'}
                  </td>
                  <td>{fmt2(row?.diamond_labour_amount)}</td>
                  <td>{fmt2(row?.metal_labour_amount)}</td>
                  <td>{fmt2(row?.total_metal ?? row?.metal_price)}</td>
                  <td className="r" style={{ fontWeight: 700, fontSize: 12 }}>
                    {fmt2(row?.total_price ?? row?.total_payable)}
                  </td>
                </tr>

                {/* Total row */}
                <tr className="total-row">
                  <td colSpan={15} className="r" style={{ letterSpacing: '0.06em' }}>TOTAL PAYABLE</td>
                  <td className="r">{fmt2(row?.total_price ?? row?.total_payable)}</td>
                </tr>
              </tbody>
            </table>

            {/* ── Summary cards ── */}
            <div className="section-label">Summary</div>
            <div className="summary-grid">

              {/* Invoice Summary */}
              <div className="sum-card">
                <div className="sum-card-head blue">Invoice Summary</div>
                <table>
                  <tbody>
                    <tr><td>Gross Weight</td>     <td className="r">{fmt(row?.gross_weight)} g</td></tr>
                    <tr><td>Net Weight</td>        <td className="r">{fmt(row?.net_weight)} g</td></tr>
                    <tr><td>Fine Weight</td>       <td className="r">{fmt(row?.fine_weight)} g</td></tr>
                    <tr><td>Diamond Amount</td>    <td className="r">₹ {fmt2(row?.diamond_price ?? row?.diamond_labour_amount)}</td></tr>
                    <tr><td>Making Charges</td>    <td className="r">₹ {fmt2((row?.labour || 0) * (row?.labour_rate || 0) || row?.metal_labour_amount)}</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Balance Summary */}
              <div className="sum-card">
                <div className="sum-card-head slate">Balance Summary</div>
                <table>
                  <tbody>
                    <tr><td>Amount</td>            <td className="r">₹ {fmt2(row?.final_amount ?? row?.total_price ?? row?.total_payable)}</td></tr>
                    <tr><td>Gold Credit</td>        <td className="r">₹ {fmt2(row?.mat_credit_price)}</td></tr>
                    <tr><td>Gold Debit</td>         <td className="r">₹ {fmt2(row?.mat_debit_price)}</td></tr>
                    <tr><td>Diamond Weight</td>     <td className="r">{fmt(row?.diamond_weight ?? row?.loose_diamond_wt)} ct</td></tr>
                    <tr><td>Credit Metal</td>       <td className="r">{row?.mat_credit_metal || '—'}</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Final Amount */}
              <div className="sum-card">
                <div className="sum-card-head green">Final Amount</div>
                <table>
                  <tbody>
                    <tr><td>Due Amount</td>        <td className="r">₹ {fmt2(row?.due_amount)}</td></tr>
                    <tr><td>Credit Amount</td>     <td className="r">₹ {fmt2(row?.credit_amount)}</td></tr>
                    <tr className="final-row">
                      <td><strong>Net Total</strong></td>
                      <td className="r">₹ {fmt2(row?.final_amount ?? row?.total_price ?? row?.total_payable)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            {/* ── Footer ── */}
            <div className="inv-footer">
              <div>
                <div>Thank you for your business.</div>
                <div style={{ marginTop: 2 }}>TULSIYA JEWELS LLP</div>
              </div>
              <div className="sig-box">
                <div style={{ height: 32 }} />
                <div className="sig-line" />
                <div>Authorised Signatory</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
