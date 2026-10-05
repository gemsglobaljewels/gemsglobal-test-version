/**
 * Self-contained invoice renderer + client-side PDF generator.
 *
 * The PDF is built by capturing a self-styled A4 sheet (all styles inline, so it
 * is independent of the admin / Tailwind CSS) and placing it onto a single A4
 * page via jsPDF. This deliberately avoids `window.print()` so the output has:
 *   - no browser print header (the site <title>),
 *   - no browser print footer (the localhost / page URL),
 *   - a guaranteed single page,
 *   - a custom filename built from the customer name + bill number.
 */

export type LedgerRow = Record<string, any>

/* ───────────────────────── formatters ───────────────────────── */

const fmt = (n: any) => (Number.isFinite(Number(n)) ? Number(n).toFixed(3) : '—')
const fmt2 = (n: any) => (Number.isFinite(Number(n)) ? Number(n).toFixed(2) : '—')

// Weight that may be numeric or free-form text: append " g" only when numeric.
const fmtWeight = (v: any) => {
  if (v === null || v === undefined || String(v).trim() === '') return '—'
  return Number.isFinite(Number(v)) ? `${fmt(v)} g` : esc(v)
}

const esc = (s: any) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export function fmtInvoiceDate(d: any): string {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** "25 Jun 2026, 02:30:45 PM" — date plus time with minutes and seconds. */
export function fmtGeneratedAt(d: Date): string {
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
  return `${date}, ${time}`
}

/* ───────────────────────── palette ───────────────────────── */

const C = {
  ink: '#1b1b1b',
  soft: '#565656',
  faint: '#9a9a9a',
  line: '#e6e3dd',
  lineStrong: '#cfcabf',
  zebra: '#f7f5f1',
  gold: '#a9854c',
  goldSoft: '#c7a86a',
  panel: '#fbfaf7',
}

/* ───────────────────────── HTML builder ───────────────────────── */

/**
 * Returns the full invoice sheet as an HTML string (single root element, fixed
 * 760px width). Pass `imgSrc` as a data URL (preferred for PDF capture) or a
 * remote URL (fine for on-screen preview); null renders a placeholder.
 */
export function buildInvoiceHTML(row: LedgerRow, genAt: Date, imgSrc: string | null): string {
  const r = row || {}

  const billNo = esc(r.bill_no || r.design_no || '—')
  const billDate = fmtInvoiceDate(r.bill_date || r.created_at || Date.now())
  const creditDate = r.credit_metal_date ? fmtInvoiceDate(r.credit_metal_date) : null
  const customer = esc(r.customer_name || '—')
  const designName = esc(r.design_name || '—')
  const designNo = esc(r.design_no || '—')
  const goldKt = r.gold_kt ? `${esc(r.gold_kt)} KT` : null

  const totalPrice = fmt2(r.total_price ?? r.total_payable)
  const netTotal = fmt2(r.final_amount ?? r.total_price ?? r.total_payable)

  const solDia =
    r.solitaire_diamond_pcs || r.solitaire_diamond_wt
      ? `${r.solitaire_diamond_pcs ?? 0} pcs · ${fmt(r.solitaire_diamond_wt)} ct`
      : '—'
  const looseDia =
    r.loose_diamond_pcs || r.loose_diamond_wt
      ? `${r.loose_diamond_pcs ?? 0} pcs · ${fmt(r.loose_diamond_wt)} ct`
      : '—'

  const makingCharges =
    (r.labour || 0) * (r.labour_rate || 0) || r.metal_labour_amount
  const diamondAmount = r.diamond_price ?? r.diamond_labour_amount

  /* small style fragments */
  const labelTd = `font-size:8.5px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${C.faint};padding:2px 10px 2px 0;text-align:right;white-space:nowrap;`
  const valTd = `font-size:12px;font-weight:700;color:${C.ink};text-align:right;white-space:nowrap;`

  const specTh = `width:15%;text-align:left;background:${C.zebra};border:1px solid ${C.line};padding:8px 11px;font-size:8.5px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:${C.soft};`
  const specTd = `width:35%;border:1px solid ${C.line};padding:8px 11px;font-size:11.5px;font-weight:600;color:${C.ink};font-variant-numeric:tabular-nums;`

  const sumLabel = `font-size:11px;color:${C.soft};padding:7px 13px;border-bottom:1px solid ${C.line};`
  const sumVal = `font-size:11px;font-weight:700;color:${C.ink};text-align:right;padding:7px 13px;border-bottom:1px solid ${C.line};font-variant-numeric:tabular-nums;`

  const specRow = (l1: string, v1: string, l2: string, v2: string) =>
    `<tr><th style="${specTh}">${l1}</th><td style="${specTd}">${v1}</td><th style="${specTh}">${l2}</th><td style="${specTd}">${v2}</td></tr>`

  const sumRow = (l: string, v: string) =>
    `<tr><td style="${sumLabel}">${l}</td><td style="${sumVal}">${v}</td></tr>`

  const itemMedia = imgSrc
    ? `<img src="${esc(imgSrc)}" alt="" style="width:62px;height:62px;flex:0 0 auto;object-fit:contain;border:1px solid ${C.line};border-radius:8px;background:#fff;" />`
    : `<div style="width:62px;height:62px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;border:1px dashed ${C.lineStrong};border-radius:8px;color:${C.faint};font-size:9px;">No Image</div>`

  return `
<div style="width:760px;box-sizing:border-box;background:#ffffff;color:${C.ink};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;border:1px solid ${C.line};overflow:hidden;">
  <div style="height:7px;background:${C.gold};"></div>

  <div style="padding:32px 40px 26px;box-sizing:border-box;">

    <!-- Header -->
    <table style="width:100%;border-collapse:collapse;"><tbody><tr>
      <td style="vertical-align:top;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:25px;font-weight:700;letter-spacing:0.02em;line-height:1.05;color:${C.ink};">Gems <span style="font-style:italic;font-weight:400;color:${C.gold};">Global</span> Jewels</div>
        <div style="font-size:9.5px;letter-spacing:0.18em;text-transform:uppercase;color:${C.faint};margin-top:7px;">Fine Jewellery &middot; Surat</div>
      </td>
      <td style="vertical-align:top;text-align:right;width:255px;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:23px;font-weight:700;letter-spacing:0.26em;text-transform:uppercase;color:${C.ink};">Invoice</div>
        <table style="border-collapse:collapse;margin-left:auto;margin-top:11px;"><tbody>
          <tr><td style="${labelTd}">Bill No</td><td style="${valTd}">${billNo}</td></tr>
          <tr><td style="${labelTd}">Date</td><td style="${valTd}">${billDate}</td></tr>
          ${creditDate ? `<tr><td style="${labelTd}">Credit Date</td><td style="${valTd}">${creditDate}</td></tr>` : ''}
        </tbody></table>
      </td>
    </tr></tbody></table>

    <div style="height:2px;background:${C.ink};margin:18px 0 16px;"></div>

    <!-- Billed to -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:18px;"><tbody><tr>
      <td style="vertical-align:top;">
        <div style="font-size:8.5px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${C.faint};margin-bottom:5px;">Billed To</div>
        <div style="font-size:16px;font-weight:700;color:${C.ink};">${customer}</div>
      </td>
      <td style="vertical-align:top;text-align:right;">
        <div style="font-size:8.5px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${C.faint};margin-bottom:5px;">Design</div>
        <div style="font-size:13px;font-weight:700;color:${C.ink};">${designNo}${goldKt ? ` &middot; ${goldKt}` : ''}</div>
      </td>
    </tr></tbody></table>

    <!-- Item -->
    <div style="font-size:9.5px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${C.soft};margin:0 0 9px;">Item Details</div>
    <div style="display:flex;align-items:center;gap:15px;border:1px solid ${C.line};border-radius:10px;padding:13px 15px;margin-bottom:16px;background:${C.panel};">
      ${itemMedia}
      <div style="flex:1 1 auto;min-width:0;">
        <div style="font-size:15px;font-weight:700;color:${C.ink};">${designName}</div>
        <div style="font-size:11px;color:${C.soft};margin-top:3px;">Design No: ${designNo}${goldKt ? ` &middot; ${goldKt}` : ''}</div>
      </div>
      <div style="text-align:right;flex:0 0 auto;">
        <div style="font-size:8.5px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${C.faint};">Total Price</div>
        <div style="font-size:18px;font-weight:700;color:${C.ink};margin-top:2px;font-variant-numeric:tabular-nums;">&#8377; ${totalPrice}</div>
      </div>
    </div>

    <!-- Specifications -->
    <div style="font-size:9.5px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${C.soft};margin:0 0 9px;">Specifications</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:18px;"><tbody>
      ${specRow('Item No.', designNo, 'Gold KT', goldKt ? esc(r.gold_kt) : '—')}
      ${specRow('Gross Wt', fmtWeight(r.gross_weight), 'Net Wt', fmtWeight(r.net_weight))}
      ${specRow('Touch %', fmt2(r.touch_purity), 'Fine Wt', `${fmt(r.fine_weight)} g`)}
      ${specRow('Metal Rate', fmt2(r.metal_rate), 'Total Metal', fmt2(r.total_metal ?? r.metal_price))}
      ${specRow('Solitaire Dia', solDia, 'Loose Dia', looseDia)}
      ${specRow('Diamond Labour', fmt2(r.diamond_labour_amount), 'Metal Labour', fmt2(r.metal_labour_amount))}
    </tbody></table>

    <!-- Summary cards -->
    <div style="display:flex;gap:14px;margin-bottom:18px;align-items:flex-start;">
      <div style="flex:1 1 0;border:1px solid ${C.line};border-radius:10px;overflow:hidden;">
        <div style="font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${C.soft};padding:8px 13px;background:${C.zebra};border-bottom:1px solid ${C.line};">Amount Summary</div>
        <table style="width:100%;border-collapse:collapse;"><tbody>
          ${sumRow('Diamond Amount', `&#8377; ${fmt2(diamondAmount)}`)}
          ${sumRow('Making Charges', `&#8377; ${fmt2(makingCharges)}`)}
          ${sumRow('Due Amount', `&#8377; ${fmt2(r.due_amount)}`)}
          <tr><td style="${sumLabel}border-bottom:none;">Credit Amount</td><td style="${sumVal}border-bottom:none;">&#8377; ${fmt2(r.credit_amount)}</td></tr>
        </tbody></table>
      </div>
      <div style="flex:1 1 0;border:1px solid ${C.line};border-radius:10px;overflow:hidden;">
        <div style="font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${C.soft};padding:8px 13px;background:${C.zebra};border-bottom:1px solid ${C.line};">Material &amp; Balance</div>
        <table style="width:100%;border-collapse:collapse;"><tbody>
          ${sumRow('Gold Credit', `&#8377; ${fmt2(r.mat_credit_price)}`)}
          ${sumRow('Gold Debit', `&#8377; ${fmt2(r.mat_debit_price)}`)}
          ${sumRow('Credit Metal', esc(r.mat_credit_metal || '—'))}
          <tr><td style="${sumLabel}border-bottom:none;">Diamond Wt</td><td style="${sumVal}border-bottom:none;">${fmt(r.diamond_weight ?? r.loose_diamond_wt)} ct</td></tr>
        </tbody></table>
      </div>
    </div>

    <!-- Grand total -->
    <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border:2px solid ${C.ink};border-radius:10px;background:${C.ink};">
      <span style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#fff;">Total Payable</span>
      <span style="font-size:22px;font-weight:700;color:#fff;font-variant-numeric:tabular-nums;">&#8377; ${netTotal}</span>
    </div>

    <!-- Footer -->
    <table style="width:100%;border-collapse:collapse;margin-top:24px;"><tbody><tr>
      <td style="vertical-align:bottom;">
        <div style="font-size:11.5px;color:${C.soft};">Thank you for your business.</div>
        <div style="font-size:12px;font-weight:700;color:${C.ink};margin-top:3px;">Gems Global Jewels</div>
      </td>
      <td style="vertical-align:bottom;text-align:center;width:190px;">
        <div style="height:30px;"></div>
        <div style="border-top:1px solid ${C.lineStrong};margin-bottom:5px;"></div>
        <div style="font-size:10.5px;color:${C.faint};">Authorised Signatory</div>
      </td>
    </tr></tbody></table>

    <div style="text-align:center;margin-top:20px;padding-top:11px;border-top:1px solid ${C.line};font-size:10px;color:${C.faint};letter-spacing:0.01em;">
      Generated on ${esc(fmtGeneratedAt(genAt))} &middot; Computer-generated invoice, no signature required.
    </div>

  </div>
</div>`.trim()
}

/* ───────────────────────── PDF generation ───────────────────────── */

/** Fetches a remote image and converts it to a data URL (avoids tainting the
 * html2canvas output). Returns null on any failure so the caller can fall back
 * to the placeholder box. */
async function resolveImage(url?: string | null): Promise<string | null> {
  if (!url || typeof url !== 'string') return null
  if (url.startsWith('data:')) return url
  try {
    const res = await fetch(url, { mode: 'cors', cache: 'force-cache' })
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise<string | null>((resolve) => {
      const fr = new FileReader()
      fr.onload = () => resolve(typeof fr.result === 'string' ? fr.result : null)
      fr.onerror = () => resolve(null)
      fr.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

const slug = (s: string) =>
  String(s)
    .replace(/[^\w\s-]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

export function invoiceFilename(row: LedgerRow): string {
  const inv = slug(String(row?.bill_no || row?.design_no || row?.id || '').slice(0, 40))
  const cust = slug(String(row?.customer_name || '').slice(0, 40))
  const parts = ['Invoice', inv, cust].filter(Boolean)
  return `${parts.join('_')}.pdf`
}

/**
 * Renders the invoice to a single-page A4 PDF and triggers a download.
 * Resolves the item image to a data URL first so the canvas is never tainted.
 */
export async function downloadInvoicePDF(row: LedgerRow, genAt?: Date): Promise<void> {
  if (typeof window === 'undefined') return
  const when = genAt ?? new Date()

  const [jspdfMod, h2cMod] = await Promise.all([import('jspdf'), import('html2canvas-pro')])
  const JsPDF: any = (jspdfMod as any).jsPDF || (jspdfMod as any).default
  const html2canvas: any = (h2cMod as any).default || h2cMod

  const imgSrc = await resolveImage(row?.item_photo)

  const holder = document.createElement('div')
  holder.style.cssText =
    'position:fixed;left:-12000px;top:0;width:760px;background:#ffffff;z-index:-1;pointer-events:none;'
  holder.innerHTML = buildInvoiceHTML(row, when, imgSrc)
  document.body.appendChild(holder)
  const sheet = (holder.firstElementChild as HTMLElement) || holder

  try {
    // Let layout settle and fonts load before capture.
    if ((document as any).fonts?.ready) {
      try {
        await (document as any).fonts.ready
      } catch {
        /* ignore */
      }
    }
    await new Promise((r) => setTimeout(r, 60))

    const canvas = await html2canvas(sheet, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      windowWidth: 760,
    })

    if (!canvas.width || !canvas.height) {
      throw new Error('Failed to render invoice: canvas has zero dimensions')
    }

    const pdf = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()

    // Fit full width; if the result is taller than one page, scale to fit so it
    // always stays a single page.
    let imgW = pageW
    let imgH = (canvas.height * imgW) / canvas.width
    if (imgH > pageH) {
      imgH = pageH
      imgW = (canvas.width * imgH) / canvas.height
    }
    const x = (pageW - imgW) / 2

    const data = canvas.toDataURL('image/png')
    pdf.addImage(data, 'PNG', x, 0, imgW, imgH, undefined, 'FAST')
    pdf.save(invoiceFilename(row))
  } finally {
    document.body.removeChild(holder)
  }
}
