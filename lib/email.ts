import nodemailer from 'nodemailer'

// ─── SMTP Transporter (lazy-initialized to ensure env vars are loaded) ───────
function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  })
}

/* ════════════════════════════════════════════════════════════════════════════
   SHARED EMAIL DESIGN SYSTEM  ·  "Light Atelier"
   One professional, on-brand structure for every transactional email.
   Light ivory canvas · white cards · dark-brown ink · muted-taupe accent.
   Web-safe serif for headings, sans for body. No icons, no emojis.
   ════════════════════════════════════════════════════════════════════════════ */

const EMAIL = {
  pageBg: '#F1EBE3', // soft ivory canvas (mirrors storefront --c-bg family)
  cardBg: '#FFFFFF',
  surface: '#FAF7F2', // inner panels
  ink: '#2C231E', // headings / strong text  (--c-text)
  body: '#5B5049', // body copy
  faint: '#9A8F86', // labels / meta
  accent: '#8F7A70', // taupe brand accent      (--c-accent)
  accentSoft: 'rgba(143,122,112,0.08)',
  line: '#E7DED4', // hairline borders
  serif: "Georgia, 'Times New Roman', Times, serif",
  sans: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  // semantic accents (muted, print-like — no neon)
  ok: '#5E7355', // positive / delivered
  warn: '#9A6C3C', // processing
  info: '#5B6B7A', // shipped / in-transit
  danger: '#B94040', // cancelled / refunded (--c-error)
  neutral: '#8A8078',
}

function emailBrand(): string {
  return process.env.SMTP_FROM_NAME || 'Gems Global Jewels'
}

// Public site URL for links inside emails. NEVER returns localhost or old domains — a customer
// clicking a link from their inbox must land on the live site. Falls back to the
// production domain when the env var is unset or points at localhost (dev).
function getPublicUrl(): string {
  const candidates = [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_SITE_URL, process.env.APP_URL]
  for (const c of candidates) {
    if (c && !/localhost|127\.0\.0\.1|0\.0\.0\.0|vercel\.app/.test(c)) return c.replace(/\/+$/, '')
  }
  return 'https://gemsglobaljewels.com'
}

// Resolve a product image to an absolute URL so it renders in every email client.
// Relative keys are prefixed with the R2 bucket (or the public site URL).
function absoluteImg(img?: string | null): string | null {
  if (!img || typeof img !== 'string') return null
  const url = img.trim()
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('//')) return `https:${url}`
  const base = (process.env.R2_PUBLIC_URL || getPublicUrl()).replace(/\/+$/, '')
  return `${base}/${url.replace(/^\/+/, '')}`
}

// ── Outer wrapper: masthead → hero → sections → footer ──────────────────────
function wrapEmail(opts: {
  title: string
  preheader?: string
  accent?: string
  hero: string
  sections: string
  footer: string
}): string {
  const accent = opts.accent || EMAIL.accent
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${opts.title}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    /* Progressive mobile enhancement — desktop layout/colours stay identical,
       small screens just tighten gutters, scale the heading and stack columns.
       Uses !important to override the inline styles email clients require. */
    @media only screen and (max-width:600px){
      .em-shell{ width:100% !important; }
      .em-gutter{ padding-left:22px !important; padding-right:22px !important; }
      .em-hero-h1{ font-size:25px !important; line-height:1.24 !important; }
      .em-strip-cell{ display:block !important; width:100% !important; border-left:0 !important; border-top:1px solid ${EMAIL.line} !important; }
      .em-content img{ max-width:100% !important; height:auto !important; }
      img.em-fluid{ max-width:100% !important; height:auto !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${EMAIL.pageBg};font-family:${EMAIL.sans};-webkit-font-smoothing:antialiased;">
  ${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL.pageBg};padding:40px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="em-shell" style="max-width:600px;width:100%;background:${EMAIL.cardBg};border:1px solid ${EMAIL.line};">
          <tr><td style="height:2px;background:${accent};line-height:2px;font-size:0;">&nbsp;</td></tr>
          ${opts.hero}
          ${opts.sections}
          ${opts.footer}
        </table>
        <div style="max-width:600px;margin:14px auto 0;text-align:center;font-family:${EMAIL.sans};font-size:10px;letter-spacing:0.05em;color:${EMAIL.faint};line-height:1.6;">
          This is a transactional email from ${emailBrand()}.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Masthead + hero heading ─────────────────────────────────────────────────
function heroBlock(opts: {
  eyebrow: string
  title: string
  titleAccent?: string
  sub?: string
  accent?: string
}): string {
  const accent = opts.accent || EMAIL.accent
  return `
  <tr>
    <td class="em-gutter" style="padding:38px 40px 0;text-align:center;">
      <div style="font-family:${EMAIL.serif};font-size:16px;letter-spacing:0.42em;text-transform:uppercase;color:${EMAIL.ink};font-weight:400;">${emailBrand()}</div>
      <div style="font-size:8px;letter-spacing:0.38em;text-transform:uppercase;color:${EMAIL.faint};margin-top:7px;">Fine Jewellery</div>
    </td>
  </tr>
  <tr>
    <td class="em-gutter" style="padding:26px 40px 0;text-align:center;">
      <span style="display:inline-block;width:26px;height:1px;background:${accent};vertical-align:middle;"></span>
      <span style="font-size:9px;letter-spacing:0.34em;text-transform:uppercase;color:${accent};padding:0 12px;vertical-align:middle;">${opts.eyebrow}</span>
      <span style="display:inline-block;width:26px;height:1px;background:${accent};vertical-align:middle;"></span>
    </td>
  </tr>
  <tr>
    <td class="em-gutter" style="padding:14px 40px 0;text-align:center;">
      <h1 class="em-hero-h1" style="margin:0;font-family:${EMAIL.serif};font-size:30px;line-height:1.2;font-weight:400;color:${EMAIL.ink};letter-spacing:0.01em;">${opts.title}${opts.titleAccent ? ` <span style="font-style:italic;color:${accent};">${opts.titleAccent}</span>` : ''}</h1>
    </td>
  </tr>
  ${opts.sub ? `
  <tr>
    <td class="em-gutter" style="padding:16px 52px 0;text-align:center;">
      <p style="margin:0;font-size:13.5px;line-height:1.75;color:${EMAIL.body};">${opts.sub}</p>
    </td>
  </tr>` : ''}
  <tr><td style="height:30px;line-height:30px;font-size:0;">&nbsp;</td></tr>`
}

// ── Greeting paragraph ──────────────────────────────────────────────────────
function greetingBlock(name: string, message: string): string {
  return `
  <tr>
    <td class="em-gutter" style="padding:0 40px 24px;">
      <p style="margin:0 0 12px;font-family:${EMAIL.serif};font-size:16px;color:${EMAIL.ink};">Dear ${name},</p>
      <p style="margin:0;font-size:13.5px;line-height:1.85;color:${EMAIL.body};">${message}</p>
    </td>
  </tr>`
}

// ── Detail panel with an uppercase section label ────────────────────────────
function panel(opts: { label?: string; accent?: string; innerRows: string }): string {
  const accent = opts.accent || EMAIL.accent
  return `
  <tr>
    <td class="em-gutter" style="padding:0 40px 22px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL.surface};border:1px solid ${EMAIL.line};">
        ${opts.label ? `
        <tr>
          <td colspan="2" style="padding:16px 22px 12px;border-bottom:1px solid ${EMAIL.line};">
            <span style="font-size:10px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:${accent};">${opts.label}</span>
          </td>
        </tr>` : ''}
        ${opts.innerRows}
      </table>
    </td>
  </tr>`
}

// ── Key / value rows (value may contain raw HTML, e.g. a status pill) ────────
function kvRows(rows: Array<{ k: string; v: string; strike?: boolean }>): string {
  const last = rows.length - 1
  return rows.map((r, i) => `
    <tr>
      <td style="padding:${i === 0 ? 16 : 8}px 22px ${i === last ? 16 : 8}px;width:140px;vertical-align:top;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${EMAIL.faint};">${r.k}</td>
      <td style="padding:${i === 0 ? 16 : 8}px 22px ${i === last ? 16 : 8}px;vertical-align:top;font-size:14px;color:${r.strike ? EMAIL.faint : EMAIL.ink};${r.strike ? 'text-decoration:line-through;' : ''}">${r.v}</td>
    </tr>`).join('')
}

// ── Status pill (typographic, no dot glyph) ─────────────────────────────────
function statusPill(label: string, color: string): string {
  return `<span style="display:inline-block;padding:5px 14px;border:1px solid ${color};color:${color};font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;">${label}</span>`
}

// ── Button ──────────────────────────────────────────────────────────────────
function ctaButton(href: string, label: string, opts?: { accent?: string; outline?: boolean }): string {
  const accent = opts?.accent || EMAIL.accent
  if (opts?.outline) {
    return `<a href="${href}" target="_blank" style="display:inline-block;padding:13px 34px;border:1px solid ${accent};color:${accent};font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;text-decoration:none;font-family:${EMAIL.sans};">${label}</a>`
  }
  return `<a href="${href}" target="_blank" style="display:inline-block;padding:14px 38px;background:${accent};color:#FFFFFF;font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;text-decoration:none;font-family:${EMAIL.sans};">${label}</a>`
}

// ── Centered callout panel ──────────────────────────────────────────────────
function calloutPanel(opts: {
  eyebrow?: string
  title?: string
  text?: string
  buttonHtml?: string
  extraHtml?: string
  accent?: string
}): string {
  const accent = opts.accent || EMAIL.accent
  return `
  <tr>
    <td class="em-gutter" style="padding:0 40px 22px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL.accentSoft};border:1px solid ${EMAIL.line};">
        <tr>
          <td style="padding:28px 24px;text-align:center;">
            ${opts.eyebrow ? `<p style="margin:0 0 8px;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:${accent};">${opts.eyebrow}</p>` : ''}
            ${opts.title ? `<p style="margin:0 0 10px;font-family:${EMAIL.serif};font-size:21px;font-style:italic;color:${EMAIL.ink};font-weight:400;">${opts.title}</p>` : ''}
            ${opts.text ? `<p style="margin:0 0 20px;font-size:13px;line-height:1.7;color:${EMAIL.body};">${opts.text}</p>` : ''}
            ${opts.buttonHtml || ''}
            ${opts.extraHtml || ''}
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

// ── Footer ──────────────────────────────────────────────────────────────────
function footerBlock(opts: {
  note?: string
  contactEmail?: string
  whatsapp?: string
  accent?: string
}): string {
  const accent = opts.accent || EMAIL.accent
  return `
  <tr>
    <td class="em-gutter" style="padding:8px 40px 0;">
      <div style="height:1px;background:${EMAIL.line};line-height:1px;font-size:0;">&nbsp;</div>
    </td>
  </tr>
  <tr>
    <td class="em-gutter" style="padding:24px 40px 34px;text-align:center;">
      ${opts.note ? `<p style="margin:0 0 14px;font-size:12.5px;line-height:1.75;color:${EMAIL.body};">${opts.note}</p>` : ''}
      ${opts.contactEmail ? `<p style="margin:0 0 4px;font-size:12px;color:${EMAIL.faint};">${opts.contactEmail}</p>` : ''}
      ${opts.whatsapp ? `<p style="margin:0;font-size:12px;color:${EMAIL.faint};">${opts.whatsapp}</p>` : ''}
      <p style="margin:18px 0 0;font-family:${EMAIL.serif};font-size:11px;letter-spacing:0.26em;text-transform:uppercase;color:${accent};">${emailBrand()} &middot; Fine Jewellery</p>
    </td>
  </tr>
  <tr><td style="height:2px;background:${accent};line-height:2px;font-size:0;">&nbsp;</td></tr>`
}

// ─── Types ──────────────────────────────────────────────────────────────────
interface AppointmentEmailData {
  customerName: string
  customerEmail: string
  customerPhone: string
  service: string
  date: string        // e.g. "2026-03-25"
  time: string        // e.g. "14:00"
  notes?: string
  appointmentId: string
  appointmentType?: 'visit' | 'online'
  meetingLink?: string
  location?: string          // showroom address for in-person visits
  preferredPlatform?: string // customer's preferred video platform (online)
}

// ─── Service label map ──────────────────────────────────────────────────────
const SERVICE_LABELS: Record<string, string> = {
  consultation: 'Personal Consultation',
  fitting: 'Jewelry Fitting',
  'custom-design': 'Custom Design Session',
  repair: 'Repair & Restoration',
}

// Resolve a human-friendly label for any service slug, including admin-defined
// ones not present in SERVICE_LABELS (slug → Title Case).
function resolveServiceLabel(service: string): string {
  if (SERVICE_LABELS[service]) return SERVICE_LABELS[service]
  return String(service || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || 'Appointment'
}

// ─── Helper: Generate .ics calendar content ─────────────────────────────────
function generateICS(data: AppointmentEmailData, meetLink: string): string {
  const { date, time, customerName, service } = data
  const isOnline = data.appointmentType !== 'visit'
  const label = resolveServiceLabel(service)
  const locationLine = isOnline ? `Google Meet: ${meetLink}` : (data.location || 'Our showroom')

  // Parse date & time → UTC timestamps for ICS
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)

  // Start time (IST → we keep it as local for simplicity; ICS will use DTSTART with TZID)
  const pad = (n: number) => String(n).padStart(2, '0')
  const startStr = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`

  // End time = start + 1 hour
  const endHour = hour + 1
  const endStr = `${year}${pad(month)}${pad(day)}T${pad(endHour)}${pad(minute)}00`

  const now = new Date()
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gems Global Jewels//Appointment//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `DTSTART;TZID=Asia/Kolkata:${startStr}`,
    `DTEND;TZID=Asia/Kolkata:${endStr}`,
    `DTSTAMP:${stamp}`,
    `UID:appointment-${data.appointmentId}@gemsglobaljewels.com`,
    `SUMMARY:${label} — Gems Global Jewels`,
    `DESCRIPTION:Your appointment with Gems Global Jewels has been confirmed.\\n\\nService: ${label}\\nCustomer: ${customerName}\\n${locationLine}`,
    `LOCATION:${locationLine}`,
    ...(isOnline ? [`URL:${meetLink}`] : []),
    'STATUS:CONFIRMED',
    `ORGANIZER;CN=Gems Global Jewels:mailto:${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}`,
    `ATTENDEE;CN=${customerName};RSVP=TRUE:mailto:${data.customerEmail}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Appointment reminder — Gems Global Jewels',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

// ─── Helper: Format date/time for display ───────────────────────────────────
function formatDisplayDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatDisplayTime(timeStr: string): string {
  try {
    const [h, m] = timeStr.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`
  } catch {
    return timeStr
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   1 · APPOINTMENT CONFIRMATION
   ════════════════════════════════════════════════════════════════════════════ */
function buildConfirmationHTML(data: AppointmentEmailData, meetLink: string): string {
  const label = resolveServiceLabel(data.service)
  const displayDate = formatDisplayDate(data.date)
  const displayTime = formatDisplayTime(data.time)
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
  const isOnline = data.appointmentType !== 'visit'

  const detailRows: Array<{ k: string; v: string }> = [
    { k: 'Service', v: label },
    { k: 'Mode', v: isOnline ? 'Online Consultation' : 'In-Person Visit' },
    { k: 'Date', v: displayDate },
    { k: 'Time', v: displayTime },
  ]
  if (isOnline && data.preferredPlatform) {
    detailRows.push({ k: 'Preferred Platform', v: data.preferredPlatform })
  }
  detailRows.push({ k: 'Status', v: statusPill('Confirmed', EMAIL.ok) })

  // Online → join-by-video callout. Visit → showroom address + directions.
  const actionPanel = isOnline
    ? calloutPanel({
      eyebrow: 'Virtual Consultation',
      title: 'Join via Video Call',
      text: 'At your appointment time, use the button below to join your private consultation.',
      buttonHtml: ctaButton(meetLink, 'Join Meeting'),
      extraHtml: `<p style="margin:16px 0 0;font-size:11px;color:${EMAIL.faint};word-break:break-all;">${meetLink}</p>`,
    })
    : calloutPanel({
      eyebrow: 'In-Person Visit',
      title: 'Visit Our Showroom',
      text: data.location
        ? `We look forward to welcoming you at:<br/><strong style="color:${EMAIL.ink};">${data.location}</strong>`
        : 'We look forward to welcoming you at our showroom. Our team will be in touch with directions.',
      buttonHtml: data.location
        ? ctaButton(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.location)}`, 'Get Directions', { outline: true })
        : '',
    })

  const sections = `
    ${greetingBlock(
    data.customerName,
    'We are delighted to confirm your appointment. All the details are set out below, and a calendar invitation is attached for your convenience.'
  )}
    ${panel({
    label: 'Appointment Details',
    innerRows: kvRows(detailRows),
  })}
    ${panel({
    label: 'Your Information',
    innerRows: kvRows([
      { k: 'Name', v: data.customerName },
      { k: 'Email', v: data.customerEmail },
      { k: 'Phone', v: data.customerPhone || 'Not provided' },
    ]),
  })}
    ${actionPanel}
    ${panel({
    label: 'Add to Calendar',
    innerRows: `
        <tr><td style="padding:16px 22px;font-size:12.5px;line-height:1.7;color:${EMAIL.body};">
          A calendar invitation (<span style="color:${EMAIL.ink};">appointment.ics</span>) is attached to this email. Open it to add this appointment to Google Calendar, Outlook, or Apple Calendar.
        </td></tr>`,
  })}`

  return wrapEmail({
    title: 'Appointment Confirmed',
    preheader: `Your ${label} on ${displayDate} at ${displayTime} is confirmed.`,
    hero: heroBlock({
      eyebrow: 'Appointment Confirmed',
      title: 'Appointment',
      titleAccent: 'Confirmed',
      sub: 'Thank you for booking with us. We look forward to welcoming you.',
    }),
    sections,
    footer: footerBlock({
      note: `To reschedule or cancel, simply reply to this email${whatsapp ? ` or contact us at ${whatsapp}` : ''}.`,
      whatsapp,
    }),
  })
}

export async function sendAppointmentConfirmationEmail(data: AppointmentEmailData): Promise<boolean> {
  try {
    if (!data.customerEmail) {
      console.log('[Email] No customer email provided, skipping confirmation email')
      return false
    }
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('[Email] SMTP credentials not configured, skipping email')
      return false
    }

    const isOnline = data.appointmentType !== 'visit'
    // Prefer the meeting link the admin set on this appointment; fall back to env.
    const meetLink = data.meetingLink || process.env.GOOGLE_MEET_LINK || 'https://meet.google.com/new'
    const brandName = emailBrand()
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER

    const label = resolveServiceLabel(data.service)
    const displayDate = formatDisplayDate(data.date)
    const displayTime = formatDisplayTime(data.time)

    const icsContent = generateICS(data, meetLink)
    const html = buildConfirmationHTML(data, meetLink)

    const locationText = isOnline
      ? `Meeting Link: ${meetLink}${data.preferredPlatform ? `\nPreferred Platform: ${data.preferredPlatform}` : ''}`
      : `Location: ${data.location || 'Our showroom'}`

    const info = await getTransporter().sendMail({
      from: `"${brandName}" <${fromEmail}>`,
      to: data.customerEmail,
      subject: `Appointment Confirmed — ${label} on ${displayDate}`,
      text: `Dear ${data.customerName},\n\nYour appointment has been confirmed.\n\nService: ${label}\nMode: ${isOnline ? 'Online Consultation' : 'In-Person Visit'}\nDate: ${displayDate}\nTime: ${displayTime}\n${locationText}\n\nThank you,\n${brandName}`,
      html,
      attachments: [
        {
          filename: 'appointment.ics',
          content: icsContent,
          contentType: 'text/calendar; method=REQUEST',
        },
      ],
      icalEvent: {
        method: 'REQUEST',
        content: icsContent,
      },
    })

    console.log(`[Email] Confirmation email sent to ${data.customerEmail}: ${info.messageId}`)
    return true
  } catch (error) {
    console.error('[Email] Failed to send confirmation email:', error)
    return false
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   2 · APPOINTMENT COMPLETION / THANK-YOU
   ════════════════════════════════════════════════════════════════════════════ */
function buildCompletionHTML(data: AppointmentEmailData): string {
  const serviceLabel = resolveServiceLabel(data.service)
  const displayDate = formatDisplayDate(data.date)
  const displayTime = formatDisplayTime(data.time)
  const brandName = emailBrand()
  const feedbackEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || ''
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''

  // Rating: numbered 1–5 links (no icons). Each opens a pre-filled feedback email.
  const ratingLinks = [1, 2, 3, 4, 5].map((n) => {
    const subject = encodeURIComponent(`Feedback: ${n}/5 — ${serviceLabel}`)
    const body = encodeURIComponent(
      `Hi ${brandName},\n\nI would rate my experience ${n} out of 5.\n\nName: ${data.customerName}\nService: ${serviceLabel}\nDate: ${displayDate}\n\nMy comments:\n\n`
    )
    return `<a href="mailto:${feedbackEmail}?subject=${subject}&body=${body}" style="display:inline-block;width:44px;height:44px;line-height:44px;text-align:center;border:1px solid ${EMAIL.line};background:${EMAIL.cardBg};color:${EMAIL.ink};font-family:${EMAIL.serif};font-size:17px;text-decoration:none;margin:0 4px;">${n}</a>`
  }).join('')

  const ratingExtra = `
    <div style="margin:0 auto 12px;">${ratingLinks}</div>
    <p style="margin:0;font-size:11px;letter-spacing:0.06em;color:${EMAIL.faint};">1 = Poor &nbsp;&middot;&nbsp; 5 = Excellent</p>`

  const sections = `
    ${greetingBlock(
    data.customerName,
    'Your appointment is now complete. It was a genuine pleasure to serve you, and we hope you had a wonderful experience with us.'
  )}
    ${panel({
    label: 'Session Summary',
    innerRows: kvRows([
      { k: 'Service', v: serviceLabel },
      { k: 'Date', v: displayDate },
      { k: 'Time', v: displayTime },
      { k: 'Status', v: statusPill('Completed', EMAIL.info) },
    ]),
  })}
    ${calloutPanel({
    eyebrow: 'We Value Your Opinion',
    title: 'How was your experience?',
    text: 'Your feedback helps us craft even better experiences. Select a rating to share your thoughts with us.',
    extraHtml: ratingExtra,
  })}
    ${whatsapp ? calloutPanel({
    title: 'Need further assistance?',
    text: 'Our team is always happy to help. Reach out to us anytime.',
    buttonHtml: ctaButton(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`, 'Message Us on WhatsApp', { outline: true }),
  }) : ''}`

  return wrapEmail({
    title: 'Thank You',
    preheader: `Thank you for visiting — we hope you enjoyed your ${serviceLabel}.`,
    hero: heroBlock({
      eyebrow: 'Appointment Complete',
      title: 'Thank',
      titleAccent: 'You',
      sub: 'We truly appreciate the time you spent with us.',
    }),
    sections,
    footer: footerBlock({
      note: `Thank you for choosing ${brandName}. We look forward to seeing you again soon.`,
      whatsapp,
    }),
  })
}

export async function sendAppointmentCompletionEmail(data: AppointmentEmailData): Promise<boolean> {
  try {
    if (!data.customerEmail) {
      console.log('[Email] No customer email provided, skipping completion email')
      return false
    }
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('[Email] SMTP credentials not configured, skipping email')
      return false
    }

    const brandName = emailBrand()
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER

    const serviceLabel = resolveServiceLabel(data.service)
    const displayDate = formatDisplayDate(data.date)
    const displayTime = formatDisplayTime(data.time)

    const html = buildCompletionHTML(data)

    const info = await getTransporter().sendMail({
      from: `"${brandName}" <${fromEmail}>`,
      to: data.customerEmail,
      subject: `Thank You — Your ${serviceLabel} is Complete | ${brandName}`,
      text: `Dear ${data.customerName},\n\nYour appointment has been completed.\n\nService: ${serviceLabel}\nDate: ${displayDate}\nTime: ${displayTime}\n\nWe'd love to hear about your experience. Simply reply to this email with your feedback.\n\nThank you for choosing ${brandName}.`,
      html,
    })

    console.log(`[Email] Completion email sent to ${data.customerEmail}: ${info.messageId}`)
    return true
  } catch (error) {
    console.error('[Email] Failed to send completion email:', error)
    return false
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   3 · APPOINTMENT CANCELLATION / APOLOGY
   ════════════════════════════════════════════════════════════════════════════ */
function buildCancellationHTML(data: AppointmentEmailData): string {
  const serviceLabel = resolveServiceLabel(data.service)
  const displayDate = formatDisplayDate(data.date)
  const displayTime = formatDisplayTime(data.time)
  const brandName = emailBrand()
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
  const appUrl = getPublicUrl()

  const sections = `
    ${greetingBlock(
    data.customerName,
    'We sincerely apologise — your upcoming appointment has been cancelled. We understand this may be inconvenient, and we are truly sorry for any disruption to your plans. We would be glad to reschedule at a time that suits you.'
  )}
    ${panel({
    label: 'Cancelled Appointment',
    accent: EMAIL.danger,
    innerRows: kvRows([
      { k: 'Service', v: serviceLabel, strike: true },
      { k: 'Date', v: displayDate, strike: true },
      { k: 'Time', v: displayTime, strike: true },
      { k: 'Status', v: statusPill('Cancelled', EMAIL.danger) },
    ]),
  })}
    ${calloutPanel({
    eyebrow: "We'd Love to See You",
    title: 'Ready to reschedule?',
    text: 'Book a new appointment at a time that works best for you. All of our consultations remain complimentary.',
    buttonHtml: ctaButton(`${appUrl}/appointments`, 'Book a New Appointment'),
  })}
    ${whatsapp ? calloutPanel({
    title: 'Have questions?',
    text: 'We are here to help with anything you need.',
    buttonHtml: ctaButton(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`, 'Message Us on WhatsApp', { outline: true }),
  }) : ''}`

  return wrapEmail({
    title: 'Appointment Cancelled',
    preheader: 'Your appointment has been cancelled — we would love to reschedule.',
    accent: EMAIL.danger,
    hero: heroBlock({
      eyebrow: 'Appointment Cancelled',
      title: 'Appointment',
      titleAccent: 'Cancelled',
      sub: 'We are sorry for the inconvenience and hope to welcome you soon.',
      accent: EMAIL.danger,
    }),
    sections,
    footer: footerBlock({
      note: `Your satisfaction remains our highest priority at ${brandName}. We sincerely apologise for any inconvenience caused.`,
      whatsapp,
      accent: EMAIL.danger,
    }),
  })
}

export async function sendAppointmentCancellationEmail(data: AppointmentEmailData): Promise<boolean> {
  try {
    if (!data.customerEmail) {
      console.log('[Email] No customer email provided, skipping cancellation email')
      return false
    }
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('[Email] SMTP credentials not configured, skipping email')
      return false
    }

    const brandName = emailBrand()
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER

    const serviceLabel = resolveServiceLabel(data.service)
    const displayDate = formatDisplayDate(data.date)
    const displayTime = formatDisplayTime(data.time)

    const html = buildCancellationHTML(data)

    const info = await getTransporter().sendMail({
      from: `"${brandName}" <${fromEmail}>`,
      to: data.customerEmail,
      subject: `Appointment Cancelled — ${serviceLabel} on ${displayDate} | ${brandName}`,
      text: `Dear ${data.customerName},\n\nWe sincerely apologise — your appointment has been cancelled.\n\nService: ${serviceLabel}\nDate: ${displayDate}\nTime: ${displayTime}\n\nWe would love to reschedule at your convenience. Please visit our website to book a new appointment.\n\nWith apologies,\n${brandName}`,
      html,
    })

    console.log(`[Email] Cancellation email sent to ${data.customerEmail}: ${info.messageId}`)
    return true
  } catch (error) {
    console.error('[Email] Failed to send cancellation email:', error)
    return false
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   4 · OFFLINE SALE THANK-YOU (in-store purchase receipt)
   ════════════════════════════════════════════════════════════════════════════ */

interface OfflineSaleEmailItem {
  productName: string
  productImage?: string | null
  quantity: number
  unitPrice: number
  discount: number
  lineTotal: number
}

interface OfflineSaleEmailData {
  customerName: string
  customerEmail: string
  customerPhone?: string
  saleId: string
  items: OfflineSaleEmailItem[]
  subtotal: number
  discountTotal: number
  totalPrice: number
  saleDate: string // ISO date string
}

// Shared item row (image + name/meta + line total). `meta` is a short line.
function itemRow(opts: { name: string; image?: string | null; meta: string; lineTotal: string }): string {
  const src = absoluteImg(opts.image)
  const imgCell = src
    ? `<img src="${src}" alt="${opts.name}" width="64" height="64" style="display:block;width:64px;height:64px;object-fit:cover;border:1px solid ${EMAIL.line};background:${EMAIL.surface};" />`
    : `<div style="width:64px;height:64px;background:${EMAIL.accentSoft};border:1px solid ${EMAIL.line};text-align:center;line-height:64px;font-family:${EMAIL.serif};font-size:24px;color:${EMAIL.accent};">${(opts.name || 'J').charAt(0).toUpperCase()}</div>`
  return `
    <tr>
      <td style="padding:16px 10px 16px 22px;width:64px;vertical-align:middle;border-bottom:1px solid ${EMAIL.line};">${imgCell}</td>
      <td style="padding:16px 12px;vertical-align:middle;border-bottom:1px solid ${EMAIL.line};">
        <div style="font-family:${EMAIL.serif};font-size:14.5px;color:${EMAIL.ink};margin-bottom:5px;line-height:1.35;">${opts.name}</div>
        <div style="font-size:11px;letter-spacing:0.05em;color:${EMAIL.faint};">${opts.meta}</div>
      </td>
      <td style="padding:16px 22px 16px 12px;text-align:right;vertical-align:middle;border-bottom:1px solid ${EMAIL.line};white-space:nowrap;">
        <div style="font-family:${EMAIL.serif};font-size:15px;color:${EMAIL.ink};">${opts.lineTotal}</div>
      </td>
    </tr>`
}

// Totals rows for order/sale summaries.
function totalRow(label: string, value: string, opts?: { strong?: boolean; muted?: boolean }): string {
  if (opts?.strong) {
    return `
    <tr>
      <td style="padding:16px 22px;font-size:12px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL.accent};border-top:1px solid ${EMAIL.line};">${label}</td>
      <td style="padding:16px 22px;text-align:right;font-family:${EMAIL.serif};font-size:22px;color:${EMAIL.ink};border-top:1px solid ${EMAIL.line};">${value}</td>
    </tr>`
  }
  return `
    <tr>
      <td style="padding:12px 22px 4px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${EMAIL.faint};">${label}</td>
      <td style="padding:12px 22px 4px;text-align:right;font-size:13px;color:${opts?.muted ? EMAIL.faint : EMAIL.body};">${value}</td>
    </tr>`
}

// Summary strip: labelled values in a row (e.g. Order No · Date · Payment).
function summaryStrip(cols: Array<{ label: string; value: string }>): string {
  const cells = cols.map((c, i) => `
    <td class="em-strip-cell" width="${Math.floor(100 / cols.length)}%" style="padding:18px 20px;text-align:center;${i > 0 ? `border-left:1px solid ${EMAIL.line};` : ''}">
      <div style="font-size:9px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:${EMAIL.accent};margin-bottom:7px;">${c.label}</div>
      <div style="font-family:${EMAIL.serif};font-size:14px;color:${EMAIL.ink};word-break:break-word;line-height:1.4;">${c.value}</div>
    </td>`).join('')
  return `
  <tr>
    <td class="em-gutter" style="padding:0 40px 22px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL.surface};border:1px solid ${EMAIL.line};">
        <tr>${cells}</tr>
      </table>
    </td>
  </tr>`
}

// Horizontal progress tracker (numbered nodes, no icons). `currentIndex` is 0-based;
// nodes up to and including it are highlighted in `accent`.
function stepsTracker(steps: string[], currentIndex: number, accent = EMAIL.accent): string {
  const n = steps.length
  const nodeCells = steps.map((label, i) => {
    const active = i <= currentIndex
    const dot = `<div style="width:30px;height:30px;line-height:30px;margin:0 auto;border-radius:50%;font-family:${EMAIL.serif};font-size:13px;border:1px solid ${active ? accent : EMAIL.line};background:${active ? accent : EMAIL.cardBg};color:${active ? '#FFFFFF' : EMAIL.faint};">${i + 1}</div>`
    const leftBar = i === 0 ? '' : `<td width="18%" style="vertical-align:middle;"><div style="height:1px;background:${i <= currentIndex ? accent : EMAIL.line};"></div></td>`
    return `${leftBar}<td width="${Math.floor(28 / n)}%" style="text-align:center;vertical-align:middle;">${dot}</td>`
  }).join('')
  const labelCells = steps.map((label, i) => {
    const active = i <= currentIndex
    return `<td width="${Math.floor(100 / n)}%" style="padding:8px 2px 0;text-align:center;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:${active ? EMAIL.ink : EMAIL.faint};">${label}</td>`
  }).join('')
  return `
  <tr>
    <td class="em-gutter" style="padding:0 40px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL.cardBg};border:1px solid ${EMAIL.line};">
        <tr><td style="padding:22px 20px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${nodeCells}</tr></table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${labelCells}</tr></table>
        </td></tr>
      </table>
    </td>
  </tr>`
}

function buildOfflineSaleThankYouHTML(data: OfflineSaleEmailData): string {
  const brandName = emailBrand()
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
  const appUrl = getPublicUrl()
  const contactEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || ''

  let saleDate = data.saleDate
  try {
    const d = new Date(data.saleDate)
    saleDate = d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  } catch { }

  const formatPrice = (n: number) =>
    `£${Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const itemsHTML = data.items.map((item) => itemRow({
    name: item.productName || 'Product',
    image: item.productImage,
    meta: `Qty ${item.quantity} × ${formatPrice(item.unitPrice)}${item.discount > 0 ? `  ·  −${formatPrice(item.discount)}` : ''}`,
    lineTotal: formatPrice(item.lineTotal),
  })).join('')

  const orderPanel = `
  <tr>
    <td class="em-gutter" style="padding:0 40px 22px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL.surface};border:1px solid ${EMAIL.line};">
        <tr>
          <td colspan="3" style="padding:16px 22px 12px;border-bottom:1px solid ${EMAIL.line};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="font-size:10px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:${EMAIL.accent};">Your Purchase</td>
              <td style="text-align:right;font-size:10px;letter-spacing:0.08em;color:${EMAIL.faint};">${saleDate}</td>
            </tr></table>
          </td>
        </tr>
        ${itemsHTML}
        ${totalRow('Subtotal', formatPrice(data.subtotal))}
        ${data.discountTotal > 0 ? totalRow('Discount', `−${formatPrice(data.discountTotal)}`, { muted: true }) : ''}
        ${totalRow('Total Paid', formatPrice(data.totalPrice), { strong: true })}
      </table>
    </td>
  </tr>`

  const sections = `
    ${greetingBlock(
    data.customerName || 'Valued Customer',
    `Thank you for your recent purchase at ${brandName}. We truly appreciate your trust in us. Below is a summary of your order for your records.`
  )}
    ${orderPanel}
    ${calloutPanel({
    eyebrow: 'Explore More',
    title: 'Discover our collection',
    text: 'Browse our exquisite range of fine jewellery, crafted with precision and passion.',
    buttonHtml: ctaButton(`${appUrl}/collection`, 'View Collection'),
  })}
    ${whatsapp ? calloutPanel({
    title: 'Questions about your purchase?',
    text: 'We are here to help.',
    buttonHtml: ctaButton(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`, 'Message Us on WhatsApp', { outline: true }),
  }) : ''}`

  return wrapEmail({
    title: 'Thank You for Your Purchase',
    preheader: `Your receipt from ${brandName} — thank you for your purchase.`,
    hero: heroBlock({
      eyebrow: 'Purchase Receipt',
      title: 'Thank',
      titleAccent: 'You',
      sub: 'Your order summary is enclosed below.',
    }),
    sections,
    footer: footerBlock({
      note: `Thank you for choosing ${brandName}. We look forward to serving you again.`,
      contactEmail: contactEmail || undefined,
      whatsapp,
    }),
  })
}

export async function sendOfflineSaleThankYouEmail(data: OfflineSaleEmailData): Promise<boolean> {
  try {
    if (!data.customerEmail) {
      console.log('[Email] No customer email provided, skipping offline sale thank-you email')
      return false
    }
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('[Email] SMTP credentials not configured, skipping email')
      return false
    }

    const brandName = emailBrand()
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER

    const html = buildOfflineSaleThankYouHTML(data)

    const itemCount = data.items.length
    const itemSuffix = itemCount === 1 ? 'item' : 'items'

    const info = await getTransporter().sendMail({
      from: `"${brandName}" <${fromEmail}>`,
      to: data.customerEmail,
      subject: `Thank You for Your Purchase — ${itemCount} ${itemSuffix} | ${brandName}`,
      text: `Dear ${data.customerName || 'Valued Customer'},\n\nThank you for your recent purchase at ${brandName}.\n\nItems:\n${data.items.map(it => `- ${it.productName} (Qty: ${it.quantity}) — £${it.lineTotal.toFixed(2)}`).join('\n')}\n\nTotal: £${data.totalPrice.toFixed(2)}\n\nWe truly appreciate your trust in us.\n\nWarm regards,\n${brandName}`,
      html,
    })

    console.log(`[Email] Offline sale thank-you email sent to ${data.customerEmail}: ${info.messageId}`)
    return true
  } catch (error) {
    console.error('[Email] Failed to send offline sale email:', error)
    return false
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   5 · ORDER STATUS UPDATE
   ════════════════════════════════════════════════════════════════════════════ */

export type OrderStatus = 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'canceled' | 'refunded' | 'return_requested' | 'returned'

interface OrderStatusEmailData {
  orderId: string
  customerName: string
  customerEmail: string
  status: OrderStatus
  totalAmount: number
  currency: 'INR' | 'USD'
  items: Array<{
    name: string
    quantity: number
    price?: number
    image?: string
    metal?: string | null
    carat?: string | null
    size?: string | null
  }>
  trackingNumber?: string
  trackingLink?: string
  notes?: string
}

const STATUS_CONFIG: Record<OrderStatus, { title: string; subtitle: string; color: string }> = {
  confirmed: { title: 'Order Confirmed', subtitle: 'Your order has been successfully placed and paid.', color: EMAIL.ok },
  processing: { title: 'Order Processing', subtitle: 'We are carefully preparing your pieces for dispatch.', color: EMAIL.warn },
  shipped: { title: 'Order Shipped', subtitle: 'Your jewellery is on its way to you.', color: EMAIL.info },
  delivered: { title: 'Order Delivered', subtitle: 'Your package has been delivered. We hope you love it.', color: EMAIL.ok },
  cancelled: { title: 'Order Cancelled', subtitle: 'Your order has been cancelled.', color: EMAIL.danger },
  canceled: { title: 'Order Cancelled', subtitle: 'Your order has been cancelled.', color: EMAIL.danger },
  refunded: { title: 'Order Refunded', subtitle: 'A refund has been processed for your order.', color: EMAIL.neutral },
  return_requested: { title: 'Return Requested', subtitle: 'We have received your return request and will be in touch shortly.', color: EMAIL.warn },
  returned: { title: 'Order Returned', subtitle: 'Your return has been received. Thank you for your patience.', color: EMAIL.neutral },
}

function buildOrderStatusHTML(data: OrderStatusEmailData): string {
  const config = STATUS_CONFIG[data.status]
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
  const appUrl = getPublicUrl()
  const currencySymbol = data.currency === 'INR' ? '₹' : '$'
  const formatPrice = (n: number) =>
    `${currencySymbol}${Number(n || 0).toLocaleString(data.currency === 'INR' ? 'en-IN' : 'en-US', {
      minimumFractionDigits: data.currency === 'INR' ? 0 : 2,
      maximumFractionDigits: data.currency === 'INR' ? 0 : 2,
    })}`
  const [firstWord, ...restWords] = config.title.split(' ')

  const statusVariantMeta = (it: OrderStatusEmailData['items'][number]) => {
    const parts: string[] = []
    if (it.metal) parts.push(it.metal)
    if (it.carat) parts.push(it.carat)
    if (it.size) parts.push(`Size ${it.size}`)
    return parts.length > 0 ? ` · ${parts.join(' · ')}` : ''
  }

  const itemsHTML = data.items.map((item) => itemRow({
    name: item.name,
    image: item.image || null,
    meta: (item.price != null ? `Qty ${item.quantity} × ${formatPrice(item.price)}` : `Qty ${item.quantity}`) + statusVariantMeta(item),
    lineTotal: item.price != null ? formatPrice(item.price * item.quantity) : '',
  })).join('')

  // Fulfilment tracker — highlights the current stage (skipped for cancelled/refunded).
  const flow: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'delivered']
  const flowIndex = flow.indexOf(data.status)
  const tracker = flowIndex >= 0
    ? stepsTracker(['Confirmed', 'Processing', 'Shipped', 'Delivered'], flowIndex, config.color)
    : ''

  // Tracking shown whenever a number is present (not only when "shipped").
  const tracking = data.trackingNumber
    ? calloutPanel({
      accent: config.color,
      eyebrow: 'Tracking Number',
      title: data.trackingNumber,
      text: data.trackingLink ? 'Follow your package in real time using the button below.' : 'Keep this number handy to track your delivery.',
      buttonHtml: data.trackingLink ? ctaButton(data.trackingLink, 'Track Package', { accent: config.color }) : '',
    })
    : ''

  // Order note (from the admin "notes" field), shown when present.
  const notesPanel = (data.notes && data.notes.trim())
    ? panel({
      label: 'Order Notes',
      accent: config.color,
      innerRows: `<tr><td style="padding:16px 22px;font-size:13px;line-height:1.75;color:${EMAIL.body};white-space:pre-line;">${data.notes.trim()}</td></tr>`,
    })
    : ''

  const sections = `
    ${greetingBlock(data.customerName, config.subtitle)}
    ${summaryStrip([
    { label: 'Order No.', value: `#${data.orderId.slice(0, 8).toUpperCase()}` },
    { label: 'Status', value: config.title.replace('Order ', '') },
    { label: 'Total', value: formatPrice(data.totalAmount) },
  ])}
    ${tracker}
    ${tracking}
    <tr>
      <td class="em-gutter" style="padding:0 40px 22px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL.surface};border:1px solid ${EMAIL.line};">
          <tr>
            <td colspan="3" style="padding:16px 22px 12px;border-bottom:1px solid ${EMAIL.line};">
              <span style="font-size:10px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:${config.color};">Order Summary</span>
            </td>
          </tr>
          ${itemsHTML}
          ${totalRow('Total Amount', formatPrice(data.totalAmount), { strong: true })}
        </table>
      </td>
    </tr>
    ${notesPanel}
    ${calloutPanel({
    text: 'View your full order details and delivery status at any time.',
    buttonHtml: ctaButton(`${appUrl}/account`, 'View My Order'),
  })}`

  return wrapEmail({
    title: config.title,
    preheader: `${config.title} — Order #${data.orderId.slice(0, 8)}`,
    accent: config.color,
    hero: heroBlock({
      eyebrow: `Order #${data.orderId.slice(0, 8)}`,
      title: firstWord,
      titleAccent: restWords.join(' '),
      accent: config.color,
    }),
    sections,
    footer: footerBlock({
      note: whatsapp ? `Questions about your order? Reach us on WhatsApp at ${whatsapp}.` : 'Thank you for shopping with us.',
      whatsapp,
      accent: config.color,
    }),
  })
}

export async function sendOrderStatusEmail(data: OrderStatusEmailData): Promise<boolean> {
  try {
    console.log(`[Email] Attempting to send ${data.status} email to: ${data.customerEmail}`)

    if (!data.customerEmail) {
      console.warn('[Email] No customer email provided, skipping.')
      return false
    }
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('[Email] SMTP credentials missing in environment variables!')
      return false
    }

    const config = STATUS_CONFIG[data.status]
    if (!config) {
      console.error(`[Email] No config found for status: ${data.status}. Cannot send email.`)
      return false
    }

    const brandName = emailBrand()
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
    console.log(`[Email] Using SMTP: host=${process.env.SMTP_HOST || 'smtp.gmail.com'}, user=${process.env.SMTP_USER ? 'SET' : 'MISSING'}, pass=${process.env.SMTP_PASSWORD ? 'SET' : 'MISSING'}`)
    const html = buildOrderStatusHTML(data)

    const info = await getTransporter().sendMail({
      from: `"${brandName}" <${fromEmail}>`,
      to: data.customerEmail,
      subject: `${config.title} — Order #${data.orderId.slice(0, 8)}`,
      html
    })

    console.log(`[Email] SUCCESS: Status update (${data.status}) sent. MessageId: ${info.messageId}`)
    return true
  } catch (error: any) {
    console.error('[Email] ERROR sending status update email:', error)
    console.error('[Email] Error Details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    })
    return false
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   6 · ONLINE ORDER CONFIRMATION
   ════════════════════════════════════════════════════════════════════════════ */

interface OrderConfirmationEmailData {
  orderId: string
  customerName: string
  customerEmail: string
  paymentId: string
  totalAmount: number
  currency: 'INR' | 'USD'
  items: Array<{
    name: string
    quantity: number
    price: number
    image?: string
    metal?: string | null
    carat?: string | null
    size?: string | null
  }>
}

function buildOrderConfirmationHTML(data: OrderConfirmationEmailData): string {
  const brandName = emailBrand()
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
  const appUrl = getPublicUrl()
  const currencySymbol = data.currency === 'INR' ? '₹' : '$'
  const formatPrice = (n: number) =>
    // Amounts are already stored in the order's own currency — display as-is, never convert here.
    `${currencySymbol}${Number(n || 0).toLocaleString(data.currency === 'INR' ? 'en-IN' : 'en-US', {
      minimumFractionDigits: data.currency === 'INR' ? 0 : 2,
      maximumFractionDigits: data.currency === 'INR' ? 0 : 2,
    })}`

  const itemCount = data.items.reduce((sum, it) => sum + (it.quantity || 0), 0)
  const paymentLabel = data.paymentId === 'COD'
    ? 'Cash on Delivery'
    : /^pi_/.test(data.paymentId || '') ? 'Card · Stripe' : 'Paid Online'

  const variantMeta = (it: OrderConfirmationEmailData['items'][number]) => {
    const parts: string[] = []
    if (it.metal) parts.push(it.metal)
    if (it.carat) parts.push(it.carat)
    if (it.size) parts.push(`Size ${it.size}`)
    return parts.length > 0 ? ` · ${parts.join(' · ')}` : ''
  }

  const itemsHTML = data.items.map((item) => itemRow({
    name: item.name,
    image: item.image || null,
    meta: `Qty ${item.quantity} × ${formatPrice(item.price)}${variantMeta(item)}`,
    lineTotal: formatPrice(item.price * item.quantity),
  })).join('')

  const sections = `
    ${greetingBlock(
    data.customerName || 'Valued Customer',
    'Thank you for your order. Your payment has been verified and your order is now confirmed. A full summary is below, and we will email you as it moves through each stage on its way to you.'
  )}

    ${summaryStrip([
    { label: 'Order No.', value: `#${data.orderId.slice(0, 8).toUpperCase()}` },
    { label: 'Payment', value: paymentLabel },
    { label: 'Total Paid', value: formatPrice(data.totalAmount) },
  ])}

    <tr>
      <td class="em-gutter" style="padding:0 40px 22px;text-align:center;">
        <span style="font-size:10.5px;letter-spacing:0.03em;color:${EMAIL.faint};">Full reference &nbsp;<span style="color:${EMAIL.body};">#${data.orderId}</span>${data.paymentId && data.paymentId !== 'COD' ? `<br/>Payment ID &nbsp;<span style="color:${EMAIL.body};">${data.paymentId}</span>` : ''}</span>
      </td>
    </tr>

    <tr>
      <td class="em-gutter" style="padding:0 40px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL.surface};border:1px solid ${EMAIL.line};">
          <tr>
            <td colspan="3" style="padding:16px 22px 12px;border-bottom:1px solid ${EMAIL.line};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="font-size:10px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:${EMAIL.accent};">Your Items</td>
                <td style="text-align:right;font-size:10px;letter-spacing:0.08em;color:${EMAIL.faint};">${itemCount} ${itemCount === 1 ? 'piece' : 'pieces'}</td>
              </tr></table>
            </td>
          </tr>
          ${itemsHTML}
          ${totalRow('Total Paid', formatPrice(data.totalAmount), { strong: true })}
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:4px 40px 12px;text-align:center;">
        <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:${EMAIL.accent};">What Happens Next</p>
      </td>
    </tr>
    ${stepsTracker(['Confirmed', 'Processing', 'Shipped', 'Delivered'], 0)}

    ${calloutPanel({
    text: 'Track your order status and view full details anytime in your account.',
    buttonHtml: ctaButton(`${appUrl}/account`, 'View My Order'),
  })}

    ${whatsapp ? calloutPanel({
    title: 'Questions about your order?',
    text: 'Our team is here to help with anything you need.',
    buttonHtml: ctaButton(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`, 'Message Us on WhatsApp', { outline: true }),
  }) : ''}`

  return wrapEmail({
    title: 'Order Confirmed',
    preheader: `Your order #${data.orderId.slice(0, 8).toUpperCase()} is confirmed — thank you.`,
    hero: heroBlock({
      eyebrow: 'Order Confirmed',
      title: 'Order',
      titleAccent: 'Confirmed',
      sub: 'Your payment is verified and your order is being prepared with care.',
    }),
    sections,
    footer: footerBlock({
      note: `Thank you for choosing ${brandName}. We look forward to bringing your jewellery to you soon.`,
      whatsapp,
    }),
  })
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationEmailData): Promise<boolean> {
  try {
    if (!data.customerEmail) {
      console.warn('[Email] No customer email provided, skipping order confirmation email.')
      return false
    }
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('[Email] SMTP credentials missing, skipping order confirmation email.')
      return false
    }

    const brandName = emailBrand()
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
    const html = buildOrderConfirmationHTML(data)

    const info = await getTransporter().sendMail({
      from: `"${brandName}" <${fromEmail}>`,
      to: data.customerEmail,
      subject: `Order Confirmed — #${data.orderId.slice(0, 8).toUpperCase()} | ${brandName}`,
      html,
    })

    console.log(`[Email] Order confirmation email sent to ${data.customerEmail}: ${info.messageId}`)
    return true
  } catch (error: any) {
    console.error('[Email] Failed to send order confirmation email:', error)
    return false
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   7 · NEWSLETTER BROADCAST
   ════════════════════════════════════════════════════════════════════════════ */

interface NewsletterBroadcastData {
  subject: string
  htmlContent: string   // Rich HTML from the compose editor
  previewText: string
  recipients: string[]
}

function buildNewsletterHTML(data: NewsletterBroadcastData): string {
  const brandName = emailBrand()
  const appUrl = getPublicUrl()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${data.subject}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @media only screen and (max-width:600px){
      .em-shell{ width:100% !important; }
      .em-gutter{ padding-left:22px !important; padding-right:22px !important; }
      .em-content img{ max-width:100% !important; height:auto !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${EMAIL.pageBg};font-family:${EMAIL.sans};-webkit-font-smoothing:antialiased;">
  ${data.previewText ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${data.previewText}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL.pageBg};padding:40px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="em-shell" style="max-width:600px;width:100%;background:${EMAIL.cardBg};border:1px solid ${EMAIL.line};">

        <tr><td style="height:2px;background:${EMAIL.accent};line-height:2px;font-size:0;">&nbsp;</td></tr>

        <!-- Masthead -->
        <tr>
          <td class="em-gutter" style="padding:34px 40px 22px;text-align:center;border-bottom:1px solid ${EMAIL.line};">
            <a href="${appUrl}" style="font-family:${EMAIL.serif};font-size:18px;letter-spacing:0.40em;text-transform:uppercase;color:${EMAIL.ink};text-decoration:none;">${brandName}</a>
            <p style="margin:8px 0 0;font-size:8px;letter-spacing:0.4em;text-transform:uppercase;color:${EMAIL.faint};">Fine Jewellery &middot; Newsletter</p>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td class="em-gutter em-content" style="padding:32px 40px 36px;color:${EMAIL.body};font-size:15px;line-height:1.8;">
            ${data.htmlContent}
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td class="em-gutter" style="padding:0 40px 36px;text-align:center;">
            ${ctaButton(`${appUrl}/collection`, 'Explore the Collection')}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="em-gutter" style="padding:22px 40px;text-align:center;border-top:1px solid ${EMAIL.line};background:${EMAIL.surface};">
            <p style="margin:0;font-size:11px;color:${EMAIL.faint};letter-spacing:0.04em;line-height:1.7;">
              You are receiving this because you subscribed to the ${brandName} newsletter.<br/>
              <a href="${appUrl}" style="color:${EMAIL.accent};text-decoration:none;">${appUrl}</a>
            </p>
          </td>
        </tr>

        <tr><td style="height:2px;background:${EMAIL.accent};line-height:2px;font-size:0;">&nbsp;</td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendNewsletterBroadcast(data: NewsletterBroadcastData): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('[Newsletter] SMTP credentials not configured')
    return { sent: 0, failed: data.recipients.length }
  }

  const brandName = emailBrand()
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
  const html = buildNewsletterHTML(data)
  const transporter = getTransporter()

  // Send in batches of 10
  const BATCH_SIZE = 10
  for (let i = 0; i < data.recipients.length; i += BATCH_SIZE) {
    const batch = data.recipients.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map(async (email) => {
        try {
          await transporter.sendMail({
            from: `"${brandName}" <${fromEmail}>`,
            to: email,
            subject: data.subject,
            text: `${data.previewText || data.subject}\n\nVisit us at: ${process.env.NEXT_PUBLIC_APP_URL || ''}`,
            html,
          })
          sent++
        } catch (err) {
          console.error(`[Newsletter] Failed to send to ${email}:`, err)
          failed++
        }
      })
    )
    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < data.recipients.length) {
      await new Promise(r => setTimeout(r, 300))
    }
  }

  console.log(`[Newsletter] Broadcast complete: ${sent} sent, ${failed} failed`)
  return { sent, failed }
}

/* ════════════════════════════════════════════════════════════════════════════
   8 · INNER CIRCLE — NEWSLETTER WELCOME
   Same "Light Atelier" system as every other email — one design, desktop & mobile.
   ════════════════════════════════════════════════════════════════════════════ */
function buildInnerCircleWelcomeHTML(): string {
  const brandName = emailBrand()
  const appUrl = getPublicUrl()

  const sections = `
    <tr>
      <td class="em-gutter" style="padding:0 40px 26px;text-align:center;">
        <p style="margin:0;font-size:14px;line-height:1.85;color:${EMAIL.body};">
          Thank you for subscribing. You are now part of a private circle that enjoys first access to new arrivals, invitations to private viewings, and quiet notes on the craft of fine jewellery — never any noise.
        </p>
      </td>
    </tr>
    ${panel({
    label: 'What to Expect',
    innerRows: kvRows([
      { k: 'First Access', v: 'Preview new collections before they are released to the public.' },
      { k: 'Private Offers', v: 'Member-only pricing and seasonal invitations.' },
      { k: 'The Journal', v: 'Occasional notes on gemstones, care, and craftsmanship.' },
    ]),
  })}
    ${calloutPanel({
    eyebrow: 'Begin Exploring',
    title: 'Your collection awaits',
    text: 'Discover pieces crafted with precision and passion, made to be worn for a lifetime.',
    buttonHtml: ctaButton(`${appUrl}/collection`, 'Explore the Collection'),
  })}`

  return wrapEmail({
    title: 'Welcome to the Inner Circle',
    preheader: `You're on the list — welcome to the ${brandName} Inner Circle.`,
    hero: heroBlock({
      eyebrow: 'The Inner Circle',
      title: 'Welcome to the',
      titleAccent: 'Inner Circle',
      sub: 'Early access, private invitations, and the quiet craft of fine jewellery.',
    }),
    sections,
    footer: footerBlock({
      note: `You are receiving this because you subscribed to the ${brandName} newsletter.`,
      contactEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || undefined,
      whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '',
    }),
  })
}

export async function sendInnerCircleWelcomeEmail(recipientEmail: string): Promise<boolean> {
  try {
    if (!recipientEmail) {
      console.log('[Email] No recipient provided, skipping Inner Circle welcome email')
      return false
    }
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('[Email] SMTP credentials not configured, skipping Inner Circle welcome email')
      return false
    }

    const brandName = emailBrand()
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
    const appUrl = getPublicUrl()
    const html = buildInnerCircleWelcomeHTML()

    const info = await getTransporter().sendMail({
      from: `"${brandName}" <${fromEmail}>`,
      to: recipientEmail,
      subject: `Welcome to the Inner Circle | ${brandName}`,
      text: `Welcome to the Inner Circle.\n\nThank you for subscribing to ${brandName}. You will be first to know about new arrivals, private offers, and the craft of fine jewellery.\n\nExplore the collection: ${appUrl}/collection`,
      html,
    })

    console.log(`[Email] Inner Circle welcome email sent to ${recipientEmail}: ${info.messageId}`)
    return true
  } catch (error) {
    console.error('[Email] Failed to send Inner Circle welcome email:', error)
    return false
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   9 · ADMIN — NEW ORDER NOTIFICATION
   Sent to the store team the moment an order is placed (COD / Razorpay / Stripe).
   ════════════════════════════════════════════════════════════════════════════ */
interface AdminOrderNotificationData {
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  totalAmount: number
  currency: 'INR' | 'USD'
  paymentLabel?: string   // 'Cash on Delivery' | 'Card · Stripe' | 'Razorpay' …
  paymentId?: string
  items: Array<{ name: string; quantity: number; price?: number; image?: string; metal?: string | null; carat?: string | null; size?: string | null }>
  shippingAddress?: any
}

// Where internal order alerts go. Prefers an explicit ADMIN_EMAIL, then falls back
// to the store's own from-address so notifications work out of the box.
function adminRecipient(): string {
  return (
    process.env.ADMIN_EMAIL ||
    process.env.ORDER_NOTIFICATION_EMAIL ||
    process.env.SMTP_FROM_EMAIL ||
    process.env.SMTP_USER ||
    ''
  )
}

function buildAdminOrderHTML(data: AdminOrderNotificationData): string {
  const brandName = emailBrand()
  const appUrl = getPublicUrl()
  const currencySymbol = data.currency === 'INR' ? '₹' : '$'
  const formatPrice = (n: number) =>
    `${currencySymbol}${Number(n || 0).toLocaleString(data.currency === 'INR' ? 'en-IN' : 'en-US', {
      minimumFractionDigits: data.currency === 'INR' ? 0 : 2,
      maximumFractionDigits: data.currency === 'INR' ? 0 : 2,
    })}`

  const adminVariantMeta = (it: AdminOrderNotificationData['items'][number]) => {
    const parts: string[] = []
    if (it.metal) parts.push(it.metal)
    if (it.carat) parts.push(it.carat)
    if (it.size) parts.push(`Size ${it.size}`)
    return parts.length > 0 ? ` · ${parts.join(' · ')}` : ''
  }

  const itemsHTML = data.items.map((item) => itemRow({
    name: item.name,
    image: item.image || null,
    meta: (item.price != null ? `Qty ${item.quantity} × ${formatPrice(item.price)}` : `Qty ${item.quantity}`) + adminVariantMeta(item),
    lineTotal: item.price != null ? formatPrice(item.price * item.quantity) : '',
  })).join('')

  const addr = data.shippingAddress || {}
  const addrBody = [
    addr.street,
    [addr.city, addr.state].filter(Boolean).join(', '),
    addr.zip,
    addr.country,
  ].filter(Boolean).join('<br/>')

  const sections = `
    <tr>
      <td class="em-gutter" style="padding:0 40px 24px;">
        <p style="margin:0;font-size:13.5px;line-height:1.85;color:${EMAIL.body};">
          A new order has just been placed on ${brandName}. The customer has received their confirmation email — the details below are for fulfilment.
        </p>
      </td>
    </tr>
    ${summaryStrip([
    { label: 'Order No.', value: `#${data.orderId.slice(0, 8).toUpperCase()}` },
    { label: 'Payment', value: data.paymentLabel || 'Paid' },
    { label: 'Total', value: formatPrice(data.totalAmount) },
  ])}
    ${panel({
    label: 'Customer',
    accent: EMAIL.ok,
    innerRows: kvRows([
      { k: 'Name', v: data.customerName || '—' },
      { k: 'Email', v: data.customerEmail || '—' },
      { k: 'Phone', v: data.customerPhone || 'Not provided' },
    ]),
  })}
    <tr>
      <td class="em-gutter" style="padding:0 40px 22px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL.surface};border:1px solid ${EMAIL.line};">
          <tr>
            <td colspan="3" style="padding:16px 22px 12px;border-bottom:1px solid ${EMAIL.line};">
              <span style="font-size:10px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:${EMAIL.ok};">Items Ordered</span>
            </td>
          </tr>
          ${itemsHTML}
          ${totalRow('Order Total', formatPrice(data.totalAmount), { strong: true })}
        </table>
      </td>
    </tr>
    ${addrBody ? panel({
    label: 'Ship To',
    accent: EMAIL.ok,
    innerRows: `<tr><td style="padding:16px 22px;font-size:13px;line-height:1.75;color:${EMAIL.ink};">${addr.name ? `<strong style="font-weight:600;">${addr.name}</strong><br/>` : ''}${addrBody}${addr.phone ? `<br/>${addr.phone}` : ''}</td></tr>`,
  }) : ''}
    ${data.paymentId ? panel({
    label: 'Payment Reference',
    accent: EMAIL.ok,
    innerRows: `<tr><td style="padding:16px 22px;font-size:12.5px;line-height:1.6;color:${EMAIL.body};word-break:break-all;">${data.paymentId}</td></tr>`,
  }) : ''}
    ${calloutPanel({
    accent: EMAIL.ok,
    text: 'Open the admin dashboard to process this order.',
    buttonHtml: ctaButton(`${appUrl}/admin/orders`, 'View in Admin', { accent: EMAIL.ok }),
  })}`

  return wrapEmail({
    title: 'New Order Received',
    preheader: `New order #${data.orderId.slice(0, 8).toUpperCase()} — ${formatPrice(data.totalAmount)}`,
    accent: EMAIL.ok,
    hero: heroBlock({
      eyebrow: 'Admin Notification',
      title: 'New Order',
      titleAccent: 'Received',
      accent: EMAIL.ok,
    }),
    sections,
    footer: footerBlock({
      note: `Internal notification · ${brandName}`,
      accent: EMAIL.ok,
    }),
  })
}

export async function sendAdminNewOrderEmail(data: AdminOrderNotificationData): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('[Email] SMTP credentials not configured, skipping admin order notification')
      return false
    }
    const to = adminRecipient()
    if (!to) {
      console.warn('[Email] No admin recipient configured (set ADMIN_EMAIL or SMTP_FROM_EMAIL) — skipping admin order notification')
      return false
    }

    const brandName = emailBrand()
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
    const currencySymbol = data.currency === 'INR' ? '₹' : '$'
    const totalStr = `${currencySymbol}${Number(data.totalAmount || 0).toLocaleString(data.currency === 'INR' ? 'en-IN' : 'en-US')}`
    const html = buildAdminOrderHTML(data)

    const info = await getTransporter().sendMail({
      from: `"${brandName} · Orders" <${fromEmail}>`,
      to,
      replyTo: data.customerEmail || undefined,
      subject: `New Order #${data.orderId.slice(0, 8).toUpperCase()} — ${totalStr} | ${brandName}`,
      html,
    })

    console.log(`[Email] Admin new-order notification sent to ${to}: ${info.messageId}`)
    return true
  } catch (error) {
    console.error('[Email] Failed to send admin order notification:', error)
    return false
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   10 · CUSTOM PAYMENT REQUEST — PAYMENT LINK
   Sent to the customer with a secure link to pay for a bespoke / off-catalogue
   order the admin created. Reuses the shared "Light Atelier" design system.
   ════════════════════════════════════════════════════════════════════════════ */

interface CustomPaymentLinkEmailData {
  customerName: string
  customerEmail: string
  title: string
  description?: string
  amount: number
  currency: 'INR' | 'USD'
  payUrl: string
  expiresAt?: string | null   // ISO string, optional
}

function formatMoney(amount: number, currency: 'INR' | 'USD'): string {
  const symbol = currency === 'INR' ? '₹' : '$'
  return `${symbol}${Number(amount || 0).toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', {
    minimumFractionDigits: currency === 'INR' ? 0 : 2,
    maximumFractionDigits: currency === 'INR' ? 0 : 2,
  })}`
}

function buildCustomPaymentLinkHTML(data: CustomPaymentLinkEmailData): string {
  const brandName = emailBrand()
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
  const amountStr = formatMoney(data.amount, data.currency)

  let expiryNote = ''
  if (data.expiresAt) {
    try {
      const d = new Date(data.expiresAt)
      expiryNote = `This secure link is valid until ${d.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric',
      })}. Please complete your payment before then.`
    } catch { /* ignore */ }
  }

  const detailRows: Array<{ k: string; v: string }> = [
    { k: 'Order', v: data.title },
  ]
  if (data.description && data.description.trim()) {
    detailRows.push({ k: 'Details', v: data.description.trim() })
  }
  detailRows.push({ k: 'Amount Due', v: `<strong style="color:${EMAIL.ink};">${amountStr}</strong>` })

  const sections = `
    ${greetingBlock(
    data.customerName || 'Valued Customer',
    `A secure payment has been prepared especially for you. Please review the details below and complete your payment at your convenience using the button provided.`
  )}
    ${panel({
    label: 'Payment Summary',
    innerRows: kvRows(detailRows),
  })}
    ${calloutPanel({
    eyebrow: 'Secure Payment',
    title: `Amount Due · ${amountStr}`,
    text: 'You will be able to pay securely by card, UPI or net banking on our website. No account is required.',
    buttonHtml: ctaButton(data.payUrl, 'Pay Securely Now'),
    extraHtml: `<p style="margin:16px 0 0;font-size:11px;color:${EMAIL.faint};word-break:break-all;">${data.payUrl}</p>`,
  })}
    ${expiryNote ? panel({
    label: 'Please Note',
    innerRows: `<tr><td style="padding:16px 22px;font-size:12.5px;line-height:1.7;color:${EMAIL.body};">${expiryNote}</td></tr>`,
  }) : ''}`

  return wrapEmail({
    title: 'Complete Your Payment',
    preheader: `Your secure payment link for ${data.title} — ${amountStr}.`,
    hero: heroBlock({
      eyebrow: 'Payment Request',
      title: 'Complete Your',
      titleAccent: 'Payment',
      sub: 'A secure, personalised payment link has been prepared for your order.',
    }),
    sections,
    footer: footerBlock({
      note: whatsapp
        ? `Questions about this payment? Reach us on WhatsApp at ${whatsapp} or simply reply to this email.`
        : 'If you have any questions about this payment, simply reply to this email.',
      whatsapp,
    }),
  })
}

export async function sendCustomPaymentLinkEmail(data: CustomPaymentLinkEmailData): Promise<boolean> {
  try {
    if (!data.customerEmail) {
      console.log('[Email] No customer email provided, skipping custom payment link email')
      return false
    }
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('[Email] SMTP credentials not configured, skipping custom payment link email')
      return false
    }

    const brandName = emailBrand()
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
    const amountStr = formatMoney(data.amount, data.currency)
    const html = buildCustomPaymentLinkHTML(data)

    const info = await getTransporter().sendMail({
      from: `"${brandName}" <${fromEmail}>`,
      to: data.customerEmail,
      subject: `Your Payment Link — ${data.title} (${amountStr}) | ${brandName}`,
      text: `Dear ${data.customerName || 'Valued Customer'},\n\nA secure payment has been prepared for you.\n\nOrder: ${data.title}\nAmount Due: ${amountStr}\n\nPay securely here:\n${data.payUrl}\n\n${data.expiresAt ? `Please complete your payment before the link expires.\n\n` : ''}Warm regards,\n${brandName}`,
      html,
    })

    console.log(`[Email] Custom payment link email sent to ${data.customerEmail}: ${info.messageId}`)
    return true
  } catch (error) {
    console.error('[Email] Failed to send custom payment link email:', error)
    return false
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   11 · CUSTOM PAYMENT — RECEIPT / SUCCESS
   Sent to the customer once a custom payment has been completed and verified.
   ════════════════════════════════════════════════════════════════════════════ */

interface CustomPaymentReceiptEmailData {
  customerName: string
  customerEmail: string
  title: string
  description?: string
  amount: number
  currency: 'INR' | 'USD'
  paymentId: string
  requestId: string
  paidAt?: string   // ISO string
}

function buildCustomPaymentReceiptHTML(data: CustomPaymentReceiptEmailData): string {
  const brandName = emailBrand()
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
  const appUrl = getPublicUrl()
  const amountStr = formatMoney(data.amount, data.currency)

  let paidDate = ''
  try {
    const d = data.paidAt ? new Date(data.paidAt) : new Date()
    paidDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch { /* ignore */ }

  const sections = `
    ${greetingBlock(
    data.customerName || 'Valued Customer',
    'Thank you — your payment has been received and confirmed. A summary of your transaction is enclosed below for your records.'
  )}
    ${summaryStrip([
    { label: 'Reference', value: `#${data.requestId.slice(0, 8).toUpperCase()}` },
    { label: 'Status', value: 'Paid' },
    { label: 'Amount Paid', value: amountStr },
  ])}
    ${panel({
    label: 'Payment Details',
    innerRows: kvRows([
      { k: 'Order', v: data.title },
      ...(data.description && data.description.trim() ? [{ k: 'Details', v: data.description.trim() }] : []),
      { k: 'Amount', v: `<strong style="color:${EMAIL.ink};">${amountStr}</strong>` },
      { k: 'Date', v: paidDate },
      { k: 'Status', v: statusPill('Paid', EMAIL.ok) },
    ]),
  })}
    <tr>
      <td class="em-gutter" style="padding:0 40px 22px;text-align:center;">
        <span style="font-size:10.5px;letter-spacing:0.03em;color:${EMAIL.faint};">Payment ID &nbsp;<span style="color:${EMAIL.body};">${data.paymentId}</span></span>
      </td>
    </tr>
    ${whatsapp ? calloutPanel({
    title: 'Need assistance?',
    text: 'Our team is always happy to help with your order.',
    buttonHtml: ctaButton(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`, 'Message Us on WhatsApp', { outline: true }),
  }) : ''}`

  return wrapEmail({
    title: 'Payment Received',
    preheader: `We've received your payment of ${amountStr} — thank you.`,
    accent: EMAIL.ok,
    hero: heroBlock({
      eyebrow: 'Payment Confirmed',
      title: 'Payment',
      titleAccent: 'Received',
      sub: 'Thank you. Your payment has been successfully processed.',
      accent: EMAIL.ok,
    }),
    sections,
    footer: footerBlock({
      note: `Thank you for choosing ${brandName}. We truly appreciate your trust in us.`,
      whatsapp,
      accent: EMAIL.ok,
    }),
  })
}

export async function sendCustomPaymentReceiptEmail(data: CustomPaymentReceiptEmailData): Promise<boolean> {
  try {
    if (!data.customerEmail) {
      console.log('[Email] No customer email provided, skipping custom payment receipt email')
      return false
    }
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('[Email] SMTP credentials not configured, skipping custom payment receipt email')
      return false
    }

    const brandName = emailBrand()
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
    const amountStr = formatMoney(data.amount, data.currency)
    const html = buildCustomPaymentReceiptHTML(data)

    const info = await getTransporter().sendMail({
      from: `"${brandName}" <${fromEmail}>`,
      to: data.customerEmail,
      subject: `Payment Received — ${data.title} (${amountStr}) | ${brandName}`,
      text: `Dear ${data.customerName || 'Valued Customer'},\n\nThank you — your payment has been received and confirmed.\n\nOrder: ${data.title}\nAmount Paid: ${amountStr}\nPayment ID: ${data.paymentId}\nReference: #${data.requestId.slice(0, 8).toUpperCase()}\n\nWarm regards,\n${brandName}`,
      html,
    })

    console.log(`[Email] Custom payment receipt email sent to ${data.customerEmail}: ${info.messageId}`)
    return true
  } catch (error) {
    console.error('[Email] Failed to send custom payment receipt email:', error)
    return false
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   12 · CUSTOM PAYMENT — ADMIN NOTIFICATION (payment received)
   ════════════════════════════════════════════════════════════════════════════ */
export async function sendAdminCustomPaymentEmail(data: {
  requestId: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  title: string
  amount: number
  currency: 'INR' | 'USD'
  paymentId: string
  gateway: string
}): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) return false
    const to = adminRecipient()
    if (!to) return false

    const brandName = emailBrand()
    const appUrl = getPublicUrl()
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
    const amountStr = formatMoney(data.amount, data.currency)

    const sections = `
      <tr>
        <td class="em-gutter" style="padding:0 40px 24px;">
          <p style="margin:0;font-size:13.5px;line-height:1.85;color:${EMAIL.body};">
            A custom payment request has just been paid on ${brandName}.
          </p>
        </td>
      </tr>
      ${summaryStrip([
      { label: 'Reference', value: `#${data.requestId.slice(0, 8).toUpperCase()}` },
      { label: 'Gateway', value: data.gateway },
      { label: 'Amount', value: amountStr },
    ])}
      ${panel({
      label: 'Customer',
      accent: EMAIL.ok,
      innerRows: kvRows([
        { k: 'Name', v: data.customerName || '—' },
        { k: 'Email', v: data.customerEmail || '—' },
        { k: 'Phone', v: data.customerPhone || 'Not provided' },
        { k: 'Order', v: data.title },
        { k: 'Payment ID', v: data.paymentId },
      ]),
    })}
      ${calloutPanel({
      accent: EMAIL.ok,
      text: 'View this payment in the admin dashboard.',
      buttonHtml: ctaButton(`${appUrl}/admin/custom-payments/${data.requestId}`, 'View in Admin', { accent: EMAIL.ok }),
    })}`

    const html = wrapEmail({
      title: 'Custom Payment Received',
      preheader: `Custom payment #${data.requestId.slice(0, 8).toUpperCase()} — ${amountStr}`,
      accent: EMAIL.ok,
      hero: heroBlock({
        eyebrow: 'Admin Notification',
        title: 'Payment',
        titleAccent: 'Received',
        accent: EMAIL.ok,
      }),
      sections,
      footer: footerBlock({ note: `Internal notification · ${brandName}`, accent: EMAIL.ok }),
    })

    const info = await getTransporter().sendMail({
      from: `"${brandName} · Payments" <${fromEmail}>`,
      to,
      replyTo: data.customerEmail || undefined,
      subject: `Custom Payment Received #${data.requestId.slice(0, 8).toUpperCase()} — ${amountStr} | ${brandName}`,
      html,
    })

    console.log(`[Email] Admin custom-payment notification sent to ${to}: ${info.messageId}`)
    return true
  } catch (error) {
    console.error('[Email] Failed to send admin custom payment notification:', error)
    return false
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   13 · CUSTOM ORDER — ADMIN NOTIFICATION (new request submitted)
   Sent to the admin when a customer submits the /custom-order form.
   ════════════════════════════════════════════════════════════════════════════ */

// Minimal HTML escape + newline→<br> for admin/customer-authored free text.
function escHtml(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
function nl2br(s: any): string {
  return escHtml(s).replace(/\r?\n/g, '<br>')
}

export interface CustomOrderData {
  requestId: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  country?: string
  title: string
  description?: string
  category?: string
  metalPreference?: string
  budget?: string
  processingTime?: string
  quantity?: number
  referenceImages?: string[]
  referenceProduct?: string
}

export async function sendAdminNewCustomOrderEmail(data: CustomOrderData): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) return false
    const to = adminRecipient()
    if (!to) return false

    const brandName = emailBrand()
    const appUrl = getPublicUrl()
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER

    const imgs = (data.referenceImages || [])
      .map((u) => absoluteImg(u))
      .filter(Boolean) as string[]

    const thumbs = imgs.length
      ? `
      <tr>
        <td class="em-gutter" style="padding:0 40px 22px;">
          <p style="margin:0 0 12px;font-size:10px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:${EMAIL.accent};">Reference Images</p>
          ${imgs
        .map(
          (u) =>
            `<a href="${u}" target="_blank" style="text-decoration:none;"><img src="${u}" width="96" height="96" class="em-fluid" style="width:96px;height:96px;object-fit:cover;border:1px solid ${EMAIL.line};margin:0 8px 8px 0;display:inline-block;" alt="reference" /></a>`
        )
        .join('')}
        </td>
      </tr>`
      : ''

    const requestRows: Array<{ k: string; v: string }> = [
      { k: 'Title', v: escHtml(data.title) },
    ]
    if (data.description && data.description.trim())
      requestRows.push({ k: 'Description', v: nl2br(data.description.trim()) })
    if (data.category) requestRows.push({ k: 'Category', v: escHtml(data.category) })
    if (data.metalPreference) requestRows.push({ k: 'Metal', v: escHtml(data.metalPreference) })
    if (data.budget) requestRows.push({ k: 'Budget', v: escHtml(data.budget) })
    if (data.processingTime) requestRows.push({ k: 'Timeline', v: escHtml(data.processingTime) })
    requestRows.push({ k: 'Quantity', v: String(data.quantity ?? 1) })
    if (data.referenceProduct)
      requestRows.push({ k: 'Ref. Product', v: escHtml(data.referenceProduct) })

    const sections = `
      <tr>
        <td class="em-gutter" style="padding:0 40px 24px;">
          <p style="margin:0;font-size:13.5px;line-height:1.85;color:${EMAIL.body};">
            A new custom order request has just been submitted on ${brandName}.
          </p>
        </td>
      </tr>
      ${summaryStrip([
      { label: 'Reference', value: `#${String(data.requestId).slice(0, 8).toUpperCase()}` },
      { label: 'Category', value: data.category || '—' },
      { label: 'Quantity', value: String(data.quantity ?? 1) },
    ])}
      ${panel({
      label: 'Customer',
      innerRows: kvRows([
        { k: 'Name', v: escHtml(data.customerName || '—') },
        { k: 'Email', v: escHtml(data.customerEmail || '—') },
        { k: 'Phone', v: escHtml(data.customerPhone || 'Not provided') },
        { k: 'Country', v: escHtml(data.country || '—') },
      ]),
    })}
      ${panel({
      label: 'Request',
      innerRows: kvRows(requestRows),
    })}
      ${thumbs}
      ${calloutPanel({
      text: 'Review this custom order and reply to the customer from the admin dashboard.',
      buttonHtml: ctaButton(`${appUrl}/admin/custom-orders/${data.requestId}`, 'View in Admin'),
    })}`

    const html = wrapEmail({
      title: 'New Custom Order',
      preheader: `Custom order #${String(data.requestId).slice(0, 8).toUpperCase()} — ${data.title}`,
      hero: heroBlock({
        eyebrow: 'Admin Notification',
        title: 'New Custom',
        titleAccent: 'Order',
      }),
      sections,
      footer: footerBlock({ note: `Internal notification · ${brandName}` }),
    })

    const info = await getTransporter().sendMail({
      from: `"${brandName} · Custom Orders" <${fromEmail}>`,
      to,
      replyTo: data.customerEmail || undefined,
      subject: `New Custom Order #${String(data.requestId).slice(0, 8).toUpperCase()} — ${data.title} | ${brandName}`,
      html,
    })

    console.log(`[Email] Admin custom-order notification sent to ${to}: ${info.messageId}`)
    return true
  } catch (error) {
    console.error('[Email] Failed to send admin custom order notification:', error)
    return false
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   14 · CUSTOM ORDER — REPLY TO CUSTOMER
   Sent to the customer when an admin replies to their custom order request.
   ════════════════════════════════════════════════════════════════════════════ */

export async function sendCustomOrderReplyEmail(data: {
  requestId: string
  customerName: string
  customerEmail: string
  title: string
  message: string
  description?: string
}): Promise<boolean> {
  try {
    if (!data.customerEmail) {
      console.log('[Email] No customer email provided, skipping custom order reply email')
      return false
    }
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('[Email] SMTP credentials not configured, skipping custom order reply email')
      return false
    }

    const brandName = emailBrand()
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
    const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''

    const sections = `
      ${greetingBlock(
      escHtml(data.customerName || 'Valued Customer'),
      `Thank you for your custom order request. Our team has reviewed it and would like to share the following reply with you.`
    )}
      ${calloutPanel({
      eyebrow: 'Our Reply',
      text: nl2br(data.message),
    })}
      ${panel({
      label: 'Your Request',
      innerRows: kvRows([
        { k: 'Title', v: escHtml(data.title) },
        ...(data.description && data.description.trim()
          ? [{ k: 'Details', v: nl2br(data.description.trim()) }]
          : []),
        { k: 'Reference', v: `#${String(data.requestId).slice(0, 8).toUpperCase()}` },
      ]),
    })}
      ${whatsapp
        ? calloutPanel({
          title: 'Have a question?',
          text: 'We are happy to help refine your custom piece.',
          buttonHtml: ctaButton(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`, 'Message Us on WhatsApp', { outline: true }),
        })
        : ''}`

    const html = wrapEmail({
      title: 'Your Custom Order',
      preheader: `A reply regarding your custom order — ${data.title}.`,
      hero: heroBlock({
        eyebrow: 'Custom Order',
        title: 'A Reply to Your',
        titleAccent: 'Request',
        sub: 'Our team has responded to your bespoke jewellery request.',
      }),
      sections,
      footer: footerBlock({
        note: whatsapp
          ? `Questions? Reach us on WhatsApp at ${whatsapp} or simply reply to this email.`
          : 'If you have any questions, simply reply to this email.',
        whatsapp,
      }),
    })

    const info = await getTransporter().sendMail({
      from: `"${brandName}" <${fromEmail}>`,
      to: data.customerEmail,
      subject: `Re: Your Custom Order — ${data.title} | ${brandName}`,
      text: `Dear ${data.customerName || 'Valued Customer'},\n\nThank you for your custom order request "${data.title}". Our team has reviewed it and has replied:\n\n${data.message}\n\nReference: #${String(data.requestId).slice(0, 8).toUpperCase()}\n\nWarm regards,\n${brandName}`,
      html,
    })

    console.log(`[Email] Custom order reply email sent to ${data.customerEmail}: ${info.messageId}`)
    return true
  } catch (error) {
    console.error('[Email] Failed to send custom order reply email:', error)
    return false
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   15 · CONTACT FORM — ADMIN NOTIFICATION (new enquiry submitted)
   Sent to the admin when a customer submits the /contact-us form.
   ════════════════════════════════════════════════════════════════════════════ */

export interface ContactEnquiryData {
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
  /** overrides the default admin recipient (admin-configurable per page) */
  to?: string
}

export async function sendAdminContactEmail(data: ContactEnquiryData): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) return false
    const to = (data.to || '').trim() || adminRecipient()
    if (!to) return false

    const brandName = emailBrand()
    const appUrl = getPublicUrl()
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER

    const sections = `
      <tr>
        <td class="em-gutter" style="padding:0 40px 24px;">
          <p style="margin:0;font-size:13.5px;line-height:1.85;color:${EMAIL.body};">
            A new enquiry has just been submitted via the contact form on ${brandName}.
          </p>
        </td>
      </tr>
      ${panel({
      label: 'Customer',
      innerRows: kvRows([
        { k: 'Name', v: escHtml(data.name || '—') },
        { k: 'Email', v: escHtml(data.email || '—') },
        { k: 'Phone', v: escHtml(data.phone || 'Not provided') },
        ...(data.subject ? [{ k: 'Subject', v: escHtml(data.subject) }] : []),
      ]),
    })}
      ${panel({
      label: 'Message',
      innerRows: kvRows([{ k: 'Enquiry', v: nl2br(data.message) }]),
    })}
      ${calloutPanel({
      text: 'Reply directly to this email to answer the customer, or manage the thread from the admin dashboard.',
      buttonHtml: ctaButton(`${appUrl}/admin/messaging`, 'View in Admin'),
    })}`

    const html = wrapEmail({
      title: 'New Contact Enquiry',
      preheader: `${data.name} — ${data.subject || 'New enquiry via the contact form'}`,
      hero: heroBlock({
        eyebrow: 'Admin Notification',
        title: 'New Contact',
        titleAccent: 'Enquiry',
      }),
      sections,
      footer: footerBlock({ note: `Internal notification · ${brandName}` }),
    })

    const info = await getTransporter().sendMail({
      from: `"${brandName} · Contact" <${fromEmail}>`,
      to,
      replyTo: data.email || undefined,
      subject: `New Enquiry — ${data.subject || 'Contact Form'} · ${data.name} | ${brandName}`,
      html,
    })

    console.log(`[Email] Admin contact enquiry notification sent to ${to}: ${info.messageId}`)
    return true
  } catch (error) {
    console.error('[Email] Failed to send admin contact enquiry notification:', error)
    return false
  }
}
