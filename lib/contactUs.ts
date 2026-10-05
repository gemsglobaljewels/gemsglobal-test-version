/**
 * Contact Us — shared config types + defaults.
 *
 * The whole /contact-us page is driven by a single JSONB `config` row in the
 * `contact_us` table (singleton, mirrors repairs / privacy / gift_guide).
 * Both the public page (app/contact-us) and the admin editor
 * (app/admin/contact-us) import these types + DEFAULT_CONTACT_US so the page
 * renders sensibly even before the table is seeded.
 *
 * The page is deliberately image-free: a typography-led hero, clickable
 * contact channel cards, a premium enquiry form beside the support-hours
 * rail, and reorderable editorial info sections. The admin can:
 *   • add / delete / reorder / hide channels, sections & their points,
 *   • add / delete / reorder support-hour rows and form subject options,
 *   • edit every text field, link and toggle.
 *
 * Inline links: section bodies (and point texts) support a tiny markdown
 * subset — `[label](href)` renders as an underlined link — and bare emails,
 * URLs and `+…` phone numbers are auto-linked (mailto: / tel:) on the public
 * page. See renderInline() in components/Contact/ContactUsContent.tsx.
 */

/* ── Curated lucide icon allow-list. The admin picks from these; the public
 *    component maps the name → component. Keep names in sync with the icon
 *    map in components/Contact/ContactUsContent.tsx. ── */
export const CONTACT_ICONS = [
  'Mail', 'Phone', 'MessageCircle', 'MapPin', 'Send', 'Globe',
  'Clock', 'CalendarClock', 'CalendarCheck', 'Timer', 'Watch',
  'Gem', 'Diamond', 'Sparkles', 'Crown', 'Gift', 'PenTool',
  'ShieldCheck', 'BadgeCheck', 'Award', 'Star', 'CircleCheck',
  'HeartHandshake', 'HandHeart', 'Users', 'Headphones', 'LifeBuoy',
  'Truck', 'PackageCheck', 'RefreshCw', 'Instagram', 'Youtube',
] as const

export type ContactIcon = (typeof CONTACT_ICONS)[number]

/** A clickable contact channel card (email / call / appointment / …). */
export interface ContactChannel {
  /** stable id so React keys + reorder stay correct across edits */
  id: string
  /** lucide icon name from CONTACT_ICONS */
  icon: string
  label: string
  /** the visible value, e.g. the address or a short line */
  value: string
  /** mailto: / tel: / https:… / internal path like /appointments */
  href: string
  /** small reassurance line under the value */
  note: string
}

/** One row of the support-hours table. */
export interface ContactHourRow {
  id: string
  days: string
  hours: string
}

/** A bullet-point inside an info section (icon + title + text). */
export interface ContactPoint {
  id: string
  icon: string
  title: string
  text: string
}

/** A reorderable editorial info block (Our Commitment, Email Support, …). */
export interface ContactSection {
  id: string
  /** short kicker above the heading (optional) */
  eyebrow: string
  title: string
  /** body copy — blank lines split into paragraphs; supports [label](href)
   *  inline links; bare emails / URLs / +phone numbers auto-link */
  body: string
  /** reorderable checklist points (optional) */
  points: ContactPoint[]
  /** hidden sections stay in config but don't render on the public page */
  is_visible: boolean
}

export interface ContactHero {
  eyebrow: string
  title: string
  /** italic accent rendered after the title (optional flourish) */
  accent: string
  subtitle: string
}

export interface ContactHours {
  eyebrow: string
  title: string
  /** small note under the table (auto-links like section bodies) */
  note: string
  rows: ContactHourRow[]
  is_visible: boolean
}

export interface ContactForm {
  eyebrow: string
  title: string
  subtitle: string
  button_text: string
  success_title: string
  success_text: string
  /** show the optional phone field */
  show_phone: boolean
  /** subject dropdown options (empty → subject select is hidden) */
  subjects: string[]
  /** where submission notifications are emailed; blank → site default */
  notify_email: string
}

export interface ContactUsConfig {
  hero: ContactHero
  /** clickable channel cards under the hero (optional — empty hides strip) */
  channels: ContactChannel[]
  form: ContactForm
  hours: ContactHours
  /** heading shown above the info sections (optional) */
  sections_eyebrow: string
  sections_title: string
  /** the repeatable, reorderable info blocks */
  sections: ContactSection[]
}

/** Deterministic id generators — avoid Math.random at module load. */
let _idSeed = 0
export const newChannelId = () =>
  `ct_ch_${Date.now().toString(36)}_${(_idSeed++).toString(36)}`
export const newSectionId = () =>
  `ct_sec_${Date.now().toString(36)}_${(_idSeed++).toString(36)}`
export const newPointId = () =>
  `ct_pt_${Date.now().toString(36)}_${(_idSeed++).toString(36)}`
export const newHourId = () =>
  `ct_hr_${Date.now().toString(36)}_${(_idSeed++).toString(36)}`

export const DEFAULT_CONTACT_US: ContactUsConfig = {
  hero: {
    eyebrow: 'Contact Us',
    title: 'We Would Love to',
    accent: 'Hear From You',
    subtitle:
      'Questions about a piece, an order or a bespoke commission — our team replies personally, usually within one business day.',
  },
  channels: [
    {
      id: 'ch_email',
      icon: 'Mail',
      label: 'Email Support',
      value: 'hello@gemsglobaljewels.com',
      href: 'mailto:hello@gemsglobaljewels.com',
      note: 'Our primary contact method — replies within 24 hours',
    },
    {
      id: 'ch_appt',
      icon: 'CalendarCheck',
      label: 'Book an Appointment',
      value: 'Virtual or in-person consultations',
      href: '/appointments',
      note: 'Choose a date and time that suits you',
    },
    {
      id: 'ch_custom',
      icon: 'Gem',
      label: 'Custom Orders',
      value: 'Design something uniquely yours',
      href: '/custom-order',
      note: 'Share your idea — we will bring it to life',
    },
  ],
  form: {
    eyebrow: 'Send a Message',
    title: 'How Can We Help?',
    subtitle:
      'Tell us a little about your enquiry and we will get back to you personally.',
    button_text: 'Send Message',
    success_title: 'Thank You — Message Received',
    success_text:
      'Your message is with our team. We reply personally, usually within one business day.',
    show_phone: true,
    subjects: [
      'General Enquiry',
      'Order Support',
      'Custom Design & Personalization',
      'Repairs & Aftercare',
      'Press & Partnerships',
    ],
    notify_email: '',
  },
  hours: {
    eyebrow: 'When We Are Available',
    title: 'Customer Support Hours',
    note:
      'Times shown in India Standard Time (IST). Email us anytime — messages sent outside these hours are answered the next business day.',
    rows: [
      { id: 'hr_1', days: 'Monday – Friday', hours: '9:30 AM – 6:30 PM' },
      { id: 'hr_2', days: 'Saturday', hours: '10:00 AM – 5:00 PM' },
      { id: 'hr_3', days: 'Sunday & Holidays', hours: 'By appointment only' },
    ],
    is_visible: true,
  },
  sections_eyebrow: 'Good to Know',
  sections_title: 'Contact Us & Information',
  sections: [
    {
      id: 'ct_default_commitment',
      eyebrow: 'Our Promise',
      title: 'Our Commitment to You',
      body:
        'Every enquiry is read and answered by a real member of our team — never an automated reply. Whether you are asking about a ring size or commissioning an heirloom, you deserve the same care we put into our jewellery.\n\nWe treat your details with complete discretion and will only ever use them to help with your enquiry.',
      points: [
        { id: 'pt_c_1', icon: 'HeartHandshake', title: 'Personal Replies', text: 'A jewellery specialist — not a bot — answers every message.' },
        { id: 'pt_c_2', icon: 'Clock', title: 'Within One Business Day', text: 'Most enquiries are answered the same day; all within 24 hours.' },
        { id: 'pt_c_3', icon: 'ShieldCheck', title: 'Private & Secure', text: 'Your details are never shared and never used for anything else.' },
      ],
      is_visible: true,
    },
    {
      id: 'ct_default_email',
      eyebrow: 'Primary Contact Method',
      title: 'Email Support (Primary Contact Method)',
      body:
        'Email is the fastest and most reliable way to reach us. Write to hello@gemsglobaljewels.com with your order number (if you have one) and as much detail as you like — photographs welcome.\n\nFor order-related questions, please use the email address you placed the order with so we can find everything quickly.',
      points: [
        { id: 'pt_e_1', icon: 'Mail', title: 'Order Questions', text: 'Include your order number for the fastest help.' },
        { id: 'pt_e_2', icon: 'PackageCheck', title: 'Shipping & Delivery', text: 'Tracking, customs and delivery timelines — we will chase it for you.' },
        { id: 'pt_e_3', icon: 'RefreshCw', title: 'Returns & Exchanges', text: 'Start a return or exchange by replying to your order confirmation.' },
      ],
      is_visible: true,
    },
    {
      id: 'ct_default_custom',
      eyebrow: 'Bespoke Service',
      title: 'Custom Orders & Personalization Support',
      body:
        'Dreaming of a one-of-a-kind piece? Our designers and master goldsmiths work with you from first sketch to final polish — engraving, birthstones, redesigns of heirloom pieces and fully bespoke commissions.\n\nThe best way to begin is to [book an appointment](/appointments) for a complimentary consultation, or start a [custom order](/custom-order) online and we will reply with ideas, timelines and pricing.',
      points: [
        { id: 'pt_b_1', icon: 'PenTool', title: 'Engraving & Personal Touches', text: 'Names, dates and messages, hand-finished by our engravers.' },
        { id: 'pt_b_2', icon: 'Crown', title: 'Heirloom Redesign', text: 'Give treasured stones and metal a beautiful new life.' },
        { id: 'pt_b_3', icon: 'Sparkles', title: 'Fully Bespoke', text: 'From sketch to setting — a piece that exists only for you.' },
      ],
      is_visible: true,
    },
  ],
}

/* ── normalizers: merge partial/legacy stored config over defaults so a missing
 *    key never crashes the page (older seeds may lack newly added fields). ── */

function normStr(v: any, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function normalizeChannel(raw: any, i: number): ContactChannel {
  const c = raw && typeof raw === 'object' ? raw : {}
  return {
    id: typeof c.id === 'string' && c.id ? c.id : `ch_${i}_${(_idSeed++).toString(36)}`,
    icon: typeof c.icon === 'string' && c.icon ? c.icon : 'Mail',
    label: normStr(c.label),
    value: normStr(c.value),
    href: normStr(c.href),
    note: normStr(c.note),
  }
}

function normalizePoint(raw: any, i: number): ContactPoint {
  const p = raw && typeof raw === 'object' ? raw : {}
  return {
    id: typeof p.id === 'string' && p.id ? p.id : `pt_${i}_${(_idSeed++).toString(36)}`,
    icon: typeof p.icon === 'string' && p.icon ? p.icon : 'CircleCheck',
    title: normStr(p.title),
    text: normStr(p.text),
  }
}

function normalizeSection(raw: any, i: number): ContactSection {
  const s = raw && typeof raw === 'object' ? raw : {}
  return {
    id: typeof s.id === 'string' && s.id ? s.id : `sec_${i}_${(_idSeed++).toString(36)}`,
    eyebrow: normStr(s.eyebrow),
    title: normStr(s.title),
    body: normStr(s.body),
    points: Array.isArray(s.points) ? s.points.map(normalizePoint) : [],
    is_visible: s.is_visible !== false,
  }
}

function normalizeHourRow(raw: any, i: number): ContactHourRow {
  const r = raw && typeof raw === 'object' ? raw : {}
  return {
    id: typeof r.id === 'string' && r.id ? r.id : `hr_${i}_${(_idSeed++).toString(36)}`,
    days: normStr(r.days),
    hours: normStr(r.hours),
  }
}

/**
 * Merge a partial/legacy stored config over the defaults. Explicitly empty
 * arrays (channels/sections/points/rows/subjects) are respected — the admin
 * may have deleted every item.
 */
export function normalizeContactUs(raw: any): ContactUsConfig {
  const cfg = raw && typeof raw === 'object' ? raw : {}
  const form = cfg.form && typeof cfg.form === 'object' ? cfg.form : {}
  const hours = cfg.hours && typeof cfg.hours === 'object' ? cfg.hours : {}
  return {
    hero: { ...DEFAULT_CONTACT_US.hero, ...(cfg.hero || {}) },
    channels: Array.isArray(cfg.channels)
      ? cfg.channels.map(normalizeChannel)
      : DEFAULT_CONTACT_US.channels,
    form: {
      ...DEFAULT_CONTACT_US.form,
      ...form,
      show_phone: form.show_phone !== false,
      subjects: Array.isArray(form.subjects)
        ? form.subjects.filter((s: any) => typeof s === 'string')
        : DEFAULT_CONTACT_US.form.subjects,
      notify_email: normStr(form.notify_email),
    },
    hours: {
      ...DEFAULT_CONTACT_US.hours,
      ...hours,
      rows: Array.isArray(hours.rows)
        ? hours.rows.map(normalizeHourRow)
        : DEFAULT_CONTACT_US.hours.rows,
      is_visible: hours.is_visible !== false,
    },
    sections_eyebrow:
      typeof cfg.sections_eyebrow === 'string'
        ? cfg.sections_eyebrow
        : DEFAULT_CONTACT_US.sections_eyebrow,
    sections_title:
      typeof cfg.sections_title === 'string'
        ? cfg.sections_title
        : DEFAULT_CONTACT_US.sections_title,
    sections: Array.isArray(cfg.sections)
      ? cfg.sections.map(normalizeSection)
      : DEFAULT_CONTACT_US.sections,
  }
}
