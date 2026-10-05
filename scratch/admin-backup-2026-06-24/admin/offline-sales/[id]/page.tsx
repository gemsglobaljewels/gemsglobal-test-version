'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, Pencil, Trash2, User, Package, Receipt, Download } from 'lucide-react'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500&display=swap');

/* ── Base ── */
.sd-page {
  min-height: 100vh;
  background: #0a0806;
  padding: 40px 48px;
  font-family: 'Jost', sans-serif;
}

/* ── Page Header ── */
.sd-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 36px;
}
.sd-eyebrow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.sd-eyebrow-line {
  width: 20px;
  height: 1px;
  background: #D4AF37;
  flex-shrink: 0;
}
.sd-eyebrow-tag {
  font-family: 'Jost', sans-serif;
  font-size: 8px;
  font-weight: 400;
  letter-spacing: 0.44em;
  text-transform: uppercase;
  color: rgba(212,175,55,0.65);
}
.sd-page-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 36px;
  font-weight: 300;
  color: #F0EBE0;
  line-height: 1.1;
  margin: 0 0 6px 0;
}
.sd-page-title em { font-style: italic; color: #D4AF37; }
.sd-page-subtitle {
  font-family: 'Jost', sans-serif;
  font-size: 11px;
  font-weight: 300;
  color: rgba(235,229,216,0.38);
  letter-spacing: 0.06em;
}

/* ── Header action buttons ── */
.sd-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-shrink: 0;
}
.sd-btn-edit {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: transparent;
  border: 1px solid rgba(212,175,55,0.18);
  color: rgba(212,175,55,0.55);
  font-family: 'Jost', sans-serif;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  height: 38px;
  padding: 0 18px;
  cursor: pointer;
  text-decoration: none;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.sd-btn-edit:hover {
  border-color: rgba(212,175,55,0.4);
  color: #D4AF37;
  background: rgba(212,175,55,0.05);
}
.sd-btn-edit svg { width: 12px; height: 12px; }

.sd-btn-download {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: #D4AF37;
  border: 1px solid #D4AF37;
  color: #000;
  font-family: 'Jost', sans-serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  height: 38px;
  padding: 0 18px;
  cursor: pointer;
  transition: opacity 0.2s;
}
.sd-btn-download:hover {
  opacity: 0.9;
}
.sd-btn-download svg { width: 12px; height: 12px; }

.sd-btn-delete {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: transparent;
  border: 1px solid rgba(248,113,113,0.12);
  color: rgba(248,113,113,0.45);
  font-family: 'Jost', sans-serif;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  height: 38px;
  padding: 0 18px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.sd-btn-delete:hover {
  border-color: rgba(248,113,113,0.38);
  background: rgba(248,113,113,0.07);
  color: rgba(248,113,113,0.9);
}
.sd-btn-delete svg { width: 12px; height: 12px; }

/* ── Alert ── */
.sd-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px;
  margin-bottom: 24px;
  border: 1px solid rgba(180,50,40,0.22);
  background: rgba(180,50,40,0.08);
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  font-weight: 300;
  color: rgba(220,100,90,0.9);
  letter-spacing: 0.03em;
}
.sd-alert svg { width: 14px; height: 14px; flex-shrink: 0; margin-top: 1px; }
.sd-alert-close {
  margin-left: auto;
  background: transparent;
  border: none;
  cursor: pointer;
  color: rgba(220,100,90,0.6);
  font-size: 16px;
  line-height: 1;
  padding: 0;
}
.sd-alert-close:hover { color: rgba(220,100,90,1); }

/* ── Loading / Empty ── */
.sd-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 14px;
}
.sd-loading-ring {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(212,175,55,0.12);
  border-top-color: rgba(212,175,55,0.55);
  border-radius: 50%;
  animation: sd-spin 1s linear infinite;
}
@keyframes sd-spin { to { transform: rotate(360deg); } }
.sd-state-label {
  font-family: 'Jost', sans-serif;
  font-size: 9px;
  font-weight: 300;
  letter-spacing: 0.30em;
  text-transform: uppercase;
  color: rgba(235,229,216,0.25);
}

/* ── Layout ── */
.sd-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  align-items: start;
}
.sd-col-main { display: flex; flex-direction: column; gap: 20px; }
.sd-col-side { display: flex; flex-direction: column; gap: 20px; }

/* ── Cards ── */
.sd-card {
  background: #13100c;
  border: 1px solid rgba(212,175,55,0.10);
  position: relative;
  overflow: hidden;
}
.sd-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212,175,55,0.40), transparent);
  pointer-events: none;
}
.sd-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(212,175,55,0.07);
}
.sd-card-header svg { width: 14px; height: 14px; color: rgba(212,175,55,0.45); flex-shrink: 0; }
.sd-card-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  font-weight: 300;
  color: #F0EBE0;
  margin: 0;
}
.sd-card-title em { font-style: italic; color: #D4AF37; }
.sd-card-body { padding: 22px; }

/* ── Customer details ── */
.sd-customer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 28px;
}
.sd-field-label {
  font-family: 'Jost', sans-serif;
  font-size: 8px;
  font-weight: 400;
  letter-spacing: 0.40em;
  text-transform: uppercase;
  color: rgba(212,175,55,0.50);
  margin-bottom: 5px;
  display: block;
}
.sd-field-value {
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  font-weight: 300;
  color: rgba(235,229,216,0.82);
  letter-spacing: 0.04em;
  line-height: 1.5;
}
.sd-field-value--empty { color: rgba(235,229,216,0.22); font-style: italic; }
.sd-field-value--mono {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: rgba(235,229,216,0.38);
}

/* ── Items table ── */
.sd-table-scroll {
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(212,175,55,0.15) transparent;
}
.sd-table-scroll::-webkit-scrollbar { height: 3px; }
.sd-table-scroll::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.18); }

.sd-table { width: 100%; border-collapse: collapse; min-width: 540px; }
.sd-table thead {
  background: rgba(212,175,55,0.04);
  border-bottom: 1px solid rgba(212,175,55,0.10);
}
.sd-table th {
  padding: 12px 18px;
  text-align: left;
  font-family: 'Jost', sans-serif;
  font-size: 7.5px;
  font-weight: 500;
  letter-spacing: 0.38em;
  text-transform: uppercase;
  color: rgba(212,175,55,0.45);
  white-space: nowrap;
}
.sd-table th.sd-th-right { text-align: right; }
.sd-table tbody tr {
  border-bottom: 1px solid rgba(212,175,55,0.05);
  transition: background 0.15s;
}
.sd-table tbody tr:last-child { border-bottom: none; }
.sd-table tbody tr:hover { background: rgba(212,175,55,0.03); }
.sd-table td {
  padding: 14px 18px;
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  font-weight: 300;
  color: rgba(235,229,216,0.65);
  letter-spacing: 0.04em;
  vertical-align: middle;
}
.sd-table td.sd-td-right { text-align: right; }

.sd-product-name {
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: rgba(235,229,216,0.85);
  margin-bottom: 2px;
}
.sd-product-id {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: rgba(235,229,216,0.22);
  letter-spacing: 0.04em;
}
.sd-td-price {
  font-family: 'Cormorant Garamond', serif;
  font-size: 14px;
  font-weight: 400;
  color: #EDE7D8;
}
.sd-td-discount {
  font-family: 'Cormorant Garamond', serif;
  font-size: 14px;
  font-weight: 400;
  color: rgba(74,222,128,0.65);
}
.sd-td-total {
  font-family: 'Cormorant Garamond', serif;
  font-size: 15px;
  font-weight: 400;
  color: #EDE7D8;
}

/* ── Totals (side panel) ── */
.sd-totals { display: flex; flex-direction: column; gap: 0; }
.sd-total-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 10px 0;
  border-bottom: 1px solid rgba(212,175,55,0.05);
}
.sd-total-row:last-child { border-bottom: none; }
.sd-total-key {
  font-family: 'Jost', sans-serif;
  font-size: 9px;
  font-weight: 300;
  letter-spacing: 0.10em;
  color: rgba(235,229,216,0.38);
}
.sd-total-val {
  font-family: 'Cormorant Garamond', serif;
  font-size: 16px;
  font-weight: 400;
  color: rgba(235,229,216,0.75);
}
.sd-total-val--discount { color: rgba(74,222,128,0.7); }
.sd-total-val--grand { font-size: 22px; color: #EDE7D8; }
.sd-divider {
  height: 1px;
  background: rgba(212,175,55,0.07);
  margin: 8px 0;
}

/* ── Notes card ── */
.sd-notes-text {
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  font-weight: 300;
  color: rgba(235,229,216,0.60);
  letter-spacing: 0.04em;
  line-height: 1.7;
}
.sd-notes-empty {
  font-family: 'Jost', sans-serif;
  font-size: 11px;
  font-weight: 300;
  color: rgba(235,229,216,0.20);
  font-style: italic;
  letter-spacing: 0.06em;
}

/* ── Sale ID badge (side) ── */
.sd-id-box {
  background: rgba(235,229,216,0.02);
  border: 1px solid rgba(212,175,55,0.08);
  padding: 14px 16px;
  margin-bottom: 12px;
}
.sd-id-label {
  font-family: 'Jost', sans-serif;
  font-size: 7.5px;
  font-weight: 400;
  letter-spacing: 0.42em;
  text-transform: uppercase;
  color: rgba(212,175,55,0.38);
  margin-bottom: 6px;
  display: block;
}
.sd-id-value {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: rgba(235,229,216,0.40);
  word-break: break-all;
  line-height: 1.5;
}
.sd-date-value {
  font-family: 'Jost', sans-serif;
  font-size: 11px;
  font-weight: 300;
  color: rgba(235,229,216,0.55);
  letter-spacing: 0.04em;
}
.sd-time-value {
  font-family: 'Jost', sans-serif;
  font-size: 10px;
  font-weight: 300;
  color: rgba(235,229,216,0.28);
  letter-spacing: 0.06em;
  margin-top: 2px;
}
`

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
    <>
      <style>{CSS}</style>
      <div className="sd-page">

        {/* Alert */}
        {error && (
          <div className="sd-alert">
            <AlertCircle />
            <span>{error}</span>
            <button className="sd-alert-close" onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* Page Header */}
        <div className="sd-header">
          <div>
            <div className="sd-eyebrow">
              <span className="sd-eyebrow-line" />
              <span className="sd-eyebrow-tag">Point of Sale</span>
            </div>
            <h1 className="sd-page-title">Sale <em>Detail</em></h1>
            <p className="sd-page-subtitle">
              {sale?.customerName ? `${sale.customerName} · ` : ''}{id?.slice(0, 8)}…
            </p>
          </div>

          {id && !loading && (
            <div className="sd-actions">
              <button className="sd-btn-download" onClick={handleDownloadPDF}>
                <Download />
                Invoice
              </button>
              <Link href={`/admin/offline-sales/${id}/edit`} className="sd-btn-edit">
                <Pencil />
                Edit
              </Link>
              <button className="sd-btn-delete" onClick={handleDelete}>
                <Trash2 />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="sd-state">
            <div className="sd-loading-ring" />
            <span className="sd-state-label">Loading sale</span>
          </div>
        ) : !sale ? (
          <div className="sd-state">
            <span className="sd-state-label">No data found</span>
          </div>
        ) : (
          <div className="sd-grid">

            {/* Main Column */}
            <div className="sd-col-main">

              {/* Customer */}
              <div className="sd-card">
                <div className="sd-card-header">
                  <User size={14} />
                  <h2 className="sd-card-title">Customer <em>Information</em></h2>
                </div>
                <div className="sd-card-body">
                  <div className="sd-customer-grid">
                    <div>
                      <span className="sd-field-label">Full Name</span>
                      <div className={`sd-field-value${!sale.customerName ? ' sd-field-value--empty' : ''}`}>
                        {sale.customerName || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <span className="sd-field-label">Phone</span>
                      <div className={`sd-field-value${!sale.customerPhone ? ' sd-field-value--empty' : ''}`}>
                        {sale.customerPhone || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <span className="sd-field-label">Email Address</span>
                      <div className={`sd-field-value${!sale.customerEmail ? ' sd-field-value--empty' : ''}`}>
                        {sale.customerEmail || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <span className="sd-field-label">Billing Address</span>
                      <div className={`sd-field-value${!sale.customerAddress?.address ? ' sd-field-value--empty' : ''}`}>
                        {sale.customerAddress?.address || 'Not provided'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="sd-card">
                <div className="sd-card-header">
                  <Package size={14} />
                  <h2 className="sd-card-title">Purchased <em>Items</em></h2>
                </div>
                <div className="sd-card-body" style={{ padding: 0 }}>
                  <div className="sd-table-scroll">
                    <table className="sd-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Qty</th>
                          <th className="sd-th-right">Unit Price</th>
                          <th className="sd-th-right">Discount</th>
                          <th className="sd-th-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(sale.items || []).length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'rgba(235,229,216,0.22)', fontStyle: 'italic', fontSize: '11px' }}>
                              No items recorded
                            </td>
                          </tr>
                        ) : (
                          (sale.items || []).map((it: any) => (
                            <tr key={it.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  {it.productImage ? (
                                    <img src={it.productImage} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(212,175,55,0.1)' }} alt="" />
                                  ) : (
                                    <div style={{ width: '40px', height: '40px', background: 'rgba(235,229,216,0.03)', borderRadius: '4px', border: '1px solid rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Package size={14} style={{ opacity: 0.2 }} />
                                    </div>
                                  )}
                                  <div>
                                    <div className="sd-product-name">{it.productName || '—'}</div>
                                    {it.productId && <div className="sd-product-id">{it.productId.slice(0, 12)}…</div>}
                                  </div>
                                </div>
                              </td>
                              <td style={{ color: 'rgba(235,229,216,0.55)' }}>{it.quantity}</td>
                              <td className="sd-td-right">
                                <span className="sd-td-price">₹{Number(it.unitPrice || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                              </td>
                              <td className="sd-td-right">
                                <span className="sd-td-discount">
                                  {Number(it.discount || 0) > 0 ? `−₹${Number(it.discount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                                </span>
                              </td>
                              <td className="sd-td-right">
                                <span className="sd-td-total">₹{Number(it.lineTotal || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="sd-card">
                <div className="sd-card-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                  <h2 className="sd-card-title">Internal <em>Notes</em></h2>
                </div>
                <div className="sd-card-body">
                  {sale.notes
                    ? <p className="sd-notes-text">{sale.notes}</p>
                    : <p className="sd-notes-empty">No notes recorded for this sale.</p>
                  }
                </div>
              </div>

            </div>

            {/* Side Column */}
            <div className="sd-col-side">

              {/* Sale Meta */}
              <div className="sd-card">
                <div className="sd-card-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  <h2 className="sd-card-title">Sale <em>Record</em></h2>
                </div>
                <div className="sd-card-body">
                  <div className="sd-id-box">
                    <span className="sd-id-label">Sale ID</span>
                    <div className="sd-id-value">{sale.id}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <span className="sd-field-label">Date &amp; Time</span>
                      {createdAt ? (
                        <>
                          <div className="sd-date-value">{createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                          <div className="sd-time-value">{createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                        </>
                      ) : <div className="sd-field-value sd-field-value--empty">Unknown</div>}
                    </div>
                    {sale.recordedBy && (
                      <div>
                        <span className="sd-field-label">Recorded By</span>
                        <div className="sd-field-value sd-field-value--mono">{sale.recordedBy.slice(0, 16)}…</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="sd-card">
                <div className="sd-card-header">
                  <Receipt size={14} />
                  <h2 className="sd-card-title">Payment <em>Summary</em></h2>
                </div>
                <div className="sd-card-body">
                  <div className="sd-totals">
                    <div className="sd-total-row">
                      <span className="sd-total-key">Subtotal</span>
                      <span className="sd-total-val">₹{Number(sale.subtotal || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="sd-total-row">
                      <span className="sd-total-key">Discount</span>
                      <span className="sd-total-val sd-total-val--discount">
                        {Number(sale.discount || 0) > 0 ? `−₹${Number(sale.discount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '₹0'}
                      </span>
                    </div>
                    <div className="sd-divider" />
                    <div className="sd-total-row">
                      <span className="sd-total-key" style={{ color: 'rgba(235,229,216,0.60)', letterSpacing: '0.14em' }}>Total Paid</span>
                      <span className="sd-total-val sd-total-val--grand">₹{Number(sale.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </>
  )
}