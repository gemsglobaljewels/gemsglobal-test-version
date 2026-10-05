/**
 * Sustainability — shared config types + defaults.
 *
 * The whole /sustainability page is driven by a single JSONB `config` row in the
 * `sustainability` table (singleton, mirrors craftsmanship / gift_guide /
 * hero_sections). Both the public page (app/sustainability) and the admin editor
 * (app/admin/sustainability) import these types + DEFAULT_SUSTAINABILITY so the
 * page renders sensibly even before the table is seeded.
 *
 * The heart of the page is `sections`: an admin-managed, reorderable list of
 * content blocks. Each section picks one of three layouts and can carry its own
 * reorderable list of `points` (icon + title + text). The admin can:
 *   • add / delete / reorder / hide whole sections,
 *   • add / delete / reorder the points inside any section,
 *   • switch a section's layout, flip its image side, and edit every field.
 *
 * Layouts:
 *   'statement' — centred editorial prose band (e.g. Our Commitment, Our Promise)
 *   'split'     — alternating image + text with a checklist of points
 *   'points'    — an icon-card grid of points (image optional / hidden)
 */

/* ── Curated lucide icon allow-list. The admin picks from these; the public
 *    component maps the name → component. Keep names in sync with the icon map
 *    in components/Sustainability/SustainabilityContent.tsx. ── */
export const SUSTAINABILITY_ICONS = [
  'Leaf', 'Sprout', 'Recycle', 'Gem', 'Diamond', 'Sparkles',
  'ShieldCheck', 'BadgeCheck', 'Award', 'HeartHandshake', 'HandHeart', 'Users',
  'Scale', 'Link', 'Factory', 'Hammer', 'Wrench', 'PackageCheck',
  'Archive', 'Droplets', 'Sun', 'Feather', 'Globe', 'CircleCheck',
] as const

export type SustainabilityIcon = (typeof SUSTAINABILITY_ICONS)[number]

export type SectionLayout = 'statement' | 'split' | 'points'

export interface SustainabilityPoint {
  /** stable id so React keys + reorder stay correct across edits */
  id: string
  /** lucide icon name from SUSTAINABILITY_ICONS */
  icon: string
  title: string
  text: string
}

export interface SustainabilitySection {
  /** stable id so React keys + reorder stay correct across edits */
  id: string
  /** how this block renders on the public page */
  layout: SectionLayout
  /** short kicker above the heading (optional) */
  eyebrow: string
  title: string
  /** body copy — blank lines split into paragraphs on the public page */
  body: string
  /** used by 'split' (and, if present, as a soft backdrop for 'statement') */
  image: string
  /** which side the image sits on for a 'split' block */
  image_side: 'left' | 'right'
  /** reorderable bullet-points (used by 'split' + 'points' layouts) */
  points: SustainabilityPoint[]
  /** hidden sections stay in config but don't render on the public page */
  is_visible: boolean
  /** optional inline CTA under the body */
  cta_text: string
  cta_link: string
}

export interface SustainabilityHero {
  eyebrow: string
  title: string
  /** italic accent word rendered after the title (optional flourish) */
  accent: string
  subtitle: string
  /** long-form intro shown under the title (supports blank-line paragraph breaks) */
  intro: string
  image: string
  /** small floating pill on the hero image (optional) */
  badge_text: string
}

export interface SustainabilityStat {
  id: string
  value: string
  label: string
}

export interface SustainabilityClosing {
  eyebrow: string
  title: string
  accent: string
  subtitle: string
  cta_text: string
  cta_link: string
  /** full-bleed background image behind the closing CTA (optional — falls back
   *  to the first section image, then the hero image, then a stock shot) */
  bg_image: string
  /** 'accent' = sage/taupe band, 'dark' = deep-espresso band (both on-brand) */
  theme: 'accent' | 'dark'
}

export interface SustainabilityConfig {
  hero: SustainabilityHero
  /** trust strip shown under the hero (optional — leave empty to hide) */
  stats: SustainabilityStat[]
  /** section heading shown above the content blocks (optional) */
  sections_eyebrow: string
  sections_title: string
  /** the repeatable, reorderable content blocks */
  sections: SustainabilitySection[]
  closing: SustainabilityClosing
}

/** Deterministic id generators — avoid Math.random/Date.now at module load. */
let _idSeed = 0
export const newSectionId = () =>
  `sus_sec_${Date.now().toString(36)}_${(_idSeed++).toString(36)}`
export const newPointId = () =>
  `sus_pt_${Date.now().toString(36)}_${(_idSeed++).toString(36)}`

export const DEFAULT_SUSTAINABILITY: SustainabilityConfig = {
  hero: {
    eyebrow: 'Our Responsibility',
    title: 'Beautiful Jewellery,',
    accent: 'Made Responsibly',
    subtitle:
      'We believe luxury and responsibility should go hand in hand — timeless pieces, made with care.',
    intro:
      'Every ring, pendant and pair of earrings we create is designed to be treasured for generations — not for a season.\n\nFrom the diamonds we choose to the way we package and finish each piece, we take a more conscious approach to fine jewellery, so the beauty you wear is matched by the care behind it.',
    image:
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1100&h=1300&fit=crop&q=90',
    badge_text: 'Consciously Crafted',
  },
  stats: [
    { id: 'st_1', value: '100%', label: 'Conflict-Free Diamonds' },
    { id: 'st_2', value: 'IGI', label: 'Certified for Quality' },
    { id: 'st_3', value: 'Solid Gold', label: 'Built to Last' },
    { id: 'st_4', value: 'Made to Order', label: 'Less Excess, Less Waste' },
  ],
  sections_eyebrow: 'Our Approach',
  sections_title: 'How We Practise Sustainability',
  sections: [
    {
      id: 'sus_default_commitment',
      layout: 'statement',
      eyebrow: 'Our Commitment',
      title: 'Luxury and Responsibility, Hand in Hand',
      body:
        'We believe luxury and responsibility should go hand in hand. We are committed to creating beautiful jewellery using ethical practices, carefully selected materials, and responsible craftsmanship.\n\nOur goal is to offer timeless pieces that are designed to be treasured for generations, while supporting a more conscious approach to fine jewellery.',
      image:
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=800&fit=crop&q=90',
      image_side: 'left',
      points: [],
      is_visible: true,
      cta_text: '',
      cta_link: '',
    },
    {
      id: 'sus_default_labgrown',
      layout: 'split',
      eyebrow: 'Lab-Grown Diamonds',
      title: 'Why We Choose Lab-Grown',
      body:
        'Lab-grown diamonds are real diamonds — grown in a controlled environment that recreates the exact conditions in which diamonds form in nature. The result is a stone that is every bit as brilliant, with an origin you can trace with confidence.',
      image:
        'https://images.unsplash.com/photo-1615655406736-b37c4fabf923?w=1000&h=1100&fit=crop&q=88',
      image_side: 'left',
      points: [
        { id: 'p_lg_1', icon: 'Diamond', title: 'Identical to Mined', text: 'Physically, chemically and optically identical to mined diamonds — the same fire and brilliance.' },
        { id: 'p_lg_2', icon: 'Sparkles', title: 'Advanced Technology', text: 'Created using advanced technology that mirrors how diamonds form deep within the earth.' },
        { id: 'p_lg_3', icon: 'ShieldCheck', title: 'Conflict-Free Origin', text: 'A transparent, traceable origin — free from conflict and easy to feel good about.' },
        { id: 'p_lg_4', icon: 'BadgeCheck', title: 'Certified for Quality', text: 'Independently graded and IGI-certified for cut, colour, clarity and carat.' },
      ],
      is_visible: true,
      cta_text: '',
      cta_link: '',
    },
    {
      id: 'sus_default_sourcing',
      layout: 'split',
      eyebrow: 'Ethical Sourcing',
      title: 'A Supply Chain We Stand Behind',
      body:
        'The materials we work with are chosen as carefully as the designs they become. We partner only with suppliers who share our standards, so every piece begins with integrity.',
      image:
        'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=1000&h=1100&fit=crop&q=88',
      image_side: 'right',
      points: [
        { id: 'p_es_1', icon: 'HeartHandshake', title: 'Responsibly Sourced Metals', text: 'Precious metals sourced responsibly through trusted, vetted partners.' },
        { id: 'p_es_2', icon: 'Users', title: 'Trusted Suppliers', text: 'Long-standing supplier relationships built on transparency and accountability.' },
        { id: 'p_es_3', icon: 'Link', title: 'Ethical Supply Chain', text: 'Every step of the chain is chosen to uphold fair, ethical practice.' },
        { id: 'p_es_4', icon: 'Scale', title: 'Industry Standards', text: 'Full compliance with recognised industry standards and best practice.' },
      ],
      is_visible: true,
      cta_text: '',
      cta_link: '',
    },
    {
      id: 'sus_default_manufacturing',
      layout: 'split',
      eyebrow: 'Responsible Manufacturing',
      title: 'Made With Intention, Not Excess',
      body:
        'We make jewellery the considered way — producing what is loved rather than filling vaults with stock. Less waste, more care, and a piece that has been through skilled hands at every stage.',
      image:
        'https://images.unsplash.com/photo-1633934542430-0905ccb5f050?w=1000&h=1100&fit=crop&q=88',
      image_side: 'left',
      points: [
        { id: 'p_rm_1', icon: 'Hammer', title: 'Made to Order', text: 'Many pieces are crafted to order, so we create what is wanted — not what sits unsold.' },
        { id: 'p_rm_2', icon: 'Recycle', title: 'Reduced Excess Inventory', text: 'Producing thoughtfully means less overproduction and far less waste.' },
        { id: 'p_rm_3', icon: 'ShieldCheck', title: 'Careful Quality Inspection', text: 'Every piece is inspected by hand before it ever reaches you.' },
        { id: 'p_rm_4', icon: 'HandHeart', title: 'Skilled Artisans', text: 'Crafted by experienced goldsmiths who take pride in every detail.' },
      ],
      is_visible: true,
      cta_text: '',
      cta_link: '',
    },
    {
      id: 'sus_default_quality',
      layout: 'points',
      eyebrow: 'Quality & Longevity',
      title: 'Made to Be Treasured for Generations',
      body:
        'Sustainability is also about making things that last. Our pieces are built to be worn every day and loved for a lifetime — the opposite of fast fashion.',
      image: '',
      image_side: 'left',
      points: [
        { id: 'p_q_1', icon: 'Gem', title: 'Solid Gold Jewellery', text: 'Crafted in solid gold — never plated or filled — for lasting value.' },
        { id: 'p_q_2', icon: 'Award', title: 'Durable Craftsmanship', text: 'Built to endure a lifetime of everyday wear.' },
        { id: 'p_q_3', icon: 'Diamond', title: 'High-Quality Settings', text: 'Secure, precise settings that hold every stone safely.' },
        { id: 'p_q_4', icon: 'Sun', title: 'Designed for Everyday Wear', text: 'Comfortable, resilient pieces made for real life.' },
        { id: 'p_q_5', icon: 'Feather', title: 'Timeless Designs', text: 'Considered design over fast fashion — style that never dates.' },
      ],
      is_visible: true,
      cta_text: '',
      cta_link: '',
    },
    {
      id: 'sus_default_packaging',
      layout: 'split',
      eyebrow: 'Packaging',
      title: 'Thoughtful From the Inside Out',
      body:
        'The care we put into our jewellery extends to how it arrives. We keep our packaging beautiful, useful and as low-impact as we can.',
      image:
        'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1000&h=1100&fit=crop&q=88',
      image_side: 'right',
      points: [
        { id: 'p_pk_1', icon: 'PackageCheck', title: 'Recyclable Boxes', text: 'Presentation boxes designed to be recycled or reused.' },
        { id: 'p_pk_2', icon: 'Leaf', title: 'Minimal Plastic', text: 'We keep plastic to an absolute minimum across our packaging.' },
        { id: 'p_pk_3', icon: 'Archive', title: 'Reusable Jewellery Boxes', text: 'Keepsake boxes made to protect and store your pieces for years.' },
        { id: 'p_pk_4', icon: 'Sprout', title: 'Responsible Materials', text: 'We continually seek lower-impact, responsibly made materials.' },
      ],
      is_visible: true,
      cta_text: '',
      cta_link: '',
    },
    {
      id: 'sus_default_care',
      layout: 'points',
      eyebrow: 'Jewellery Care',
      title: 'Caring for Pieces Made to Last',
      body:
        'A little care goes a long way. Looking after your jewellery keeps it beautiful and extends its life for years to come.',
      image: '',
      image_side: 'left',
      points: [
        { id: 'p_c_1', icon: 'Archive', title: 'Proper Storage', text: 'Store pieces separately in a soft-lined box to avoid scratches.' },
        { id: 'p_c_2', icon: 'Droplets', title: 'Gentle Cleaning', text: 'Clean with warm water, mild soap and a soft brush.' },
        { id: 'p_c_3', icon: 'ShieldCheck', title: 'Regular Inspection', text: 'Check settings and clasps periodically for signs of wear.' },
        { id: 'p_c_4', icon: 'Wrench', title: 'Professional Maintenance', text: 'Book occasional professional cleaning and servicing.' },
      ],
      is_visible: true,
      cta_text: '',
      cta_link: '',
    },
    {
      id: 'sus_default_promise',
      layout: 'statement',
      eyebrow: 'Our Promise',
      title: 'A Journey, Not a Destination',
      body:
        'Sustainability is a journey, not a destination. We continually seek ways to improve our materials, processes and partnerships — while delivering exceptional jewellery that our customers can wear with confidence.',
      image:
        'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=1200&h=800&fit=crop&q=90',
      image_side: 'left',
      points: [],
      is_visible: true,
      cta_text: 'Explore the Collection',
      cta_link: '/collection',
    },
  ],
  closing: {
    eyebrow: 'Conscious by Design',
    title: 'Jewellery You Can Wear With',
    accent: 'Confidence',
    subtitle:
      'Discover pieces created with care — for you, and for the world they are worn in.',
    cta_text: 'Explore the Collection',
    cta_link: '/collection',
    bg_image:
      'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?w=1600&h=1000&fit=crop&q=90',
    theme: 'accent',
  },
}

/* ── normalizers: merge partial/legacy stored config over defaults so a missing
 *    key never crashes the page (older seeds may lack newly added fields). ── */

function normalizePoint(raw: any, i: number): SustainabilityPoint {
  const p = raw && typeof raw === 'object' ? raw : {}
  return {
    id: typeof p.id === 'string' && p.id ? p.id : `pt_${i}_${(_idSeed++).toString(36)}`,
    icon: typeof p.icon === 'string' && p.icon ? p.icon : 'Leaf',
    title: typeof p.title === 'string' ? p.title : '',
    text: typeof p.text === 'string' ? p.text : '',
  }
}

function normalizeSection(raw: any, i: number): SustainabilitySection {
  const s = raw && typeof raw === 'object' ? raw : {}
  const layout: SectionLayout =
    s.layout === 'split' || s.layout === 'points' || s.layout === 'statement'
      ? s.layout
      : 'split'
  return {
    id: typeof s.id === 'string' && s.id ? s.id : `sec_${i}_${(_idSeed++).toString(36)}`,
    layout,
    eyebrow: typeof s.eyebrow === 'string' ? s.eyebrow : '',
    title: typeof s.title === 'string' ? s.title : '',
    body: typeof s.body === 'string' ? s.body : '',
    image: typeof s.image === 'string' ? s.image : '',
    image_side: s.image_side === 'right' ? 'right' : 'left',
    points: Array.isArray(s.points) ? s.points.map(normalizePoint) : [],
    is_visible: s.is_visible !== false,
    cta_text: typeof s.cta_text === 'string' ? s.cta_text : '',
    cta_link: typeof s.cta_link === 'string' ? s.cta_link : '',
  }
}

function normalizeStat(raw: any, i: number): SustainabilityStat {
  const s = raw && typeof raw === 'object' ? raw : {}
  return {
    id: typeof s.id === 'string' && s.id ? s.id : `st_${i}_${(_idSeed++).toString(36)}`,
    value: typeof s.value === 'string' ? s.value : '',
    label: typeof s.label === 'string' ? s.label : '',
  }
}

/**
 * Merge a partial/legacy stored config over the defaults. Explicitly empty
 * arrays (sections/stats/points) are respected — the admin may have deleted
 * every item.
 */
export function normalizeSustainability(raw: any): SustainabilityConfig {
  const cfg = raw && typeof raw === 'object' ? raw : {}
  return {
    ...DEFAULT_SUSTAINABILITY,
    ...cfg,
    hero: { ...DEFAULT_SUSTAINABILITY.hero, ...(cfg.hero || {}) },
    stats: Array.isArray(cfg.stats)
      ? cfg.stats.map(normalizeStat)
      : DEFAULT_SUSTAINABILITY.stats,
    sections_eyebrow:
      typeof cfg.sections_eyebrow === 'string'
        ? cfg.sections_eyebrow
        : DEFAULT_SUSTAINABILITY.sections_eyebrow,
    sections_title:
      typeof cfg.sections_title === 'string'
        ? cfg.sections_title
        : DEFAULT_SUSTAINABILITY.sections_title,
    sections: Array.isArray(cfg.sections)
      ? cfg.sections.map(normalizeSection)
      : DEFAULT_SUSTAINABILITY.sections,
    closing: { ...DEFAULT_SUSTAINABILITY.closing, ...(cfg.closing || {}) },
  }
}
