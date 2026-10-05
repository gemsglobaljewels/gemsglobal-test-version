'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Download } from 'lucide-react'
import { buildInvoiceHTML, downloadInvoicePDF } from '@/lib/invoice-pdf'

type Row = Record<string, any>

export default function LedgerInvoicePage() {
  const params = useParams() as Record<string, string | string[] | undefined>
  const rawId = params?.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  const [row, setRow] = useState<Row | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  // Stamped once on mount so the printed timestamp is stable across re-renders
  const [genAt] = useState(() => new Date())

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

  async function handleDownload() {
    if (!row || downloading) return
    try {
      setDownloading(true)
      await downloadInvoicePDF(row, genAt)
    } catch {
      setError('Could not generate the PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="a-page inv-root">
      <style>{`
        .inv-root { padding-bottom: 48px; }
        .inv-bar {
          position: sticky; top: 0; z-index: 50;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid var(--c-border);
          margin: -24px -24px 28px;
          padding: 16px 24px;
        }
        .inv-stage {
          display: flex; justify-content: center;
          overflow-x: auto;
          padding: 4px;
        }
        .inv-sheet-shadow { box-shadow: var(--shadow-md); border-radius: 4px; }
        .inv-state {
          max-width: 760px; margin: 0 auto; background: #fff;
          border: 1px solid var(--c-border); border-radius: 12px;
          padding: 60px 24px; text-align: center;
        }
      `}</style>

      {/* Screen toolbar */}
      <div className="inv-bar">
        <div className="a-head" style={{ marginBottom: 0 }}>
          <div>
            <div className="a-eyebrow">Ledger Report</div>
            <h1 className="a-title">Invoice <em>Preview</em></h1>
          </div>
          <div className="a-head-actions">
            <button type="button" className="a-btn a-btn--ghost" onClick={() => window.history.back()}>
              <ArrowLeft size={16} /> Back
            </button>
            <button
              type="button"
              className="a-btn a-btn--primary"
              onClick={handleDownload}
              disabled={!row || loading || downloading}
            >
              <Download size={16} /> {downloading ? 'Preparing…' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="inv-state">
          <div className="a-loader-row" style={{ justifyContent: 'center' }}>
            <span className="a-loader" />
            <span className="a-loader-label">Loading invoice…</span>
          </div>
        </div>
      ) : error ? (
        <div className="inv-state">
          <div className="a-empty-title">Unable to load invoice</div>
          <div className="a-empty-text" style={{ margin: '0 auto' }}>{error}</div>
        </div>
      ) : !row ? (
        <div className="inv-state">
          <div className="a-empty-title">Not found</div>
          <div className="a-empty-text" style={{ margin: '0 auto' }}>This invoice could not be located.</div>
        </div>
      ) : (
        <div className="inv-stage">
          {/* WYSIWYG: same markup that gets rendered into the PDF */}
          <div
            className="inv-sheet-shadow"
            dangerouslySetInnerHTML={{ __html: buildInvoiceHTML(row, genAt, row.item_photo || null) }}
          />
        </div>
      )}
    </div>
  )
}
