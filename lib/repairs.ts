/**
 * Repairs — shared config types + defaults.
 *
 * The whole /repairs page is driven by a single JSONB `config` row in the
 * `repairs` table (singleton, mirrors sustainability / craftsmanship /
 * gift_guide / hero_sections). Both the public page (app/repairs) and the
 * admin editor (app/admin/repairs) import these types + DEFAULT_REPAIRS so the
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
 *   'statement' — centred editorial prose band (e.g. Our Workshop, Our Promise)
 *   'split'     — alternating image + text with a checklist of points
 *   'points'    — an icon-card grid of points (image optional / hidden)
 */

/* ── Curated lucide icon allow-list. The admin picks from these; the public
 *    component maps the name → component. Keep names in sync with the icon map
 *    in components/Repairs/RepairsContent.tsx. ── */
export const REPAIRS_ICONS = [
  'Wrench', 'Hammer', 'Settings', 'Cog', 'Ruler', 'Scissors',
  'Gem', 'Diamond', 'Sparkles', 'Crown', 'Watch', 'PenTool',
  'ShieldCheck', 'BadgeCheck', 'Award', 'Medal', 'Star', 'CircleCheck',
  'Clock', 'Timer', 'CalendarClock', 'RefreshCw', 'Recycle', 'Droplets',
  'Truck', 'PackageCheck', 'HandHeart', 'HeartHandshake', 'Users', 'Scale',
  'MapPin', 'Phone', 'Send', 'Feather', 'Sun',
] as const

export type RepairIcon = (typeof REPAIRS_ICONS)[number]

export type SectionLayout = 'statement' | 'split' | 'points'

export interface RepairPoint {
  /** stable id so React keys + reorder stay correct across edits */
  id: string
  /** lucide icon name from REPAIRS_ICONS */
  icon: string
  title: string
  text: string
}

export interface RepairSection {
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
  points: RepairPoint[]
  /** hidden sections stay in config but don't render on the public page */
  is_visible: boolean
  /** optional inline CTA under the body */
  cta_text: string
  cta_link: string
}

export interface RepairsHero {
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

export interface RepairsStat {
  id: string
  value: string
  label: string
}

export interface RepairsClosing {
  eyebrow: string
  title: string
  accent: string
  subtitle: string
  cta_text: string
  cta_link: string
  /** full-bleed background image behind the closing CTA (optional — falls back
   *  to the first section image, then the hero image, then a stock shot) */
  bg_image: string
  /** 'accent' = warm taupe band, 'dark' = deep-espresso band (both on-brand) */
  theme: 'accent' | 'dark'
}

export interface RepairsConfig {
  hero: RepairsHero
  /** trust strip shown under the hero (optional — leave empty to hide) */
  stats: RepairsStat[]
  /** section heading shown above the content blocks (optional) */
  sections_eyebrow: string
  sections_title: string
  /** the repeatable, reorderable content blocks */
  sections: RepairSection[]
  closing: RepairsClosing
}

/** Deterministic id generators — avoid Math.random/Date.now at module load. */
let _idSeed = 0
export const newSectionId = () =>
  `rep_sec_${Date.now().toString(36)}_${(_idSeed++).toString(36)}`
export const newPointId = () =>
  `rep_pt_${Date.now().toString(36)}_${(_idSeed++).toString(36)}`

export const DEFAULT_REPAIRS: RepairsConfig = {
  hero: {
    eyebrow: 'Jewellery Repairs & Restoration',
    title: 'Expert Care for',
    accent: 'Pieces You Treasure',
    subtitle:
      'From a loose stone to a full restoration — our master goldsmiths bring your jewellery back to its best.',
    intro:
      'Fine jewellery is made to last a lifetime, but everyday wear takes its toll. A worn claw, a stretched chain, a dull finish — small things that deserve expert hands.\n\nOur in-house workshop repairs and restores gold, platinum and diamond jewellery with the same care we put into creating it. Every piece is assessed, quoted and cared for by skilled craftspeople — no job too small, no heirloom too precious.',
    image:
      'https://images.unsplash.com/photo-1600721391776-b5cd0e0048f9?w=1100&h=1300&fit=crop&q=90',
    badge_text: 'In-House Workshop',
  },
  stats: [
    { id: 'st_1', value: 'In-House', label: 'Master Goldsmiths' },
    { id: 'st_2', value: 'Free', label: 'Assessment & Quote' },
    { id: 'st_3', value: '5–10 Days', label: 'Typical Turnaround' },
    { id: 'st_4', value: '12-Month', label: 'Repair Guarantee' },
  ],
  sections_eyebrow: 'What We Do',
  sections_title: 'Repairs & Restoration Services',
  sections: [
    {
      id: 'rep_default_commitment',
      layout: 'statement',
      eyebrow: 'Our Workshop',
      title: 'Craftsmanship That Restores, Not Replaces',
      body:
        'We believe a well-made piece deserves to be repaired, not discarded. Our workshop brings together traditional goldsmithing and modern precision to return your jewellery to its former beauty.\n\nWhether it is a treasured heirloom or a recent favourite, every repair is handled with discretion, expertise and respect for the original design.',
      image:
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=800&fit=crop&q=90',
      image_side: 'left',
      points: [],
      is_visible: true,
      cta_text: '',
      cta_link: '',
    },
    {
      id: 'rep_default_ring',
      layout: 'split',
      eyebrow: 'Ring Repairs',
      title: 'Resizing, Re-Tipping & Rebuilding',
      body:
        'Rings take the most wear of any piece. We resize, restore worn shanks, re-tip claws and rebuild settings so your ring is secure and comfortable for years to come.',
      image:
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1000&h=1100&fit=crop&q=88',
      image_side: 'left',
      points: [
        { id: 'p_r_1', icon: 'Ruler', title: 'Ring Resizing', text: 'Sized up or down precisely, keeping the band even and the profile true.' },
        { id: 'p_r_2', icon: 'ShieldCheck', title: 'Claw Re-Tipping', text: 'Worn claws rebuilt so your stones are held safely and securely.' },
        { id: 'p_r_3', icon: 'Hammer', title: 'Shank Restoration', text: 'Thin or worn shanks reinforced or replaced for lasting strength.' },
        { id: 'p_r_4', icon: 'Gem', title: 'Setting Rebuilds', text: 'Damaged settings rebuilt to hold and showcase your diamonds.' },
      ],
      is_visible: true,
      cta_text: '',
      cta_link: '',
    },
    {
      id: 'rep_default_stone',
      layout: 'split',
      eyebrow: 'Stone & Diamond Work',
      title: 'Replacements, Resetting & Tightening',
      body:
        'A missing or loose stone doesn’t mean the end of a piece. We source matching diamonds and gemstones, reset loose stones and tighten settings with jeweller’s precision.',
      image:
        'https://images.unsplash.com/photo-1615655406736-b37c4fabf923?w=1000&h=1100&fit=crop&q=88',
      image_side: 'right',
      points: [
        { id: 'p_s_1', icon: 'Diamond', title: 'Stone Replacement', text: 'Lost or chipped stones matched and replaced to blend seamlessly.' },
        { id: 'p_s_2', icon: 'Sparkles', title: 'Stone Tightening', text: 'Loose stones re-secured before they are lost.' },
        { id: 'p_s_3', icon: 'Search', title: 'Free Assessment', text: 'Every setting inspected under magnification so nothing is missed.' },
        { id: 'p_s_4', icon: 'BadgeCheck', title: 'Matched to Original', text: 'Cut, colour and clarity matched to preserve your piece’s look.' },
      ],
      is_visible: true,
      cta_text: '',
      cta_link: '',
    },
    {
      id: 'rep_default_chain',
      layout: 'split',
      eyebrow: 'Chains & Clasps',
      title: 'Necklaces, Bracelets & Fastenings',
      body:
        'From a snapped chain to a tired clasp, we repair the pieces you wear every day so they fasten smoothly and sit beautifully once again.',
      image:
        'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=1000&h=1100&fit=crop&q=88',
      image_side: 'left',
      points: [
        { id: 'p_c_1', icon: 'Wrench', title: 'Chain Soldering', text: 'Broken links repaired invisibly and reinforced against future wear.' },
        { id: 'p_c_2', icon: 'RefreshCw', title: 'Clasp Replacement', text: 'Worn or broken clasps replaced with secure, easy-to-use fastenings.' },
        { id: 'p_c_3', icon: 'Scissors', title: 'Shortening & Lengthening', text: 'Chains and bracelets adjusted to your preferred length.' },
        { id: 'p_c_4', icon: 'CircleCheck', title: 'Pearl Restringing', text: 'Pearl and bead strands restrung and knotted by hand.' },
      ],
      is_visible: true,
      cta_text: '',
      cta_link: '',
    },
    {
      id: 'rep_default_finishing',
      layout: 'points',
      eyebrow: 'Cleaning & Finishing',
      title: 'Bring Back the Shine',
      body:
        'A professional clean and finish can make a piece look years younger. We restore the surface, colour and sparkle that everyday wear dulls over time.',
      image: '',
      image_side: 'left',
      points: [
        { id: 'p_f_1', icon: 'Sparkles', title: 'Professional Polishing', text: 'Scratches and scuffs polished away to restore a mirror finish.' },
        { id: 'p_f_2', icon: 'Droplets', title: 'Rhodium Plating', text: 'White gold re-plated for a bright, even, brilliant-white finish.' },
        { id: 'p_f_3', icon: 'Sun', title: 'Ultrasonic Cleaning', text: 'Deep, gentle cleaning that reaches every setting and crevice.' },
        { id: 'p_f_4', icon: 'PenTool', title: 'Engraving', text: 'New engraving added, or worn engraving carefully refreshed.' },
        { id: 'p_f_5', icon: 'Watch', title: 'Watch Servicing', text: 'Battery changes, strap adjustments and basic watch care.' },
      ],
      is_visible: true,
      cta_text: '',
      cta_link: '',
    },
    {
      id: 'rep_default_process',
      layout: 'points',
      eyebrow: 'How It Works',
      title: 'Simple, Transparent & Insured',
      body:
        'Getting your jewellery repaired with us is straightforward. Here is what to expect from first contact to the moment your piece is back on your hand.',
      image: '',
      image_side: 'left',
      points: [
        { id: 'p_p_1', icon: 'MapPin', title: '1. Bring It In', text: 'Visit us or post your piece securely — we handle every item with care.' },
        { id: 'p_p_2', icon: 'Search', title: '2. Free Assessment', text: 'We inspect your piece and give you a clear, no-obligation quote.' },
        { id: 'p_p_3', icon: 'Wrench', title: '3. Expert Repair', text: 'Our goldsmiths carry out the work in our in-house workshop.' },
        { id: 'p_p_4', icon: 'PackageCheck', title: '4. Quality Check & Return', text: 'Every repair is inspected and cleaned before it is returned to you.' },
      ],
      is_visible: true,
      cta_text: '',
      cta_link: '',
    },
    {
      id: 'rep_default_restoration',
      layout: 'split',
      eyebrow: 'Heirloom Restoration',
      title: 'New Life for Treasured Pieces',
      body:
        'Antique and sentimental jewellery deserves special care. We restore heirlooms sympathetically — preserving their character while making them safe to wear and enjoy again.',
      image:
        'https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=1000&h=1100&fit=crop&q=88',
      image_side: 'right',
      points: [
        { id: 'p_h_1', icon: 'Crown', title: 'Antique Restoration', text: 'Delicate, period-sympathetic repair of vintage and antique pieces.' },
        { id: 'p_h_2', icon: 'HandHeart', title: 'Sentimental Care', text: 'Heirlooms handled with the discretion and respect they deserve.' },
        { id: 'p_h_3', icon: 'RefreshCw', title: 'Remodelling', text: 'Tired pieces reimagined into something you will wear every day.' },
        { id: 'p_h_4', icon: 'Award', title: 'Master Craftsmanship', text: 'Complex restorations completed by our most experienced goldsmiths.' },
      ],
      is_visible: true,
      cta_text: '',
      cta_link: '',
    },
    {
      id: 'rep_default_promise',
      layout: 'statement',
      eyebrow: 'Our Promise',
      title: 'Repaired With Care, Returned With Pride',
      body:
        'Every repair leaves our workshop only when it meets our own standards. We stand behind our work with a 12-month guarantee, because your trust matters as much as the piece itself.',
      image:
        'https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?w=1200&h=800&fit=crop&q=90',
      image_side: 'left',
      points: [],
      is_visible: true,
      cta_text: 'Book a Repair',
      cta_link: '/appointments',
    },
  ],
  closing: {
    eyebrow: 'Ready When You Are',
    title: 'Let’s Restore What You',
    accent: 'Love',
    subtitle:
      'Book a free assessment and let our workshop bring your jewellery back to its best.',
    cta_text: 'Book a Repair',
    cta_link: '/appointments',
    bg_image:
      'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?w=1600&h=1000&fit=crop&q=90',
    theme: 'accent',
  },
}

/* ── normalizers: merge partial/legacy stored config over defaults so a missing
 *    key never crashes the page (older seeds may lack newly added fields). ── */

function normalizePoint(raw: any, i: number): RepairPoint {
  const p = raw && typeof raw === 'object' ? raw : {}
  return {
    id: typeof p.id === 'string' && p.id ? p.id : `pt_${i}_${(_idSeed++).toString(36)}`,
    icon: typeof p.icon === 'string' && p.icon ? p.icon : 'Wrench',
    title: typeof p.title === 'string' ? p.title : '',
    text: typeof p.text === 'string' ? p.text : '',
  }
}

function normalizeSection(raw: any, i: number): RepairSection {
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

function normalizeStat(raw: any, i: number): RepairsStat {
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
export function normalizeRepairs(raw: any): RepairsConfig {
  const cfg = raw && typeof raw === 'object' ? raw : {}
  return {
    ...DEFAULT_REPAIRS,
    ...cfg,
    hero: { ...DEFAULT_REPAIRS.hero, ...(cfg.hero || {}) },
    stats: Array.isArray(cfg.stats)
      ? cfg.stats.map(normalizeStat)
      : DEFAULT_REPAIRS.stats,
    sections_eyebrow:
      typeof cfg.sections_eyebrow === 'string'
        ? cfg.sections_eyebrow
        : DEFAULT_REPAIRS.sections_eyebrow,
    sections_title:
      typeof cfg.sections_title === 'string'
        ? cfg.sections_title
        : DEFAULT_REPAIRS.sections_title,
    sections: Array.isArray(cfg.sections)
      ? cfg.sections.map(normalizeSection)
      : DEFAULT_REPAIRS.sections,
    closing: { ...DEFAULT_REPAIRS.closing, ...(cfg.closing || {}) },
  }
}
