'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowLeft,
  Pencil,
  Trash2,
  Package,
  Receipt,
  Download,
  Clock,
  X,
} from 'lucide-react'

export default function AdminOfflineSaleDetailPage() {
  const params = useParams() as { id?: string }
  const id = params?.id as string | undefined
  const router = useRouter()
  const [sale, setSale] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (id === 'undefined' || !uuidRe.test(id)) {
      router.replace('/admin/offline-sales')
      return
    }
    setError('')
    fetchSale(id)
  }, [id])

  async function fetchSale(saleId: string) {
    try {
      setLoading(true)
      const res = await fetch(`/api/offline-sales/${saleId}`)
      const data = await res.json()
      if (!res.ok) {
        if (String(data?.error || '').toLowerCase().includes('invalid sale id')) {
          router.replace('/admin/offline-sales')
          return
        }
        setError(data?.error || 'Failed to load sale')
      } else {
        setSale(data)
      }
    } catch {
      setError('Failed to load sale')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    const ok = window.confirm('Delete this sale? This action cannot be undone.')
    if (!ok || !id) return
    try {
      const res = await fetch(`/api/offline-sales/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Failed to delete sale')
      } else {
        window.location.href = '/admin/offline-sales'
      }
    } catch {
      setError('Failed to delete sale')
    }
  }

  const handleDownloadPDF = () => {
    if (!sale) return;

    // Check if window is available for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = (sale.items || []).map((it: any, index: number) => `
      <tr>
        <td>${index + 1}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            ${it.productImage ? `<img src="${it.productImage}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #eee;" />` : `<div style="width: 40px; height: 40px; background: #f5f5f5; border-radius: 4px; border: 1px solid #eee; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #ccc;">No Img</div>`}
            <span>${it.productName || '—'}</span>
          </div>
        </td>
        <td style="text-align: center;">${it.quantity}</td>
        <td style="text-align: right;">₹${Number(it.unitPrice || 0).toLocaleString('en-IN')}</td>
        <td style="text-align: right;">₹${Number(it.discount || 0).toLocaleString('en-IN')}</td>
        <td style="text-align: right; font-weight: 600;">₹${Number(it.lineTotal || 0).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${sale.customerName || 'Sale'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
          body { font-family: 'DM Sans', sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px; }
          .brand { font-size: 28px; font-weight: 700; color: #D4AF37; letter-spacing: 1px; }
          .invoice-label { font-size: 32px; font-weight: 700; color: #eee; text-transform: uppercase; margin: 0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 5px; }
          .info-value { font-size: 14px; font-weight: 500; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f9f9f9; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #eee; }
          td { padding: 12px; font-size: 13px; border-bottom: 1px solid #f5f5f5; }
          .totals { margin-left: auto; width: 300px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
          .total-row.grand { border-top: 2px solid #D4AF37; margin-top: 10px; padding-top: 15px; font-size: 18px; font-weight: 700; color: #D4AF37; }
          .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">GEMS GLOBAL JEWELS</div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">Luxury Handcrafted Jewelry</div>
          </div>
          <h1 class="invoice-label">Invoice</h1>
        </div>

        <div class="info-grid">
          <div>
            <div class="info-label">Billed To</div>
            <div class="info-value"><strong>${sale.customerName || 'Valued Customer'}</strong></div>
            <div class="info-value">${sale.customerEmail || ''}</div>
            <div class="info-value">${sale.customerPhone || ''}</div>
            <div class="info-value">${sale.customerAddress?.address || ''}</div>
          </div>
          <div style="text-align: right;">
            <div class="info-label">Invoice Details</div>
            <div class="info-value">Sale ID: ${sale.id.slice(0, 12).toUpperCase()}</div>
            <div class="info-value">Date: ${new Date(sale.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Discount</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal</span>
            <span>₹${Number(sale.subtotal || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="total-row">
            <span>Total Discount</span>
            <span>−₹${Number(sale.discount || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="total-row grand">
            <span>Net Total</span>
            <span>₹${Number(sale.total || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for shopping with Gems Global Jewels.</p>
          <p style="font-size: 10px; margin-top: 5px;">This is a computer-generated invoice and does not require a signature.</p>
        </div>

        <script>
          window.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const createdAt = sale?.createdAt ? new Date(sale.createdAt) : null

  return (
    <div className="a-page">
      {/* Alert */}
      {error && (
        <div
          className="a-card"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '14px 18px',
            marginBottom: 20,
            border: '1px solid var(--c-danger)',
            background: 'var(--c-danger-bg)',
            color: 'var(--c-danger)',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 13 }}>{error}</span>
          <button
            className="a-icon-btn a-icon-btn--sm"
            onClick={() => setError('')}
            style={{ marginLeft: 'auto', color: 'var(--c-danger)' }}
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Back link */}
      <Link href="/admin/offline-sales" className="a-back">
        <ArrowLeft size={15} />
        Back to Offline Sales
      </Link>

      {/* Page Header */}
      <div className="a-head">
        <div>
          <div className="a-eyebrow">Point of Sale</div>
          <h1 className="a-title">Sale <em>Detail</em></h1>
          <p className="a-subtitle">
            {sale?.customerName ? `${sale.customerName} · ` : ''}{id?.slice(0, 8)}…
          </p>
        </div>

        {id && !loading && (
          <div className="a-head-actions">
            <button className="a-btn a-btn--primary" onClick={handleDownloadPDF}>
              <Download size={15} />
              Invoice
            </button>
            <Link href={`/admin/offline-sales/${id}/edit`} className="a-btn a-btn--ghost">
              <Pencil size={15} />
              Edit
            </Link>
            <button className="a-btn a-btn--danger" onClick={handleDelete}>
              <Trash2 size={15} />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Loading / Empty / Content */}
      {loading ? (
        <div className="a-loader-row" style={{ padding: '80px 0' }}>
          <span className="a-loader" />
          <span className="a-loader-label">Loading sale</span>
        </div>
      ) : !sale ? (
        <div className="a-empty">
          <div className="a-empty-ico"><Receipt size={20} /></div>
          <div className="a-empty-title">No data found</div>
          <div className="a-empty-text">This sale could not be loaded.</div>
        </div>
      ) : (
        <div className="a-grid-2">
          {/* Main Column */}
          <div className="a-stack">
            {/* Customer */}
            <div className="a-card">
              <div className="a-card-head">
                <h2 className="a-card-title">Customer <em>Information</em></h2>
              </div>
              <div className="a-card-body">
                <div className="a-form-grid">
                  <div className="a-field">
                    <span className="a-label">Full Name</span>
                    <div
                      style={{
                        fontFamily: 'var(--font-dmsans)',
                        fontSize: 14,
                        color: sale.customerName ? 'var(--c-text)' : 'var(--c-text-faint)',
                        fontStyle: sale.customerName ? 'normal' : 'italic',
                      }}
                    >
                      {sale.customerName || 'Not provided'}
                    </div>
                  </div>
                  <div className="a-field">
                    <span className="a-label">Phone</span>
                    <div
                      style={{
                        fontFamily: 'var(--font-dmsans)',
                        fontSize: 14,
                        color: sale.customerPhone ? 'var(--c-text)' : 'var(--c-text-faint)',
                        fontStyle: sale.customerPhone ? 'normal' : 'italic',
                      }}
                    >
                      {sale.customerPhone || 'Not provided'}
                    </div>
                  </div>
                  <div className="a-field">
                    <span className="a-label">Email Address</span>
                    <div
                      style={{
                        fontFamily: 'var(--font-dmsans)',
                        fontSize: 14,
                        color: sale.customerEmail ? 'var(--c-text)' : 'var(--c-text-faint)',
                        fontStyle: sale.customerEmail ? 'normal' : 'italic',
                      }}
                    >
                      {sale.customerEmail || 'Not provided'}
                    </div>
                  </div>
                  <div className="a-field">
                    <span className="a-label">Billing Address</span>
                    <div
                      style={{
                        fontFamily: 'var(--font-dmsans)',
                        fontSize: 14,
                        color: sale.customerAddress?.address ? 'var(--c-text)' : 'var(--c-text-faint)',
                        fontStyle: sale.customerAddress?.address ? 'normal' : 'italic',
                      }}
                    >
                      {sale.customerAddress?.address || 'Not provided'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="a-card">
              <div className="a-card-head">
                <h2 className="a-card-title">Purchased <em>Items</em></h2>
              </div>
              <div className="a-card-body a-card-body--flush">
                <div className="a-table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
                  <div className="a-table-scroll">
                    <table className="a-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Qty</th>
                          <th className="a-td-right">Unit Price</th>
                          <th className="a-td-right">Discount</th>
                          <th className="a-td-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(sale.items || []).length === 0 ? (
                          <tr>
                            <td colSpan={5}>
                              <div className="a-empty">
                                <div className="a-empty-ico"><Package size={20} /></div>
                                <div className="a-empty-title">No items recorded</div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          (sale.items || []).map((it: any) => (
                            <tr key={it.id}>
                              <td>
                                <div className="a-cell-lead">
                                  {it.productImage ? (
                                    <img src={it.productImage} className="a-media" alt="" />
                                  ) : (
                                    <div
                                      className="a-media"
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'var(--c-surface)',
                                        color: 'var(--c-text-faint)',
                                      }}
                                    >
                                      <Package size={14} style={{ opacity: 0.5 }} />
                                    </div>
                                  )}
                                  <div>
                                    <div className="a-cell-name">{it.productName || '—'}</div>
                                    {it.productId && (
                                      <div className="a-cell-meta a-mono">{it.productId.slice(0, 12)}…</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="a-muted">{it.quantity}</td>
                              <td className="a-td-right">
                                ₹{Number(it.unitPrice || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </td>
                              <td className="a-td-right">
                                {Number(it.discount || 0) > 0 ? (
                                  <span style={{ color: 'var(--c-success)' }}>
                                    −₹{Number(it.discount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                  </span>
                                ) : (
                                  <span className="a-muted">—</span>
                                )}
                              </td>
                              <td className="a-td-right">
                                <strong>₹{Number(it.lineTotal || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="a-card">
              <div className="a-card-head">
                <h2 className="a-card-title">Internal <em>Notes</em></h2>
              </div>
              <div className="a-card-body">
                {sale.notes ? (
                  <p
                    style={{
                      fontFamily: 'var(--font-dmsans)',
                      fontSize: 14,
                      color: 'var(--c-text)',
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {sale.notes}
                  </p>
                ) : (
                  <p
                    style={{
                      fontFamily: 'var(--font-dmsans)',
                      fontSize: 13,
                      color: 'var(--c-text-faint)',
                      fontStyle: 'italic',
                      margin: 0,
                    }}
                  >
                    No notes recorded for this sale.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Side Column */}
          <div className="a-stack">
            {/* Sale Meta */}
            <div className="a-card">
              <div className="a-card-head">
                <h2 className="a-card-title">Sale <em>Record</em></h2>
              </div>
              <div className="a-card-body">
                <div
                  style={{
                    background: 'var(--c-surface)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 'var(--radius)',
                    padding: '14px 16px',
                    marginBottom: 16,
                  }}
                >
                  <span className="a-label" style={{ display: 'block', marginBottom: 6 }}>Sale ID</span>
                  <div className="a-mono" style={{ fontSize: 12, color: 'var(--c-text)', wordBreak: 'break-all', lineHeight: 1.5 }}>
                    {sale.id}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="a-field">
                    <span className="a-label">Date &amp; Time</span>
                    {createdAt ? (
                      <>
                        <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: 14, color: 'var(--c-text)' }}>
                          {createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                        <div className="a-muted" style={{ fontFamily: 'var(--font-dmsans)', fontSize: 12, marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Clock size={12} />
                          {createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: 14, color: 'var(--c-text-faint)', fontStyle: 'italic' }}>Unknown</div>
                    )}
                  </div>
                  {sale.recordedBy && (
                    <div className="a-field">
                      <span className="a-label">Recorded By</span>
                      <div className="a-mono" style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
                        {sale.recordedBy.slice(0, 16)}…
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="a-card">
              <div className="a-card-head">
                <h2 className="a-card-title">Payment <em>Summary</em></h2>
              </div>
              <div className="a-card-body">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div
                    className="a-row a-row--between"
                    style={{ padding: '11px 0', borderBottom: '1px solid var(--c-border)' }}
                  >
                    <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 13, color: 'var(--c-text-muted)' }}>Subtotal</span>
                    <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 15, fontWeight: 600, color: 'var(--c-text)' }}>
                      ₹{Number(sale.subtotal || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div
                    className="a-row a-row--between"
                    style={{ padding: '11px 0', borderBottom: '1px solid var(--c-border)' }}
                  >
                    <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 13, color: 'var(--c-text-muted)' }}>Discount</span>
                    <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 15, fontWeight: 600, color: 'var(--c-success)' }}>
                      {Number(sale.discount || 0) > 0
                        ? `−₹${Number(sale.discount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                        : '₹0'}
                    </span>
                  </div>
                  <div
                    className="a-row a-row--between"
                    style={{ padding: '14px 0 4px', alignItems: 'baseline' }}
                  >
                    <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 13, fontWeight: 600, letterSpacing: '0.02em', color: 'var(--c-text)' }}>Total Paid</span>
                    <span style={{ fontFamily: 'var(--font-main)', fontSize: 26, color: 'var(--c-text)' }}>
                      ₹{Number(sale.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
